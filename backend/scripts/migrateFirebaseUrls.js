/**
 * One-time migration for Firebase Storage URLs.
 *
 * Finds old-style https://storage.googleapis.com/<bucket>/<path> URLs, creates
 * a Firebase download token for the underlying file, and rewrites the MongoDB
 * field to the token-based firebasestorage.googleapis.com URL.
 *
 * Run from backend:
 *   node scripts/migrateFirebaseUrls.js
 */

const path = require("path");
const crypto = require("crypto");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("../config/db");
const { bucket } = require("../config/firebase");

const Match = require("../models/match.model");
const Channel = require("../models/channel.model");

const OLD_URL_PREFIX = "https://storage.googleapis.com/";

const MATCH_FIELDS = ["teamALogo", "teamBLogo", "thumbnail", "banner", "liveLogo"];
const CHANNEL_FIELDS = ["thumbnail", "logo", "liveLogo"];

function extractFilePathFromOldUrl(url) {
  if (!url || !url.startsWith(OLD_URL_PREFIX)) return null;

  const withoutPrefix = url.slice(OLD_URL_PREFIX.length);
  const firstSlashIndex = withoutPrefix.indexOf("/");

  if (firstSlashIndex === -1) return null;

  const bucketNameInUrl = withoutPrefix.slice(0, firstSlashIndex);
  const filePath = withoutPrefix.slice(firstSlashIndex + 1);

  if (bucketNameInUrl !== bucket.name) {
    console.warn(
      `  Bucket mismatch in URL (${bucketNameInUrl} vs ${bucket.name}); skipping.`
    );
    return null;
  }

  return decodeURIComponent(filePath);
}

async function regenerateDownloadUrl(filePath) {
  const fileRef = bucket.file(filePath);
  const [exists] = await fileRef.exists();

  if (!exists) {
    console.warn(`  File not found in bucket: ${filePath}; skipping.`);
    return null;
  }

  const downloadToken = crypto.randomUUID();

  await fileRef.setMetadata({
    metadata: {
      firebaseStorageDownloadTokens: downloadToken
    }
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    filePath
  )}?alt=media&token=${downloadToken}`;
}

async function migrateCollection(Model, fields, label) {
  console.log(`\n=== Migrating ${label} ===`);

  const orConditions = fields.map((field) => ({
    [field]: { $regex: `^${OLD_URL_PREFIX}` }
  }));

  const docs = await Model.find({ $or: orConditions });
  console.log(`Found ${docs.length} ${label} document(s) with old-style URLs.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const doc of docs) {
    let changed = false;

    for (const field of fields) {
      const currentValue = doc[field];

      if (!currentValue || !currentValue.startsWith(OLD_URL_PREFIX)) continue;

      const filePath = extractFilePathFromOldUrl(currentValue);

      if (!filePath) {
        console.warn(`  [${doc._id}] Could not parse path from ${field}: ${currentValue}`);
        skippedCount++;
        continue;
      }

      try {
        const newUrl = await regenerateDownloadUrl(filePath);

        if (newUrl) {
          console.log(`  [${doc._id}] ${field} -> token regenerated`);
          doc[field] = newUrl;
          changed = true;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`  [${doc._id}] Error fixing ${field}: ${err.message}`);
        errorCount++;
      }
    }

    if (changed) {
      await doc.save();
      updatedCount++;
    }
  }

  console.log(
    `--- ${label} summary: updated=${updatedCount}, skipped=${skippedCount}, errors=${errorCount} ---`
  );
}

(async () => {
  try {
    await connectDB();
    console.log("Connected to DB. Starting migration...");

    await migrateCollection(Match, MATCH_FIELDS, "Match");
    await migrateCollection(Channel, CHANNEL_FIELDS, "Channel");

    console.log("\nMigration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Fatal migration error:", err);
    process.exit(1);
  }
})();
