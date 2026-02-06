const cloudinary = require("../config/cloudinary");
const User = require("../models/User");

// Upload profile image to Cloudinary
exports.uploadProfileImage = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ message: "No image provided" });
        }

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "geoguide/profiles",
            width: 300,
            height: 300,
            crop: "fill",
            gravity: "face",
            quality: "auto",
            format: "webp",
        });

        // Update user's profile image in database
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profileImage: uploadResponse.secure_url },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile image uploaded successfully",
            profileImage: uploadResponse.secure_url,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload image" });
    }
};

// Remove profile image
exports.removeProfileImage = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profileImage: "" },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile image removed successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Remove image error:", error);
        res.status(500).json({ message: "Failed to remove image" });
    }
};
