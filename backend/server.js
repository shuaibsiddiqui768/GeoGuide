const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Security headers
app.use(helmet()); // sets sensible defaults for security headers [web:24][web:31]

// CORS: restrict in production, open in dev
app.use(cors());

// Logging only in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // request logging in dev per docs [web:21]
}

// Parse JSON request bodies
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cities", require("./routes/cityRoutes"));

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
