const express = require("express");
const mongoose = require("mongoose");
const {
  getCities,
  getCity,
  createCity,
  updateCity,
  deleteCity,
} = require("../controllers/cityController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

function validateObjectId(req, res, next) {
  const { id } = req.params;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
}

// All routes require authentication
router.get("/", protect, getCities);
router.get("/:id", protect, validateObjectId, getCity);
router.post("/", protect, createCity);
router.put("/:id", protect, validateObjectId, updateCity);
router.delete("/:id", protect, validateObjectId, deleteCity);

module.exports = router;

