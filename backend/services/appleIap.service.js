const { SignedDataVerifier, Environment } = require('@apple/app-store-server-library');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

exports.verifyAppleTransaction = async (signedTransactionData) => {
  // Load Apple Root Certificates from backend/certs folder
  const rootCertificates = [
    fs.readFileSync(path.join(__dirname, '../certs/AppleComputerRootCertificate.cer')),
    fs.readFileSync(path.join(__dirname, '../certs/AppleRootCA-G2.cer')),
    fs.readFileSync(path.join(__dirname, '../certs/AppleRootCA-G3.cer')),
  ];

  // Decode the incoming JWT payload first to inspect bundleId and environment
  const unverifiedPayload = jwt.decode(signedTransactionData);

  if (unverifiedPayload) {
    console.log("Apple IAP Incoming Transaction Payload:", {
      bundleId: unverifiedPayload.bundleId,
      environment: unverifiedPayload.environment,
      productId: unverifiedPayload.productId,
      transactionId: unverifiedPayload.transactionId,
      originalTransactionId: unverifiedPayload.originalTransactionId
    });
  }

  // Use configured bundleId or fallback to the transaction's bundleId
  const bundleId = process.env.APPLE_BUNDLE_ID || unverifiedPayload?.bundleId || 'com.example.playon';
  const appAppleId = process.env.APPLE_APP_ID ? Number(process.env.APPLE_APP_ID) : 0;

  // Determine environment dynamically or from ENV
  let environment = Environment.SANDBOX;
  if (process.env.APPLE_IAP_ENV) {
    const envUpper = process.env.APPLE_IAP_ENV.toUpperCase();
    if (envUpper === 'PRODUCTION') {
      environment = Environment.PRODUCTION;
    } else if (envUpper === 'XCODE') {
      environment = Environment.XCODE;
    } else if (envUpper === 'LOCALTESTING') {
      environment = Environment.LOCAL_TESTING;
    } else {
      environment = Environment.SANDBOX;
    }
  } else if (unverifiedPayload?.environment) {
    if (unverifiedPayload.environment === 'Production') {
      environment = Environment.PRODUCTION;
    } else if (unverifiedPayload.environment === 'Xcode') {
      environment = Environment.XCODE;
    } else if (unverifiedPayload.environment === 'LocalTesting') {
      environment = Environment.LOCAL_TESTING;
    } else {
      environment = Environment.SANDBOX;
    }
  }

  // Enable online OCSP revocation checks if explicitly enabled, otherwise false for better sandbox/local reliability
  const enableOnlineChecks = process.env.APPLE_IAP_ONLINE_CHECKS === 'true';

  const verifier = new SignedDataVerifier(
    rootCertificates,
    enableOnlineChecks,
    environment,
    bundleId,
    appAppleId
  );

  try {
    const verifiedTransaction = await verifier.verifyAndDecodeTransaction(signedTransactionData);
    return verifiedTransaction;
  } catch (error) {
    // If online checks failed, retry once with online checks disabled
    if (enableOnlineChecks) {
      try {
        console.warn("Retrying Apple IAP verification with online checks disabled...");
        const offlineVerifier = new SignedDataVerifier(
          rootCertificates,
          false,
          environment,
          bundleId,
          appAppleId
        );
        const verifiedTransaction = await offlineVerifier.verifyAndDecodeTransaction(signedTransactionData);
        return verifiedTransaction;
      } catch (retryError) {
        // Fall through to log original error
      }
    }

    console.error("====== APPLE IAP VERIFICATION FAILED ======");
    console.error(`Status: ${error.status} | Message: ${error.message}`);
    console.error(`Expected Bundle ID: "${bundleId}" | Incoming Bundle ID: "${unverifiedPayload?.bundleId}"`);
    console.error(`Expected Environment: "${environment}" | Incoming Environment: "${unverifiedPayload?.environment}"`);
    console.dir(error, { depth: null });
    console.error("===========================================");
    throw error;
  }
};
