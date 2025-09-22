// models/City.js
const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const citySchema = new mongoose.Schema(
  {
    cityName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    emoji: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "", trim: true },
    position: { type: positionSchema, required: true },
    clientId: { type: String, index: true }, // optional: preserve old JSON 'id'
  },
  { timestamps: true }
);

module.exports = mongoose.model("City", citySchema);
