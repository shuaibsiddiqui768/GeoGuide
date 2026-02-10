const mongoose = require("mongoose");
const Tour = require("../models/Tour");
const User = require("../models/User");
const City = require("../models/City");
const { deleteImagesFromCloudinary } = require("../utils/cloudinaryHelper");

// Get all tours for the logged-in user or a friend
exports.getTours = async (req, res) => {
    try {
        const { userId } = req.query;
        let targetUserId = req.user._id;

        // If userId is provided, verify friendship before showing tours
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
                return res.status(403).json({ message: "You can only view trips of your friends" });
            }

            targetUserId = userId;
        }

        // Normalize targetUserId to ObjectId for reliable $or matching
        const targetId = new mongoose.Types.ObjectId(targetUserId);

        const tours = await Tour.find({
            $or: [
                { user: targetId },
                { participants: targetId }
            ],
        })
            .populate("cities")
            .populate("participants", "name username profileImage")
            .populate("user", "name username profileImage") // Populate owner
            .sort({ createdAt: -1 });
        res.status(200).json(tours);
    } catch (error) {
        console.error("Get tours error:", error);
        res.status(500).json({ message: "Failed to fetch tours" });
    }
};

// Get a single tour by ID
exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user._id },
                { participants: req.user._id },
                { pendingInvites: req.user._id }
            ],
        })
            .populate("cities")
            .populate("participants", "name username profileImage")
            .populate("pendingInvites", "name username profileImage")
            .populate("user", "name username profileImage");

        if (!tour) {
            return res.status(404).json({ message: "Tour not found" });
        }

        res.status(200).json(tour);
    } catch (error) {
        console.error("Get tour error:", error);
        res.status(500).json({ message: "Failed to fetch tour" });
    }
};

// Create a new tour
exports.createTour = async (req, res) => {
    try {
        const { name, description, startDate, endDate, participants } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Tour name is required" });
        }

        // Ensure participants are unique ObjectIds
        const uniqueParticipants = participants
            ? [...new Set(participants)].map(id => new mongoose.Types.ObjectId(id))
            : [];

        const tour = await Tour.create({
            name,
            description,
            startDate,
            endDate,
            user: req.user._id,
            cities: [],
            participants: [],
            pendingInvites: uniqueParticipants, // Save as pending invites
        });

        res.status(201).json(tour);
    } catch (error) {
        console.error("Create tour error:", error);
        res.status(500).json({ message: "Failed to create tour" });
    }
};

// Update a tour
exports.updateTour = async (req, res) => {
    try {
        const { name, description, startDate, endDate } = req.body;

        const tour = await Tour.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [{ user: req.user._id }, { participants: req.user._id }],
            },
            { name, description, startDate, endDate },
            { new: true }
        ).populate("cities").populate("participants", "name username profileImage");

        if (!tour) {
            return res.status(404).json({ message: "Tour not found" });
        }

        res.status(200).json(tour);
    } catch (error) {
        console.error("Update tour error:", error);
        res.status(500).json({ message: "Failed to update tour" });
    }
};

// Delete a tour (or leave if participant)
exports.deleteTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);

        if (!tour) {
            return res.status(404).json({ message: "Tour not found" });
        }

        // If user is owner, delete the tour AND all associated cities
        if (tour.user.toString() === req.user._id.toString()) {
            console.log(`Owner deleting tour ${req.params.id}. Associated cities:`, tour.cities);

            // Delete all cities that were part of this tour
            if (tour.cities && tour.cities.length > 0) {
                // Fetch cities to get their images before deletion
                const citiesToDelete = await City.find({ _id: { $in: tour.cities } });
                const allImageUrls = citiesToDelete.flatMap(c => c.images || []);

                if (allImageUrls.length > 0) {
                    console.log(`Deleting ${allImageUrls.length} city images from Cloudinary for tour ${req.params.id}`);
                    try {
                        await deleteImagesFromCloudinary(allImageUrls);
                    } catch (cloudinaryErr) {
                        console.error("Failed to delete tour city images from Cloudinary:", cloudinaryErr);
                    }
                }

                const deleteResult = await City.deleteMany({ _id: { $in: tour.cities } });
                console.log(`Deleted ${deleteResult.deletedCount} cities associated with tour.`);
            }

            await Tour.findByIdAndDelete(req.params.id);
            return res.status(204).send();
        }

        // If user is participant, just remove self
        const isParticipant = tour.participants.some(
            (p) => p.toString() === req.user._id.toString()
        );

        if (isParticipant) {
            tour.participants = tour.participants.filter(
                (p) => p.toString() !== req.user._id.toString()
            );
            await tour.save();
            return res.status(204).send();
        }

        return res.status(403).json({ message: "Unauthorized to delete this trip" });
    } catch (error) {
        console.error("Delete tour error:", error);
        res.status(500).json({ message: "Failed to delete tour" });
    }
};

// Add a city to a tour
exports.addCityToTour = async (req, res) => {
    try {
        const { cityId } = req.body;

        if (!cityId) {
            return res.status(400).json({ message: "City ID is required" });
        }

        const tour = await Tour.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [{ user: req.user._id }, { participants: req.user._id }],
            },
            { $addToSet: { cities: cityId } }, // $addToSet prevents duplicates
            { new: true }
        ).populate("cities").populate("participants", "name username profileImage");

        if (!tour) {
            return res.status(404).json({ message: "Tour not found" });
        }

        res.status(200).json(tour);
    } catch (error) {
        console.error("Add city to tour error:", error);
        res.status(500).json({ message: "Failed to add city to tour" });
    }
};

// Remove a city from a tour
exports.removeCityFromTour = async (req, res) => {
    try {
        const { cityId } = req.body;

        if (!cityId) {
            return res.status(400).json({ message: "City ID is required" });
        }

        const tour = await Tour.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [{ user: req.user._id }, { participants: req.user._id }],
            },
            { $pull: { cities: cityId } },
            { new: true }
        ).populate("cities").populate("participants", "name username profileImage");

        if (!tour) {
            return res.status(404).json({ message: "Tour not found" });
        }

        res.status(200).json(tour);
    } catch (error) {
        console.error("Remove city from tour error:", error);
        res.status(500).json({ message: "Failed to remove city from tour" });
    }
};

// Get pending tour invitations
exports.getInvites = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);

        const invites = await Tour.find({
            pendingInvites: userId,
        })
            .populate("user", "name username profileImage")
            .populate("cities")
            .sort({ createdAt: -1 });

        res.status(200).json(invites || []);
    } catch (error) {
        console.error("GET_INVITES_ERROR:", error);
        res.status(500).json({
            message: "Internal Server Error during invitation fetch",
            details: error.message
        });
    }
};

// Respond to tour invitation (accept/reject)
exports.respondToInvite = async (req, res) => {
    try {
        const { tourId, status } = req.body;

        if (!tourId || !["accept", "reject"].includes(status)) {
            return res.status(400).json({ message: "tourId and status (accept/reject) required" });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        const targetTourId = new mongoose.Types.ObjectId(tourId);

        const tour = await Tour.findOne({
            _id: targetTourId,
            pendingInvites: userId,
        });

        if (!tour) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        if (status === "accept") {
            // Remove from pending
            tour.pendingInvites = tour.pendingInvites.filter(
                (id) => id.toString() !== userId.toString()
            );
            // Add to participants if not already there
            if (!tour.participants.some(p => p.toString() === userId.toString())) {
                tour.participants.push(userId);
            }
        } else {
            // Just remove from pending
            tour.pendingInvites = tour.pendingInvites.filter(
                (id) => id.toString() !== userId.toString()
            );
        }

        await tour.save();
        res.status(200).json(tour);
    } catch (error) {
        console.error("RESPOND_INVITE_ERROR:", error);
        res.status(500).json({
            message: "Internal Server Error responding to invitation",
            details: error.message
        });
    }
};

// Invite someone to an existing tour
exports.inviteToTour = async (req, res) => {
    try {
        const { friendId } = req.body;
        const { id: tourId } = req.params;

        if (!friendId) {
            return res.status(400).json({ message: "Friend ID is required" });
        }

        const tour = await Tour.findOne({
            _id: tourId,
            user: req.user._id // Only owner can invite
        });

        if (!tour) {
            return res.status(404).json({ message: "Tour not found or unauthorized" });
        }

        const friendObjectId = new mongoose.Types.ObjectId(friendId);

        // Check if already a participant or already invited
        const alreadyParticipant = tour.participants.some(p => p.toString() === friendId);
        const alreadyInvited = tour.pendingInvites.some(p => p.toString() === friendId);

        if (alreadyParticipant || alreadyInvited) {
            return res.status(400).json({ message: "User is already part of or invited to this trip" });
        }

        // Add to pending invites
        tour.pendingInvites.push(friendObjectId);
        await tour.save();

        const updatedTour = await Tour.findById(tourId)
            .populate("cities")
            .populate("participants", "name username profileImage")
            .populate("pendingInvites", "name username profileImage")
            .populate("user", "name username profileImage");

        res.status(200).json(updatedTour);
    } catch (error) {
        console.error("Invite to tour error:", error);
        res.status(500).json({ message: "Failed to send invitation" });
    }
};
