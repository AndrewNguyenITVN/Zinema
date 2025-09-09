const express = require("express");
const { z } = require("zod");

const foodController = require("../controllers/food.controller");
const { methodNotAllowed } = require("../controllers/errors.controller");
const { validateRequest } = require("../middlewares/validator.middleware");
const foodImageUpload = require("../middlewares/food-image-upload.middleware");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants");
const {
  foodSchema,
  getFoodsQuerySchema,
  createFoodSchema,
  updateFoodSchema,
} = require("../schemas/food.schemas");

const router = express.Router();

module.exports.setup = (app) => {
  app.use("/api/foods", router);

  // GET /api/foods - Lấy tất cả món ăn với query parameters
  router.get(
    "/",
    validateRequest(
      z.object({
        input: getFoodsQuerySchema.strict(),
      })
    ),
    foodController.getAllFoods
  );

  // POST /api/foods - Tạo món ăn mới (chỉ admin)
  router.post(
    "/",
    [
      authenticateToken,
      authorizeRoles([ROLES.ADMIN]),
      validateRequest(
        z.object({
          input: createFoodSchema.strict(),
        })
      ),
    ],
    foodController.createFood
  );

  // DELETE /api/foods - Xóa tất cả món ăn (chỉ admin)
  router.delete(
    "/",
    [
      authenticateToken,
      authorizeRoles([ROLES.ADMIN]),
      validateRequest(
        z.object({
          input: z.object({}).strict(),
        })
      ),
    ],
    foodController.deleteAllFoods
  );

  router.all("/", methodNotAllowed);

  // GET /api/foods/:id - Lấy món ăn theo ID
  router.get(
    "/:id",
    validateRequest(
      z.object({
        input: foodSchema.pick({ id: true }).strict(),
      })
    ),
    foodController.getFoodById
  );

  // PUT /api/foods/:id - Cập nhật món ăn (chỉ admin)
  router.put(
    "/:id",
    [
      authenticateToken,
      authorizeRoles([ROLES.ADMIN]),
      validateRequest(
        z.object({
          input: updateFoodSchema
            // .extend({
            //     id: z.coerce.number().positive("ID phải là số dương"),
            // })
            .strict()
            .refine(
              (data) => {
                const keys = Object.keys(data);
                return keys.some(
                  (key) => key !== "id" && data[key] !== undefined
                );
              },
              {
                message: "At least one field is required",
              }
            ),
        })
      ),
    ],
    foodController.updateFood
  );

  // DELETE /api/foods/:id - Xóa món ăn theo ID (chỉ admin)
  router.delete(
    "/:id",
    [
      authenticateToken,
      authorizeRoles([ROLES.ADMIN]),
      validateRequest(
        z.object({
          input: foodSchema.pick({ id: true }).strict(),
        })
      ),
    ],
    foodController.deleteFood
  );

  router.all("/:id", methodNotAllowed);

  // POST /api/foods/:id/image - Upload ảnh cho món ăn (chỉ admin)
  router.post(
    "/:id/image",
    [
      authenticateToken,
      authorizeRoles([ROLES.ADMIN]),
      validateRequest(
        z.object({
          input: foodSchema.pick({ id: true }).strict(),
        })
      ),
      foodImageUpload, // Middleware xử lý upload file
    ],
    foodController.uploadFoodImage
  );
};
