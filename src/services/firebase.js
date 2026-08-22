import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  RecaptchaVerifier, signInWithPhoneNumber
} from 'firebase/auth';

// ────────────────────────────────────────────────────────────────────────────
// Firebase Web SDK Configuration
// Works locally and in production with Vite environment variables
// ────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAERGuezuPISBbIygwv0OjUpl4XyfIHgDA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wonderbond-5741c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wonderbond-5741c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wonderbond-5741c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "753323020461",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:753323020461:web:58f7b41b4e2615b110f624",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Format Firebase Auth errors into friendly messages
 */
export const formatFirebaseError = (error) => {
  if (!error) return 'Authentication failed. Please try again.';
  const code = error.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Sign-in cancelled. Only one sign-in request at a time is allowed.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Invalid phone number. Please include country code (e.g. +91 9876543210).';
  }
  if (code === 'auth/missing-phone-number') {
    return 'Please enter a valid phone number.';
  }
  if (code === 'auth/quota-exceeded') {
    return 'SMS quota exceeded for today. Please try again later.';
  }
  if (code === 'auth/code-expired' || code === 'auth/invalid-verification-code') {
    return 'Invalid or expired OTP code. Please check the code and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Phone authentication is not enabled in your Firebase Console. Please enable Phone provider in Firebase Console > Authentication > Sign-in method.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  return error.message || 'Authentication error. Please try again.';
};

/**
 * Google Sign-In popup open karo aur idToken return karo
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return { idToken, user: result.user };
  } catch (error) {
    const friendlyMessage = formatFirebaseError(error);
    const err = new Error(friendlyMessage);
    err.code = error.code;
    throw err;
  }
};

/**
 * Setup invisible reCAPTCHA for Phone OTP
 */
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // reCAPTCHA expired
      }
    });
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('reCAPTCHA setup error:', error);
    return null;
  }
};

/**
 * Send Real SMS OTP to Phone Number via Firebase
 */
export const sendPhoneOtpAPI = async (phoneNumber, containerId = 'recaptcha-container') => {
  try {
    let formatted = phoneNumber.trim().replace(/[\s-]/g, '');
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10) {
        formatted = '+91' + formatted; // Default to India country code if 10 digits
      } else {
        formatted = '+' + formatted;
      }
    }

    const appVerifier = setupRecaptcha(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, formatted, appVerifier);
    window.phoneConfirmationResult = confirmationResult;
    return { success: true, formattedPhone: formatted, confirmationResult };
  } catch (error) {
    const friendlyMsg = formatFirebaseError(error);
    const err = new Error(friendlyMsg);
    err.code = error.code;
    throw err;
  }
};

/**
 * Verify SMS OTP Code entered by User
 */
export const verifyPhoneOtpAPI = async (otpCode) => {
  try {
    if (!window.phoneConfirmationResult) {
      throw new Error('Verification session expired. Please request a new OTP.');
    }
    const result = await window.phoneConfirmationResult.confirm(otpCode.trim());
    return { success: true, user: result.user };
  } catch (error) {
    const friendlyMsg = formatFirebaseError(error);
    const err = new Error(friendlyMsg);
    err.code = error.code;
    throw err;
  }
};


