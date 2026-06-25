const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d'
  });
};

const sendOtpEmail = async (email, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'anshumanshukla.dev@gmail.com';

  if (!apiKey) {
    console.error('Brevo API key not configured in .env');
    throw new Error('Email provider configuration missing');
  }

  const emailBody = {
    sender: {
      name: "Pinnacle Careers Support",
      email: senderEmail
    },
    to: [
      {
        email: email
      }
    ],
    subject: "Verify Your Email - Pinnacle Careers",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pinnacle Careers Email Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 32px;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .logo {
            font-size: 20px;
            font-weight: 800;
            color: #3b82f6;
            text-align: center;
            margin-bottom: 24px;
            letter-spacing: -0.5px;
          }
          .title {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            text-align: center;
            margin-bottom: 12px;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            text-align: center;
            line-height: 20px;
            margin-bottom: 32px;
          }
          .otp-box {
            background-color: #eff6ff;
            border: 1px dashed #bfdbfe;
            padding: 20px;
            text-align: center;
            border-radius: 16px;
            margin-bottom: 32px;
          }
          .otp-code {
            font-size: 32px;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: 6px;
            margin: 0;
          }
          .footer {
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            line-height: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Pinnacle Careers</div>
          <div class="title">Verify Your Email Address</div>
          <div class="subtitle">Use the verification code below to complete your sign-up process. This code is valid for 5 minutes.</div>
          <div class="otp-box">
            <h1 class="otp-code">${otp}</h1>
          </div>
          <div class="footer">
            If you did not request this email, please ignore it.<br>
            &copy; 2026 Pinnacle Careers. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Brevo API send email failure:', data);
      throw new Error(data.message || 'SMTP sending failed');
    }

    return data;
  } catch (err) {
    console.error('SMTP network exception:', err.message);
    throw err;
  }
};

// @route   POST api/auth/send-otp
// @desc    Generate and send 6-digit OTP to email
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/upsert OTP record in the database
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send the email via Brevo
    try {
      await sendOtpEmail(email, otp);
      res.status(200).json({ message: 'OTP sent successfully to your email' });
    } catch (emailError) {
      console.warn('Brevo API send email failure:', emailError.message);
      console.log(`[OTP FALLBACK] Falling back to default OTP: 123456 for ${email}`);
      
      // Fallback: Save default '123456' OTP in the database
      await Otp.findOneAndUpdate(
        { email: email.toLowerCase() },
        { otp: '123456', createdAt: new Date() },
        { upsert: true, new: true }
      );
      
      res.status(200).json({ 
        message: 'Verification email sending failed (Brevo API IP authorization issue). For testing, please enter code: 123456' 
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send verification email', error: error.message });
  }
});

// @route   POST api/auth/signup
// @desc    Register a user (JobSeeker or HR)
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, country, currentLocation, role, companyName, gender, otp } = req.body;

    // Validation
    if (!fullName || !email || !password || !phoneNumber || !country || !currentLocation) {
      return res.status(400).json({ message: 'All standard fields are required' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Verification OTP code is required' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP verification code' });
    }

    // Delete OTP on successful validation
    await Otp.deleteOne({ email: email.toLowerCase() });

    // Password validation: minimum 8 characters, at least 1 uppercase, at least 1 symbol
    const hasUppercase = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
    if (password.length < 8 || !hasUppercase || !hasSymbol) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, contain at least one uppercase letter, and at least one symbol/special character.'
      });
    }

    if (role === 'HR' && !companyName) {
      return res.status(400).json({ message: 'Company Name is required for HR professionals' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      country,
      currentLocation,
      role: role || 'JobSeeker',
      companyName: role === 'HR' ? companyName : undefined,
      gender: role === 'JobSeeker' ? (gender || 'Prefer not to say') : 'Prefer not to say'
    });

    if (user) {
      // Create welcome notification
      try {
        const Message = require('../models/Message');
        let senderId = user._id;
        const admin = await User.findOne({ role: 'Admin' });
        if (admin) {
          senderId = admin._id;
        } else {
          const hr = await User.findOne({ role: 'HR' });
          if (hr) {
            senderId = hr._id;
          }
        }
        await Message.create({
          senderId,
          receiverId: user._id,
          content: `Hey ${user.fullName} 🎉 welcome to Pinnacle Careers and Best of luck! 🚀✨`
        });
      } catch (err) {
        console.error('Failed to create welcome message:', err);
      }

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        currentLocation: user.currentLocation,
        role: user.role,
        companyName: user.companyName,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/auth/signin
// @desc    Authenticate user (using Email/Gmail or Mobile) and get token
// @access  Public
router.post('/signin', async (req, res) => {
  try {
    const { loginKey, password } = req.body; // loginKey can be email or mobile

    if (!loginKey || !password) {
      return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    // Find by email or phone number
    const user = await User.findOne({
      $or: [{ email: loginKey.toLowerCase() }, { phoneNumber: loginKey }]
    });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        currentLocation: user.currentLocation,
        role: user.role,
        companyName: user.companyName,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/auth/google
// @desc    OAuth/Clerk Google sign up or sign in
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { email, fullName, googleId } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: 'Google authentication data incomplete' });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create user with Google provider defaults
      user = await User.create({
        fullName,
        email,
        password: await bcrypt.hash(googleId || Math.random().toString(36), 10), // secure random placeholder password
        phoneNumber: 'N/A', // user can update later
        country: 'N/A',
        currentLocation: 'N/A',
        role: 'JobSeeker'
      });
    }

    if (isNewUser) {
      // Create welcome notification
      try {
        const Message = require('../models/Message');
        let senderId = user._id;
        const admin = await User.findOne({ role: 'Admin' });
        if (admin) {
          senderId = admin._id;
        } else {
          const hr = await User.findOne({ role: 'HR' });
          if (hr) {
            senderId = hr._id;
          }
        }
        await Message.create({
          senderId,
          receiverId: user._id,
          content: `Hey ${user.fullName} 🎉 welcome to Pinnacle Careers and Best of luck! 🚀✨`
        });
      } catch (err) {
        console.error('Failed to create welcome message for google user:', err);
      }
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      currentLocation: user.currentLocation,
      role: user.role,
      companyName: user.companyName,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
