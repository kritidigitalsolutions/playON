const Channel = require("../models/channel.model");

const isValidChannelNumber = (value) =>
  Number.isInteger(value) && value > 0;

const ensureChannelNumbers = async () => {
  const channels = await Channel.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select("_id channelNumber")
    .lean();

  const reserved = new Set();
  const firstOwnerByNumber = new Map();
  let nextNumber = 1;

  const takeNextNumber = () => {
    while (reserved.has(nextNumber)) {
      nextNumber += 1;
    }

    reserved.add(nextNumber);
    return nextNumber;
  };

  channels.forEach((channel) => {
    const currentNumber = Number(channel.channelNumber);

    if (isValidChannelNumber(currentNumber)) {
      reserved.add(currentNumber);

      if (!firstOwnerByNumber.has(currentNumber)) {
        firstOwnerByNumber.set(currentNumber, String(channel._id));
      }
    }
  });

  const writes = [];

  channels.forEach((channel) => {
    const currentNumber = Number(channel.channelNumber);
    const shouldKeep =
      isValidChannelNumber(currentNumber) &&
      firstOwnerByNumber.get(currentNumber) === String(channel._id);

    if (shouldKeep) return;

    writes.push({
      updateOne: {
        filter: { _id: channel._id },
        update: {
          $set: {
            channelNumber: takeNextNumber()
          }
        }
      }
    });
  });

  if (writes.length) {
    await Channel.bulkWrite(writes, { ordered: true });
    console.log(`Repaired ${writes.length} channel numbers`);
  }
};

module.exports = ensureChannelNumbers;
