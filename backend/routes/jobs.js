const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect, hrOrAdmin, adminOnly } = require('../middleware/authMiddleware');

// @route   GET api/jobs
// @desc    Get all jobs with search and filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Unpin expired jobs dynamically before fetching
    await Job.updateMany(
      { isPinned: true, pinnedUntil: { $lt: new Date() } },
      { $set: { isPinned: false, pinnedUntil: null } }
    );

    const { search } = req.query;
    let query = {};

    if (search) {
      // Handle the "Internship | Location" search format
      if (search.includes('|')) {
        const parts = search.split('|');
        const roleQuery = parts[0].trim();
        const locationQuery = parts[1] ? parts[1].trim() : '';

        const andQuery = [];
        if (roleQuery) {
          andQuery.push({
            $or: [
              { role: { $regex: roleQuery, $options: 'i' } },
              { type: { $regex: roleQuery, $options: 'i' } }
            ]
          });
        }
        if (locationQuery) {
          andQuery.push({ location: { $regex: locationQuery, $options: 'i' } });
        }

        if (andQuery.length > 0) {
          query = { $and: andQuery };
        }
      } else {
        // Fallback: search term matches role, location, company, or type
        query = {
          $or: [
            { role: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } }
          ]
        };
      }
    }

    const jobs = await Job.find(query).sort({ isPinned: -1, createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/jobs/stats/public
// @desc    Get counts for public stats (Active Roles, Top Startups, Applicants, HR Registry)
// @access  Public
router.get('/stats/public', async (req, res) => {
  try {
    const activeRoles = await Job.countDocuments({ status: { $ne: 'Closed' } });
    
    const jobCompanies = await Job.distinct('company');
    const HrContact = require('../models/HrContact');
    const hrCompanies = await HrContact.distinct('companyName');
    const uniqueCompanies = new Set([...jobCompanies, ...hrCompanies]);
    const topStartups = uniqueCompanies.size;

    const Application = require('../models/Application');
    const applicants = await Application.countDocuments();

    const hrRegistry = await HrContact.countDocuments();

    res.json({
      activeRoles: activeRoles || 0,
      topStartups: topStartups || 0,
      applicants: applicants || 0,
      hrRegistry: hrRegistry || 0
    });
  } catch (error) {
    console.error('Fetch public stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/jobs/:id
// @desc    Get single job details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.id || req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Count applications matching this jobId
    const Application = require('../models/Application');
    const applicantCount = await Application.countDocuments({ jobId: job._id });
    
    res.json({
      ...job.toObject(),
      applicantCount
    });
  } catch (error) {
    console.error('Fetch job details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/jobs
// @desc    Create a job post (HR and Admin only)
// @access  Private (HR/Admin)
router.post('/', protect, hrOrAdmin, async (req, res) => {
  try {
    const { role, company, location, type, description, openDays, establishedDate, howToApply, hrContact, openings } = req.body;

    if (!role || !company || !location || !description || !establishedDate || !howToApply || !hrContact || !hrContact.email || !hrContact.phone) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let openingsVal = 1;
    if (openings !== undefined && openings !== null && openings !== '') {
      const parsed = Number(openings);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Vacancies must be 0 or a positive number' });
      }
      openingsVal = parsed;
    }

    const job = await Job.create({
      role,
      company,
      location,
      type: type || 'Full-time',
      description,
      openDays: openDays || 30,
      establishedDate,
      howToApply,
      hrContact,
      postedBy: req.user._id,
      openings: openingsVal
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/jobs/:id/status
// @desc    Toggle job status (Open / Closed)
// @access  Private (HR/Admin only)
router.put('/:id/status', protect, hrOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify ownership
    if (req.user.role !== 'Admin' && String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to modify this job' });
    }

    job.status = job.status === 'Open' ? 'Closed' : 'Open';
    await job.save();

    res.json(job);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/jobs/:id
// @desc    Delete a job (Admin or posting HR only)
// @access  Private (HR/Admin only)
router.delete('/:id', protect, hrOrAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check ownership
    if (req.user.role !== 'Admin' && String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/jobs/:id/pin
// @desc    Pin a job for X days (Admin only)
// @access  Private (Admin only)
router.put('/:id/pin', protect, adminOnly, async (req, res) => {
  try {
    const { durationDays } = req.body;
    const days = Number(durationDays);

    if (!days || isNaN(days) || days <= 0) {
      return res.status(400).json({ message: 'Please provide a valid duration in days' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.isPinned = true;
    job.pinnedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await job.save();

    res.json({ message: `Job pinned successfully for ${days} days`, job });
  } catch (error) {
    console.error('Pin job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/jobs/:id/unpin
// @desc    Unpin a job (Admin only)
// @access  Private (Admin only)
router.put('/:id/unpin', protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.isPinned = false;
    job.pinnedUntil = null;
    await job.save();

    res.json({ message: 'Job unpinned successfully', job });
  } catch (error) {
    console.error('Unpin job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
