import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiBaseUrl } from './constants/apiconst.js'; 

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

  // --- VOICE OUTPUT LOGIC ---
  const speakResult = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let message = `You may have ${result.condition}. `;
    if (result.severity === 'mild') {
      message += "This condition is generally mild. You can take precautions and follow our recommended diet plan.";
    } else {
      message += "This condition requires attention. We recommend approaching a specialist immediately. You can download your medical report below.";
    }

    const utterance = new SpeechSynthesisUtterance(message);
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Samantha") || 
        v.name.includes("Female")
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.pitch = 1.1; 
      utterance.rate = 0.9; 
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { speakResult(); }, 1000);
    return () => clearTimeout(timer); 
  }, [result.condition, result.severity]); 

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
      const response = await fetch(`${apiBaseUrl}/generate_pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  useEffect(() => {
    localStorage.setItem('diagnosisResult', JSON.stringify(result));
  }, [result]);

  const isMild = result.severity === 'mild';

  return (
    <div className="diagnosis-wrapper">
      <div className="diagnosis-page fade-in-up">
        
        {/* DEMO CONTROL */}
        <div className="demo-control-panel stagger-1">
          <span>
            <span style={{color: '#00D4FF'}}>⚙️ System Override:</span> Current Mode: 
            <strong style={{color: isMild ? '#32D74B' : '#FF3B30', marginLeft: '8px'}}>
              {result.severity ? result.severity.toUpperCase() : "UNKNOWN"}
            </strong>
          </span>
          <button onClick={toggleSeverity} className="btn glass-btn btn-sm">
            Force {isMild ? 'Serious' : 'Mild'} UI
          </button>
        </div>

        {/* HEADER */}
        <div className="diagnosis-header stagger-1">
          <div className="hero-badge pulse-glow" style={{ marginBottom: '15px' }}>Analysis Complete</div>
          <h1 className="hero-title">Diagnostic <span className="text-gradient">Report</span></h1>
          <p className="hero-subtitle">Based on your provided data, here is the AI assessment.</p>
        </div>

        {/* --- 1. THE STATIC PARENT CONTAINER --- */}
        <div className="results-morphing-card stagger-1">
          
          {/* ✨ 2. THE EMPTY, MORPHING VISUAL BOX (Added this!) ✨ */}
          <div className="visual-box-morph stagger-2"></div>
          
          {/* --- 3. THE FIXED, STATIC CONTENT LAYER --- */}
          <div className="results-content-wrapper stagger-3">
            
            {/* RESULT HEADER */}
            <div className="result-header-block">
              <div className={`status-badge ${isMild ? 'badge-safe' : 'badge-danger'} pulse-glow`}>
                {isMild ? '✅ Low Risk Detected' : '⚠️ High Attention Required'}
              </div>
              
              <h2 className="condition-title">{result.condition}</h2>
              
              <div className="confidence-score">
                AI Confidence Matrix: <span className="score-highlight">{result.confidence}</span>
              </div>
            </div>

            {/* DYNAMIC CONTENT BLOCK */}
            <div className={`result-content-box ${isMild ? 'box-safe' : 'box-danger'} fade-in`}>
              <h3>
                {isMild ? 'Recommended Action: Lifestyle Management' : 'Recommended Action: Specialist Consultation'}
              </h3>
              <p className="result-description">
                {result.description} 
                <br/><br/>
                {isMild 
                  ? "Our AI suggests a personalized therapeutic diet plan can significantly improve this condition." 
                  : "Based on your location, we have identified top-rated specialists nearby to assist you immediately."}
              </p>
              
              <div className="action-buttons-grid">
                {isMild ? (
                  <>
                    <Link to="/diet-plans" style={{ textDecoration: 'none' }}>
                      <button className="btn btn-primary btn-glow" style={{ width: '100%' }}>View Personal Diet Plan →</button>
                    </Link>
                    <Link to="/grocery" style={{ textDecoration: 'none' }}>
                      <button className="btn glass-btn" style={{ width: '100%' }}>Order Recommended Groceries</button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/hospitals" style={{ textDecoration: 'none' }}>
                      <button className="btn btn-danger btn-glow" style={{ width: '100%' }}>Find Nearby Hospitals 🏥</button>
                    </Link>
                    <button className="btn glass-btn" style={{ width: '100%' }} onClick={handleDownload}>
                      Download Medical PDF 📄
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* RUN ANOTHER ANALYSIS */}
            <div className="rerun-analysis-link">
                <Link to="/diagnosis">
                    ← Run Another Analysis
                </Link>
            </div>

          </div> {/* End of results-content-wrapper */}
        </div> {/* End of results-morphing-card */}
      </div>
    </div>
  );
};

export default ResultsDashboard;