const express = require("express");
const { uploadProfileImage, removeProfileImage } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Upload profile image - requires authentication
router.post("/profile-image", protect, uploadProfileImage);

// Remove profile image - requires authentication
router.delete("/profile-image", protect, removeProfileImage);

module.exports = router;
