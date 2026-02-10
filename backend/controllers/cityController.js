const mongoose = require("mongoose");
const City = require("../models/City");
const User = require("../models/User");
const Tour = require("../models/Tour");
const { deleteImagesFromCloudinary } = require("../utils/cloudinaryHelper");

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

    // Normalize targetUserId for consistent matching
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    // 1. Get ALL tours where this user is the owner, a participant, or has a pending invite
    // This allows them to see the cities related to trips they are involved in.
    const involvedTours = await Tour.find({
      $or: [
        { user: targetId },
        { participants: targetId },
        { pendingInvites: targetId }
      ],
    }).select("cities").lean();

    // Flatten and stringify all city IDs from these tours to ensure unique, valid matching
    const tourCityIds = [
      ...new Set(
        involvedTours
          .flatMap((t) => t.cities || [])
          .map((id) => id.toString())
      )
    ];

    // 2. Query cities: 
    // - Owned by the target user
    // - OR included in any tours they are involved in
    const cities = await City.find({
      $or: [
        { user: targetId },
        { _id: { $in: tourCityIds } }
      ],
    })
      .sort({
        date: -1,
        createdAt: -1,
      })
      .lean();

    res.status(200).json({ data: cities });
  } catch (err) {
    console.error("getCities error:", err);
    res.status(500).json({ message: "Server error retrieving cities" });
  }
};

// Get a single city (with permission checks)
exports.getCity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    // 1. Find the city first
    const city = await City.findById(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    // 2. Check Ownership
    if (city.user.toString() === req.user._id.toString()) {
      return res.status(200).json(city);
    }

    // 3. Check Friendship/Public status via Owner
    const owner = await User.findById(city.user);
    if (owner) {
      const currentUser = await User.findById(req.user._id);
      const isFriend = currentUser.friends.some(
        (f) => f.toString() === owner._id.toString()
      );

      if (isFriend || owner.isPublic) {
        return res.status(200).json(city);
      }
    }

    // 4. Check if user is in a shared/invited tour that includes this city
    const tourCityId = new mongoose.Types.ObjectId(id);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const sharedTour = await Tour.findOne({
      cities: tourCityId,
      $or: [
        { user: userId },
        { participants: userId },
        { pendingInvites: userId }
      ],
    });

    if (sharedTour) {
      return res.status(200).json(city);
    }

    // If none of the above, unauthorized
    return res.status(403).json({ message: "Unauthorized to view this city" });
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

    // 1. Find city first to check ownership
    const city = await City.findById(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    // 2. Check Ownership - only the creator can edit their pinned cities
    if (city.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized: Only the creator can edit this city's details"
      });
    }

    const payload = { ...req.body };
    if (payload.position) {
      payload.position = {
        lat: Number(payload.position.lat),
        lng: Number(payload.position.lng),
      };
    }
    // Prevent changing the user field
    delete payload.user;

    // 3. Handle image deletion from Cloudinary if images were removed
    if (payload.images && Array.isArray(payload.images)) {
      const removedImages = city.images.filter(img => !payload.images.includes(img));
      if (removedImages.length > 0) {
        console.log(`Deleting ${removedImages.length} removed images from Cloudinary for city ${id}`);
        try {
          await deleteImagesFromCloudinary(removedImages);
        } catch (cloudinaryErr) {
          console.error("Failed to delete removed city images from Cloudinary:", cloudinaryErr);
        }
      }
    }

    const updated = await City.findByIdAndUpdate(
      id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

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

    // 1. Find city first
    const city = await City.findById(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    // 2. Check Ownership
    if (city.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized: Only the creator can delete this city"
      });
    }

    // 3. Delete images from Cloudinary if any
    if (city.images && city.images.length > 0) {
      console.log(`Cleanup: Deleting ${city.images.length} images from Cloudinary for city: ${city.cityName} (${id})`);
      try {
        const results = await deleteImagesFromCloudinary(city.images);
        console.log(`Cloudinary cleanup results for ${city.cityName}:`, results);
      } catch (cloudinaryErr) {
        console.error("Failed to delete city images from Cloudinary during city deletion:", cloudinaryErr);
      }
    }

    console.log(`Database: Deleting city document: ${city.cityName} (${id})`);
    await City.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    console.error("deleteCity error:", err);
    res.status(500).json({ message: "Server error deleting city" });
  }
};

