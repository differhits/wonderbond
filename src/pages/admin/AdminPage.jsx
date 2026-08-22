import { useState, useEffect, useCallback } from 'react';
import {
  Users, BarChart2, ShieldCheck, AlertTriangle, Search,
  CheckCircle, XCircle, Trash2, RefreshCw, Crown, UserX,
  UserCheck, TrendingUp, MessageCircle, Star, Activity,
  ChevronDown, Eye, Heart, Sparkles, MapPin, Compass, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  getAdminStatsAPI, getAdminUsersAPI, getAdminMessagesAPI,
  suspendUserAPI, verifyUserAPI, changeRoleAPI, deleteUserAPI,
} from '../../services/adminService';
import './AdminPage.css';

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <div
      className={`admin-stat-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? `Click to view ${label}` : undefined}
    >
      <div className="admin-stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={22} />
      </div>
      <div className="admin-stat-body">
        <div className="admin-stat-value">{value ?? '0'}</div>
        <div className="admin-stat-label">{label}</div>
        {sub && <div className="admin-stat-sub">{sub}</div>}
      </div>
      {onClick && (
        <div className="admin-stat-arrow" style={{ color }}>
          →
        </div>
      )}
    </div>
  );
}

// ── Mini Bar Chart ───────────────────────────────────────────────
function MiniChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="admin-chart-empty">No signup activity data yet</div>;
  }
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="admin-mini-chart">
      {data.map((d, i) => (
        <div key={d._id || i} className="admin-chart-col" title={`${d._id}: ${d.count} new users`}>
          <div
            className="admin-chart-bar"
            style={{ height: `${Math.max(12, (d.count / max) * 100)}%` }}
          />
          <span className="admin-chart-label">
            {d._id ? d._id.slice(5) : `Day ${i + 1}`}
          </span>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'overview',  icon: BarChart2,     label: 'Overview' },
  { id: 'users',     icon: Users,         label: 'Users & Partners' },
  { id: 'matches',   icon: Heart,         label: 'My Matches' },
  { id: 'verify',    icon: ShieldCheck,   label: 'Verification' },
  { id: 'messages',  icon: MessageCircle, label: 'Messages' },
  { id: 'reports',   icon: AlertTriangle, label: 'Safety & Reports' },
];

export default function AdminPage() {
  const { user, refreshUser } = useAuth();
  const { matches, unmatchUser } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [msgScope, setMsgScope] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStats = useCallback(async () => {
    try {
      const s = await getAdminStatsAPI();
      setStats(s);
    } catch (e) {
      // stats error fallback
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsersAPI({ search, status: statusFilter });
      setUsers(data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminMessagesAPI();
      setMessages(data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (tab === 'users' || tab === 'verify') loadUsers();
    if (tab === 'messages') loadMessages();
  }, [tab, loadUsers, loadMessages]);

  const handleAction = async (fn, ...args) => {
    setActionLoading(true);
    try {
      const updated = await fn(...args);
      setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
      showToast('Action successful! ✅');
      loadStats();
      if (refreshUser) refreshUser();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(true);
    try {
      await deleteUserAPI(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      showToast('User deleted');
      loadStats();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingVerify = users.filter(u => !u.verified && u.onboardingDone);

  const myId = user?._id || user?.id;
  const myMessagesCount = messages.filter(m => {
    const sId = m.senderId?._id || m.senderId;
    const rId = m.receiverId?._id || m.receiverId;
    return (sId && sId === myId) || (rId && rId === myId);
  }).length;

  const filteredMessages = messages.filter(m => {
    if (msgScope === 'mine') {
      const sId = m.senderId?._id || m.senderId;
      const rId = m.receiverId?._id || m.receiverId;
      if (sId !== myId && rId !== myId) return false;
    }
    if (!msgSearch) return true;
    const term = msgSearch.toLowerCase();
    const sender = m.senderId?.name?.toLowerCase() || '';
    const receiver = m.receiverId?.name?.toLowerCase() || '';
    const content = m.content?.toLowerCase() || '';
    return sender.includes(term) || receiver.includes(term) || content.includes(term);
  });

  return (
    <div className="admin-page page-container">
      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">
            <Crown size={22} style={{ color: 'var(--brand-primary)', marginRight: 8 }} />
            Control Hub & Admin Dashboard
          </h1>
          <p className="page-subtitle">
            Manage platform users, verify profiles, control matches & monitor real-time activity
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { loadStats(); loadUsers(); if (tab === 'messages') loadMessages(); }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={15} /> {t.label}
            {t.id === 'verify' && pendingVerify.length > 0 && (
              <span className="admin-tab-badge">{pendingVerify.length}</span>
            )}
            {t.id === 'matches' && matches.length > 0 && (
              <span className="admin-tab-badge" style={{ background: '#ff6584' }}>{matches.length}</span>
            )}
            {t.id === 'messages' && messages.length > 0 && (
              <span className="admin-tab-badge" style={{ background: '#E84B0F' }}>{messages.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="admin-overview animate-fadeIn">
          <div className="admin-stats-grid">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers || users.length}
              color="#6c63ff"
              onClick={() => {
                setStatusFilter('');
                setTab('users');
              }}
            />
            <StatCard
              icon={Activity}
              label="Active Users"
              value={stats?.activeUsers || users.filter(u => u.isActive).length}
              color="#43e97b"
              sub={`${stats?.newUsersToday || 0} joined today`}
              onClick={() => {
                setStatusFilter('active');
                setTab('users');
              }}
            />
            <StatCard
              icon={ShieldCheck}
              label="Verified Users"
              value={stats?.verifiedUsers || users.filter(u => u.verified).length}
              color="#2D9B8A"
              onClick={() => {
                setStatusFilter('verified');
                setTab('users');
              }}
            />
            <StatCard
              icon={Heart}
              label="My Matches"
              value={matches.length}
              color="#ff6584"
              onClick={() => setTab('matches')}
            />
            <StatCard
              icon={MessageCircle}
              label="Total Messages"
              value={stats?.totalMessages || messages.length}
              color="#E84B0F"
              onClick={() => setTab('messages')}
            />
          </div>

          <div className="admin-chart-card card">
            <div className="admin-chart-header">
              <h3><TrendingUp size={16} /> Community Registrations & Growth — Last 7 Days</h3>
            </div>
            <MiniChart data={stats?.dailySignups} />
          </div>

          <div className="admin-overview-grid">
            <div className="card admin-info-card">
              <h4>⚡ Quick Control Actions</h4>
              <div className="admin-quick-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setTab('verify')}>
                  <ShieldCheck size={14} /> Review Pending Verifications ({pendingVerify.length || stats?.pendingVerify || 0})
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setStatusFilter(''); setTab('users'); }}>
                  <Users size={14} /> Manage Platform Users ({stats?.totalUsers || users.length})
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setTab('matches')}>
                  <Heart size={14} /> Control My Matches ({matches.length})
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setTab('messages')}>
                  <MessageCircle size={14} /> View Chat Activity ({messages.length || stats?.totalMessages || 0} msgs)
                </button>
              </div>
            </div>
            <div className="card admin-info-card">
              <h4>📊 Platform Health</h4>
              <div className="admin-health-items">
                <div className="admin-health-row">
                  <span>Verified users</span>
                  <div className="admin-health-bar">
                    <div
                      className="admin-health-fill"
                      style={{
                        width: stats?.totalUsers
                          ? `${((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(0)}%`
                          : '0%',
                        background: '#43e97b'
                      }}
                    />
                  </div>
                  <span className="admin-health-pct">
                    {stats?.totalUsers
                      ? `${((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="admin-health-row">
                  <span>Active users</span>
                  <div className="admin-health-bar">
                    <div
                      className="admin-health-fill"
                      style={{
                        width: stats?.totalUsers
                          ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(0)}%`
                          : '0%',
                        background: '#6c63ff'
                      }}
                    />
                  </div>
                  <span className="admin-health-pct">
                    {stats?.totalUsers
                      ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Users & Partners Tab ── */}
      {tab === 'users' && (
        <div className="admin-users animate-fadeIn">
          <div className="admin-users-toolbar">
            <div className="admin-search-wrap">
              <Search size={15} />
              <input
                className="admin-search-input"
                placeholder="Search by name, email, city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-filter-group">
              {[
                { label: 'All', val: '' },
                { label: 'Active', val: 'active' },
                { label: 'Verified', val: 'verified' },
                { label: 'Unverified', val: 'unverified' },
                { label: 'Suspended', val: 'suspended' },
              ].map(f => (
                <button
                  key={f.val}
                  className={`admin-filter-btn ${statusFilter === f.val ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f.val)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading"><RefreshCw size={20} className="spin-anim" /> Loading users…</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={40} strokeWidth={1.2} color="var(--brand-primary)" /></div>
              <h3>No Users Found</h3>
              <p>Try searching with another keyword.</p>
            </div>
          ) : (
            <div className="admin-table-wrap card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>City / Location</th>
                    <th>Joined</th>
                    <th>Actions & Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const avatar = u.photos?.[0] || u.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=E84B0F&color=fff`;
                    return (
                      <tr key={u._id} className="admin-user-row">
                        <td>
                          <div className="admin-user-cell">
                            <img src={avatar} alt={u.name} className="avatar avatar-sm" />
                            <div>
                              <div className="admin-user-name">
                                {u.name}
                                {u.verified && <CheckCircle size={13} color="#43e97b" />}
                              </div>
                              <div className="admin-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-orange' : 'badge-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className="admin-city-cell">{u.city || '—'}</span>
                        </td>
                        <td>
                          <span className="admin-date-cell">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className="admin-action-btns" style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Chat with user"
                              onClick={() => navigate('/messages', { state: { targetUserId: u._id } })}
                            >
                              <MessageCircle size={13} /> Chat
                            </button>
                            <button
                              className="btn-icon"
                              title={u.verified ? 'Remove verification' : 'Verify user'}
                              onClick={() => handleAction(verifyUserAPI, u._id)}
                              disabled={actionLoading}
                            >
                              <ShieldCheck size={15} color={u.verified ? '#43e97b' : '#999'} />
                            </button>
                            <button
                              className="btn-icon"
                              title={u.isActive ? 'Suspend user' : 'Unsuspend user'}
                              onClick={() => handleAction(suspendUserAPI, u._id)}
                              disabled={actionLoading}
                            >
                              {u.isActive ? <UserX size={15} color="#ef4444" /> : <UserCheck size={15} color="#43e97b" />}
                            </button>
                            <button
                              className="btn-icon"
                              title={u.role === 'admin' ? 'Demote to user' : 'Make admin'}
                              onClick={() => handleAction(changeRoleAPI, u._id, u.role === 'admin' ? 'user' : 'admin')}
                              disabled={actionLoading}
                            >
                              <Crown size={15} color={u.role === 'admin' ? '#FFD700' : '#999'} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Delete user"
                              onClick={() => handleDelete(u._id)}
                              disabled={actionLoading}
                            >
                              <Trash2 size={15} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="admin-table-footer">
                {users.length} user{users.length !== 1 ? 's' : ''} shown
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── My Matches Tab ── */}
      {tab === 'matches' && (
        <div className="admin-matches animate-fadeIn">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div>
              <h3>My Travel Matches & Partners</h3>
              <p className="page-subtitle">Manage and chat with your connected travel partners</p>
            </div>
            <Link to="/discover" className="btn btn-primary btn-sm">
              <Compass size={14} /> Find New Partners
            </Link>
          </div>

          {matches.length === 0 ? (
            <div className="empty-state card" style={{ padding: 40, textAlign: 'center' }}>
              <div className="empty-state-icon"><Heart size={44} color="#ff6584" /></div>
              <h3>No Matches Yet</h3>
              <p>Explore travelers in Discover and connect to start planning adventures together!</p>
              <Link to="/discover" className="btn btn-primary" style={{ marginTop: 12 }}>
                Discover Travelers
              </Link>
            </div>
          ) : (
            <div className="admin-verify-grid">
              {matches.map(m => {
                const partner = m.user || m;
                const avatar = partner.avatar || partner.photos?.[0] ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || 'Partner')}&background=ff6584&color=fff`;
                return (
                  <div key={m.id || partner._id} className="admin-verify-card card">
                    <img src={avatar} alt={partner.name} className="admin-verify-photo" />
                    <div className="admin-verify-info">
                      <div className="admin-verify-name">
                        {partner.name}
                        {partner.verified && <CheckCircle size={13} color="#43e97b" />}
                      </div>
                      <div className="admin-verify-meta">
                        {partner.city || 'Global'} · {partner.travelStyle || 'Explorer'}
                      </div>
                      {partner.bio && <p className="admin-verify-bio">"{partner.bio}"</p>}
                    </div>
                    <div className="admin-verify-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/messages', { state: { targetUserId: partner._id || partner.id } })}
                      >
                        <MessageSquare size={13} /> Chat Now
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/profile/${partner._id || partner.id}`)}
                      >
                        <Eye size={13} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Verify Tab ── */}
      {tab === 'verify' && (
        <div className="admin-verify animate-fadeIn">
          <div className="admin-verify-header">
            <h3>Verification Management Queue</h3>
            <p className="page-subtitle">Users who completed onboarding and require profile verification</p>
          </div>

          {loading ? (
            <div className="admin-loading"><RefreshCw size={20} className="spin-anim" /> Loading…</div>
          ) : pendingVerify.length === 0 ? (
            <div className="empty-state card" style={{ padding: 40, textAlign: 'center' }}>
              <div className="empty-state-icon"><CheckCircle size={40} strokeWidth={1.2} color="var(--brand-primary)" /></div>
              <h3>All Caught Up!</h3>
              <p>All registered users are currently verified. You can also verify or unverify users from the Users tab.</p>
            </div>
          ) : (
            <div className="admin-verify-grid">
              {pendingVerify.map(u => {
                const avatar = u.photos?.[0] || u.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=E84B0F&color=fff`;
                return (
                  <div key={u._id} className="admin-verify-card card">
                    <img src={avatar} alt={u.name} className="admin-verify-photo" />
                    <div className="admin-verify-info">
                      <div className="admin-verify-name">{u.name}</div>
                      <div className="admin-verify-meta">{u.email}</div>
                      <div className="admin-verify-meta">
                        {u.city} · {u.age ? `${u.age} yrs` : ''} · {u.travelStyle || '—'}
                      </div>
                      {u.bio && <p className="admin-verify-bio">"{u.bio}"</p>}
                    </div>
                    <div className="admin-verify-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAction(verifyUserAPI, u._id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={13} /> Verify
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAction(suspendUserAPI, u._id)}
                        disabled={actionLoading}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Messages Tab ── */}
      {tab === 'messages' && (
        <div className="admin-messages animate-fadeIn">
          <div className="admin-users-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="admin-search-wrap" style={{ flex: 1, minWidth: 260 }}>
              <Search size={15} />
              <input
                className="admin-search-input"
                placeholder="Search messages by sender, receiver, or content..."
                value={msgSearch}
                onChange={e => setMsgSearch(e.target.value)}
              />
            </div>
            <div className="admin-filter-group">
              <button
                className={`admin-filter-btn ${msgScope === 'all' ? 'active' : ''}`}
                onClick={() => setMsgScope('all')}
              >
                All Messages ({messages.length})
              </button>
              <button
                className={`admin-filter-btn ${msgScope === 'mine' ? 'active' : ''}`}
                onClick={() => setMsgScope('mine')}
              >
                My Messages ({myMessagesCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading"><RefreshCw size={20} className="spin-anim" /> Loading messages…</div>
          ) : filteredMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><MessageCircle size={40} strokeWidth={1.2} color="var(--brand-primary)" /></div>
              <h3>No Messages Found</h3>
              <p>Real-time conversation logs will appear here.</p>
            </div>
          ) : (
            <div className="admin-table-wrap card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Type</th>
                    <th>Content / Preview</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map(m => {
                    const senderAvatar = m.senderId?.photos?.[0] || m.senderId?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(m.senderId?.name || 'User')}&background=6c63ff&color=fff`;
                    const receiverAvatar = m.receiverId?.photos?.[0] || m.receiverId?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(m.receiverId?.name || 'User')}&background=E84B0F&color=fff`;

                    return (
                      <tr key={m._id} className="admin-user-row">
                        <td>
                          <div className="admin-user-cell">
                            <img src={senderAvatar} alt="" className="avatar avatar-sm" />
                            <div>
                              <div className="admin-user-name">{m.senderId?.name || 'Unknown'}</div>
                              <div className="admin-user-email">{m.senderId?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-user-cell">
                            <img src={receiverAvatar} alt="" className="avatar avatar-sm" />
                            <div>
                              <div className="admin-user-name">{m.receiverId?.name || 'Unknown'}</div>
                              <div className="admin-user-email">{m.receiverId?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                            {m.type || 'text'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '280px', wordBreak: 'break-word' }}>
                          {m.type === 'location' ? (
                            <span>📍 Location: {m.locationData?.city || 'Pinned location'}</span>
                          ) : m.type === 'itinerary' ? (
                            <span>✈️ Trip: {m.itineraryData?.destination || 'Plan'}</span>
                          ) : (
                            <span>{m.content || '—'}</span>
                          )}
                        </td>
                        <td>
                          <span className="admin-date-cell">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="admin-table-footer">
                {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} shown
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reports ── */}
      {tab === 'reports' && (
        <div className="admin-reports animate-fadeIn">
          <div className="empty-state">
            <div className="empty-state-icon">
              <AlertTriangle size={40} strokeWidth={1.2} color="var(--brand-primary)" />
            </div>
            <h3>No Reports Yet</h3>
            <p>Platform safety reports and flags will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
