const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String, // e.g. "June 18, 2026"
    required: true
  },
  time: {
    type: String, // e.g. "09:00 AM - 04:00 PM"
    required: true
  },
  location: {
    type: String, // Text address
    required: true
  },
  googleMapsUrl: {
    type: String, // Link to Google Maps location
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: false,
    trim: true
  },
  requirements: {
    type: String,
    required: true
  },
  type: {
    type: String, // e.g. "Immediate Joining"
    default: "Immediate Joining"
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Drive', driveSchema);
