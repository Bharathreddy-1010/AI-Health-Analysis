import React, { useState } from 'react';
import { apiBaseUrl } from './constants/apiconst.js'; 
import './AuthPages.css'; // Make sure to import the new CSS

// --- SHARED LAYOUT & 3D BACKGROUND ---
const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page-container">
      {/* Floating 3D Objects representing core app features */}
      <div className="floating-background">
        <div className="bg-glow glow-blue"></div>
        <div className="bg-glow glow-sky"></div>
        <div className="auth-shape shape-1">🏥</div> {/* Hospitals */}
        <div className="auth-shape shape-2">🔬</div> {/* Analyze */}
        <div className="auth-shape shape-3">🥗</div> {/* Diet */}
        <div className="auth-shape shape-4">🛒</div> {/* Shop */}
        <div className="auth-shape shape-5">🧬</div> {/* Health */}
        <div className="auth-shape shape-6">🍎</div> {/* Nutrition */}
      </div>
      
      {/* Foreground Content */}
      <div className="auth-content-wrapper">
        {children}
      </div>
    </div>
  );
};

// --- LOGIN PAGE ---
export const LoginPage = ({ onLogin, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`Attempting login connection to: ${apiBaseUrl}/login`);
      
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase(), 
          password: password,
          custom_id: "0"
        })
      });
      
      const data = await response.json();

      if (data.status === 'success') {
        onLogin({ email: data.email, user_id: data.user_id });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setError('Cannot connect to server. Is backend running?');
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo-icon">⚕️</span>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your health dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}

        <p className="auth-footer-text">
          Don't have an account? 
          <span onClick={onSwitch} className="auth-link">Sign Up</span>
        </p>
      </div>
    </AuthLayout>
  );
};

// --- SIGNUP PAGE ---
export const SignupPage = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customId, setCustomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`Attempting signup connection to: ${apiBaseUrl}/signup`);
      
      const response = await fetch(`${apiBaseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase(), 
          password: password, 
          custom_id: customId 
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert('🎉 Account Created! Please Login.');
        onSwitch(); 
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error("Signup fetch error:", err);
      setError('Cannot connect to server. Is backend running?');
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo-icon">✨</span>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join NutriCare for AI Health Analysis</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Unique Health ID (e.g. RAJ123)" 
              className="auth-input"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}

        <p className="auth-footer-text">
          Already have an account? 
          <span onClick={onSwitch} className="auth-link">Login</span>
        </p>
      </div>
    </AuthLayout>
  );
};