require('dotenv').config({ path: './.env' });
const connectDB = require('../config/db');
const Match = require('../models/match.model');
const Stream = require('../models/stream.model');

const STATUS_MAP = {
  live: 'live',
  completed: 'ended',
  cancelled: 'offline',
  upcoming: 'scheduled'
};

(async () => {
  try {
    await connectDB();
    const matches = await Match.find({}).lean();
    let fixed = 0;
    let total = 0;
    for (const match of matches) {
      const stream = await Stream.findOne({ matchId: match._id }).sort({ createdAt: -1 });
      if (!stream) continue;
      total += 1;
      const desiredStatus = STATUS_MAP[match.status] || 'scheduled';
      if (stream.status === desiredStatus) continue;

      const update = {
        status: desiredStatus,
        scheduledAt: match.matchDate || stream.scheduledAt
      };

      if (desiredStatus === 'live') {
        update.startedAt = stream.startedAt || match.liveStartedAt || new Date();
        update.endedAt = null;
        update.health = 'good';
      } else if (desiredStatus === 'ended') {
        update.endedAt = stream.endedAt || match.liveEndedAt || new Date();
        update.startedAt = stream.startedAt || match.liveStartedAt || match.matchDate || null;
      } else if (desiredStatus === 'offline') {
        update.endedAt = stream.endedAt || new Date();
        update.startedAt = stream.startedAt || null;
      } else if (desiredStatus === 'scheduled') {
        update.startedAt = null;
        update.endedAt = null;
      }

      await Stream.findByIdAndUpdate(stream._id, update, { new: true, runValidators: true });
      console.log(`Updated stream ${stream._id} for match ${match._id}: ${stream.status} -> ${desiredStatus}`);
      fixed += 1;
    }

    console.log(`Done. Processed ${total} latest streams. Fixed ${fixed} mismatches.`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating MongoDB:', err);
    process.exit(1);
  }
})();
