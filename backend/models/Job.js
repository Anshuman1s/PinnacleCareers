const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Internship', 'Full-time', 'Part-time', 'Contract'],
    default: 'Full-time',
    index: true
  },
  description: {
    type: String,
    required: true
  },
  openDays: {
    type: Number,
    required: true,
    default: 30 // Open for how many days
  },
  establishedDate: {
    type: String, // e.g. "2014" or "Oct 2014"
    required: true
  },
  howToApply: {
    type: String,
    required: true
  },
  hrContact: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  openings: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedUntil: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
