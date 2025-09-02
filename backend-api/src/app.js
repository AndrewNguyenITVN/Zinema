const rateLimit = require("express-rate-limit");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const JSend = require("./jsend");
const authRouter = require("./routes/auth.router");
const cinemaRouter = require("./routes/cinema.router");
const movieRouter = require("./routes/movie.router");
const showtimeRouter = require("./routes/showtime.router");
const bookingRouter = require("./routes/booking.router");
const foodRouter = require("./routes/food.router");
const statisticsRouter = require("./routes/statistics.router");
const {
  resourceNotFound,
  handleError,
} = require("./controllers/errors.controller");

const getSwaggerDocument = () => {
  delete require.cache[require.resolve("../doc/openapiSpec.json")];
  return require("../doc/openapiSpec.json");
};

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Test rate limit
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60, // Limit each IP to 30 requests per window (1 minute)
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
    });
  },
  standardHeaders: true, // Return rate limit info in the 'RateLimit-*' headers
  legacyHeaders: false, // Disable the 'X-RateLimit-*' headers
});

app.use(limiter);

app.get("/", (req, res) => {
  return res.json(JSend.success({ message: "Cinema Management API" }));
});

// Tài liệu API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(getSwaggerDocument()));

// Serve static files
app.use("/public", express.static("public"));

// Setup routes
authRouter.setup(app);
cinemaRouter.setup(app);
movieRouter.setup(app);
showtimeRouter.setup(app);
bookingRouter.setup(app);
foodRouter.setup(app);
statisticsRouter.setup(app);

// 404 handler - must be after all routes
app.use(resourceNotFound);

// Error handling middleware - must be last
app.use(handleError);

module.exports = app;
