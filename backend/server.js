const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config({ override: true });

const User = require('./models/User');
const Job = require('./models/Job');
const Visit = require('./models/Visit');
const Drive = require('./models/Drive');
const HrContact = require('./models/HrContact');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const connectDB = require('./db');

// Database Connection & Seed Data Function
const initializeDBAndSeed = async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    try {
      // Clean up legacy negative openings to avoid validation failures on existing records
      const updateResult = await Job.updateMany(
        { openings: { $lt: 0 } },
        { $set: { openings: 0 } }
      );
      if (updateResult.modifiedCount > 0) {
        console.log(`Cleaned up ${updateResult.modifiedCount} legacy job listings with negative vacancies.`);
      }

      // Seed Admin User
     
      // Seed HR User


initializeDBAndSeed();

const { startCleanupSchedule } = require('./utils/userCleanup');
startCleanupSchedule();

// Routes Mapping
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/drives', require('./routes/drives'));
app.use('/api/hr-contacts', require('./routes/hrContacts'));
app.use('/api/messages', require('./routes/messages'));

// Base health check route
app.get('/', (req, res) => {
  res.send('Job Portal API is running.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Wrap express app in HTTP server to support socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Bind io instance to express app so it is accessible in API routers
app.set('socketio', io);

// Import Message model for socket database persistence
const Message = require('./models/Message');

// Socket.io Connection Event Handler
io.on('connection', (socket) => {
  console.log('New Socket.io client connected:', socket.id);

  // User joins a room named after their unique database userId
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket client ${socket.id} joined private room: ${userId}`);
    }
  });

  // Handle HR/Admin sending a message to a candidate
  socket.on('send_private_message', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      if (!senderId || !receiverId || !content) return;

      // Save message to database
      const newMessage = await Message.create({
        senderId,
        receiverId,
        content
      });

      // Populate senderId info to give frontend full details
      const populatedMsg = await Message.findById(newMessage._id)
        .populate('senderId', 'fullName email role');

      // Emit message to the receiver's private room
      io.to(receiverId).emit('receive_private_message', populatedMsg);
      // Emit message back to the sender's private room so other tabs stay in sync
      io.to(senderId).emit('receive_private_message', populatedMsg);
      
      console.log(`Private message from ${senderId} to ${receiverId} broadcasted.`);
    } catch (err) {
      console.error('Socket message save/dispatch error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket.io client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
