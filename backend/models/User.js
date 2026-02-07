const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: [true, "Email must be unique"],
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email"],
      set: (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: [200, "Bio cannot be more than 200 characters"],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    // Friend system
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    sentRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    receivedRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create indexes for search
userSchema.index({ username: 1 });
userSchema.index({ name: "text", username: "text" });

// Hash the password if modified/new
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if users are friends
userSchema.methods.isFriendsWith = function (userId) {
  return this.friends.some(id => id.toString() === userId.toString());
};

// Method to check if request was sent
userSchema.methods.hasSentRequestTo = function (userId) {
  return this.sentRequests.some(id => id.toString() === userId.toString());
};

// Method to check if request was received
userSchema.methods.hasReceivedRequestFrom = function (userId) {
  return this.receivedRequests.some(id => id.toString() === userId.toString());
};

module.exports = mongoose.model("User", userSchema);
