const express = require("express");
const {
    getTours,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    addCityToTour,
    removeCityFromTour,
    getInvites,
    respondToInvite,
} = require("../controllers/tourController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Tour CRUD routes
router.get("/", getTours);
router.get("/invites", getInvites);
router.post("/respond-invite", respondToInvite);
router.get("/:id", getTour);
router.post("/", createTour);
router.put("/:id", updateTour);
router.delete("/:id", deleteTour);

// City management routes
router.post("/:id/cities", addCityToTour);
router.delete("/:id/cities", removeCityFromTour);

module.exports = router;
