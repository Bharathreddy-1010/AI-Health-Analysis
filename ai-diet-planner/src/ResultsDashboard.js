import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ResultsDashboard = () => {
  // 1. Load the REAL AI Result from LocalStorage
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('diagnosisResult');
    if (saved) {
      return JSON.parse(saved);
    } else {
      return {
        condition: "No Data Found",
        confidence: "0%",
        severity: "mild",
        description: "Please go back and run the analysis first."
      };
    }
  });

  // --- VOICE OUTPUT LOGIC (Improved) ---
  const speakResult = () => {
    if (!('speechSynthesis' in window)) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Prepare text
    let message = `You may have ${result.condition}. `;
    if (result.severity === 'mild') {
      message += "This condition is generally mild. You can take precautions and follow our recommended diet plan.";
    } else {
      message += "This condition requires attention. We recommend approaching a specialist immediately. You can download your medical report below.";
    }

    const utterance = new SpeechSynthesisUtterance(message);
    
    // --- FIX: SELECT A BETTER VOICE ---
    // Wait for voices to load, then pick a "Natural" or "Google" voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a female/natural voice (Google US English is usually best on Chrome)
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Samantha") || 
        v.name.includes("Female")
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Tweak pitch/rate to sound less "ghostly"
      utterance.pitch = 1.1; 
      utterance.rate = 0.9;  // Slightly slower is more natural
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  };

  // --- AUTO-SPEAK ON LOAD ---
  useEffect(() => {
    // Wait 1 second before speaking so the user sees the page first
    const timer = setTimeout(() => {
      speakResult();
    }, 1000);
    
    return () => clearTimeout(timer); // Cleanup
  }, []);

  // --- TOGGLE DEMO ---
  const toggleSeverity = () => {
    setResult(prev => ({
      ...prev,
      severity: prev.severity === 'mild' ? 'serious' : 'mild',
    }));
  };

  // --- PDF DOWNLOAD ---
  const handleDownload = async () => {
    try {
      const response = await fetch('https://ai-health-analysis.onrender.com/generate_pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NutriCare_Report_${result.condition.replace(/ /g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Failed to generate PDF. Is the backend running?");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Error connecting to server for PDF download.");
    }
  };

  // Save changes
  useEffect(() => {
    localStorage.setItem('diagnosisResult', JSON.stringify(result));
  }, [result]);

  return (
    <div className="diagnosis-page">
      
      {/* DEMO CONTROL */}
      <div style={{ 
        background: '#2d3748', color: 'white', padding: '15px', borderRadius: '10px', 
        marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>🕵️‍♂️ <strong>Demo Control:</strong> Current Mode: {result.severity ? result.severity.toUpperCase() : "UNKNOWN"}</span>
        <button 
          onClick={toggleSeverity}
          style={{ 
            background: 'white', color: '#2d3748', border: 'none', padding: '8px 16px', 
            borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' 
          }}
        >
          Force {result.severity === 'mild' ? 'Serious' : 'Mild'} UI
        </button>
      </div>

      <div className="diagnosis-header">
        <h1>AI Analysis Results</h1>
        <p>Based on the symptoms provided, here is the AI assessment.</p>
      </div>

      <div className="diagnosis-card" style={{ padding: '3rem' }}>
        
        {/* RESULT HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            display: 'inline-block', padding: '8px 20px', borderRadius: '50px', 
            background: result.severity === 'mild' ? '#e6fffa' : '#fff5f5',
            color: result.severity === 'mild' ? '#319795' : '#e53e3e',
            fontWeight: 'bold', marginBottom: '1rem'
          }}>
            {result.severity === 'mild' ? '✅ Low Risk' : '⚠️ High Attention Required'}
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>
            {result.condition}
          </h2>
          <p style={{ color: '#718096' }}>AI Confidence Score: <strong>{result.confidence}</strong></p>
        </div>

        {/* DYNAMIC CONTENT BLOCK */}
        {result.severity === 'mild' ? (
          // --- MILD CASE UI ---
          <div style={{ background: '#f0fff4', padding: '2rem', borderRadius: '16px', border: '1px solid #c6f6d5' }}>
            <h3 style={{ color: '#2f855a' }}>Recommended Action: Lifestyle Management</h3>
            <p style={{ marginBottom: '2rem', color: '#2c7a7b' }}>
              {result.description} Our AI suggests a personalized diet plan can significantly improve this condition without medication.
            </p>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <Link to="/diet-plans" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%' }}>
                  View Personal Diet Plan →
                </button>
              </Link>
              <Link to="/grocery" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }}>
                  Order Recommended Groceries
                </button>
              </Link>
            </div>
          </div>
        ) : (
          // --- SERIOUS CASE UI ---
          <div style={{ background: '#fff5f5', padding: '2rem', borderRadius: '16px', border: '1px solid #fed7d7' }}>
            <h3 style={{ color: '#c53030' }}>Recommended Action: Specialist Consultation</h3>
            <p style={{ marginBottom: '2rem', color: '#9b2c2c' }}>
              {result.description} Based on your location, we have identified top-rated specialists nearby.
            </p>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <Link to="/hospitals" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="btn" style={{ 
                  width: '100%', backgroundColor: '#e53e3e', color: 'white' 
                }}>
                  Find Nearby Hospitals 🏥
                </button>
              </Link>
              
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={handleDownload}
              >
                Download Medical Report PDF 📄
              </button>
            </div>
          </div>
        )}

        {/* --- RESTORED: RUN ANOTHER ANALYSIS BUTTON --- */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <Link to="/diagnosis" style={{ color: '#718096', textDecoration: 'none', fontWeight: '600' }}>
                ← Run Another Analysis
            </Link>
        </div>

      </div>
    </div>
  );
};

export default ResultsDashboard;