const User = require('../models/User');
const Message = require('../models/Message');
const Application = require('../models/Application');
const Job = require('../models/Job');

const runUserCleanup = async () => {
  try {
    console.log('[Cleanup] Starting inactive users cleanup task...');
    const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

    // Find users who are not Admins and whose lastActive is older than 28 days
    const inactiveUsers = await User.find({
      role: { $ne: 'Admin' },
      lastActive: { $lt: twentyEightDaysAgo }
    });

    const deletedCount = inactiveUsers.length;
    if (deletedCount === 0) {
      console.log('[Cleanup] No inactive users found to clean up today.');
      return;
    }

    const inactiveUserIds = inactiveUsers.map(user => user._id);

    // 1. Delete associated applications
    const appResult = await Application.deleteMany({ userId: { $in: inactiveUserIds } });
    console.log(`[Cleanup] Deleted ${appResult.deletedCount} associated applications.`);

    // 2. Delete associated jobs (posted by inactive HRs)
    const jobResult = await Job.deleteMany({ postedBy: { $in: inactiveUserIds } });
    console.log(`[Cleanup] Deleted ${jobResult.deletedCount} associated jobs.`);

    // 3. Delete messages involving the inactive users
    const msgResult = await Message.deleteMany({
      $or: [
        { senderId: { $in: inactiveUserIds } },
        { receiverId: { $in: inactiveUserIds } }
      ]
    });
    console.log(`[Cleanup] Deleted ${msgResult.deletedCount} associated messages.`);

    // 4. Delete the user accounts themselves
    const userResult = await User.deleteMany({ _id: { $in: inactiveUserIds } });
    console.log(`[Cleanup] Deleted ${userResult.deletedCount} inactive user accounts.`);

    // 5. Notify all Admins about the cleanup count
    const admins = await User.find({ role: 'Admin' });
    if (admins.length > 0) {
      const content = `🧹 System Cleanup: Removed ${deletedCount} inactive user accounts (inactive > 28 days) and their associated data from MongoDB today. 🗑️`;
      
      const adminMessages = admins.map(admin => ({
        senderId: admin._id, // Self-sent system message representation
        receiverId: admin._id,
        content,
        read: false
      }));

      await Message.insertMany(adminMessages);
      console.log(`[Cleanup] Admin notifications sent to ${admins.length} administrators.`);
    }

    console.log(`[Cleanup] Completed inactive users cleanup. Total users removed: ${deletedCount}`);
  } catch (error) {
    console.error('[Cleanup] Error running user cleanup:', error);
  }
};

// Start the cleanup schedule
const startCleanupSchedule = () => {
  // Run once immediately on start (delayed by 10 seconds to allow DB connection to fully establish)
  setTimeout(() => {
    runUserCleanup();
  }, 10000);

  // Run every 24 hours
  setInterval(runUserCleanup, 24 * 60 * 60 * 1000);
};

module.exports = { startCleanupSchedule, runUserCleanup };
