const Channel = require("../models/channel.model");
const Counter = require("../models/counter.model");

const COUNTER_ID = "channelNumber";

// Used only by ensureChannelNumbers at startup
const getMaxChannelNumber = async () => {
  const lastChannel = await Channel.findOne({
    channelNumber: { $type: "number", $gt: 0 }
  })
    .sort({ channelNumber: -1 })
    .select("channelNumber")
    .lean();

  return lastChannel?.channelNumber || 0;
};

// Used only by ensureChannelNumbers at startup
const syncChannelNumberCounter = async () => {
  const maxChannelNumber = await getMaxChannelNumber();

  await Counter.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $max: { seq: maxChannelNumber } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Finds the lowest unused channel number (fills gaps automatically)
const getNextChannelNumber = async () => {
  const channels = await Channel.find({
    channelNumber: { $type: "number", $gt: 0 }
  })
    .select("channelNumber")
    .lean();

  const used = new Set(channels.map((c) => c.channelNumber));

  let next = 1;
  while (used.has(next)) {
    next += 1;
  }

  if (!next || next <= 0) {
    throw new Error(`Invalid channel number generated: ${next}`);
  }

  return next;
};

module.exports = {
  getNextChannelNumber,
  syncChannelNumberCounter
};