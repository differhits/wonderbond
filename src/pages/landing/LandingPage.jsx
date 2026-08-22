import { Link } from 'react-router-dom';
import { Zap, Globe, Shield, Heart, Star, ArrowRight, CheckCircle, MapPin, MessageCircle } from 'lucide-react';
import './LandingPage.css';

const features = [
  { icon: Globe, title: 'Destination Matching', desc: 'Find travelers heading to the same destination during your travel dates.', color: '#6c63ff' },
  { icon: Heart, title: 'Smart Compatibility', desc: 'Our algorithm scores compatibility based on travel style, budget, interests and more.', color: '#ff6584' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Travel with confidence. Our verification system builds a trusted community.', color: '#43e97b' },
  { icon: MessageCircle, title: 'Real-Time Chat', desc: 'Connect privately with your matches and plan your trip together.', color: '#ffbe0b' },
];

const stats = [
  { number: '50K+', label: 'Active Travelers' },
  { number: '120+', label: 'Destinations' },
  { number: '98%', label: 'Match Satisfaction' },
  { number: '4.9★', label: 'App Rating' },
];

const testimonials = [
  {
    name: 'Priya Sharma', city: 'Mumbai → Bali',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face',
    text: 'WonderBond matched me with the most incredible travel companion for Bali. We hiked through rice terraces, explored temples, and made memories for life!',
  },
  {
    name: 'Carlos Mendez', city: 'Mexico City → Tokyo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    text: 'As a solo traveler, safety was my top concern. WonderBond\'s verified profiles gave me the confidence to travel with someone new. 10/10 experience.',
  },
  {
    name: 'Emma Wilson', city: 'London → Vietnam',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    text: 'The compatibility score is so accurate! My travel partner and I had the same budget, same interests, and the same terrible sense of direction.',
  },
];

const travelStyles = ['🎒 Backpacker', '🌿 Eco-Traveler', '💼 Digital Nomad', '🏔️ Adventure', '🍽️ Food Tourism', '🛥️ Luxury'];

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link to="/" className="landing-nav-logo">
          <div className="landing-logo-icon"><Zap size={18} fill="white" /></div>
          <span>WonderBond</span>
        </Link>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#testimonials">Stories</a>
        </div>
        <div className="landing-nav-cta">
          <Link to="/auth" className="btn btn-ghost">Log in</Link>
          <Link to="/auth?mode=register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
          <div className="hero-blob hero-blob-3" />
        </div>
        <div className="landing-hero-content">
          <div className="hero-badge"><span>✈️</span><span>50,000+ travelers connected worldwide</span></div>
          <h1 className="hero-title">Find Your Perfect<br /><span className="gradient-text">Travel Partner</span></h1>
          <p className="hero-desc">Stop traveling solo. WonderBond matches you with like-minded travelers heading to the same destination — based on your travel style, budget, and interests.</p>
          <div className="hero-cta">
            <Link to="/auth?mode=register" className="btn btn-primary btn-xl">Start Exploring <ArrowRight size={20} /></Link>
            <Link to="/auth" className="btn btn-secondary btn-xl">See Travelers</Link>
          </div>
          <div className="hero-trust">
            {['No credit card required', 'Free to join', '100% safe & verified'].map(t => (
              <span key={t} className="hero-trust-item"><CheckCircle size={14} />{t}</span>
            ))}
          </div>
        </div>
        <div className="hero-cards">
          <div className="hero-card hero-card-1 animate-float">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=56&h=56&fit=crop&crop=face" className="avatar avatar-md" alt="" />
            <div><div className="hero-card-name">Sofia M.</div><div className="hero-card-meta"><MapPin size={12} /> Bali</div></div>
            <div className="hero-card-compat">89%</div>
          </div>
          <div className="hero-card hero-card-2 animate-float" style={{ animationDelay: '0.5s' }}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=56&h=56&fit=crop&crop=face" className="avatar avatar-md" alt="" />
            <div><div className="hero-card-name">Liam C.</div><div className="hero-card-meta"><MapPin size={12} /> Tokyo</div></div>
            <div className="hero-card-compat">82%</div>
          </div>
          <div className="hero-card hero-card-3 animate-float" style={{ animationDelay: '1s' }}>
            <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=56&h=56&fit=crop&crop=face" className="avatar avatar-md" alt="" />
            <div><div className="hero-card-name">Amara O.</div><div className="hero-card-meta"><MapPin size={12} /> Serengeti</div></div>
            <div className="hero-card-compat">76%</div>
          </div>
        </div>
      </section>

      <section className="landing-stats">
        {stats.map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="landing-styles">
        <p className="styles-label">Connecting all types of travelers</p>
        <div className="styles-list">{travelStyles.map(s => <span key={s} className="tag">{s}</span>)}</div>
      </section>

      <section id="features" className="landing-features">
        <div className="section-header">
          <h2>Everything you need for <span className="gradient-text">safe solo travel</span></h2>
          <p>Built by travelers, for travelers. WonderBond has all the tools to help you find trusted companions.</p>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon" style={{ background: `${f.color}20`, color: f.color }}><f.icon size={24} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-how">
        <div className="section-header">
          <h2>How <span className="gradient-text">WonderBond</span> works</h2>
          <p>Connect with your ideal travel partner in three simple steps</p>
        </div>
        <div className="steps-grid">
          {[
            { num: '01', title: 'Create Your Profile', desc: 'Tell us who you are, where you\'re going, and what kind of traveler you are.' },
            { num: '02', title: 'Discover & Swipe', desc: 'Browse compatible travelers heading to your destination. Swipe right to connect.' },
            { num: '03', title: 'Match & Travel', desc: 'When it\'s mutual, you\'re matched! Chat, plan your itinerary, and travel together.' },
          ].map(step => (
            <div key={step.num} className="step-card">
              <div className="step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="landing-testimonials">
        <div className="section-header">
          <h2>Real stories from <span className="gradient-text">real travelers</span></h2>
          <p>Join thousands who have found their perfect travel companion</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map(t => (
            <div key={t.name} className="testimonial-card card">
              <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#ffd700" color="#ffd700" />)}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="avatar avatar-sm" />
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-city"><MapPin size={11} /> {t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="cta-bg"><div className="cta-blob-1" /><div className="cta-blob-2" /></div>
        <div className="cta-content">
          <h2>Ready to find your travel partner?</h2>
          <p>Join 50,000+ solo travelers already on WonderBond</p>
          <Link to="/auth?mode=register" className="btn btn-primary btn-xl">Join for Free <ArrowRight size={20} /></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-logo">
          <div className="landing-logo-icon"><Zap size={14} fill="white" /></div>
          <span>WonderBond</span>
        </div>
        <p>© 2026 WonderBond. Making solo travel more social.</p>
        <div className="footer-links">
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Safety</a><a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}
