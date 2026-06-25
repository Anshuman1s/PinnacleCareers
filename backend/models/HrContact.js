const mongoose = require('mongoose');

const HrContactSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required']
  },
  hrEmail: {
    type: String,
    required: [true, 'HR email is required']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required']
  },
  phone: {
    type: String,
    required: [true, 'Contact phone number is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HrContact', HrContactSchema);
