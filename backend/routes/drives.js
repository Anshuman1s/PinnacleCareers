const express = require('express');
const router = express.Router();
const Drive = require('../models/Drive');
const { protect, hrOrAdmin } = require('../middleware/authMiddleware');

// @route   GET api/drives
// @desc    Get all upcoming walk-in drives
// @access  Public
router.get('/', async (req, res) => {
  try {
    const drives = await Drive.find().sort({ createdAt: -1 });
    res.json(drives);
  } catch (error) {
    console.error('Fetch drives error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/drives
// @desc    Create a walk-in drive (HR/Admin only)
// @access  Private
router.post('/', protect, hrOrAdmin, async (req, res) => {
  try {
    const { company, role, date, time, location, googleMapsUrl, requirements, type, contact } = req.body;

    if (!company || !role || !date || !time || !location || !requirements || !googleMapsUrl) {
      return res.status(400).json({ message: 'Please provide all required fields, including the Google Maps URL' });
    }

    const drive = await Drive.create({
      company,
      role,
      date,
      time,
      location,
      googleMapsUrl: googleMapsUrl.trim(),
      requirements,
      type: type || 'Immediate Joining',
      postedBy: req.user._id,
      contact: contact || undefined
    });

    res.status(201).json(drive);
  } catch (error) {
    console.error('Create drive error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/drives/:id
// @desc    Delete a walk-in drive (Admin or posting HR only)
// @access  Private
router.delete('/:id', protect, hrOrAdmin, async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Walk-in drive not found' });
    }

    // Verify ownership
    if (req.user.role !== 'Admin' && String(drive.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this drive' });
    }

    await drive.deleteOne();
    res.json({ message: 'Walk-in drive deleted successfully' });
  } catch (error) {
    console.error('Delete drive error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
