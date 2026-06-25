const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// @route   GET api/messages/history/:otherUserId
// @desc    Get message history between logged-in user and another user
// @access  Private
router.get('/history/:otherUserId', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.otherUserId;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get message history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/messages/unread
// @desc    Get unread notification count/messages for logged-in user
// @access  Private
router.get('/unread', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all unread messages sent to current user, populate sender details
    const unreadMessages = await Message.find({
      receiverId: currentUserId,
      read: false
    }).populate('senderId', 'fullName email role').sort({ createdAt: -1 });

    res.json(unreadMessages);
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/messages/read/:senderId
// @desc    Mark all messages from a specific sender as read
// @access  Private
router.put('/read/:senderId', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const senderId = req.params.senderId;

    await Message.updateMany(
      { senderId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/messages/broadcast
// @desc    Broadcast a message to multiple recipients
// @access  Private
router.post('/broadcast', protect, async (req, res) => {
  try {
    const { recipientIds, content } = req.body;
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0 || !content) {
      return res.status(400).json({ message: 'Invalid recipients or message content.' });
    }

    const senderId = req.user._id;

    // Build database records
    const messagesData = recipientIds.map(receiverId => ({
      senderId,
      receiverId,
      content
    }));

    // Save all to database in bulk
    const savedMessages = await Message.insertMany(messagesData);

    // Get io instance bound to Express
    const io = req.app.get('socketio');
    if (io) {
      // Loop and emit real-time events to all users
      for (const msg of savedMessages) {
        const receiverIdStr = msg.receiverId.toString();
        
        // Populate senderId for frontend details
        const populatedMsg = await Message.findById(msg._id)
          .populate('senderId', 'fullName email role');
        
        // Emit to recipient
        io.to(receiverIdStr).emit('receive_private_message', populatedMsg);
        
        // Emit back to sender
        io.to(senderId.toString()).emit('receive_private_message', populatedMsg);
      }
    }

    res.status(201).json({ message: 'Broadcast sent successfully', count: savedMessages.length });
  } catch (error) {
    console.error('Broadcast message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/messages/broadcast-all
// @desc    Broadcast a message to ALL registered JobSeeker users (Admin only)
// @access  Private (Admin only)
router.post('/broadcast-all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required.' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const User = require('../models/User');
    // Find all users who are JobSeekers
    const seekers = await User.find({ role: 'JobSeeker' }, '_id');
    const recipientIds = seekers.map(u => u._id);

    if (recipientIds.length === 0) {
      return res.status(400).json({ message: 'No registered candidates found to message.' });
    }

    const senderId = req.user._id;

    // Build message records
    const messagesData = recipientIds.map(receiverId => ({
      senderId,
      receiverId,
      content
    }));

    // Save all to database in bulk
    const savedMessages = await Message.insertMany(messagesData);

    // Get io instance bound to Express
    const io = req.app.get('socketio');
    if (io) {
      // Loop and emit real-time events to all users
      for (const msg of savedMessages) {
        const receiverIdStr = msg.receiverId.toString();
        
        // Populate senderId for frontend details
        const populatedMsg = await Message.findById(msg._id)
          .populate('senderId', 'fullName email role');
        
        // Emit to recipient
        io.to(receiverIdStr).emit('receive_private_message', populatedMsg);
        
        // Emit back to sender
        io.to(senderId.toString()).emit('receive_private_message', populatedMsg);
      }
    }

    res.status(201).json({ 
      message: 'Global broadcast sent successfully', 
      count: savedMessages.length 
    });
  } catch (error) {
    console.error('Global broadcast error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
