const foodService = require("../services/food.service");
const ApiError = require("../api-error");
const JSend = require("../jsend");

/**
 * Lấy tất cả món ăn
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getAllFoods(req, res, next) {
  let result = {
    foods: [],
    metadata: {
      totalRecords: 0,
      firstPage: 1,
      lastPage: 1,
      page: 1,
      limit: 10,
    },
  };

  try {
    result = await foodService.getAllFoods(req.query);
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal Server Error"));
  }

  return res.json(
    JSend.success({
      foods: result.foods,
      metadata: result.metadata,
    })
  );
}

/**
 * Lấy món ăn theo ID
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getFoodById(req, res, next) {
  const { id } = req.params;
  try {
    const food = await foodService.getFoodById(id);
    if (!food) {
      return next(new ApiError(404, "Food not found"));
    }
    return res.json(
      JSend.success({
        food,
      })
    );
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal Server Error"));
  }
}

/**
 * Tạo món ăn mới
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function createFood(req, res, next) {
  try {
    console.log("Request body:", req.body.input);

    const food = await foodService.createFood(req.body.input);
    return res
      .status(201)
      .set({
        Location: `${req.baseUrl}/${food.id}`,
      })
      .json(
        JSend.success({
          food,
        })
      );
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal Server Error"));
  }
}

/**
 * Cập nhật món ăn
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function updateFood(req, res, next) {
  const { id } = req.params;
  try {
    const updated = await foodService.updateFood(id, req.body.input);
    if (!updated) {
      return next(new ApiError(404, "Food not found"));
    }

    return res.json(
      JSend.success({
        food: updated,
      })
    );
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal Server Error"));
  }
}

/**
 * Xóa món ăn theo ID
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function deleteFood(req, res, next) {
  const { id } = req.params;

  try {
    const deleted = await foodService.deleteFood(id);
    if (!deleted) {
      return next(new ApiError(404, "Food not found"));
    }
    return res.json(JSend.success());
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal Server Error"));
  }
}

/**
 * Xóa tất cả món ăn
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function deleteAllFoods(req, res, next) {
  try {
    await foodService.deleteAllFoods();
    return res.json(JSend.success());
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal Server Error"));
  }
}

/**
 * Upload hình ảnh cho món ăn
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function uploadFoodImage(req, res, next) {
    const { id } = req.params;

    // req.file được cung cấp bởi middleware multer
    if (!req.file) {
        return next(new ApiError(400, "Không có file nào được tải lên."));
    }

    try {
        // Tạo đường dẫn URL công khai cho file ảnh
        const imageUrl = `/images/foods/${req.file.filename}`;

        // Cập nhật đường dẫn ảnh trong database
        const updatedFood = await foodService.updateFood(id, { image_url: imageUrl });

        if (!updatedFood) {
            return next(new ApiError(404, "Food not found"));
        }

        return res.json(JSend.success({
            food: updatedFood
        }));
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Internal Server Error"));
    }
}

module.exports = {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  deleteAllFoods,
  uploadFoodImage,
};
