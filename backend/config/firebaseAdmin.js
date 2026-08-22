const path = require('path');
const fs = require('fs');
const {
  initializeApp,
  getApps,
  cert,
} = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// ────────────────────────────────────────────────────────────────────────────
// Firebase Admin SDK Initialization
// Supports:
// 1. FIREBASE_SERVICE_ACCOUNT environment variable (JSON string or Base64 string) - Best for Render/Railway/Vercel
// 2. GOOGLE_SERVICE_ACCOUNT_PATH file path
// 3. Default fallback to serviceAccountKey.json in backend directory
// ────────────────────────────────────────────────────────────────────────────

let firebaseAuth = null;

const loadServiceAccount = () => {
  // Option 1: Direct JSON or Base64 in Environment Variable (Production Hosting)
  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envServiceAccount) {
    try {
      const trimmed = envServiceAccount.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }
      // Base64 decoded
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (err) {
      console.warn('⚠️  Could not parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
    }
  }

  // Option 2: File Path from Env
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
    if (fs.existsSync(resolvedPath)) {
      return require(resolvedPath);
    }
  }

  // Option 3: Fallback locations
  const possiblePaths = [
    path.join(__dirname, '..', 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'backend', 'serviceAccountKey.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return require(p);
    }
  }

  return null;
};

if (!getApps().length) {
  try {
    const serviceAccount = loadServiceAccount();
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount) });
      firebaseAuth = getAuth();
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      console.warn('⚠️  Firebase Service Account not found. Google sign-in verification will be disabled until serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT is configured.');
    }
  } catch (err) {
    console.warn('⚠️  Firebase Admin init failed:', err.message);
  }
} else {
  firebaseAuth = getAuth();
}

// Export a wrapper so callers use: admin.auth().verifyIdToken(...)
const admin = {
  auth: () => ({
    verifyIdToken: async (idToken) => {
      if (!firebaseAuth) {
        throw new Error('Firebase Admin not initialized. Please ensure serviceAccountKey.json exists or FIREBASE_SERVICE_ACCOUNT env variable is set.');
      }
      return firebaseAuth.verifyIdToken(idToken);
    },
  }),
};

module.exports = admin;

