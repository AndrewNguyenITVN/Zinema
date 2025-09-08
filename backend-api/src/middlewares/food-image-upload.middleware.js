const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../api-error');

// Thư mục lưu trữ ảnh món ăn
const UPLOAD_DIR = path.join(__dirname, '../../public/images/foods');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cấu hình lưu trữ cho multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất: food-<food_id>-<timestamp>.<extension>
        const foodId = req.params.id;
        const uniqueSuffix = `${foodId}-${Date.now()}`;
        const extension = path.extname(file.originalname);
        cb(null, `food-${uniqueSuffix}${extension}`);
    }
});

// Filter file: chỉ chấp nhận các định dạng ảnh phổ biến
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Chỉ chấp nhận file hình ảnh!'), false);
    }
};

// Khởi tạo middleware multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
}).single('image'); // Tên field trong form-data là 'image'

/**
 * Middleware xử lý upload ảnh món ăn
 */
const foodImageUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Lỗi từ multer (ví dụ: file quá lớn)
            return next(new ApiError(400, err.message));
        } else if (err) {
            // Lỗi khác (ví dụ: file không đúng định dạng)
            return next(err);
        }
        // Nếu không có file được tải lên
        if (!req.file) {
            return next(new ApiError(400, 'Vui lòng chọn một file hình ảnh để tải lên.'));
        }
        next();
    });
};

module.exports = foodImageUpload;
