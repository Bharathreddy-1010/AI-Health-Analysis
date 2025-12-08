import React from 'react';
import { Link } from 'react-router-dom';

const DietPlans = () => {
  const plans = [
    {
      title: "Diabetes-Friendly",
      slug: "diabetes-friendly",
      desc: "Low glycemic meals designed to help manage blood sugar levels and improve insulin sensitivity.",
      tags: ["Low sugar", "Complex carbs", "High fiber"],
      icon: "❤️"
    },
    {
      title: "Anti-Inflammatory",
      slug: "anti-inflammatory",
      desc: "Rich in omega-3s and antioxidants to reduce inflammation and support joint health.",
      tags: ["Omega-3 rich", "Antioxidants", "Turmeric"],
      icon: "🌿"
    },
    {
      title: "Heart Healthy",
      slug: "heart-healthy",
      desc: "Mediterranean-inspired meals to support cardiovascular health and reduce cholesterol.",
      tags: ["Low sodium", "Healthy fats", "Lean proteins"],
      icon: "❤️"
    },
    {
      title: "Weight Management",
      slug: "weight-management",
      desc: "Balanced, portion-controlled meals to support healthy weight loss or maintenance.",
      tags: ["Calorie controlled", "High protein", "Filling"],
      icon: "🔥"
    }
  ];

  return (
    <div className="diet-page">
      <div className="diet-header">
        <span className="hero-badge">✨ AI-Powered Nutrition</span>
        <h1>Personalized Diet Plans</h1>
        <p>Choose a diet type based on your health goals, or get a personalized plan by analyzing your symptoms first.</p>
      </div>

      <div className="diet-cta-box">
        <h2>Get a Personalized Plan</h2>
        <p>Our AI can create a custom diet plan based on your specific health conditions.</p>
        <Link to="/diagnosis">
          <button className="btn btn-white-outline">Start Health Analysis →</button>
        </Link>
      </div>

      <div className="diet-grid">
        {plans.map((plan, index) => (
          /* ADDED CLASS NAME HERE TO FIX OVERLAP */
          <Link 
            to={`/diet-plans/${plan.slug}`} 
            className="diet-card-link"
            key={index}
          >
            <div className="diet-card">
              <div className="diet-card-top">
                <div className="diet-icon-box">{plan.icon}</div>
                <h3>{plan.title}</h3>
                <span className="arrow-icon">→</span>
              </div>
              <p>{plan.desc}</p>
              <div className="diet-tags">
                {plan.tags.map((tag, i) => (
                  <span key={i} className="diet-tag">{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="diet-footer-features">
        <div className="feature-item">
          <div className="feature-icon-simple">🍴</div>
          <h4>7-Day Meal Plans</h4>
          <p>Complete weekly plans with breakfast, lunch, dinner, and snacks.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon-simple">✨</div>
          <h4>AI Generated</h4>
          <p>Plans are customized using advanced AI based on your health profile.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon-simple">🍃</div>
          <h4>Grocery Lists</h4>
          <p>Every plan includes a shopping list with everything you need.</p>
        </div>
      </div>
    </div>
  );
};

export default DietPlans;