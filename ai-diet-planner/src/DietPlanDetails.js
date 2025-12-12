 import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- FULL 7-DAY MOCK DATA (Do not abbreviate!) ---
const dietDatabase = {
  "diabetes-friendly": {
    title: "Diabetes-Friendly",
    days: {
      Monday: {
        breakfast: "Greek yogurt with berries and chia seeds",
        lunch: "Grilled chicken salad with quinoa",
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
      Wednesday: {
        breakfast: "Scrambled eggs with spinach",
        lunch: "Turkey wrap with whole wheat tortilla",
        dinner: "Zucchini noodles with turkey meatballs",
        snacks: "Pear and string cheese",
        grocery: ["Eggs", "Spinach", "Turkey slices", "Zucchini", "Pear"]
      },
      Thursday: {
        breakfast: "Smoothie bowl with protein powder",
        lunch: "Chickpea salad with cucumber and feta",
        dinner: "Grilled shrimp skewers with brown rice",
        snacks: "Hard-boiled egg",
        grocery: ["Shrimp", "Chickpeas", "Cucumber", "Feta", "Protein powder"]
      },
      Friday: {
        breakfast: "Avocado toast on rye bread",
        lunch: "Tuna salad lettuce wraps",
        dinner: "Stuffed bell peppers with ground turkey",
        snacks: "Handful of mixed nuts",
        grocery: ["Avocado", "Rye bread", "Tuna", "Bell peppers", "Ground turkey"]
      },
      Saturday: {
        breakfast: "Cottage cheese with peaches",
        lunch: "Vegetable stir-fry with tofu",
        dinner: "Roasted chicken with sweet potatoes",
        snacks: "Celery with peanut butter",
        grocery: ["Cottage cheese", "Tofu", "Chicken", "Sweet potatoes", "Celery"]
      },
      Sunday: {
        breakfast: "Whole grain pancakes with sugar-free syrup",
        lunch: "Grilled fish tacos with slaw",
        dinner: "Eggplant parmesan (baked)",
        snacks: "Greek yogurt cup",
        grocery: ["Whole grain flour", "White fish", "Cabbage", "Eggplant", "Marinara"]
      }
    }
  },
  "anti-inflammatory": {
    title: "Anti-Inflammatory",
    days: {
      Monday: {
        breakfast: "Turmeric oatmeal with flaxseeds",
        lunch: "Spinach and kale salad with avocado",
        dinner: "Baked mackerel with turmeric rice",
        snacks: "Blueberries and walnuts",
        grocery: ["Mackerel", "Kale", "Turmeric", "Blueberries", "Walnuts"]
      },
      Tuesday: {
        breakfast: "Green smoothie with ginger",
        lunch: "Quinoa bowl with roasted chickpeas",
        dinner: "Salmon with steamed broccoli",
        snacks: "Dark chocolate square",
        grocery: ["Ginger", "Chickpeas", "Salmon", "Broccoli", "Dark Chocolate"]
      },
      Wednesday: {
        breakfast: "Chia seed pudding with almond milk",
        lunch: "Lentil and vegetable stew",
        dinner: "Cod with sautéed greens",
        snacks: "Orange slices",
        grocery: ["Chia seeds", "Almond milk", "Lentils", "Cod", "Oranges"]
      },
      Thursday: {
        breakfast: "Berry smoothie bowl",
        lunch: "Avocado and tomato salad",
        dinner: "Grilled chicken with turmeric",
        snacks: "Green tea and almonds",
        grocery: ["Berries", "Avocado", "Tomatoes", "Chicken", "Green tea"]
      },
      Friday: {
        breakfast: "Oatmeal with berries",
        lunch: "Grilled vegetable wrap",
        dinner: "Baked trout with asparagus",
        snacks: "Apple slices",
        grocery: ["Oats", "Mixed veggies", "Trout", "Asparagus", "Apples"]
      },
      Saturday: {
        breakfast: "Scrambled tofu with spinach",
        lunch: "Quinoa salad with nuts",
        dinner: "Roasted turkey with sweet potato",
        snacks: "Pear",
        grocery: ["Tofu", "Spinach", "Quinoa", "Turkey", "Sweet potato"]
      },
      Sunday: {
        breakfast: "Greek yogurt with honey",
        lunch: "Salmon salad",
        dinner: "Stir-fried veggies with brown rice",
        snacks: "Walnuts",
        grocery: ["Yogurt", "Honey", "Salmon", "Veggies", "Brown rice"]
      }
    }
  },
  "heart-healthy": {
    title: "Heart Healthy",
    days: {
      Monday: {
        breakfast: "Oatmeal with sliced almonds",
        lunch: "Grilled salmon salad",
        dinner: "Whole wheat pasta with marinara",
        snacks: "Orange",
        grocery: ["Oats", "Almonds", "Salmon", "Whole wheat pasta", "Oranges"]
      },
      Tuesday: {
        breakfast: "Bran flakes with skim milk",
        lunch: "Turkey sandwich on whole wheat",
        dinner: "Baked chicken breast with green beans",
        snacks: "Pear",
        grocery: ["Bran flakes", "Skim milk", "Turkey", "Chicken breast", "Green beans"]
      },
      Wednesday: {
        breakfast: "Yogurt with berries",
        lunch: "Bean soup with side salad",
        dinner: "Grilled fish with quinoa",
        snacks: "Apple",
        grocery: ["Yogurt", "Berries", "Beans", "Fish", "Quinoa"]
      },
      Thursday: {
        breakfast: "Whole grain toast with avocado",
        lunch: "Chicken caesar salad (light dressing)",
        dinner: "Stir-fried tofu with veggies",
        snacks: "Carrots",
        grocery: ["Whole grain bread", "Avocado", "Chicken", "Tofu", "Carrots"]
      },
      Friday: {
        breakfast: "Smoothie with spinach and fruit",
        lunch: "Lentil salad",
        dinner: "Roasted turkey with sweet potato",
        snacks: "Banana",
        grocery: ["Spinach", "Fruit", "Lentils", "Turkey", "Sweet potato"]
      },
      Saturday: {
        breakfast: "Scrambled egg whites with peppers",
        lunch: "Tuna salad",
        dinner: "Whole wheat pizza with veggies",
        snacks: "Grapes",
        grocery: ["Egg whites", "Peppers", "Tuna", "Whole wheat dough", "Grapes"]
      },
      Sunday: {
        breakfast: "Oatmeal with walnuts",
        lunch: "Grilled veggie wrap",
        dinner: "Baked salmon with asparagus",
        snacks: "Almonds",
        grocery: ["Oats", "Walnuts", "Veggies", "Salmon", "Asparagus"]
      }
    }
  },
  "weight-management": {
    title: "Weight Management",
    days: {
      Monday: {
        breakfast: "Egg white omelet with spinach",
        lunch: "Grilled chicken breast with mixed greens",
        dinner: "Baked cod with steamed broccoli",
        snacks: "Celery sticks",
        grocery: ["Egg whites", "Spinach", "Chicken breast", "Cod", "Broccoli"]
      },
      Tuesday: {
        breakfast: "Greek yogurt with flaxseeds",
        lunch: "Turkey lettuce wraps",
        dinner: "Zucchini noodles with marinara",
        snacks: "Apple slices",
        grocery: ["Greek yogurt", "Flaxseeds", "Turkey", "Zucchini", "Apples"]
      },
      Wednesday: {
        breakfast: "Smoothie with protein powder",
        lunch: "Quinoa salad with cucumber",
        dinner: "Grilled shrimp with asparagus",
        snacks: "Almonds",
        grocery: ["Protein powder", "Quinoa", "Cucumber", "Shrimp", "Asparagus"]
      },
      Thursday: {
        breakfast: "Oatmeal with water and cinnamon",
        lunch: "Lentil soup",
        dinner: "Baked chicken with roasted carrots",
        snacks: "Pear",
        grocery: ["Oats", "Lentils", "Chicken", "Carrots", "Pear"]
      },
      Friday: {
        breakfast: "Boiled eggs",
        lunch: "Tuna salad with light mayo",
        dinner: "Stir-fried tofu with mixed veggies",
        snacks: "Berries",
        grocery: ["Eggs", "Tuna", "Tofu", "Mixed veggies", "Berries"]
      },
      Saturday: {
        breakfast: "Cottage cheese with pineapple",
        lunch: "Grilled veggie salad",
        dinner: "Turkey chili",
        snacks: "Carrot sticks",
        grocery: ["Cottage cheese", "Pineapple", "Veggies", "Turkey", "Carrots"]
      },
      Sunday: {
        breakfast: "Scrambled egg whites",
        lunch: "Chicken and veggie skewers",
        dinner: "Baked salmon with green beans",
        snacks: "Orange",
        grocery: ["Egg whites", "Chicken", "Salmon", "Green beans", "Orange"]
      }
    }
  }
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DietPlanDetails = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("Monday");

  // Fallback Logic
  const planData = dietDatabase[type] || dietDatabase["diabetes-friendly"];
  const dailyPlan = planData.days[selectedDay] || planData.days["Monday"];

  // --- 1. HANDLE PDF DOWNLOAD ---
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('https://ai-health-analysis-1.onrender.com/generate_diet_pdf', {
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
          ⬇ Download Full 7-Day Plan PDF
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