/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('=== BẮT ĐẦU KHỞI TẠO DATABASE MỚI ===');
  
  // Xóa bỏ các bảng hiện có nếu có
  try {
    // Xóa các bảng theo thứ tự để tránh lỗi khóa ngoại
    await knex.schema.dropTableIfExists('food_orders');
    await knex.schema.dropTableIfExists('invoices');
    await knex.schema.dropTableIfExists('tickets');
    await knex.schema.dropTableIfExists('seat_locks');
    await knex.schema.dropTableIfExists('ticket_bookings');
    await knex.schema.dropTableIfExists('showtimes');
    await knex.schema.dropTableIfExists('seats');
    await knex.schema.dropTableIfExists('cinema_rooms');
    await knex.schema.dropTableIfExists('seat_types');
    await knex.schema.dropTableIfExists('movies');
    await knex.schema.dropTableIfExists('foods');
    await knex.schema.dropTableIfExists('employees');
    await knex.schema.dropTableIfExists('customers');
    await knex.schema.dropTableIfExists('accounts');
    await knex.schema.dropTableIfExists('roles');
    
    console.log('Đã xóa các bảng cũ (nếu có)');
  } catch (error) {
    console.log('Không có bảng nào để xóa hoặc có lỗi khi xóa:', error.message);
  }
  
  // Tạo các bảng mới
  console.log('Đang tạo các bảng mới...');
  
  // Bảng roles - vai trò người dùng
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.timestamps(true, true);
  });
  console.log('Đã tạo bảng roles');
  
  // Bảng accounts - tài khoản người dùng
  await knex.schema.createTable('accounts', (table) => {
    table.increments('id').primary();
    table.string('phone_number', 15).unique(); // Cho phép NULL cho Google Auth
    table.string('email', 100).unique();
    table.string('password', 100); // Cho phép NULL cho Google Auth
    table.string('google_id', 255).unique();
    table.enum('auth_provider', ['local', 'google']).defaultTo('local');
    table.integer('role_id').unsigned().notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.foreign('role_id').references('roles.id');
  });
  console.log('Đã tạo bảng accounts');
  
  // Bảng customers - thông tin khách hàng
  await knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().unique(); // Cho phép NULL để hỗ trợ customer POS
    table.string('full_name', 100).notNullable();
    table.string('phone_number', 20);
    table.string('address', 255);
    table.enum('gender', ['male', 'female', 'other']).defaultTo('other');
    table.date('date_of_birth');
    table.integer('loyalty_points').unsigned().defaultTo(0);
    table.timestamps(true, true);

    table.foreign('account_id').references('accounts.id').onDelete('CASCADE');
  });
  console.log('Đã tạo bảng customers');
  
  // Bảng employees - thông tin nhân viên
  await knex.schema.createTable('employees', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable().unique();
    table.string('email', 100);
    table.string('full_name', 100).notNullable();
    table.string('phone_number', 20);
    table.string('address', 255);
    table.enum('gender', ['male', 'female', 'other']).defaultTo('other');
    table.date('date_of_birth');
    table.string('position', 50);
    table.timestamps(true, true);

    table.foreign('account_id').references('accounts.id').onDelete('CASCADE');
  });
  console.log('Đã tạo bảng employees');
  
  // Bảng seat_types - loại ghế
  await knex.schema.createTable('seat_types', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.timestamps(true, true);
  });
  console.log('Đã tạo bảng seat_types');
  
  // Bảng movies - phim
  await knex.schema.createTable('movies', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('director', 255);
    table.string('cast', 500);
    table.string('genre', 255);
    table.integer('duration_min'); // Thời lượng phim (phút)
    table.date('release_date');
    table.date('end_date');
    table.string('country', 100);
    table.string('age_rating', 20); // Thêm age_rating
    table.enum('status', ['active', 'inactive']).defaultTo('active'); // Thêm status
    table.string('poster_url', 255);
    table.string('trailer_url', 255);
    table.timestamps(true, true);
  });
  console.log('Đã tạo bảng movies');
  
  // Bảng cinema_rooms - phòng chiếu
  await knex.schema.createTable('cinema_rooms', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable();
    table.integer('capacity').unsigned().notNullable(); // Sức chứa tối đa
    table.integer('rows').unsigned().notNullable(); // Số hàng
    table.integer('columns').unsigned().notNullable(); // Số cột
    table.enum('type', ['2D', '3D', '4DX', 'IMAX']).defaultTo('2D');
    table.enum('status', ['active', 'maintenance', 'inactive']).defaultTo('active');
    table.timestamps(true, true);
  });
  console.log('Đã tạo bảng cinema_rooms');
  
  // Bảng seats - ghế
  await knex.schema.createTable('seats', (table) => {
    table.increments('id').primary();
    table.integer('cinema_room_id').unsigned().notNullable();
    table.integer('seat_type_id').unsigned().notNullable();
    table.string('name', 10).notNullable(); // Ví dụ: A1, B2, ...
    table.string('row', 5).notNullable(); // Hàng (A, B, C, ...)
    table.integer('column').unsigned().notNullable(); // Cột (1, 2, 3, ...)
    table.enum('status', ['available', 'unavailable']).defaultTo('available');
    table.timestamps(true, true);

    table.foreign('cinema_room_id').references('cinema_rooms.id');
    table.foreign('seat_type_id').references('seat_types.id');
    table.unique(['cinema_room_id', 'name']);
  });
  console.log('Đã tạo bảng seats');
  
  // Bảng showtimes - suất chiếu
  await knex.schema.createTable('showtimes', (table) => {
    table.increments('id').primary();
    table.integer('movie_id').unsigned().notNullable();
    table.integer('cinema_room_id').unsigned().notNullable();
    table.datetime('start_time').notNullable();
    table.datetime('end_time').notNullable();
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.enum('status', ['scheduled', 'canceled', 'completed']).defaultTo('scheduled');
    table.timestamps(true, true);

    table.foreign('movie_id').references('movies.id');
    table.foreign('cinema_room_id').references('cinema_rooms.id');
  });
  console.log('Đã tạo bảng showtimes');
  
  // Bảng foods - thức ăn
  await knex.schema.createTable('foods', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.string('image_url', 255);
    table.string('category', 50);
    table.boolean('is_available').defaultTo(true);
    table.timestamps(true, true);
  });
  console.log('Đã tạo bảng foods');
  
  // Bảng ticket_bookings - đặt vé
  await knex.schema.createTable('ticket_bookings', (table) => {
    table.increments('id').primary();
    table.string('booking_code', 20).notNullable().unique();
    table.integer('customer_id').unsigned().notNullable();
    table.integer('showtime_id').unsigned().notNullable();
    table.datetime('booking_date').notNullable();
    table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed']).defaultTo('pending');
    table.timestamps(true, true);

    table.foreign('customer_id').references('customers.id');
    table.foreign('showtime_id').references('showtimes.id');
  });
  console.log('Đã tạo bảng ticket_bookings');
  
  // Bảng tickets - vé
  await knex.schema.createTable('tickets', (table) => {
    table.increments('id').primary();
    table.integer('ticket_booking_id').unsigned().notNullable();
    table.integer('seat_id').unsigned().notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.timestamps(true, true);

    table.foreign('ticket_booking_id').references('ticket_bookings.id').onDelete('CASCADE');
    table.foreign('seat_id').references('seats.id');
    table.unique(['ticket_booking_id', 'seat_id']);
  });
  console.log('Đã tạo bảng tickets');
  
  // Bảng food_orders - đơn thức ăn
  await knex.schema.createTable('food_orders', (table) => {
    table.increments('id').primary();
    table.integer('ticket_booking_id').unsigned().notNullable();
    table.integer('food_id').unsigned().notNullable();
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.decimal('price', 10, 2).notNullable(); // Giá tổng cho món đó (đã nhân số lượng)
    table.timestamps(true, true);

    table.foreign('ticket_booking_id').references('ticket_bookings.id').onDelete('CASCADE');
    table.foreign('food_id').references('foods.id');
  });
  console.log('Đã tạo bảng food_orders');
  
  // Bảng invoices - hóa đơn
  await knex.schema.createTable('invoices', (table) => {
    table.increments('id').primary();
    table.integer('ticket_booking_id').unsigned().notNullable().unique();
    table.enum('payment_method', ['cash', 'credit_card', 'momo', 'zalopay', 'banking']).defaultTo('cash');
    table.enum('payment_status', ['pending', 'paid', 'failed']).defaultTo('pending');
    table.decimal('amount', 10, 2).notNullable();
    table.datetime('payment_date');
    table.timestamps(true, true);

    table.foreign('ticket_booking_id').references('ticket_bookings.id').onDelete('CASCADE');
  });
  console.log('Đã tạo bảng invoices');
  
  // Bảng seat_locks - khóa ghế tạm thời
  await knex.schema.createTable('seat_locks', (table) => {
      table.increments('id').primary();
      table.integer('seat_id').unsigned().notNullable();
      table.integer('showtime_id').unsigned().notNullable();
      table.integer('locked_by_user_id').unsigned().notNullable();
      table.datetime('locked_until').notNullable();
      table.timestamps(true, true);

      table.foreign('seat_id').references('seats.id').onDelete('CASCADE');
      table.foreign('showtime_id').references('showtimes.id').onDelete('CASCADE');
      table.foreign('locked_by_user_id').references('accounts.id').onDelete('CASCADE');
      table.unique(['seat_id', 'showtime_id']);
  });
  console.log('Đã tạo bảng seat_locks');
  
  console.log('=== KHỞI TẠO DATABASE HOÀN TẤT ===');
  
  // Thêm dữ liệu cho bảng roles
  await knex('roles').insert([
    { 
      name: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    },
    { 
      name: 'staff',
      created_at: new Date(),
      updated_at: new Date()
    },
    { 
      name: 'customer',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  console.log('Đã thêm dữ liệu cho bảng roles');
  
  console.log('Giờ bạn có thể chạy các seed tiếp theo để thêm dữ liệu mẫu vào database.');
}; 