import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // <--- Added useNavigate

// --- MOCK DATA ---
const dietDatabase = {
  "diabetes-friendly": {
    title: "Diabetes-Friendly",
    days: {
      Monday: {
        breakfast: "Greek yogurt with berries and chia seeds",
        lunch: "Grilled chicken salad with quinoa and mixed greens",
        dinner: "Lean beef stir-fry with brown rice",
        snacks: "Almonds and an apple",
        grocery: ["Chicken breast", "Quinoa", "Greek yogurt", "Chia seeds", "Berries"]
      },
      Tuesday: {
        breakfast: "Oatmeal with walnuts and cinnamon",
        lunch: "Lentil soup with whole grain roll",
        dinner: "Baked salmon with asparagus",
        snacks: "Carrot sticks with hummus",
        grocery: ["Salmon", "Asparagus", "Lentils", "Walnuts", "Hummus"]
      },
      // ... (Rest of days can be inferred or kept from previous code)
      Wednesday: { breakfast: "Scrambled eggs", lunch: "Turkey wrap", dinner: "Zucchini noodles", snacks: "Pear", grocery: ["Eggs", "Turkey", "Zucchini"] },
      Thursday: { breakfast: "Smoothie bowl", lunch: "Chickpea salad", dinner: "Grilled shrimp", snacks: "Boiled egg", grocery: ["Shrimp", "Chickpeas", "Cucumber"] },
      Friday: { breakfast: "Avocado toast", lunch: "Tuna salad", dinner: "Stuffed peppers", snacks: "Nuts", grocery: ["Avocado", "Tuna", "Peppers"] },
      Saturday: { breakfast: "Cottage cheese", lunch: "Veggie stir-fry", dinner: "Roasted chicken", snacks: "Celery", grocery: ["Cottage cheese", "Chicken", "Veggies"] },
      Sunday: { breakfast: "Pancakes", lunch: "Fish tacos", dinner: "Eggplant parm", snacks: "Yogurt", grocery: ["Flour", "Fish", "Eggplant"] }
    }
  },
  "anti-inflammatory": { title: "Anti-Inflammatory", days: { Monday: { breakfast: "Turmeric oats", lunch: "Kale salad", dinner: "Baked mackerel", snacks: "Walnuts", grocery: ["Mackerel", "Kale", "Turmeric"] } } },
  "heart-healthy": { title: "Heart Healthy", days: { Monday: { breakfast: "Oatmeal", lunch: "Salmon salad", dinner: "Whole wheat pasta", snacks: "Orange", grocery: ["Salmon", "Oats", "Pasta"] } } },
  "weight-management": { title: "Weight Management", days: { Monday: { breakfast: "Egg whites", lunch: "Grilled chicken", dinner: "Baked cod", snacks: "Celery", grocery: ["Chicken", "Cod", "Celery"] } } }
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DietPlanDetails = () => {
  const { type } = useParams();
  const navigate = useNavigate(); // <--- Hook for navigation
  const [selectedDay, setSelectedDay] = useState("Monday");

  // Fallback Logic
  const planData = dietDatabase[type] || dietDatabase["diabetes-friendly"];
  const dailyPlan = planData.days[selectedDay] || planData.days["Monday"];

  // --- 1. HANDLE PDF DOWNLOAD ---
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/generate_diet_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NutriCare_${planData.title}_Plan.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Failed to download diet plan.");
      }
    } catch (error) {
      console.error("PDF Download Error:", error);
      alert("Backend error. Is the server running?");
    }
  };

  // --- 2. HANDLE GROCERY NAVIGATION ---
  const handleGoToGrocery = () => {
    navigate('/grocery');
  };

  return (
    <div className="plan-details-page">
      <div className="plan-header">
        <span className="ai-badge">✨ AI-Generated Plan</span>
        <h1>Your 7-Day Diet Plan</h1>
        <div className="customized-tag">Customized for: {planData.title}</div>
      </div>

      <div className="days-scroller">
        {daysOfWeek.map((day) => (
          <button 
            key={day} 
            className={`day-pill ${selectedDay === day ? 'active' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="plan-content-grid">
        {/* MEALS COLUMN */}
        <div className="meals-section">
          <h2>{selectedDay}'s Meals</h2>
          <div className="meal-card">
            <div className="meal-icon">☕</div><div><h3>Breakfast</h3><p>{dailyPlan.breakfast}</p></div>
          </div>
          <div className="meal-card">
            <div className="meal-icon">☀️</div><div><h3>Lunch</h3><p>{dailyPlan.lunch}</p></div>
          </div>
          <div className="meal-card">
            <div className="meal-icon">🌙</div><div><h3>Dinner</h3><p>{dailyPlan.dinner}</p></div>
          </div>
          <div className="meal-card">
            <div className="meal-icon">🍏</div><div><h3>Snacks</h3><p>{dailyPlan.snacks}</p></div>
          </div>
        </div>

        {/* GROCERY COLUMN */}
        <div className="grocery-section">
          <div className="grocery-card">
            <h3>🛒 Grocery List</h3>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>Items needed for {selectedDay}</p>
            <div className="grocery-chips">
              {dailyPlan.grocery.map((item, idx) => (
                <span key={idx} className="grocery-chip">{item}</span>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
              <button className="btn-view-all" onClick={handleGoToGrocery}>
                View All Products
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS - CLEANED UP */}
      <div className="plan-footer-actions">
        <button 
          className="btn-outline" 
          onClick={handleDownloadPDF}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ⬇ Download PDF
        </button>
        
        <button 
          className="btn-primary" 
          onClick={handleGoToGrocery}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          🛒 Shop Groceries
        </button>
      </div>
    </div>
  );
};

export default DietPlanDetails;