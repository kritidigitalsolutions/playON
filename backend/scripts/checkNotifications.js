require('dotenv').config({ path: './.env' });
const connectDB = require('../config/db');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

(async () => {
  try {
    await connectDB();
    const totalUsers = await User.countDocuments();
    const usersWithFcm = await User.countDocuments({ fcmToken: { $ne: null, $ne: '' } });
    const usersWithFcmSample = await User.find({ fcmToken: { $ne: null, $ne: '' } }).limit(5).select('_id email fcmToken');
    const totalNotifs = await Notification.countDocuments();
    const recentNotifs = await Notification.find({}).sort({ createdAt: -1 }).limit(10).lean();
    console.log('totalUsers', totalUsers);
    console.log('usersWithFcm', usersWithFcm);
    console.log('usersWithFcmSample', usersWithFcmSample.map(u=> ({ _id: u._id, email: u.email, fcmToken: u.fcmToken?.slice(0,20) })));
    console.log('totalNotifs', totalNotifs);
    console.log('recentNotifs', recentNotifs.map(n=> ({ _id: n._id, title: n.title, type: n.type, targetUser: n.targetUser, createdAt: n.createdAt, metadata: n.metadata, sentAt: n.sentAt }))); 
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
