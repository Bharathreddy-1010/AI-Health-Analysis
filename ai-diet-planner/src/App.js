import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- IMPORTS ---
import GroceryShop from './GroceryShop';
import HospitalFinder from './HospitalFinder';
import DiagnosisInput from './DiagnosisInput';
import ResultsDashboard from './ResultsDashboard'; 
import DietPlans from './DietPlans';           
import DietPlanDetails from './DietPlanDetails'; 
import CartPage from './CartPage';
import Chatbot from './Chatbot'; 
import { LoginPage, SignupPage } from './AuthPages'; 
import Hero3D from './Hero3D'; // Make sure you created this file!
import DoctorBooking from './DoctorBooking';
import './App.css'; 

// --- NAVBAR COMPONENT ---
const Navbar = ({ cartCount, onLogout, user }) => {
  const location = useLocation();
  const showCartButton = location.pathname === '/grocery' || location.pathname === '/cart';
  const displayId = user?.user_id ? user.user_id.toUpperCase() : "";

  return (
    <nav className="navbar glass-effect">
      <div className="nav-brand">
        <div className="nav-logo">
          <span className="logo-icon">⚕️</span> NutriCare
        </div>
        {user && (
          <div className="user-badge fade-in">
            <span className="badge-label">ID:</span>
            <span className="badge-value">{displayId}</span>
          </div>
        )}
      </div>

      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/diagnosis" className={location.pathname === '/diagnosis' ? 'active' : ''}>Analyze</Link>
        <Link to="/diet-plans" className={location.pathname.includes('/diet') ? 'active' : ''}>Diet</Link>
        <Link to="/hospitals" className={location.pathname === '/hospitals' ? 'active' : ''}>Hospitals</Link>
        <Link to="/doctors" className={location.pathname === '/doctors' ? 'active' : ''}>Doctors</Link>
        <Link to="/grocery" className={location.pathname === '/grocery' ? 'active' : ''}>Shop</Link>
      </div>

      <div className="nav-actions">
        {showCartButton && (
          <Link to="/cart" className="btn btn-cart bounce-in">
            🛒 <span className="cart-count">{cartCount}</span>
          </Link>
        )}
        <button onClick={onLogout} className="btn btn-logout slide-in-right">
          Logout ↪
        </button>
      </div>
    </nav>
  );
};

// --- HOME COMPONENT ---
const Home = ({ user, showNotification }) => {
  
  // This triggers when a user clicks the floating 3D elements!
  const handle3DClick = (message) => {
    showNotification(`✨ ${message}`);
  };

  return (
    <div className="home-container">
      {/* HERO SECTION */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Blobs */}
        <div className="hero-bg-elements">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>

        {/* 3D FLOATING ELEMENTS LAYER */}
        <Hero3D onInteract={handle3DClick} />
        
        {/* TEXT LAYER (pointer-events: none lets clicks pass through to the 3D items behind it) */}
        <div className="hero-content fade-in-up" style={{ position: 'relative', zIndex: 10, pointerEvents: 'none' }}>
          
          {/* pointer-events: auto makes sure you can still click the buttons! */}
          <div style={{ pointerEvents: 'auto' }}>
            <div className="hero-badge pulse-glow">AI-Powered Health & Nutrition</div>
            <h1 className="hero-title">
              Welcome back, <br/>
              <span className="text-gradient">{user?.email.split('@')[0]}</span>
            </h1>
            <p className="hero-subtitle stagger-1">
              Transform your health journey with clinical-grade AI prediction, personalized diet plans, and smart recovery tracking.
            </p>
            <div className="hero-buttons stagger-2">
              <Link to="/diagnosis" className="btn btn-primary btn-glow">Start Free Analysis →</Link>
              <Link to="/diet-plans" className="btn btn-secondary glass-btn">Explore Diet Plans</Link>
            </div>
          </div>

        </div>
      </section>
      
      {/* FEATURES SECTION */}
      <section className="features-section">
        <div className="section-header fade-in-up">
          <h2>Comprehensive Health Ecosystem</h2>
          <p>Advanced AI technology combined with medical expertise for your personalized care.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card animate-on-scroll delay-1">
            <div className="feature-icon-wrapper"><div className="feature-icon float-animation">🩺</div></div>
            <h3>AI Health Analysis</h3>
            <p>Upload medical reports or describe symptoms for instant, accurate health insights.</p>
          </div>
          
          <div className="feature-card animate-on-scroll delay-2">
            <div className="feature-icon-wrapper"><div className="feature-icon float-animation" style={{animationDelay: '0.5s'}}>🥗</div></div>
            <h3>Precision Diet</h3>
            <p>Get custom 7-day clinical meal plans generated by AI based on your specific vitals.</p>
          </div>
          
          <div className="feature-card animate-on-scroll delay-3">
            <div className="feature-icon-wrapper"><div className="feature-icon float-animation" style={{animationDelay: '1s'}}>🏥</div></div>
            <h3>Hospital Network</h3>
            <p>Find top-rated nearby specialists and hospitals based on your precise condition.</p>
          </div>
          
          <div className="feature-card animate-on-scroll delay-4">
            <div className="feature-icon-wrapper"><div className="feature-icon float-animation" style={{animationDelay: '1.5s'}}>🛒</div></div>
            <h3>Smart Grocery</h3>
            <p>Filter and shop for therapeutic groceries that perfectly match your dietary Rx.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nutricare_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [showSignup, setShowSignup] = useState(false);
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null); 

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('nutricare_user', JSON.stringify(userData)); 
    showNotification(`👋 Welcome back, ${userData.email}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nutricare_user'); 
    setCart([]); 
    showNotification("Logged out successfully.");
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    showNotification(`✅ Added ${product.name} to cart!`);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
    showNotification("🗑️ Item removed from cart");
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      showNotification("⚠️ Your cart is empty!");
      return;
    }
    setCart([]); 
    showNotification("🎉 Order Placed Successfully! Shipment is on the way.");
  };

  // GATEKEEPER
  if (!user) {
    return (
      <div className="App auth-bg">
        {notification && (
          <div className="toast-container slide-down">
            <div className="toast-message glass-effect">{notification}</div>
          </div>
        )}
        {showSignup ? (
          <SignupPage onSwitch={() => setShowSignup(false)} />
        ) : (
          <LoginPage onLogin={handleLogin} onSwitch={() => setShowSignup(true)} />
        )}
      </div>
    );
  }

  // MAIN APP ROUTER
  return (
    <Router>
      <div className="App main-layout">
        <Navbar cartCount={cart.length} onLogout={handleLogout} user={user} />

        {notification && (
          <div className="toast-container slide-down">
            <div className="toast-message glass-effect">{notification}</div>
          </div>
        )}

        <Chatbot />

        <main className="main-content">
          <Routes>
            {/* Note: Passed showNotification down to Home so the 3D items can trigger toasts! */}
            <Route path="/" element={<Home user={user} showNotification={showNotification} />} />
            <Route path="/diagnosis" element={<DiagnosisInput />} />
            <Route path="/results" element={<ResultsDashboard />} />
            <Route path="/hospitals" element={<HospitalFinder />} />
            <Route path="/grocery" element={<GroceryShop addToCart={addToCart} />} />
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} onPlaceOrder={placeOrder} />} />
            <Route path="/diet-plans" element={<DietPlans />} />
            <Route path="/doctors" element={<DoctorBooking />} />
            <Route path="/diet-plans/:type" element={<DietPlanDetails />} />
          </Routes>
        </main>

        <footer className="footer glass-effect-top">
          <div className="footer-content">
            <div className="footer-col">
              <h3><span className="logo-icon">⚕️</span> NutriCare</h3>
              <p>AI-powered personalized health pathways for optimal recovery.</p>
            </div>
            <div className="footer-col">
              <h4>Features</h4>
              <ul><li>Health Analysis</li><li>Clinical Diet Plans</li><li>Find Hospitals</li><li>Smart Rx Grocery</li></ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul><li>About Us</li><li>Medical Advisory</li><li>Careers</li><li>Contact</li></ul>
            </div>
            <div className="footer-col">
              <h4>Legal & Privacy</h4>
              <ul><li>Privacy Policy</li><li>Terms of Service</li><li>HIPAA Compliance</li></ul>
            </div>
          </div>
          <div className="footer-bottom">© 2026 NutriCare Systems. All rights reserved.</div>
        </footer>
      </div>
    </Router>
  );
}

export default App;