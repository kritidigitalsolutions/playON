const { SignedDataVerifier, Environment } = require('@apple/app-store-server-library');
const fs = require('fs');
const path = require('path');

exports.verifyAppleTransaction = async (signedTransactionData) => {
  // Load Apple Root Certificates from backend/certs folder
  const rootCertificates = [
    fs.readFileSync(path.join(__dirname, '../certs/AppleComputerRootCertificate.cer')),
    fs.readFileSync(path.join(__dirname, '../certs/AppleRootCA-G2.cer')),
    fs.readFileSync(path.join(__dirname, '../certs/AppleRootCA-G3.cer')),
  ];

  const bundleId = process.env.APPLE_BUNDLE_ID || 'com.example.playon'; // Read from ENV
  const appAppleId = 0; // Set to 0 if unknown
  const environment = process.env.APPLE_IAP_ENV === 'production' 
    ? Environment.PRODUCTION 
    : Environment.SANDBOX;

  const verifier = new SignedDataVerifier(
    rootCertificates,
    true, // enableOnlineChecks (checks revocation status)
    environment,
    bundleId,
    appAppleId
  );

  try {
    const verifiedTransaction = await verifier.verifyAndDecodeTransaction(signedTransactionData);
    return verifiedTransaction;
  } catch (error) {
    console.error("====== APPLE IAP VERIFICATION FAILED ======");
    console.error(error);
    if (error.response) {
        console.error("Response Data:", error.response.data);
    }
    console.dir(error, { depth: null });
    console.error("===========================================");
    throw error; // Throw original error so it's visible in controller
  }
};
