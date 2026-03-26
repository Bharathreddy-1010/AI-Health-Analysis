import React from 'react';
import { Link } from 'react-router-dom';
import './DietPlans.css'; 

const DietPlans = () => {
  const plans = [
    {
      title: "Diabetes-Friendly",
      slug: "diabetes-friendly",
      desc: "Low glycemic meals designed to help manage blood sugar levels and improve insulin sensitivity.",
      tags: ["Low sugar", "Complex carbs", "High fiber"],
      icon: "🩸",
      themeClass: "theme-teal"
    },
    {
      title: "Anti-Inflammatory",
      slug: "anti-inflammatory",
      desc: "Rich in omega-3s and antioxidants to reduce inflammation and support joint health.",
      tags: ["Omega-3 rich", "Antioxidants", "Turmeric"],
      icon: "🌿",
      themeClass: "theme-green"
    },
    {
      title: "Heart Healthy",
      slug: "heart-healthy",
      desc: "Mediterranean-inspired meals to support cardiovascular health and reduce cholesterol.",
      tags: ["Low sodium", "Healthy fats", "Lean proteins"],
      icon: "❤️",
      themeClass: "theme-red"
    },
    {
      title: "Weight Management",
      slug: "weight-management",
      desc: "Balanced, portion-controlled meals to support healthy weight loss or maintenance.",
      tags: ["Calorie controlled", "High protein", "Filling"],
      icon: "⚖️",
      themeClass: "theme-blue"
    }
  ];

  return (
    <div className="diet-page-container">
      
      {/* --- AMBIENT 3D GROCERY BACKGROUND --- */}
      <div className="floating-background">
        <div className="bg-glow glow-blue"></div>
        <div className="bg-glow glow-sky"></div>
        {/* Floating Grocery Items */}
        <div className="grocery-shape shape-1">🥦</div>
        <div className="grocery-shape shape-2">🍎</div>
        <div className="grocery-shape shape-3">🥑</div>
        <div className="grocery-shape shape-4">🥕</div>
        <div className="grocery-shape shape-5">🐟</div>
        <div className="grocery-shape shape-6">🍋</div>
        <div className="grocery-shape shape-7">🥬</div>
      </div>

      <div className="diet-content-wrapper">
        
        {/* Header Section */}
        <div className="diet-header">
          <span className="hero-badge">✨ AI-Powered Nutrition</span>
          <h1 className="page-title">Explore Diet Plans</h1>
          <p className="page-subtitle">Choose a category below to view a comprehensive 7-day meal plan tailored for your health.</p>
        </div>

        {/* Diet Plan Cards Grid */}
        <div className="diet-grid">
          {plans.map((plan, index) => (
            <Link 
              to={`/diet-plans/${plan.slug}`} 
              className={`diet-card-link ${plan.themeClass}`}
              key={index}
            >
              <div className="diet-card">
                <div className="diet-card-top">
                  <div className="diet-icon-box">{plan.icon}</div>
                  <span className="arrow-icon">→</span>
                </div>
                <h3 className="diet-card-title">{plan.title}</h3>
                <p className="diet-card-desc">{plan.desc}</p>
                <div className="diet-tags">
                  {plan.tags.map((tag, i) => (
                    <span key={i} className="diet-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Feature Highlights */}
        <div className="diet-footer-features">
          <div className="feature-item">
            <div className="feature-icon-simple">🍴</div>
            <div className="feature-text">
              <h4>7-Day Meal Plans</h4>
              <p>Complete weekly plans with breakfast, lunch, dinner, and snacks.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-simple">✨</div>
            <div className="feature-text">
              <h4>AI Generated</h4>
              <p>Plans are customized using advanced AI based on your health profile.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-simple">🛒</div>
            <div className="feature-text">
              <h4>Grocery Lists</h4>
              <p>Every plan includes a shopping list with everything you need.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DietPlans;