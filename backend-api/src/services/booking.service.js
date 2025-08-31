const knex = require("../database/knex");
const { ROLES } = require("../constants");

/**
 * Repository pattern cho các bảng liên quan đến booking
 */
function ticketBookingRepository() {
  return knex("ticket_bookings");
}

function ticketRepository() {
  return knex("tickets");
}

function foodOrderRepository() {
  return knex("food_orders");
}

function invoiceRepository() {
  return knex("invoices");
}

function showtimeRepository() {
  return knex("showtimes");
}

function seatRepository() {
  return knex("seats");
}

function customerRepository() {
  return knex("customers");
}

function seatLockRepository() {
    return knex("seat_locks");
}

/**
 * Helper function: Tạo mã booking duy nhất
 * @returns {string} - Mã booking dạng BK20241201001
 */
async function generateBookingCode() {
  let bookingCode;
  let isUnique = false;

  while (!isUnique) {
    // Tạo một số ngẫu nhiên có 6 chữ số
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    bookingCode = `BK${randomPart}`;

    // Kiểm tra xem mã đã tồn tại trong DB chưa
    const existingBooking = await ticketBookingRepository()
      .where({ booking_code: bookingCode })
      .first();
    if (!existingBooking) {
      isUnique = true;
    }
  }
  return bookingCode;
}

/**
 * Helper function: Kiểm tra quyền truy cập booking
 * @param {Object} user - Thông tin user từ token
 * @param {Object} booking - Thông tin booking
 * @returns {boolean} - True nếu user có quyền truy cập
 */
function canAccessBooking(user, booking) {
  // Admin và Staff có thể truy cập tất cả
  if (user.role === ROLES.ADMIN || user.role === ROLES.STAFF) {
    return true;
  }

  // Customer chỉ có thể truy cập booking của mình
  if (user.role === ROLES.CUSTOMER) {
    return booking.customer_account_id === user.id;
  }

  return false;
}

/**
 * Lấy danh sách tất cả bookings với phân trang và lọc
 * @param {Object} queryParams - Tham số query
 * @param {Object} user - Thông tin user từ token
 * @returns {Promise<Object>} - Danh sách bookings và metadata
 */
async function getAllBookings(queryParams, user) {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer_id,
      showtime_id,
      booking_date,
    } = queryParams;

    let query = ticketBookingRepository()
      .leftJoin("customers", "ticket_bookings.customer_id", "customers.id")
      .leftJoin("showtimes", "ticket_bookings.showtime_id", "showtimes.id")
      .leftJoin("movies", "showtimes.movie_id", "movies.id")
      .leftJoin("cinema_rooms", "showtimes.cinema_room_id", "cinema_rooms.id")
      .select(
        "ticket_bookings.*",
        "customers.full_name as customer_name",
        "customers.phone_number as customer_phone",
        "customers.account_id as customer_account_id",
        "movies.title as movie_title",
        "cinema_rooms.name as room_name",
        "showtimes.start_time",
        "showtimes.end_time"
      );

    // Phân quyền: Customer chỉ xem được booking của mình
    if (user.role === ROLES.CUSTOMER) {
      query = query.where("customers.account_id", user.id);
    }

    // Áp dụng các filter
    if (status) {
      query = query.where("ticket_bookings.status", status);
    }

    if (
      customer_id &&
      (user.role === ROLES.ADMIN || user.role === ROLES.STAFF)
    ) {
      query = query.where("ticket_bookings.customer_id", customer_id);
    }

    if (showtime_id) {
      query = query.where("ticket_bookings.showtime_id", showtime_id);
    }

    if (booking_date) {
      query = query.whereRaw("DATE(ticket_bookings.created_at) = ?", [
        booking_date,
      ]);
    }

    // Đếm tổng số bản ghi - tạo query riêng cho count
    let countQuery = ticketBookingRepository()
      .leftJoin("customers", "ticket_bookings.customer_id", "customers.id")
      .leftJoin("showtimes", "ticket_bookings.showtime_id", "showtimes.id")
      .leftJoin("movies", "showtimes.movie_id", "movies.id")
      .leftJoin("cinema_rooms", "showtimes.cinema_room_id", "cinema_rooms.id");

    // Áp dụng cùng các filter cho count query
    if (user.role === ROLES.CUSTOMER) {
      countQuery = countQuery.where("customers.account_id", user.id);
    }

    if (status) {
      countQuery = countQuery.where("ticket_bookings.status", status);
    }

    if (
      customer_id &&
      (user.role === ROLES.ADMIN || user.role === ROLES.STAFF)
    ) {
      countQuery = countQuery.where("ticket_bookings.customer_id", customer_id);
    }

    if (showtime_id) {
      countQuery = countQuery.where("ticket_bookings.showtime_id", showtime_id);
    }

    if (booking_date) {
      countQuery = countQuery.whereRaw("DATE(ticket_bookings.created_at) = ?", [
        booking_date,
      ]);
    }

    const totalResult = await countQuery
      .count("ticket_bookings.id as count")
      .first();
    const totalRecords = parseInt(totalResult.count);

    // Phân trang
    const offset = (page - 1) * limit;
    const bookings = await query
      .orderBy("ticket_bookings.created_at", "desc")
      .limit(limit)
      .offset(offset);

    if (bookings.length > 0) {
      const bookingIds = bookings.map((b) => b.id);

      // Lấy tất cả vé và đồ ăn cho các booking đã tìm thấy
      const ticketsPromise = ticketRepository()
        .leftJoin("seats", "tickets.seat_id", "seats.id")
        .whereIn("tickets.ticket_booking_id", bookingIds)
        .select("tickets.ticket_booking_id", "seats.name as seat_name");

      const foodOrdersPromise = foodOrderRepository()
        .leftJoin("foods", "food_orders.food_id", "foods.id")
        .whereIn("food_orders.ticket_booking_id", bookingIds)
        .select(
          "food_orders.ticket_booking_id",
          "food_orders.quantity",
          "foods.name as food_name"
        );

      const [tickets, foodOrders] = await Promise.all([
        ticketsPromise,
        foodOrdersPromise,
      ]);

      // Nhóm chúng theo ID booking để dễ dàng truy xuất
      const ticketsByBooking = tickets.reduce((acc, t) => {
        if (!acc[t.ticket_booking_id]) acc[t.ticket_booking_id] = [];
        acc[t.ticket_booking_id].push(t);
        return acc;
      }, {});

      const foodByBooking = foodOrders.reduce((acc, f) => {
        if (!acc[f.ticket_booking_id]) acc[f.ticket_booking_id] = [];
        acc[f.ticket_booking_id].push(f);
        return acc;
      }, {});

      // Gán thông tin chi tiết vào mỗi booking
      bookings.forEach((booking) => {
        booking.tickets = ticketsByBooking[booking.id] || [];
        booking.food_orders = foodByBooking[booking.id] || [];
      });
    }

    return {
      bookings,
      metadata: {
        totalRecords,
        firstPage: 1,
        lastPage: Math.ceil(totalRecords / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    };
  } catch (error) {
    console.error("Get all bookings error:", error);
    throw error;
  }
}

/**
 * Lấy thông tin chi tiết booking theo ID
 * @param {number} id - ID của booking
 * @param {Object} user - Thông tin user từ token
 * @returns {Promise<Object|null>} - Thông tin booking hoặc null nếu không tìm thấy
 */
async function getBookingById(id, user) {
  try {
    const booking = await ticketBookingRepository()
      .leftJoin("customers", "ticket_bookings.customer_id", "customers.id")
      .leftJoin("showtimes", "ticket_bookings.showtime_id", "showtimes.id")
      .leftJoin("movies", "showtimes.movie_id", "movies.id")
      .leftJoin("cinema_rooms", "showtimes.cinema_room_id", "cinema_rooms.id")
      .where("ticket_bookings.id", id)
      .select(
        "ticket_bookings.*",
        "customers.full_name as customer_name",
        "customers.phone_number as customer_phone",
        "customers.account_id as customer_account_id",
        "movies.title as movie_title",
        "movies.duration_min as movie_duration",
        "movies.age_rating as movie_rating",
        "cinema_rooms.name as room_name",
        "showtimes.start_time",
        "showtimes.end_time",
        "showtimes.price as base_price"
      )
      .first();

    if (!booking) {
      return null;
    }

    // Kiểm tra quyền truy cập
    if (!canAccessBooking(user, booking)) {
      return null;
    }

    // Lấy thông tin vé (tickets)
    const tickets = await ticketRepository()
      .leftJoin("seats", "tickets.seat_id", "seats.id")
      .leftJoin("seat_types", "seats.seat_type_id", "seat_types.id")
      .where("tickets.ticket_booking_id", id)
      .select(
        "tickets.*",
        "seats.row",
        "seats.column",
        "seats.name as seat_name",
        "seat_types.name as seat_type_name",
        "seat_types.price as seat_type_price"
      );

    // Lấy thông tin đồ ăn (food orders)
    const foodOrders = await foodOrderRepository()
      .leftJoin("foods", "food_orders.food_id", "foods.id")
      .where("food_orders.ticket_booking_id", id)
      .select(
        "food_orders.*",
        "foods.name as food_name",
        "foods.price as food_unit_price"
      );

    // Lấy thông tin hóa đơn
    const invoice = await invoiceRepository()
      .where("ticket_booking_id", id)
      .first();

    return {
      ...booking,
      tickets,
      food_orders: foodOrders,
      invoice,
    };
  } catch (error) {
    console.error("Get booking by ID error:", error);
    throw error;
  }
}

/**
 * Lấy thông tin chi tiết booking theo mã booking
 * @param {string} bookingCode - Mã của booking
 * @param {Object} user - Thông tin user từ token (để check quyền)
 * @returns {Promise<Object|null>} - Thông tin booking hoặc null nếu không tìm thấy
 */
async function getBookingByCode(bookingCode, user) {
  try {
    // Chỉ admin và staff mới có quyền tra cứu
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.STAFF) {
      return null;
    }

    const booking = await ticketBookingRepository()
      .where({ booking_code: bookingCode })
      .first();

    if (!booking) {
      return null;
    }

    // Dùng lại hàm getBookingById để lấy đầy đủ thông tin
    return await getBookingById(booking.id, user);
  } catch (error) {
    console.error(`Error getting booking by code ${bookingCode}:`, error);
    throw error;
  }
}

/**
 * Cập nhật trạng thái booking
 * @param {number} id - ID của booking
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {Object} user - Thông tin user từ token
 * @returns {Promise<Object|null>} - Booking sau khi cập nhật hoặc null
 */
async function updateBooking(id, updateData, user) {
  try {
    // Kiểm tra booking có tồn tại và quyền truy cập
    const existingBooking = await getBookingById(id, user);
    if (!existingBooking) {
      return null;
    }

    // Lọc ra các trường được phép cập nhật trong ticket_bookings
    const allowedBookingFields = ["status"];
    const bookingUpdate = {};

    if (updateData.status !== undefined) {
      bookingUpdate.status = updateData.status;
    }

    // Lọc ra các trường được phép cập nhật trong invoices
    const allowedInvoiceFields = ["payment_method", "payment_status"];
    const invoiceUpdate = {};

    if (updateData.payment_method !== undefined) {
      invoiceUpdate.payment_method = updateData.payment_method;
    }

    if (updateData.payment_status !== undefined) {
      invoiceUpdate.payment_status = updateData.payment_status;
      if (updateData.payment_status === "paid") {
        invoiceUpdate.payment_date = new Date();
      }
    }

    // Cập nhật trong transaction
    await knex.transaction(async (trx) => {
      // Cập nhật booking nếu có thay đổi
      if (Object.keys(bookingUpdate).length > 0) {
        await ticketBookingRepository()
          .transacting(trx)
          .where("id", id)
          .update({
            ...bookingUpdate,
            updated_at: new Date(),
          });
      }

      // Cập nhật invoice nếu có thay đổi
      if (Object.keys(invoiceUpdate).length > 0) {
        await invoiceRepository()
          .transacting(trx)
          .where("ticket_booking_id", id)
          .update({
            ...invoiceUpdate,
            updated_at: new Date(),
          });
      }
    });

    // Lấy lại dữ liệu mới
    return await getBookingById(id, user);
  } catch (error) {
    console.error("Update booking error:", error);
    throw error;
  }
}

/**
 * Xóa booking (chỉ admin)
 * @param {number} id - ID của booking
 * @param {Object} user - Thông tin user từ token
 * @returns {Promise<boolean>} - True nếu xóa thành công
 */
async function deleteBooking(id, user) {
  try {
    const booking = await ticketBookingRepository()
      .leftJoin("customers", "ticket_bookings.customer_id", "customers.id")
      .where("ticket_bookings.id", id)
      .select(
        "ticket_bookings.*",
        "customers.account_id as customer_account_id"
      )
      .first();

    if (!booking) {
      return false;
    }

    // Kiểm tra quyền: Admin có toàn quyền, Customer chỉ được xóa booking của mình
    if (
      user.role === ROLES.CUSTOMER &&
      booking.customer_account_id !== user.id
    ) {
      return false;
    }

    // Customer chỉ có thể hủy vé 'pending' hoặc 'confirmed'
    if (
      user.role === ROLES.CUSTOMER &&
      !["pending", "confirmed"].includes(booking.status)
    ) {
      throw new Error("Chỉ có thể hủy các vé đang chờ xử lý hoặc đã xác nhận.");
    }

    // Xóa trong transaction để đảm bảo tính toàn vẹn
    await knex.transaction(async (trx) => {
      // Xóa food orders
      await foodOrderRepository()
        .transacting(trx)
        .where("ticket_booking_id", id)
        .del();

      // Xóa tickets
      await ticketRepository()
        .transacting(trx)
        .where("ticket_booking_id", id)
        .del();

      // Xóa invoice nếu có
      await invoiceRepository()
        .transacting(trx)
        .where("ticket_booking_id", id)
        .del();

      // Xóa booking
      await ticketBookingRepository().transacting(trx).where("id", id).del();
    });

    return true;
  } catch (error) {
    console.error("Delete booking error:", error);
    throw error;
  }
}

/**
 * Tạo booking mới
 * @param {Object} bookingData - Dữ liệu booking
 * @param {Object} user - Thông tin user từ token
 * @returns {Promise<Object>} - Booking mới được tạo
 */
async function createBooking(bookingData, user) {
  try {
    const {
      showtime_id,
      seats: seatIds,
      food_items = [],
      customer_phone,
    } = bookingData;

    console.log("Create booking request:", {
      showtimeId: showtime_id,
      seatIds,
      foodItems: food_items,
      userId: user.id,
      userRole: user.role,
      customerPhone: customer_phone,
    });

    // === START: LOGIC KHÓA GHẾ MỚI ===

    // 1. Validate showtime exists và chưa bắt đầu
    const showtime = await showtimeRepository()
      .leftJoin("movies", "showtimes.movie_id", "movies.id")
      .leftJoin("cinema_rooms", "showtimes.cinema_room_id", "cinema_rooms.id")
      .where("showtimes.id", showtime_id)
      .select(
        "showtimes.*",
        "movies.title as movie_title",
        "cinema_rooms.name as room_name"
      )
      .first();

    if (!showtime) {
      throw new Error("Suất chiếu không tồn tại");
    }

    const now = new Date();
    if (new Date(showtime.start_time) <= now) {
      throw new Error("Không thể đặt vé cho suất chiếu đã bắt đầu");
    }

    // 2. Dọn dẹp các booking pending đã hết hạn để giải phóng ghế
    await cleanupExpiredBookings();

    // 3. Kiểm tra xem ghế có đang bị khóa bởi người khác không
    // Đồng thời xác nhận là chính người dùng này đã khóa ghế
    const locks = await seatLockRepository()
        .where({ showtime_id })
        .whereIn("seat_id", seatIds);

    const userLockIds = locks
        .filter(lock => lock.locked_by_user_id === user.id)
        .map(lock => lock.seat_id);

    const otherUserLocks = locks.filter(lock => lock.locked_by_user_id !== user.id);

    if (otherUserLocks.length > 0) {
        const lockedSeatIds = otherUserLocks.map(l => l.seat_id);
        throw new Error(`Ghế ${lockedSeatIds.join(', ')} đang được người khác giữ.`);
    }

    // Kiểm tra xem người dùng có khóa đủ số ghế họ muốn đặt không
    if (userLockIds.length !== seatIds.length) {
        const unlockedSeats = seatIds.filter(id => !userLockIds.includes(id));
        throw new Error(`Bạn chưa khóa các ghế: ${unlockedSeats.join(', ')}. Vui lòng khóa ghế trước khi đặt.`);
    }

    // 4. Kiểm tra lần cuối xem ghế đã được đặt (confirmed) chưa (đề phòng trường hợp race condition)
    const alreadyBookedSeats = await ticketRepository()
      .leftJoin(
        "ticket_bookings",
        "tickets.ticket_booking_id",
        "ticket_bookings.id"
      )
      .whereIn("tickets.seat_id", seatIds)
      .where("ticket_bookings.showtime_id", showtime_id)
      .where("ticket_bookings.status", "confirmed") // Chỉ check confirmed
      .select("tickets.seat_id");

    if (alreadyBookedSeats.length > 0) {
      const bookedSeatIds = alreadyBookedSeats.map((seat) => seat.seat_id);
      throw new Error(`Ghế ${bookedSeatIds.join(", ")} đã được người khác đặt trong lúc bạn thao tác.`);
    }

    // === END: LOGIC KHÓA GHẾ MỚI ===


    // Xác định customer_id
    let customerId;

    // Nếu là staff đặt hộ khách hàng
    if (
      (user.role === ROLES.STAFF || user.role === ROLES.ADMIN) &&
      customer_phone
    ) {
      const customer = await customerRepository()
        .where("phone_number", customer_phone)
        .first();

      if (!customer) {
        throw new Error(
          `Không tìm thấy khách hàng với số điện thoại ${customer_phone}`
        );
      }

      customerId = customer.id;
    } else {
      // Khách hàng tự đặt vé
      const customer = await customerRepository()
        .where("account_id", user.id)
        .first();

      if (!customer) {
        throw new Error(`Không tìm thấy hồ sơ khách hàng cho tài khoản này.`);
      }

      customerId = customer.id;
    }

    // Validate seats và tính toán giá
    const seats = await seatRepository()
      .leftJoin("seat_types", "seats.seat_type_id", "seat_types.id")
      .whereIn("seats.id", seatIds)
      .select(
        "seats.*",
        "seat_types.name as seat_type_name",
        "seat_types.price as seat_type_price"
      );

    if (seats.length !== seatIds.length) {
      throw new Error("Một số ghế không tồn tại");
    }

    // Tính tổng tiền vé - sử dụng giá base của showtime
    const ticketTotal = seats.reduce((total, seat) => {
      return total + parseFloat(showtime.price);
    }, 0);

    // Validate và tính tiền đồ ăn
    let foodTotal = 0;
    let validatedFoodItems = [];

    if (food_items && food_items.length > 0) {
      const foodIds = food_items.map((item) => item.food_id);
      const foods = await knex("foods")
        .whereIn("id", foodIds)
        .where("is_available", true)
        .select("*");

      for (const item of food_items) {
        const food = foods.find((f) => f.id === item.food_id);
        if (!food) {
          throw new Error(
            `Đồ ăn ID ${item.food_id} không tồn tại hoặc không khả dụng`
          );
        }

        const itemTotal = parseFloat(food.price) * item.quantity;
        foodTotal += itemTotal;

        validatedFoodItems.push({
          food_id: item.food_id,
          quantity: item.quantity,
          unit_price: parseFloat(food.price),
          total_price: itemTotal,
        });
      }
    }

    const totalAmount = ticketTotal + foodTotal;

    // Tạo booking trong transaction
    const result = await knex.transaction(async (trx) => {
      // 1. Tạo ticket_booking
      const [bookingId] = await ticketBookingRepository()
        .transacting(trx)
        .insert({
          booking_code: await generateBookingCode(),
          customer_id: customerId,
          showtime_id: showtime_id,
          booking_date: new Date(),
          status: "pending",
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("id");

      // 2. Tạo tickets
      const ticketInserts = seats.map((seat) => ({
        ticket_booking_id: bookingId.id,
        seat_id: seat.id,
        price: parseFloat(showtime.price),
        created_at: new Date(),
      }));

      await ticketRepository().transacting(trx).insert(ticketInserts);

      // 3. Tạo food orders (nếu có)
      if (validatedFoodItems.length > 0) {
        const foodOrderInserts = validatedFoodItems.map((item) => ({
          ticket_booking_id: bookingId.id,
          food_id: item.food_id,
          quantity: item.quantity,
          price: item.total_price,
          created_at: new Date(),
          updated_at: new Date(),
        }));

        await foodOrderRepository().transacting(trx).insert(foodOrderInserts);
      }

      // 4. Tạo invoice
      await invoiceRepository().transacting(trx).insert({
        ticket_booking_id: bookingId.id,
        payment_method: "cash",
        payment_status: "pending",
        amount: totalAmount,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // 5. Xóa lock của user sau khi đã đặt vé thành công
      await seatLockRepository()
          .transacting(trx)
          .where({
              showtime_id: showtime_id,
              locked_by_user_id: user.id
          })
          .whereIn("seat_id", seatIds)
          .del();


      return bookingId.id;
    });

    console.log("Booking created successfully:", {
      bookingId: result,
      customerId,
      totalAmount,
    });

    // Lấy thông tin booking vừa tạo
    const newBooking = await getBookingById(result, user);

    return newBooking;
  } catch (error) {
    console.error("Create booking error:", error);
    throw error;
  }
}

/**
 * Confirm booking và thanh toán
 * @param {number} bookingId - ID của booking
 * @param {Object} confirmData - Dữ liệu xác nhận
 * @param {Object} user - Thông tin user từ token
 * @returns {Promise<Object|null>} - Booking sau khi confirm
 */
async function confirmBooking(bookingId, confirmData, user) {
  try {
    const { payment_method, payment_details = {} } = confirmData;

    console.log("Confirm booking request:", {
      bookingId,
      paymentMethod: payment_method,
      userId: user.id,
    });

    // Lấy booking hiện tại
    const booking = await getBookingById(bookingId, user);
    if (!booking) {
      return null;
    }

    if (booking.status !== "pending") {
      throw new Error("Chỉ có thể xác nhận booking đang ở trạng thái pending");
    }

    // Cập nhật booking và invoice trong transaction
    await knex.transaction(async (trx) => {
      // Cập nhật booking
      await ticketBookingRepository()
        .transacting(trx)
        .where("id", bookingId)
        .update({
          status: "confirmed",
          updated_at: new Date(),
        });

      // Cập nhật invoice
      await invoiceRepository()
        .transacting(trx)
        .where("ticket_booking_id", bookingId)
        .update({
          payment_method: payment_method,
          payment_status: "paid",
          payment_date: new Date(),
          updated_at: new Date(),
        });
    });

    console.log("Booking confirmed successfully:", { bookingId });

    // Lấy lại thông tin booking đã cập nhật
    return await getBookingById(bookingId, user);
  } catch (error) {
    console.error("Confirm booking error:", error);
    throw error;
  }
}

/**
 * Dọn dẹp các booking pending đã hết hạn
 * @param {number} timeoutMinutes - Thời gian hết hạn tính bằng phút (mặc định 15 phút)
 * @returns {Promise<number>} - Số lượng booking đã được dọn dẹp
 */
async function cleanupExpiredBookings(timeoutMinutes = 15) {
  try {
    const expiredTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const result = await ticketBookingRepository()
      .where("status", "pending")
      .where("created_at", "<", expiredTime)
      .update({ status: "cancelled" });

    console.log(`Cleaned up ${result} expired pending bookings`);
    return result;
  } catch (error) {
    console.error("Error cleaning up expired bookings:", error);
    throw error;
  }
}

/**
 * Helper function: Dọn dẹp các seat_locks đã hết hạn
 */
async function cleanupExpiredSeatLocks() {
    try {
        const now = new Date();
        const deletedCount = await seatLockRepository().where("locked_until", "<", now).del();
        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} expired seat locks.`);
        }
    } catch (error) {
        console.error("Error cleaning up expired seat locks:", error);
        // Không throw error để không làm gián đoạn các tiến trình khác
    }
}

/**
 * Khóa các ghế được chọn trong một suất chiếu cụ thể
 * @param {number} showtimeId - ID của suất chiếu
 * @param {Array<number>} seatIds - Mảng các ID của ghế cần khóa
 * @param {Object} user - Thông tin người dùng đang thực hiện
 * @returns {Promise<Object>} - Thông tin về lock
 */
async function lockSeats(showtimeId, seatIds, user) {
    // Dọn dẹp các lock đã hết hạn trước khi thực hiện
    await cleanupExpiredSeatLocks();

    const now = new Date();
    const lockDurationMinutes = 5; // Khóa ghế trong 5 phút
    const lockedUntil = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);

    // 1. Kiểm tra showtime có hợp lệ không
    const showtime = await showtimeRepository().where("id", showtimeId).first();
    if (!showtime || new Date(showtime.start_time) <= now) {
        throw new Error("Suất chiếu không hợp lệ hoặc đã bắt đầu.");
    }

    // 2. Kiểm tra xem ghế đã được đặt (confirmed/pending) chưa
    const bookedSeats = await ticketRepository()
        .leftJoin("ticket_bookings", "tickets.ticket_booking_id", "ticket_bookings.id")
        .where("ticket_bookings.showtime_id", showtimeId)
        .whereIn("ticket_bookings.status", ["confirmed", "pending"])
        .whereIn("tickets.seat_id", seatIds)
        .select("tickets.seat_id");

    if (bookedSeats.length > 0) {
        const bookedSeatIds = bookedSeats.map(s => s.seat_id);
        throw new Error(`Ghế ${bookedSeatIds.join(', ')} đã được đặt.`);
    }

    // 3. Kiểm tra xem ghế có đang bị khóa bởi người khác không
    const existingLocks = await seatLockRepository()
        .where({ showtime_id: showtimeId })
        .whereIn("seat_id", seatIds);

    const otherUserLocks = existingLocks.filter(lock => lock.locked_by_user_id !== user.id);
    if (otherUserLocks.length > 0) {
        const lockedSeatIds = otherUserLocks.map(l => l.seat_id);
        throw new Error(`Ghế ${lockedSeatIds.join(', ')} đang được người khác giữ.`);
    }

    // 4. Bắt đầu transaction để khóa ghế
    return await knex.transaction(async (trx) => {
        // Xóa các lock cũ của chính user này trên suất chiếu này để làm mới
        await seatLockRepository()
            .transacting(trx)
            .where({
                showtime_id: showtimeId,
                locked_by_user_id: user.id,
            })
            .whereIn("seat_id", seatIds)
            .del();

        // Tạo lock mới
        const locksToInsert = seatIds.map(seatId => ({
            seat_id: seatId,
            showtime_id: showtimeId,
            locked_by_user_id: user.id,
            locked_until: lockedUntil,
        }));

        await seatLockRepository().transacting(trx).insert(locksToInsert);

        return {
            locked_until: lockedUntil,
            locked_seats: seatIds
        };
    });
}


/**
 * Mở khóa các ghế đã chọn
 * @param {number} showtimeId - ID của suất chiếu
 * @param {Array<number>} seatIds - Mảng các ID của ghế cần mở khóa
 * @param {Object} user - Thông tin người dùng
 */
async function unlockSeats(showtimeId, seatIds, user) {
    try {
        await seatLockRepository()
            .where({
                showtime_id: showtimeId,
                locked_by_user_id: user.id
            })
            .whereIn("seat_id", seatIds)
            .del();
    } catch (error) {
        console.error("Error unlocking seats:", error);
        throw new Error("Lỗi khi mở khóa ghế.");
    }
}

module.exports = {
  getAllBookings,
  getBookingById,
  getBookingByCode,
  createBooking,
  confirmBooking,
  updateBooking,
  deleteBooking,
  generateBookingCode,
  canAccessBooking,
  cleanupExpiredBookings,
  lockSeats,
  unlockSeats
};
