const express = require("express");
const { uploadProfileImage, removeProfileImage, uploadCityImages } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Upload profile image - requires authentication
router.post("/profile-image", protect, uploadProfileImage);

// Remove profile image - requires authentication
router.delete("/profile-image", protect, removeProfileImage);

// Upload city images - requires authentication
router.post("/city-images", protect, uploadCityImages);

module.exports = router;
