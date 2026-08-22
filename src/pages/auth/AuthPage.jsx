import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
import { useAuth } from '../../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const { login, loginWithGoogle, register, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      const res = await login(form.email, form.password);
      if (!res.success) setError(res.message || 'Invalid email or password');
    } else {
      if (!form.name || !form.email || !form.password) {
        setError('Please fill in all fields');
        return;
      }
      const res = await register(form.name, form.email, form.password);
      if (res.success) navigate('/onboarding');
      else setError(res.message || 'Registration failed');
    }
  };

  const handleGoogle = async () => {
    setError('');
    const res = await loginWithGoogle();
    if (res.success) {
      if (res.user?.onboardingDone === false) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message || 'Google sign in failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      {/* Back button */}
      <Link to="/" className="auth-back">
        <ArrowLeft size={18} />
        Back to home
      </Link>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={22} fill="white" /></div>
          <span className="auth-logo-text">WonderBond</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Sign Up
          </button>
        </div>

        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome back!' : 'Join WonderBond'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Log in to find your next travel partner'
            : 'Create an account to start connecting with travelers'}
        </p>

        {/* Google */}
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Alex Rivera"
                  className="form-input input-with-icon"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="form-input input-with-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input input-with-icon"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(p => !p)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <button onClick={() => setMode('register')} className="auth-switch-btn">
              Sign up free
            </button>
          </p>
        )}

        {mode === 'register' && (
          <p className="auth-switch">
            Already have an account?{' '}
            <button onClick={() => setMode('login')} className="auth-switch-btn">
              Log in
            </button>
          </p>
        )}

        <p className="auth-terms">
          By continuing, you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
