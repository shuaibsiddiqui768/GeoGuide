const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// CORS configuration - allow frontend origins
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    process.env.FRONTEND_URL, // Add your Render frontend URL here
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Security headers (configured to work with CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Logging only in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // request logging in dev per docs [web:21]
}

// Parse JSON request bodies (increased limit for image uploads)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cities", require("./routes/cityRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

// Health route
app.get("/", (req, res) => {
  res.send("GeoGuide API is running...");
});

// Centralized error handler at end
app.use((err, req, res, next) => {
  console.error(err);
  const status =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ message: err.message || "Server Error" });
}); // express error handler placement pattern [web:32][web:26]

// Start server after DB connected
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect DB, server not started:", err);
    process.exit(1);
  });
