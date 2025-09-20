const knex = require('../database/knex');
const Paginator = require('./paginator');
const { cleanupExpiredSeatLocks } = require('./booking.service');

/**
 * Repository pattern cho table showtimes
 * @returns {Object} - Knex query builder cho table showtimes
 */
function showtimeRepository() {
    return knex('showtimes');
}

/**
 * Filter và transform dữ liệu showtime từ request payload
 * Chỉ lấy các fields có giá trị
 * @param {Object} payload - Raw data từ request body
 * @returns {Object} - Filtered data object cho database operations
 */
function readShowtimeData(payload) {
    return {
        // Chỉ thêm field nếu có giá trị (truthy)
        ...(payload.movie_id && { movie_id: payload.movie_id }),
        ...(payload.cinema_room_id && { cinema_room_id: payload.cinema_room_id }),
        ...(payload.start_time && { start_time: payload.start_time }),
        ...(payload.end_time && { end_time: payload.end_time }),
        ...(payload.price && { price: payload.price }),
        ...(payload.status && { status: payload.status }),
    };
}

/**
 * Tạo mới một suất chiếu
 * @param {Object} payload - Dữ liệu suất chiếu từ request body
 * @returns {Promise<Object>} - Object chứa thông tin suất chiếu vừa tạo bao gồm ID
 */
async function createShowtime(payload) {
    try {
        // Filter và transform dữ liệu cho database
        const showtimeData = readShowtimeData(payload);
        console.log("Data to insert:", showtimeData);
        
        // Thêm timestamps
        const now = new Date();
        const ids = await showtimeRepository().insert({
            ...showtimeData,
            created_at: now,
            updated_at: now
        }).returning('id');
        
        // Extract ID từ kết quả insert
        const id = ids[0].id;
        
        // Trả về object với ID và data vừa insert
        return { id, ...showtimeData };
    } catch (error) {
        console.error("Error in createShowtime service:", error);
        throw error;
    }
}

/**
 * Lấy danh sách tất cả suất chiếu với phân trang và filtering
 * @param {Object} query - Query parameters từ request
 * @param {number} query.movie_id - ID phim để lọc (optional)
 * @param {number} query.cinema_room_id - ID phòng chiếu để lọc (optional)
 * @param {string} query.status - Trạng thái suất chiếu để lọc (optional)
 * @param {string} query.date - Ngày chiếu để lọc (YYYY-MM-DD) (optional)
 * @param {number} query.page - Số trang (default: 1)
 * @param {number} query.limit - Số items per page (default: 10)
 * @returns {Promise<Object>} - Object chứa danh sách showtimes và metadata
 */
async function getAllShowtimes(query) {
    // Destructure các query parameters với default values
    const { movie_id, cinema_room_id, status, date, page = 1, limit = 10 } = query;
    
    // Tạo paginator để xử lý phân trang
    const paginator = new Paginator(page, limit);
  
    // Query database với multiple filtering conditions và JOIN để lấy thông tin liên quan
    const results = await showtimeRepository()
      .leftJoin('movies', 'showtimes.movie_id', 'movies.id')
      .leftJoin('cinema_rooms', 'showtimes.cinema_room_id', 'cinema_rooms.id')
      .where((builder) => {
        // Lọc theo ID phim
        if (movie_id) {
          builder.where('showtimes.movie_id', movie_id);
        }
        // Lọc theo ID phòng chiếu
        if (cinema_room_id) {
          builder.where('showtimes.cinema_room_id', cinema_room_id);
        }
        // Lọc theo trạng thái
        if (status) {
          builder.where('showtimes.status', status);
        }
        // Lọc theo ngày chiếu (so sánh theo DATE part của start_time)
        if (date) {
          builder.whereRaw('DATE(showtimes.start_time) = ?', [date]);
        }
      })
      .select(
        // Sử dụng window function để đếm tổng records
        knex.raw('COUNT(showtimes.id) OVER() AS record_count'),
        'showtimes.id',
        'showtimes.movie_id',
        'showtimes.cinema_room_id',
        'showtimes.start_time',
        'showtimes.end_time',
        'showtimes.price',
        'showtimes.status',
        'showtimes.created_at',
        'showtimes.updated_at',
        // Thông tin phim liên quan
        'movies.title as movie_title',
        'movies.duration_min as movie_duration',
        // Thông tin phòng chiếu liên quan
        'cinema_rooms.name as room_name',
        'cinema_rooms.capacity as room_capacity'
      )
      .orderBy('showtimes.start_time', 'asc') // Sắp xếp theo thời gian bắt đầu
      .limit(paginator.limit) // Giới hạn số records per page
      .offset(paginator.offset); // Skip records của các trang trước
  
    // Lấy tổng số records từ window function
    const totalRecords = results[0]?.record_count ?? 0;
  
    // Xóa field record_count khỏi kết quả trả về
    const showtimes = results.map((result) => {
      result.record_count = undefined;
      return result;
    });
  
    // Trả về data và metadata phân trang
    return {
      metadata: paginator.getMetadata(totalRecords),
      showtimes,
    };
}

/**
 * Lấy thông tin chi tiết của một suất chiếu theo ID
 * @param {number} id - ID của suất chiếu
 * @returns {Promise<Object|null>} - Object chứa thông tin suất chiếu hoặc null nếu không tìm thấy
 */
async function getShowtimeById(id) {
  // Query suất chiếu theo ID với JOIN để lấy thông tin liên quan
  return showtimeRepository()
    .leftJoin('movies', 'showtimes.movie_id', 'movies.id')
    .leftJoin('cinema_rooms', 'showtimes.cinema_room_id', 'cinema_rooms.id')
    .where('showtimes.id', id)
    .select(
      'showtimes.*',
      'movies.title as movie_title',
      'movies.duration_min as movie_duration',
      'movies.genre as movie_genre',
      'cinema_rooms.name as room_name',
      'cinema_rooms.capacity as room_capacity'
    )
    .first();
}

/**
 * Cập nhật thông tin suất chiếu
 * @param {number} id - ID của suất chiếu cần cập nhật
 * @param {Object} updateData - Dữ liệu cập nhật từ request body
 * @returns {Promise<Object|null>} - Object chứa thông tin suất chiếu sau khi cập nhật hoặc null nếu không tìm thấy
 */
async function updateShowtime(id, updateData) {
  // Lấy thông tin suất chiếu hiện tại để kiểm tra tồn tại
  const existingShowtime = await showtimeRepository()
      .where('id', id)
      .select('*')
      .first();

  // Trả về null nếu suất chiếu không tồn tại
  if (!existingShowtime) {
      return null;
  }

  // Filter và transform dữ liệu cập nhật
  const showtimeData = readShowtimeData(updateData);

  // Chỉ update nếu có dữ liệu hợp lệ
  if (Object.keys(showtimeData).length > 0) {
      await showtimeRepository().where('id', id).update({
          ...showtimeData,
          updated_at: new Date() // Cập nhật timestamp
      });
  }

  // Merge old data với new data và trả về
  return { ...existingShowtime, ...showtimeData };
}

/**
 * Hủy một suất chiếu
 * @param {number} id - ID của suất chiếu cần hủy
 * @returns {Promise<Object|null>} - Object chứa thông tin suất chiếu vừa bị hủy hoặc null nếu không tìm thấy
 */
async function deleteShowtime(id) {
  // Tìm suất chiếu để đảm bảo nó tồn tại
  const showtime = await showtimeRepository()
      .where('id', id)
      .first();

  // Trả về null nếu suất chiếu không tồn tại
  if (!showtime) {
      return null;
  }

  // Cập nhật status thành 'canceled' thay vì xóa
  const updated = await showtimeRepository()
    .where({ id })
    .update({ status: 'canceled' });

  return updated;
}

/**
 * Hủy tất cả suất chiếu
 * @returns {Promise<void>} - Không trả về gì
 */
async function deleteAllShowtimes() {
  // Cập nhật status của tất cả suất chiếu thành 'canceled'
  await showtimeRepository().update({ status: 'canceled' });
}

/**
 * Lấy danh sách ghế và trạng thái của chúng cho một suất chiếu cụ thể
 * @param {number} showtimeId - ID của suất chiếu
 * @returns {Promise<Object>} - Object chứa thông tin phòng và danh sách ghế
 */
async function getSeatsForShowtime(showtimeId) {
    // Chủ động dọn dẹp các lock đã hết hạn mỗi khi có người xem sơ đồ ghế
    await cleanupExpiredSeatLocks();

    const showtime = await knex('showtimes')
        .leftJoin('cinema_rooms', 'showtimes.cinema_room_id', 'cinema_rooms.id')
        .where('showtimes.id', showtimeId)
        .select(
            'showtimes.cinema_room_id',
            'cinema_rooms.name as room_name',
            'cinema_rooms.rows as room_rows',
            'cinema_rooms.columns as room_columns',
            'showtimes.price as showtime_price'
        )
        .first();

    if (!showtime) {
        return null; // or throw an error
    }

    const room = await knex('cinema_rooms').where('id', showtime.cinema_room_id).first();

    const seats = await knex('seats')
        .leftJoin('seat_types', 'seats.seat_type_id', 'seat_types.id')
        .where({ cinema_room_id: showtime.cinema_room_id })
        .select(
            'seats.id', 
            'seats.name', 
            'seats.row', 
            'seats.column',
            'seat_types.name as type',
            'seat_types.price as surcharge'
        )
        .orderBy('seats.row', 'asc')
        .orderBy('seats.column', 'asc');

    // Lấy danh sách các ghế đã được đặt cho suất chiếu này
    const bookedSeatIds = (await knex('tickets')
        .join('ticket_bookings', 'tickets.ticket_booking_id', 'ticket_bookings.id')
        .where('ticket_bookings.showtime_id', showtimeId)
        .whereIn('ticket_bookings.status', ['confirmed', 'completed']))
        .map(t => t.seat_id);
    
    // Lấy danh sách các ghế đang bị khóa
    const lockedSeats = await knex('seat_locks')
        .where('showtime_id', showtimeId)
        .where('locked_until', '>', new Date());
    
    // Gán trạng thái cho mỗi ghế
    seats.forEach(seat => {
        if (bookedSeatIds.includes(seat.id)) {
            seat.status = 'booked';
        } else {
            const lock = lockedSeats.find(l => l.seat_id === seat.id);
            if (lock) {
                seat.status = 'locked';
                // Optional: không trả về thông tin người khóa cho client
                // seat.locked_by = lock.locked_by_user_id; 
            } else {
                seat.status = 'available';
            }
        }
    });

    return {
      room: {
        id: showtime.cinema_room_id,
        name: room.name,
        rows: room.rows,
        columns: room.columns,
      },
      showtimePrice: showtime.showtime_price,
      seats: seats,
    };
}

module.exports = {
    createShowtime,
    getAllShowtimes,
    getShowtimeById,
    updateShowtime,
    deleteShowtime,
    deleteAllShowtimes,
    getSeatsForShowtime
}; 