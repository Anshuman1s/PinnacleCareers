const express = require('express');
const router = express.Router();
const HrContact = require('../models/HrContact');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET api/hr-contacts
// @desc    Get all HR contacts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const contacts = await HrContact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error('Fetch HR contacts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/hr-contacts
// @desc    Add a new HR contact (Admin only)
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { companyName, hrEmail, contactEmail, phone } = req.body;

    if (!companyName || !hrEmail || !contactEmail || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const contact = await HrContact.create({
      companyName,
      hrEmail,
      contactEmail,
      phone
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create HR contact error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/hr-contacts/:id
// @desc    Delete an HR contact (Admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const contact = await HrContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    await contact.deleteOne();
    res.json({ message: 'HR contact deleted successfully' });
  } catch (error) {
    console.error('Delete HR contact error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
