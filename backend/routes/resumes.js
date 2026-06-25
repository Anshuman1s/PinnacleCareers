const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Application = require('../models/Application');
const { protect } = require('../middleware/authMiddleware');
// Firebase disabled - storing files locally in uploads/ directory

// Configure multer for file uploads (CSV, PDF, DOC, DOCX)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Preserve extension but add unique timestamp to prevent collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.doc' || ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents (.pdf, .doc, .docx) are allowed'), false);
    }
  }
});

// @route   GET api/resumes/applied/:jobId
// @desc    Check if the user has already applied for a specific job
// @access  Private
router.get('/applied/:jobId', protect, async (req, res) => {
  try {
    const alreadyApplied = await Application.exists({
      jobId: req.params.jobId,
      $or: [
        { userId: req.user._id },
        { email: req.user.email }
      ]
    });
    res.json({ alreadyApplied: !!alreadyApplied });
  } catch (error) {
    console.error('Check already applied error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/resumes/check
// @desc    Check if the logged-in user has uploaded their resume (has an Application record)
// @access  Private
router.get('/check', protect, async (req, res) => {
  try {
    const hasResume = await Application.exists({ 
      $or: [
        { userId: req.user._id },
        { email: req.user.email }
      ]
    });
    res.json({ hasResume: !!hasResume });
  } catch (error) {
    console.error('Check resume error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/resumes/upload
// @desc    Upload resume (CSV, PDF, or Word) and save details
// @access  Public
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a valid file' });
    }

    const isCsv = req.file.originalname.endsWith('.csv');

    if (isCsv) {
      // Process CSV parsing
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          // Delete the temporary CSV file after parsing
          fs.unlinkSync(req.file.path);

          if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty' });
          }

          const firstRow = results[0];
          
          const getVal = (keys) => {
            for (let k of Object.keys(firstRow)) {
              if (keys.includes(k.toLowerCase().trim())) {
                return firstRow[k];
              }
            }
            return '';
          };

          const fullName = getVal(['fullname', 'name', 'full name']) || 'Uploaded Candidate';
          const email = getVal(['email', 'mail', 'emailaddress']) || 'candidate@example.com';
          const phoneNumber = getVal(['phone', 'mobile', 'phonenumber', 'contact']);
          const skillsString = getVal(['skills', 'technologies', 'skillset']);
          const experience = getVal(['experience', 'work', 'history']);
          const education = getVal(['education', 'degree', 'qualification']);

          const skills = skillsString 
            ? skillsString.split(',').map(s => s.trim()).filter(Boolean) 
            : [];

          const application = await Application.create({
            userId: req.body.userId || null,
            fullName,
            email,
            phoneNumber,
            skills,
            experience,
            education,
            fileName: req.file.originalname
          });

          // Retroactively update existing job application records that had no resume
          if (application.userId || application.email) {
            const query = {
              jobId: { $ne: null },
              fileName: { $in: [null, ""] }
            };
            const orConditions = [];
            if (application.userId) orConditions.push({ userId: application.userId });
            if (application.email) orConditions.push({ email: { $regex: new RegExp(`^${application.email}$`, 'i') } });
            if (orConditions.length > 0) {
              query.$or = orConditions;
              await Application.updateMany(query, {
                $set: {
                  fileName: application.fileName,
                  skills: application.skills,
                  experience: application.experience,
                  education: application.education,
                  phoneNumber: application.phoneNumber
                }
              });
            }
          }

          res.status(201).json({
            message: 'CSV parsed and uploaded successfully',
            data: application
          });
        })
        .on('error', (err) => {
          console.error('CSV parse stream error:', err);
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          res.status(500).json({ message: 'Error parsing CSV file', error: err.message });
        });

    } else {
      // For PDF or Word documents: read details sent from frontend form fields
      const { fullName, email, phoneNumber, skills: skillsStr, experience, education } = req.body;

      if (!fullName || !email) {
        // Cleanup file if validation fails
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Full Name and Email are required for PDF/Word uploads' });
      }

      const skills = skillsStr
        ? skillsStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      // Save application record using local filename and convert to a web URL
      const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      const application = await Application.create({
        userId: req.body.userId || null,
        fullName,
        email,
        phoneNumber: phoneNumber || '',
        skills,
        experience: experience || '',
        education: education || '',
        fileName: req.file.filename,
        resumeUrl: resumeUrl
      });

      // Retroactively update existing job application records that had no resume
      if (application.userId || application.email) {
        const query = {
          jobId: { $ne: null },
          fileName: { $in: [null, ""] }
        };
        const orConditions = [];
        if (application.userId) orConditions.push({ userId: application.userId });
        if (application.email) orConditions.push({ email: { $regex: new RegExp(`^${application.email}$`, 'i') } });
        if (orConditions.length > 0) {
          query.$or = orConditions;
          await Application.updateMany(query, {
            $set: {
              fileName: application.fileName,
              resumeUrl: application.resumeUrl,
              skills: application.skills,
              experience: application.experience,
              education: application.education,
              phoneNumber: application.phoneNumber
            }
          });
        }
      }

      res.status(201).json({
        message: 'Resume file uploaded successfully',
        data: application
      });
    }

  } catch (error) {
    console.error('Resume upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/resumes/download-csv
// @desc    Download all resumes aggregated in a CSV (HR/Admin only)
// @access  Private
router.get('/download-csv', protect, async (req, res) => {
  try {
    let query = {};
    const { jobId } = req.query;

    if (req.user.role === 'HR') {
      const Job = require('../models/Job');
      // Find all jobs belonging to this HR/Company
      const myJobs = await Job.find({
        $or: [
          { postedBy: req.user._id },
          { company: req.user.companyName }
        ]
      });
      const myJobIds = myJobs.map(j => j._id.toString());

      if (jobId) {
        // Verify this jobId belongs to HR/Company
        if (!myJobIds.includes(jobId)) {
          return res.status(403).json({ message: 'Access denied: You can only download candidates for your own job postings.' });
        }
        query = { jobId: jobId };
      } else {
        // Download all candidates for their company's jobs
        query = { jobId: { $in: myJobIds } };
      }
    } else if (req.user.role === 'Admin') {
      if (jobId) {
        query = { jobId: jobId };
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const applications = await Application.find(query).populate('jobId', 'role').sort({ createdAt: -1 });
    
    // CSV Header row
    let csvContent = 'Full Name,Email,Phone Number,Skills,Experience,Education,File Name,Applied For,Applied Date\n';
    
    const escapeCsvField = (val) => {
      if (val === undefined || val === null) return '';
      let str = String(val).replace(/"/g, '""'); // Escape double quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`; // Wrap in double quotes if commas or special chars present
      }
      return str;
    };
 
    applications.forEach((app) => {
      const skillsStr = app.skills ? app.skills.join(', ') : '';
      const dateStr = app.createdAt ? app.createdAt.toISOString() : '';
      const roleStr = app.jobId ? app.jobId.role : 'General Upload';
 
      csvContent += [
        escapeCsvField(app.fullName),
        escapeCsvField(app.email),
        escapeCsvField(app.phoneNumber),
        escapeCsvField(skillsStr),
        escapeCsvField(app.experience),
        escapeCsvField(app.education),
        escapeCsvField(app.fileName),
        escapeCsvField(roleStr),
        escapeCsvField(dateStr)
      ].join(',') + '\n';
    });
 
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=resumes_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Download CSV error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/resumes/apply
// @desc    Apply for a job using the user's existing resume or profile details
// @access  Private
router.post('/apply', protect, async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const Job = require('../models/Job');
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Find user's existing resume upload
    const existingResume = await Application.findOne({ 
      $or: [
        { userId: req.user._id },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    // Check if they already applied to this job
    const alreadyApplied = await Application.exists({
      jobId,
      $or: [
        { userId: req.user._id },
        { email: req.user.email }
      ]
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Default to user profile details if no resume was uploaded
    let fullName = req.user.fullName;
    let email = req.user.email;
    let phoneNumber = req.user.phoneNumber || '';
    let skills = [];
    let experience = '';
    let education = '';
    let fileName = '';
    let resumeUrl = '';

    if (existingResume) {
      fullName = existingResume.fullName;
      email = existingResume.email;
      phoneNumber = existingResume.phoneNumber || phoneNumber;
      skills = existingResume.skills || [];
      experience = existingResume.experience || '';
      education = existingResume.education || '';
      fileName = existingResume.fileName || '';
      resumeUrl = existingResume.resumeUrl || '';
    }

    // Create new application record linked to the job
    const application = await Application.create({
      jobId,
      userId: req.user._id,
      fullName,
      email,
      phoneNumber,
      skills,
      experience,
      education,
      fileName,
      resumeUrl
    });

    res.status(201).json({ message: 'Application submitted successfully', data: application });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/resumes
// @desc    Get uploaded resumes (Admin gets all, HR gets company jobs applications only)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'Admin') {
      const applications = await Application.find().populate('jobId', 'role company').sort({ createdAt: -1 });
      return res.json(applications);
    } else if (req.user.role === 'HR') {
      const Job = require('../models/Job');
      // Find all jobs posted by this HR or matching their companyName
      const myJobs = await Job.find({
        $or: [
          { postedBy: req.user._id },
          { company: req.user.companyName }
        ]
      });
      const myJobIds = myJobs.map(j => j._id);

      // Find applications linked to these job IDs
      const applications = await Application.find({ jobId: { $in: myJobIds } }).populate('jobId', 'role company').sort({ createdAt: -1 });
      return res.json(applications);
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
