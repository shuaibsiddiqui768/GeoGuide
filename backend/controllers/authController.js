const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { deleteImagesFromCloudinary } = require("../utils/cloudinaryHelper");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });


exports.signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailNorm = email.trim().toLowerCase();
    const usernameNorm = username.trim().toLowerCase();

    // Check if email exists
    const emailExists = await User.findOne({ email: emailNorm });
    if (emailExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Check if username exists
    const usernameExists = await User.findOne({ username: usernameNorm });
    if (usernameExists) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const user = await User.create({
      name,
      username: usernameNorm,
      email: emailNorm,
      password
    });

    const token = createToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.checkUsername = async (req, res) => {
  try {
    const { username, excludeUserId } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const usernameNorm = username.trim().toLowerCase();
    const query = { username: usernameNorm };

    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const user = await User.findOne(query);

    res.status(200).json({
      available: !user,
      message: user ? "Username is already taken" : "Username is available"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const usernameNorm = username.trim().toLowerCase();

    // Validation
    if (usernameNorm.length < 3 || usernameNorm.length > 30) {
      return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
    }

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(usernameNorm)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    // Check if taken by SOMEONE ELSE
    const exists = await User.findOne({ username: usernameNorm, _id: { $ne: req.user._id } });
    if (exists) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: usernameNorm },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Username updated successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update username error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const emailNorm = email.trim().toLowerCase();


    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = createToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.me = async (req, res) => {
  res.status(200).json({ user: req.user });
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    // 1. Delete user's profile image from Cloudinary if it exists
    if (user.profileImage) {
      console.log("Deleting profile image during account deletion:", user.profileImage);
      try {
        await deleteImagesFromCloudinary(user.profileImage);
      } catch (err) {
        console.error("Failed to delete profile image during account deletion:", err);
      }
    }

    // 2. Delete user's cities and their images from Cloudinary
    const City = require("../models/City");
    const userCities = await City.find({ user: req.user._id });
    const cityImages = userCities.flatMap(c => c.images || []);

    if (cityImages.length > 0) {
      try {
        await deleteImagesFromCloudinary(cityImages);
      } catch (err) {
        console.error("Failed to delete user city images during account deletion:", err);
      }
    }
    await City.deleteMany({ user: req.user._id });

    // 3. Delete user's tours (this logic might need refinement if tours have participants)
    const Tour = require("../models/Tour");
    await Tour.deleteMany({ user: req.user._id });

    // 4. Delete user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
