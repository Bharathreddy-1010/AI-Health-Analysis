import React, { useState } from 'react';

// --- SHARED STYLES (Simple CSS for Auth) ---
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    fontFamily: "'Segoe UI', sans-serif"
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  title: {
    marginBottom: '20px',
    color: '#2d3748',
    fontSize: '2rem'
  },
  input: {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    marginTop: '20px',
    background: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  link: {
    color: '#3182ce',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginLeft: '5px'
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.9rem',
    marginTop: '10px',
    background: '#fff5f5',
    padding: '10px',
    borderRadius: '5px'
  }
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
      // Connecting to Python Backend
      const response = await fetch('https://ai-health-analysis-1.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase(), 
          password: password,
          custom_id: "0" // Not used for login, but keeps data shape consistent
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        onLogin({ email: data.email, user_id: data.user_id }); // Pass user data up to App.js
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Is backend running?');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={{ color: '#718096', marginBottom: '20px' }}>Sign in to access your health dashboard</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email Address" 
            style={styles.input} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={styles.input} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {error && <div style={styles.error}>{error}</div>}

        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          Don't have an account? 
          <span onClick={onSwitch} style={styles.link}>Sign Up</span>
        </p>
      </div>
    </div>
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
      const response = await fetch('https://ai-health-analysis-1.onrender.com/signup', {
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
        onSwitch(); // Go to Login Page
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Is backend running?');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={{ color: '#718096', marginBottom: '20px' }}>Join NutriCare for AI Health Analysis</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email Address" 
            style={styles.input} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Unique Health ID (e.g. RAJ123)" 
            style={styles.input} 
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={styles.input} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {error && <div style={styles.error}>{error}</div>}

        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          Already have an account? 
          <span onClick={onSwitch} style={styles.link}>Login</span>
        </p>
      </div>
    </div>
  );
};