import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './OnboardingPage.css';

const INTERESTS = ['Hiking', 'Food', 'Photography', 'Art', 'Music', 'Surfing', 'Yoga', 'History', 'Architecture', 'Nightlife', 'Scuba Diving', 'Wildlife', 'Camping', 'Languages', 'Fashion', 'Coffee', 'Wine'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Arabic', 'Portuguese', 'Hindi', 'Italian', 'Korean', 'Russian'];
const TRAVEL_STYLES = ['Backpacker', 'Budget', 'Mid-range', 'Luxury', 'Cultural', 'Adventure', 'Digital Nomad', 'Eco-Traveler'];
const BUDGETS = ['Budget ($)', 'Mid-range ($$)', 'Luxury ($$$)', 'Ultra-Luxury ($$$$)'];

const steps = [
  { id: 1, title: 'Basic Info', desc: 'Tell us about yourself' },
  { id: 2, title: 'Travel Style', desc: 'How do you like to travel?' },
  { id: 3, title: 'Interests', desc: 'What do you love doing?' },
  { id: 4, title: 'Languages', desc: 'Languages you speak' },
];

export default function OnboardingPage() {
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    age: '',
    gender: '',
    nationality: '',
    city: '',
    bio: '',
    travelStyle: '',
    budget: '',
    interests: [],
    languages: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const toggleArr = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const canAdvance = () => {
    if (step === 1) return data.age && data.gender && data.city;
    if (step === 2) return data.travelStyle && data.budget;
    if (step === 3) return data.interests.length >= 3;
    if (step === 4) return data.languages.length >= 1;
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(s => s + 1);
    } else {
      // Save to backend
      setSaving(true);
      setError('');
      const result = await updateProfile({ ...data, onboardingDone: true });
      setSaving(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Something went wrong. Try again.');
      }
    }
  };


  const progress = (step / steps.length) * 100;

  return (
    <div className="onboarding">
      <div className="onboarding-bg">
        <div className="onboard-blob onboard-blob-1" />
        <div className="onboard-blob onboard-blob-2" />
      </div>

      <div className="onboarding-card">
        {/* Header */}
        <div className="onboard-header">
          <div className="onboard-logo">
            <div className="onboard-logo-icon"><Zap size={18} fill="white" /></div>
            <span>WonderBond</span>
          </div>
          <div className="onboard-step-label">Step {step} of {steps.length}</div>
        </div>

        {/* Progress */}
        <div className="progress-bar" style={{ marginBottom: 32 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Steps nav */}
        <div className="onboard-steps">
          {steps.map(s => (
            <div key={s.id} className={`onboard-step-dot ${s.id === step ? 'active' : ''} ${s.id < step ? 'done' : ''}`}>
              {s.id < step ? <CheckCircle size={14} /> : s.id}
            </div>
          ))}
        </div>

        {/* Step title */}
        <div className="onboard-step-info">
          <h2>{steps[step - 1].title}</h2>
          <p>{steps[step - 1].desc}</p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="onboard-fields animate-fadeIn">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input type="number" min="18" max="99" className="form-input" placeholder="25" value={data.age} onChange={e => update('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={data.gender} onChange={e => update('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nationality</label>
              <input type="text" className="form-input" placeholder="American" value={data.nationality} onChange={e => update('nationality', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Current City</label>
              <input type="text" className="form-input" placeholder="New York" value={data.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" placeholder="Tell other travelers about yourself..." value={data.bio} onChange={e => update('bio', e.target.value)} rows={3} />
            </div>
          </div>
        )}

        {/* Step 2: Travel Style */}
        {step === 2 && (
          <div className="onboard-fields animate-fadeIn">
            <div className="form-group">
              <label className="form-label">Travel Style</label>
              <div className="chip-grid">
                {TRAVEL_STYLES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${data.travelStyle === s ? 'chip-active' : ''}`}
                    onClick={() => update('travelStyle', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Budget Range</label>
              <div className="chip-grid">
                {BUDGETS.map(b => (
                  <button
                    key={b}
                    type="button"
                    className={`chip ${data.budget === b ? 'chip-active' : ''}`}
                    onClick={() => update('budget', b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="onboard-fields animate-fadeIn">
            <p className="onboard-hint">Select at least 3 interests to help us find your best matches</p>
            <div className="chip-grid">
              {INTERESTS.map(i => (
                <button
                  key={i}
                  type="button"
                  className={`chip ${data.interests.includes(i) ? 'chip-active' : ''}`}
                  onClick={() => toggleArr('interests', i)}
                >
                  {i}
                </button>
              ))}
            </div>
            <p className="onboard-count">{data.interests.length} selected</p>
          </div>
        )}

        {/* Step 4: Languages */}
        {step === 4 && (
          <div className="onboard-fields animate-fadeIn">
            <p className="onboard-hint">Select all languages you speak</p>
            <div className="chip-grid">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  type="button"
                  className={`chip ${data.languages.includes(l) ? 'chip-active' : ''}`}
                  onClick={() => toggleArr('languages', l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="onboard-actions">
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={saving}>
              Back
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            style={{ marginLeft: step > 1 ? 0 : 'auto' }}
          >
            {saving ? '⏳ Saving...' : step === 4 ? "🎉 Let's Go!" : 'Continue'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 8, fontSize: '0.85rem' }}>
            {error}
          </p>
        )}

        <button
          className="onboard-skip"
          onClick={() => navigate('/dashboard')}
        >
          Skip for now
        </button>

      </div>
    </div>
  );
}
