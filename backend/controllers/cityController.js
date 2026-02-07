const mongoose = require("mongoose");
const City = require("../models/City");
const User = require("../models/User");

// Get all cities for the logged-in user or a friend
exports.getCities = async (req, res) => {
  try {
    const { userId } = req.query;
    let targetUserId = req.user._id;

    // If userId is provided, verify friendship before showing cities
    if (userId && userId !== req.user._id.toString()) {
      // Check if the target user exists
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if current user is friends with target user
      const currentUser = await User.findById(req.user._id);
      const isFriend = currentUser.friends.some(
        friendId => friendId.toString() === userId
      );

      // Also check if target profile is public
      if (!isFriend && !targetUser.isPublic) {
        return res.status(403).json({ message: "You can only view cities of your friends" });
      }

      targetUserId = userId;
    }

    // Filter cities by the target user's ID
    const cities = await City.find({ user: targetUserId }).sort({
      date: -1,
      createdAt: -1,
    });
    res.status(200).json({ data: cities });
  } catch (err) {
    console.error("getCities error:", err);
    res.status(500).json({ message: "Server error retrieving cities" });
  }
};

// Get a single city (only if it belongs to the logged-in user)
exports.getCity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    // Find city that belongs to this user
    const city = await City.findOne({ _id: id, user: req.user._id });
    if (!city) return res.status(404).json({ message: "City not found" });
    res.status(200).json(city);
  } catch (err) {
    console.error("getCity error:", err);
    res.status(500).json({ message: "Server error retrieving city" });
  }
};

// Create a new city for the logged-in user
exports.createCity = async (req, res) => {
  try {
    const {
      cityName,
      country,
      emoji,
      date,
      notes,
      position,
      images, // Add images here
      id: clientId,
    } = req.body;
    if (
      !cityName ||
      !country ||
      !emoji ||
      !date ||
      !position?.lat ||
      !position?.lng
    ) {
      return res.status(400).json({
        message:
          "cityName, country, emoji, date, and position.lat/lng are required",
      });
    }
    const doc = await City.create({
      cityName,
      country,
      emoji,
      date,
      notes: notes || "",
      position: {
        lat: Number(position.lat),
        lng: Number(position.lng),
      },
      images: images || [], // Save images
      clientId: clientId || undefined,
      // Associate the city with the logged-in user
      user: req.user._id,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error("createCity error:", err);
    res.status(500).json({ message: "Server error creating city" });
  }
};

// Update a city (only if it belongs to the logged-in user)
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const payload = { ...req.body };
    if (payload.position) {
      payload.position = {
        lat: Number(payload.position.lat),
        lng: Number(payload.position.lng),
      };
    }
    // Prevent changing the user field
    delete payload.user;

    // Only update if the city belongs to this user
    const updated = await City.findOneAndUpdate(
      { _id: id, user: req.user._id },
      payload,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updated) return res.status(404).json({ message: "City not found" });
    res.status(200).json(updated);
  } catch (err) {
    console.error("updateCity error:", err);
    res.status(500).json({ message: "Server error updating city" });
  }
};

// Delete a city (only if it belongs to the logged-in user)
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    // Only delete if the city belongs to this user
    const removed = await City.findOneAndDelete({ _id: id, user: req.user._id });
    if (!removed) return res.status(404).json({ message: "City not found" });
    res.status(204).send();
  } catch (err) {
    console.error("deleteCity error:", err);
    res.status(500).json({ message: "Server error deleting city" });
  }
};

