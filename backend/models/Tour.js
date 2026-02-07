const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter a tour name"],
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        cities: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "City",
            },
        ],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        pendingInvites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        budget: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "USD",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Tour", tourSchema);
