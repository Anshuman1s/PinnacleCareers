const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically expire documents after 24 hours to keep 'today' stats clean
  }
});

module.exports = mongoose.model('Visit', visitSchema);
