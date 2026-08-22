import { createContext, useContext, useState, useEffect } from 'react';
import {
  registerAPI,
  loginAPI,
  googleLoginAPI,
  getMeAPI,
  saveToken,
  removeToken,
} from '../services/authService';
import { updateProfileAPI } from '../services/userService';
import { signInWithGoogle } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true on first load

  // ── Auto-login on page refresh ─────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const me = await getMeAPI();
      if (me) setUser(me);
      setLoading(false);
    };
    restoreSession();
  }, []);

  // ── Register ────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await registerAPI(name, email, password);
      saveToken(data.token);
      setUser(data.user);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, message: error.message };
    }
  };

  // ── Login ───────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginAPI(email, password);
      saveToken(data.token);
      setUser(data.user);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, message: error.message };
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = () => {
    removeToken();
    setUser(null);
  };

  // ── Update Profile (onboarding + edit) ─────────────────────────────────
  const updateProfile = async (updates) => {
    try {
      const updatedUser = await updateProfileAPI(updates);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // ── Google Login ────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      // Step 1: Firebase popup → idToken lo
      const { idToken } = await signInWithGoogle();

      // Step 2: Backend ko verify karne bhejo
      const data = await googleLoginAPI(idToken);

      // Step 3: JWT save karo aur user set karo
      saveToken(data.token);
      setUser(data.user);
      setLoading(false);
      return { success: true, user: data.user };
    } catch (error) {
      setLoading(false);
      return { success: false, message: error.message };
    }
  };

  // ── Refresh User Session ────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const me = await getMeAPI();
      if (me) setUser(me);
      return me;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, logout, updateProfile, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
