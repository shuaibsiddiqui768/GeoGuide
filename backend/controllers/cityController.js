const mongoose = require("mongoose");
const City = require("../models/City");

// Get all cities for the logged-in user
exports.getCities = async (req, res) => {
  try {
    // Filter cities by the authenticated user's ID
    const cities = await City.find({ user: req.user._id }).sort({
      date: -1,
      createdAt: -1,
    });
    res.status(200).json(cities);
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

