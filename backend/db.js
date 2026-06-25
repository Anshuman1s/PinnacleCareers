const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables (.env)');
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');
    return true;
  } catch (err) {
    console.error('Failed to connect to MongoDB. Running in fallback database mode.', err.message);
    return false;
  }
};

module.exports = connectDB;
