const Channel = require("../models/channel.model");
const { syncChannelNumberCounter } = require("./channelNumber");

const isValidChannelNumber = (value) =>
  Number.isInteger(value) && value > 0;

const ensureChannelNumbers = async () => {
  const channels = await Channel.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select("_id channelNumber")
    .lean();

  const reserved = new Set();
  const firstOwnerByNumber = new Map();

  // First pass: collect all valid, non-duplicate numbers
  channels.forEach((channel) => {
    const num = Number(channel.channelNumber);
    if (isValidChannelNumber(num) && !firstOwnerByNumber.has(num)) {
      reserved.add(num);
      firstOwnerByNumber.set(num, String(channel._id));
    }
  });

  let nextFree = 1;

  const takeNextNumber = () => {
    while (reserved.has(nextFree)) {
      nextFree += 1;
    }
    const assigned = nextFree;
    reserved.add(assigned);
    nextFree += 1; // advance so next call doesn't return the same number
    return assigned;
  };

  const writes = [];

  channels.forEach((channel) => {
    const num = Number(channel.channelNumber);
    const isOwner =
      isValidChannelNumber(num) &&
      firstOwnerByNumber.get(num) === String(channel._id);

    if (isOwner) return; // already has a valid, unique number

    writes.push({
      updateOne: {
        filter: { _id: channel._id },
        update: { $set: { channelNumber: takeNextNumber() } }
      }
    });
  });

  if (writes.length) {
    await Channel.bulkWrite(writes, { ordered: true });
    console.log(`[ensureChannelNumbers] Repaired ${writes.length} channel(s)`);
  }

  await syncChannelNumberCounter();
};

module.exports = ensureChannelNumbers;