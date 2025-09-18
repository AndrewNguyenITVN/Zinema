const knex = require('../database/knex');
const Paginator = require('./paginator');

/**
 * Repository pattern cho table foods
 * @returns {Object} - Knex query builder cho table foods
 */
function foodRepository() {
    return knex('foods');
}

/**
 * Filter và transform dữ liệu food từ request payload
 * @param {Object} payload - Raw data từ request body
 * @returns {Object} - Filtered data object cho database operations
 */
function readFoodData(payload) {
    return {
        // Chỉ thêm field nếu có giá trị (truthy)
        ...(payload.name && { name: payload.name }),
        ...(payload.description && { description: payload.description }),
        ...(payload.price && { price: payload.price }),
        ...(payload.image_url && { image_url: payload.image_url }),
        ...(payload.category && { category: payload.category }),
        ...(payload.is_available !== undefined && { is_available: payload.is_available }),
    };
}

/**
 * Lấy danh sách tất cả food với phân trang và filtering
 * @param {Object} query - Query parameters từ request
 * @param {string} query.name - Tên món ăn để tìm kiếm (optional)
 * @param {string} query.category - Danh mục để lọc (optional)
 * @param {boolean} query.is_available - Trạng thái có sẵn để lọc (optional)
 * @param {number} query.min_price - Giá tối thiểu để lọc (optional)
 * @param {number} query.max_price - Giá tối đa để lọc (optional)
 * @param {number} query.page - Số trang (default: 1)
 * @param {number} query.limit - Số items per page (default: 10)
 * @returns {Promise<Object>} - Object chứa danh sách foods và metadata
 */
async function getAllFoods(query) {
    // Destructure các query parameters với default values
    const { name, category, is_available, min_price, max_price, page = 1, limit = 10 } = query;

    // Tạo paginator để xử lý phân trang
    const paginator = new Paginator(page, limit);

    // Query database với multiple filtering conditions
    const results = await foodRepository()
        .where((builder) => {
            // Tìm kiếm theo tên món ăn
            if (name) {
                builder.where('name', 'ilike', `%${name}%`);
            }
            // Tìm kiếm theo danh mục
            if (category) {
                builder.where('category', 'ilike', `%${category}%`);
            }
            // Lọc theo trạng thái có sẵn - Mặc định là true
            if (is_available !== undefined) {
                builder.where('is_available', is_available);
            } else {
                builder.where('is_available', true);
            }
            // Lọc theo khoảng giá
            if (min_price !== undefined) {
                builder.where('price', '>=', min_price);
            }
            if (max_price !== undefined) {
                builder.where('price', '<=', max_price);
            }
        })
        .select(
            // Sử dụng window function để đếm tổng records
            knex.raw('COUNT(id) OVER() AS record_count'),
            'id',
            'name',
            'description',
            'price',
            'image_url',
            'category',
            'is_available',
            'created_at',
            'updated_at'
        )
        .orderBy('created_at', 'desc') // Sắp xếp theo ngày tạo mới nhất
        .limit(paginator.limit) // Giới hạn số records / page
        .offset(paginator.offset); // Skip records của các trang trước

    // Lấy tổng số records từ window function
    const totalRecords = results[0]?.record_count ?? 0;

    // Xóa field record_count khỏi kết quả trả về
    const foods = results.map((result) => {
        result.record_count = undefined;
        return result;
    });

    // Trả về data và metadata phân trang
    return {
        metadata: paginator.getMetadata(totalRecords),
        foods,
    };
}

/**
 * Lấy thông tin chi tiết của một món ăn theo ID
 * @param {number} id - ID của món ăn
 * @returns {Promise<Object|null>} - Object chứa thông tin food hoặc null nếu không tìm thấy
 */
async function getFoodById(id) {
    // Query food theo ID và trả về record đầu tiên (hoặc null)
    return foodRepository().where('id', id).select('*').first();
}

/**
 * Tạo mới một món ăn
 * @param {Object} payload - Dữ liệu food từ request body
 * @returns {Promise<Object>} - Object chứa thông tin food vừa tạo bao gồm ID
 */
async function createFood(payload) {
    try {
        // Filter và transform dữ liệu cho database
        const foodData = readFoodData(payload);
        console.log("Data to insert:", foodData);

        // Thêm timestamps
        const now = new Date();
        const ids = await foodRepository().insert({
            ...foodData,
            created_at: now,
            updated_at: now
        }).returning('id');

        // Extract ID từ kết quả insert
        const id = ids[0].id;

        // Trả về object với ID và data vừa insert
        return { id, ...foodData };
    } catch (error) {
        console.error("Error in createFood service:", error);
        throw error;
    }
}

/**
 * Cập nhật thông tin món ăn
 * @param {number} id - ID của món ăn cần cập nhật
 * @param {Object} updateData - Dữ liệu cập nhật từ request body
 * @returns {Promise<Object|null>} - Object chứa thông tin food sau khi cập nhật hoặc null nếu không tìm thấy
 */
async function updateFood(id, updateData) {
    // Lấy thông tin food hiện tại để kiểm tra tồn tại
    const currentFood = await foodRepository()
        .where('id', id)
        .select('*')
        .first();

    // Trả về null nếu food không tồn tại
    if (!currentFood) {
        return null;
    }

    // Filter và transform dữ liệu cập nhật 
    const foodData = readFoodData(updateData);

    // Chỉ update nếu có dữ liệu hợp lệ
    if (Object.keys(foodData).length > 0) {
        await foodRepository().where('id', id).update({
            ...foodData,
            updated_at: new Date() // Cập nhật timestamp
        });
    }

    // Merge old data với new data và trả về result cuối cùng
    return { ...currentFood, ...foodData };
}

/**
 * Xóa món ăn theo ID
 * @param {number} id - ID của món ăn cần xóa
 * @returns {Promise<Object|null>} - Object chứa thông tin food đã được "xóa" hoặc null nếu không tìm thấy
 */
async function deleteFood(id) {
  try {
    // Tìm món ăn trước khi "xóa"
    const food = await foodRepository().where('id', id).first();
    if (!food) {
      return null; // Trả về null nếu không tìm thấy
    }
    // Thực hiện xóa mềm
    await foodRepository().where('id', id).update({ is_available: false, updated_at: new Date() });
    return { ...food, is_available: false }; // Trả về món ăn đã được "xóa"
  } catch (error) {
    console.error(`Error soft deleting food with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Xóa tất cả food
 * @returns {Promise<void>}
 */
async function deleteAllFoods() {
    await foodRepository().del();
}

module.exports = {
    getAllFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood,
    deleteAllFoods
};
