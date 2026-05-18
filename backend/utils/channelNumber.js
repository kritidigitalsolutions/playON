const Channel = require("../models/channel.model");
const Counter = require("../models/counter.model");

const COUNTER_ID = "channelNumber";

const getMaxChannelNumber = async () => {
  const lastChannel = await Channel.findOne({
    channelNumber: { $type: "number", $gt: 0 }
  })
    .sort({ channelNumber: -1 })
    .select("channelNumber")
    .lean();

  return lastChannel?.channelNumber || 0;
};

const syncChannelNumberCounter = async () => {
  const maxChannelNumber = await getMaxChannelNumber();

  await Counter.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $max: { seq: maxChannelNumber } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getNextChannelNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!counter || typeof counter.seq !== "number" || counter.seq <= 0) {
    throw new Error(
      `Counter returned invalid channel number: ${counter?.seq}`
    );
  }

  return counter.seq;
};

module.exports = {
  getNextChannelNumber,
  syncChannelNumberCounter
};