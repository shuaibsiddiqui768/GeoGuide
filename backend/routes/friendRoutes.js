const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const auth = require("../middleware/authMiddleware");

// All routes require authentication
router.use(auth.protect);

// User search and profile
router.get("/search", friendController.searchUsers);
router.get("/profile/:identifier", friendController.getUserProfile);

// Friend requests
router.get("/requests", friendController.getFriendRequests);
router.post("/request/:userId", friendController.sendFriendRequest);
router.delete("/request/:userId", friendController.cancelFriendRequest);
router.post("/accept/:userId", friendController.acceptFriendRequest);
router.delete("/reject/:userId", friendController.rejectFriendRequest);

// Friends management
router.get("/list", friendController.getFriendsList);
router.delete("/remove/:userId", friendController.removeFriend);
router.get("/status/:userId", friendController.getRelationshipStatus);

// Username management
router.put("/username", friendController.updateUsername);

module.exports = router;
