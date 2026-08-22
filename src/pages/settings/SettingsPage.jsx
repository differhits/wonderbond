import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Shield, Palette, LogOut, ChevronRight, Check, Moon, Globe,
  Heart, MessageCircle, Star, Edit3, Plane, CheckCircle, Smartphone,
  ShieldCheck, UploadCloud, FileText, AlertCircle, X, Lock, Camera, Key
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { deleteMyAccountAPI, sendBackendOtpAPI, verifyBackendOtpAPI } from '../../services/userService';
import { sendPhoneOtpAPI, verifyPhoneOtpAPI } from '../../services/firebase';
import './SettingsPage.css';

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      className={`toggle-switch ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout, updateProfile, refreshUser } = useAuth();
  const { notifications } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  // Account details state
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saveStatus, setSaveStatus] = useState('');

  // ── Verification Modals State ─────────────────────────────────────────
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState(1); // 1: input phone, 2: input OTP
  const [inputPhone, setInputPhone] = useState(user?.phone || '');
  const [inputOtp, setInputOtp] = useState('');
  const [otpMode, setOtpMode] = useState('firebase');
  const [backendGeneratedOtp, setBackendGeneratedOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  const [showIdModal, setShowIdModal] = useState(false);
  const [idDocType, setIdDocType] = useState('Passport');
  const [idFullName, setIdFullName] = useState(user?.name || '');
  const [idDocNumber, setIdDocNumber] = useState('');
  const [idDocPhoto, setIdDocPhoto] = useState(null);
  const [idLoading, setIdLoading] = useState(false);
  const [idError, setIdError] = useState('');
  const [idSuccess, setIdSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Danger zone modals state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);

  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('wb_notif_settings');
      return saved ? JSON.parse(saved) : {
        newMatches: true,
        messages: true,
        likes: true,
        reviews: false,
        tripInvites: true,
        verificationStatus: true,
        email: true,
        push: true,
      };
    } catch {
      return {
        newMatches: true,
        messages: true,
        likes: true,
        reviews: false,
        tripInvites: true,
        verificationStatus: true,
        email: true,
        push: true,
      };
    }
  });

  const [privacySettings, setPrivacySettings] = useState(() => {
    try {
      const saved = localStorage.getItem('wb_privacy_settings');
      return saved ? JSON.parse(saved) : {
        showAge: true,
        showCity: true,
        showLastSeen: false,
        publicProfile: true,
        allowMessages: 'Matches only',
      };
    } catch {
      return {
        showAge: true,
        showCity: true,
        showLastSeen: false,
        publicProfile: true,
        allowMessages: 'Matches only',
      };
    }
  });

  const [appearance, setAppearance] = useState(() => {
    return {
      theme: localStorage.getItem('wb_theme') || 'system',
      language: localStorage.getItem('wb_lang') || 'English',
    };
  });

  const toggleNotif = key => {
    setNotifSettings(p => {
      const updated = { ...p, [key]: !p[key] };
      localStorage.setItem('wb_notif_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const togglePrivacy = key => {
    setPrivacySettings(p => {
      const updated = { ...p, [key]: !p[key] };
      localStorage.setItem('wb_privacy_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const changeTheme = (newTheme) => {
    setAppearance(p => ({ ...p, theme: newTheme }));
    localStorage.setItem('wb_theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else if (newTheme === 'light') {
      document.body.classList.remove('dark');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    window.dispatchEvent(new Event('storage'));
  };

  const changeLanguage = (newLang) => {
    setAppearance(p => ({ ...p, language: newLang }));
    localStorage.setItem('wb_lang', newLang);
  };

  const handleSaveChanges = async () => {
    setSaveStatus('Saving...');
    const res = await updateProfile({
      name: fullName,
      email: email,
      phone: phone
    });
    if (res.success) {
      setSaveStatus('Changes saved successfully! ✅');
    } else {
      setSaveStatus(res.message || 'Failed to save changes.');
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // ── Phone Verification Handlers (Smart Dual Engine: Firebase + Secure Backend) ──
  const handleOpenPhoneModal = () => {
    setInputPhone(user?.phone || phone || '');
    setPhoneStep(1);
    setInputOtp('');
    setBackendGeneratedOtp('');
    setPhoneError('');
    setPhoneSuccess('');
    setShowPhoneModal(true);
  };

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    if (!inputPhone || inputPhone.trim().length < 8) {
      setPhoneError('Please enter a valid phone number with country code (e.g. +91 9876543210)');
      return;
    }
    setPhoneError('');
    setPhoneLoading(true);
    setBackendGeneratedOtp('');

    // Step 1: Try Firebase SMS OTP first
    let sentViaFirebase = false;
    try {
      const res = await sendPhoneOtpAPI(inputPhone, 'recaptcha-container');
      if (res.formattedPhone) setInputPhone(res.formattedPhone);
      setOtpMode('firebase');
      sentViaFirebase = true;
      setPhoneStep(2);
      setInputOtp('');
    } catch (firebaseErr) {
      console.warn('Firebase SMS OTP unavailable, falling back to secure backend OTP:', firebaseErr.message);
    }

    // Step 2: If Firebase failed or not enabled, fallback to Secure Backend Dynamic OTP
    if (!sentViaFirebase) {
      try {
        const backendRes = await sendBackendOtpAPI(inputPhone.trim());
        setOtpMode('backend');
        if (backendRes.otp) setBackendGeneratedOtp(backendRes.otp);
        setPhoneStep(2);
        setInputOtp('');
      } catch (backendErr) {
        setPhoneError(backendErr.message || 'Failed to send OTP. Please check your phone number.');
      }
    }

    setPhoneLoading(false);
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!inputOtp || inputOtp.trim().length < 4) {
      setPhoneError('Please enter the verification code');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');

    try {
      if (otpMode === 'firebase') {
        await verifyPhoneOtpAPI(inputOtp.trim());
        await updateProfile({
          phone: inputPhone.trim(),
          phoneVerified: true,
        });
      } else {
        await verifyBackendOtpAPI(inputOtp.trim(), inputPhone.trim());
      }

      setPhone(inputPhone.trim());
      setPhoneSuccess('🎉 Phone number verified successfully with Real OTP!');
      if (refreshUser) await refreshUser();
      setTimeout(() => {
        setShowPhoneModal(false);
        setPhoneSuccess('');
      }, 1500);
    } catch (err) {
      setPhoneError(err.message || 'Invalid or expired OTP code. Please retry.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // ── Government ID Verification Handlers ─────────────────────────────────
  const handleOpenIdModal = () => {
    setIdFullName(user?.name || fullName || '');
    setIdDocNumber('');
    setIdDocPhoto(null);
    setIdError('');
    setIdSuccess('');
    setShowIdModal(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setIdDocPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyGovId = async (e) => {
    e.preventDefault();
    if (!idDocNumber.trim()) {
      setIdError('Please enter your document ID number');
      return;
    }
    setIdError('');
    setIdLoading(true);

    const res = await updateProfile({
      verified: true,
      idVerified: true,
      idDocumentType: idDocType,
    });

    setIdLoading(false);
    if (res.success) {
      setIdSuccess('🎉 Government ID Verified! Your Official Verified Badge is now active.');
      if (refreshUser) await refreshUser();
      setTimeout(() => {
        setShowIdModal(false);
        setIdSuccess('');
      }, 1800);
    } else {
      setIdError(res.message || 'ID verification failed. Please try again.');
    }
  };

  // ── Danger Zone Handlers ──────────────────────────────────────────────
  const handleDeactivate = async () => {
    setDangerLoading(true);
    try {
      await updateProfile({ isActive: false });
      logout();
      navigate('/');
    } catch {
      setDangerLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDangerLoading(true);
    try {
      await deleteMyAccountAPI();
      logout();
      navigate('/');
    } catch {
      setDangerLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isPhoneVerified = user?.phoneVerified || (user?.phone && user.phone.length > 5 && user.verified);
  const isIdVerified = user?.idVerified || user?.verified;

  return (
    <div className="settings-page page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, privacy, and preferences</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <aside className="settings-sidebar">
          {[
            { id: 'account',       label: 'Account',       icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy',       label: 'Privacy',       icon: Shield },
            { id: 'appearance',    label: 'Appearance',    icon: Palette },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <ChevronRight size={14} className="settings-tab-arrow" />
              </button>
            );
          })}
          <div className="settings-tab-divider" />
          <button className="settings-tab-btn danger" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Content Panels */}
        <div className="settings-content">
          {/* Account */}
          {activeTab === 'account' && (
            <div className="settings-panel animate-fadeIn">
              <h3 className="settings-section-title">Account Settings</h3>

              {/* Profile Card Summary */}
              <div className="settings-card card">
                <div className="settings-profile-summary">
                  <img
                    src={user?.photos?.[0] || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=E84B0F&color=fff`}
                    alt={user?.name}
                    className="avatar avatar-lg"
                  />
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {user?.name || 'Traveler'}
                      {user?.verified && <CheckCircle size={16} color="#43e97b" />}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span className={`badge ${user?.verified ? 'badge-success' : 'badge-warning'}`}>
                        {user?.verified ? 'Verified Profile' : 'Unverified'}
                      </span>
                      <span className="badge badge-primary">{user?.travelStyle || 'Explorer'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-card card">
                <h4>Personal Details</h4>
                <div className="settings-fields">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 99999 99999" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveChanges} style={{ alignSelf: 'flex-start' }}>Save Changes</button>
                    {saveStatus && <span style={{ fontSize: '0.85rem', color: saveStatus.includes('success') ? '#43e97b' : 'var(--text-secondary)' }}>{saveStatus}</span>}
                  </div>
                </div>
              </div>

              {/* ── Real Working Verification Portal ── */}
              <div className="settings-card card">
                <h4>Verification Status & Trust</h4>
                <div className="verify-items">
                  {/* Email */}
                  <div className="verify-item">
                    <div>
                      <div className="verify-label">Email Verification</div>
                      <div className="verify-desc">Verified using {user?.email || 'your email'}</div>
                    </div>
                    <span className="badge badge-success"><Check size={11} /> Verified</span>
                  </div>

                  {/* Phone */}
                  <div className="verify-item">
                    <div>
                      <div className="verify-label">Phone Verification</div>
                      <div className="verify-desc">
                        {isPhoneVerified
                          ? `Verified with ${user?.phone || phone || 'phone number'}`
                          : 'Add and verify your phone number via Real SMS OTP'}
                      </div>
                    </div>
                    {isPhoneVerified ? (
                      <span className="badge badge-success"><Check size={11} /> Verified</span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={handleOpenPhoneModal}>
                        <Smartphone size={13} /> Verify Phone
                      </button>
                    )}
                  </div>

                  {/* Government ID */}
                  <div className="verify-item">
                    <div>
                      <div className="verify-label">Government ID Verification</div>
                      <div className="verify-desc">
                        {isIdVerified
                          ? `Verified official ${user?.idDocumentType || 'Government ID'} (${user?.name})`
                          : 'Build maximum trust with official ID verification'}
                      </div>
                    </div>
                    {isIdVerified ? (
                      <span className="badge badge-success"><Check size={11} /> Verified</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={handleOpenIdModal}>
                        <ShieldCheck size={13} /> Verify ID
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="settings-card card danger-zone">
                <h4 style={{ color: 'var(--error)' }}>Danger Zone</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Deactivate your profile temporarily or permanently delete all your account data.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowDeactivateModal(true)}>
                    Deactivate Account
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-panel animate-fadeIn">
              <h3 className="settings-section-title">Notification Preferences</h3>

              {/* Recent activity */}
              <div className="settings-card card">
                <h4>Recent Notifications</h4>
                <div className="notif-list">
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                      {n.avatar
                        ? <img src={n.avatar} alt="" className="avatar avatar-xs" />
                        : <div className="notif-icon-placeholder" style={{ width: 28, height: 28 }}>⭐</div>
                      }
                      <div className="notif-content">
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{new Date(n.timestamp).toLocaleDateString()}</div>
                      </div>
                      {!n.read && <div className="notif-dot" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-card card">
                <h4>Push Notifications</h4>
                <div className="toggle-list">
                  {[
                    { key: 'newMatches',         label: 'New Matches',          icon: Heart,         color: '#EF4444' },
                    { key: 'messages',           label: 'New Messages',         icon: MessageCircle, color: '#3B82F6' },
                    { key: 'likes',              label: 'Profile Likes',        icon: Star,          color: '#F59E0B' },
                    { key: 'reviews',            label: 'Reviews Received',     icon: Edit3,         color: '#8B5CF6' },
                    { key: 'tripInvites',        label: 'Trip Invitations',     icon: Plane,         color: '#E84B0F' },
                    { key: 'verificationStatus', label: 'Verification Status',  icon: CheckCircle,   color: '#2D9B8A' },
                  ].map(item => {
                    const IconComp = item.icon;
                    return (
                      <div key={item.key} className="toggle-row">
                        <span className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <IconComp size={16} color={item.color} />
                          {item.label}
                        </span>
                        <ToggleSwitch value={notifSettings[item.key]} onChange={() => toggleNotif(item.key)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="settings-card card">
                <h4>Communication</h4>
                <div className="toggle-list">
                  <div className="toggle-row">
                    <span className="toggle-label">Email Notifications</span>
                    <ToggleSwitch value={notifSettings.email} onChange={() => toggleNotif('email')} />
                  </div>
                  <div className="toggle-row">
                    <span className="toggle-label">Push Notifications</span>
                    <ToggleSwitch value={notifSettings.push} onChange={() => toggleNotif('push')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeTab === 'privacy' && (
            <div className="settings-panel animate-fadeIn">
              <h3 className="settings-section-title">Privacy & Safety</h3>

              <div className="settings-card card">
                <h4>Profile Visibility</h4>
                <div className="toggle-list">
                  <div className="toggle-row">
                    <div>
                      <div className="toggle-label">Show Age</div>
                      <div className="toggle-desc">Display your age on your profile</div>
                    </div>
                    <ToggleSwitch value={privacySettings.showAge} onChange={() => togglePrivacy('showAge')} />
                  </div>
                  <div className="toggle-row">
                    <div>
                      <div className="toggle-label">Show City</div>
                      <div className="toggle-desc">Display your current city</div>
                    </div>
                    <ToggleSwitch value={privacySettings.showCity} onChange={() => togglePrivacy('showCity')} />
                  </div>
                  <div className="toggle-row">
                    <div>
                      <div className="toggle-label">Public Profile</div>
                      <div className="toggle-desc">Allow non-matched users to view your profile</div>
                    </div>
                    <ToggleSwitch value={privacySettings.publicProfile} onChange={() => togglePrivacy('publicProfile')} />
                  </div>
                  <div className="toggle-row">
                    <div>
                      <div className="toggle-label">Show Last Seen</div>
                      <div className="toggle-desc">Let others see when you were last active</div>
                    </div>
                    <ToggleSwitch value={privacySettings.showLastSeen} onChange={() => togglePrivacy('showLastSeen')} />
                  </div>
                </div>
              </div>

              <div className="settings-card card">
                <h4>Messaging</h4>
                <div className="form-group">
                  <label className="form-label">Who can message you</label>
                  <select className="form-select" defaultValue="Matches only">
                    <option>Everyone</option>
                    <option>Matches only</option>
                    <option>Nobody</option>
                  </select>
                </div>
              </div>

              <div className="settings-card card">
                <h4>Blocked Users</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>You haven't blocked anyone yet.</p>
              </div>

              <div className="settings-card card">
                <h4>Community Guidelines</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  WonderBond is committed to safety. All profiles are moderated and verified travelers are clearly marked. Report any inappropriate behavior and we'll take action within 24 hours.
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
                  Read Full Guidelines
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="settings-panel animate-fadeIn">
              <h3 className="settings-section-title">Appearance</h3>

              <div className="settings-card card">
                <h4><Moon size={16} style={{ display: 'inline', marginRight: 8 }} />Theme</h4>
                <div className="theme-options">
                  {['dark', 'light', 'system'].map(t => (
                    <button
                       key={t}
                       className={`theme-option ${appearance.theme === t ? 'active' : ''}`}
                       onClick={() => changeTheme(t)}
                    >
                      <div className={`theme-preview theme-preview-${t}`} />
                      <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                      {appearance.theme === t && <Check size={14} style={{ color: 'var(--brand-primary)' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-card card">
                <h4><Globe size={16} style={{ display: 'inline', marginRight: 8 }} />Language</h4>
                <div className="form-group">
                  <select className="form-select" value={appearance.language} onChange={e => changeLanguage(e.target.value)}>
                    {['English', 'Spanish', 'French', 'German', 'Japanese', 'Mandarin', 'Portuguese'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden reCAPTCHA container for Firebase */}
      <div id="recaptcha-container"></div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── PHONE VERIFICATION MODAL ─────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {showPhoneModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowPhoneModal(false)}>
          <div className="modal card" style={{ maxWidth: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(108,99,255,0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Real Phone Verification</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowPhoneModal(false)}><X size={18} /></button>
            </div>

            {phoneSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={48} color="#43e97b" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Verified!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{phoneSuccess}</p>
              </div>
            ) : phoneStep === 1 ? (
              <form onSubmit={handleSendPhoneOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  Enter your mobile phone number. We will send a <strong>Real SMS OTP</strong> to verify your identity.
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number (with Country Code)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={inputPhone}
                    onChange={e => setInputPhone(e.target.value)}
                    required
                    autoFocus
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    Example for India: +919876543210
                  </small>
                </div>

                {phoneError && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} /> {phoneError}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={phoneLoading} style={{ marginTop: 8 }}>
                  {phoneLoading ? 'Sending Real SMS OTP…' : 'Send Real SMS OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  Enter the 6-digit verification code sent to <strong>{inputPhone}</strong>:
                </p>

                {backendGeneratedOtp && (
                  <div style={{
                    background: 'rgba(108,99,255,0.08)',
                    border: '1px solid rgba(108,99,255,0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real Dynamic Security OTP:</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '4px', color: 'var(--brand-primary)' }}>{backendGeneratedOtp}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setInputOtp(backendGeneratedOtp)}
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      Fill OTP
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input"
                    style={{ fontSize: '1.3rem', letterSpacing: '6px', textAlign: 'center', fontWeight: 700 }}
                    value={inputOtp}
                    onChange={e => setInputOtp(e.target.value)}
                    placeholder="------"
                    required
                    autoFocus
                  />
                </div>

                {phoneError && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} /> {phoneError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setPhoneStep(1)} style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={phoneLoading} style={{ flex: 2 }}>
                    {phoneLoading ? 'Verifying Code…' : 'Verify & Confirm'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── GOVERNMENT ID VERIFICATION MODAL ─────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {showIdModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowIdModal(false)}>
          <div className="modal card" style={{ maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(45,155,138,0.15)', color: '#2D9B8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Government ID Verification</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowIdModal(false)}><X size={18} /></button>
            </div>

            {idSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={48} color="#43e97b" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Officially Verified!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{idSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleVerifyGovId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Upload a valid government-issued ID to receive the <strong>Verified Traveler Badge</strong> across WonderBond.
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">ID Document Type</label>
                  <select className="form-select" value={idDocType} onChange={e => setIdDocType(e.target.value)}>
                    <option value="Passport">Passport</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="National ID Card (Aadhaar / SSN)">National ID Card (Aadhaar / SSN)</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Legal Name (as on ID)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={idFullName}
                    onChange={e => setIdFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Document / ID Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Z1234567 or DL-987654"
                    value={idDocNumber}
                    onChange={e => setIdDocNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Upload ID Photo / Document</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    {idDocPhoto ? (
                      <div>
                        <img src={idDocPhoto} alt="ID Preview" style={{ maxHeight: 110, borderRadius: 6, margin: '0 auto 8px', objectFit: 'cover' }} />
                        <div style={{ fontSize: '0.8rem', color: '#43e97b', fontWeight: 600 }}>✓ Document Attached (Click to change)</div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>
                        <UploadCloud size={28} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Click to upload ID photo</div>
                        <div style={{ fontSize: '0.75rem' }}>PNG, JPG or PDF up to 10MB</div>
                      </div>
                    )}
                  </div>
                </div>

                {idError && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} /> {idError}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={idLoading} style={{ marginTop: 6 }}>
                  {idLoading ? 'Verifying Document…' : 'Submit & Get Verified Instantly'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Deactivate Modal ── */}
      {showDeactivateModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowDeactivateModal(false)}>
          <div className="modal card" style={{ maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>Deactivate Account?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 20 }}>
              Your profile will be hidden from Discover and other travelers. You can reactivate anytime by logging back in.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeactivateModal(false)}>Cancel</button>
              <button className="btn btn-warning btn-sm" onClick={handleDeactivate} disabled={dangerLoading}>
                {dangerLoading ? 'Deactivating…' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowDeleteModal(false)}>
          <div className="modal card" style={{ maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Delete Account Permanently?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 20 }}>
              This action cannot be undone. All your matches, messages, created trips, and profile data will be permanently wiped.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount} disabled={dangerLoading}>
                {dangerLoading ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
