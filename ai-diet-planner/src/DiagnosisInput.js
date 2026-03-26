import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiBaseUrl } from './constants/apiconst.js'; 

// --- LIST OF COMMON SYMPTOMS ---
const commonSymptoms = [
  "Fever", "Headache", "Fatigue", "Cough", "Sore Throat", "Chest Pain",
  "Shortness of Breath", "Nausea", "Vomiting", "Diarrhea", "Abdominal Pain",
  "Back Pain", "Joint Pain", "Dizziness", "Rash", "Swelling",
  "Loss of Appetite", "Chills", "Night Sweats", "Muscle Aches"
];

const DiagnosisInput = () => {
  const [activeTab, setActiveTab] = useState('describe'); 
  const [symptoms, setSymptoms] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [notification, setNotification] = useState(null); 
  const navigate = useNavigate();

  // --- ICONS ---
  const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  );

  const StopIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <rect x="9" y="9" width="6" height="6" fill="currentColor"></rect>
    </svg>
  );

  const UploadIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      showToast(`✅ Selected: "${file.name}"`);
    }
  };

  // --- LOGIC 1: Replace entire text (For the Scenario Chips) ---
  const handleExampleClick = (text) => setSymptoms(text);

  // --- LOGIC 2: Append single symptom (For the Common Symptoms Grid) ---
  const handleAddSymptom = (symptomName) => {
    setSymptoms((prevText) => {
      const currentText = prevText.trim();
      if (currentText.length === 0) return symptomName;
      if (currentText.endsWith(',')) return `${currentText} ${symptomName}`;
      return `${currentText}, ${symptomName}`;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    let apiUrl = `${apiBaseUrl}/analyze`;
    let bodyData;
    let headers = { 'Content-Type': 'application/json' };

    if (activeTab === 'upload') {
      if (!selectedFile) {
        showToast("⚠️ Please select a file first!");
        setLoading(false);
        return;
      }
      apiUrl = `${apiBaseUrl}/analyze_file`;
      const formData = new FormData();
      formData.append('file', selectedFile);
      bodyData = formData;
      headers = {}; 
    } else {
      if (!symptoms.trim()) {
        showToast("⚠️ Please enter symptoms first!");
        setLoading(false);
        return;
      }
      bodyData = JSON.stringify({ text: symptoms });
    }

    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: headers, body: bodyData });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      localStorage.setItem('diagnosisResult', JSON.stringify(data));
      navigate('/results');
    } catch (error) {
      alert("Failed to connect to AI Backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  // Shared inline style for all clickable chips to keep code clean
  const chipStyle = {
    cursor: 'pointer', padding: '8px 16px', borderRadius: '50px', 
    background: '#f1f5f9', color: '#334155', fontSize: '0.9rem', 
    border: '1px solid #e2e8f0', transition: 'all 0.2s'
  };

  return (
    <div className="diagnosis-wrapper">
      <div className="diagnosis-page fade-in-up">
        {notification && (
          <div className="toast-container slide-down">
            <div className="toast-message glass-effect">
              {notification}
            </div>
          </div>
        )}

        <div className="diagnosis-header stagger-1">
          <div className="hero-badge pulse-glow" style={{ marginBottom: '15px' }}>Clinical AI Engine</div>
          <h1 className="hero-title">Health <span className="text-gradient">Analysis</span></h1>
          <p className="hero-subtitle">Describe your symptoms or upload medical reports for instant, AI-powered diagnostic insights.</p>
        </div>

        <div className="diagnosis-glass-card hover-3d stagger-2">
          
          <div className="segmented-tabs">
            <button className={`seg-tab ${activeTab === 'describe' ? 'active' : ''}`} onClick={() => setActiveTab('describe')}>
              <span>📝</span> Describe Symptoms
            </button>
            <button className={`seg-tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
              <span>📄</span> Upload Report
            </button>
          </div>

          <div className="tab-content-area">
            {activeTab === 'describe' ? (
              <div className="fade-in">
                <div className="input-header">
                  <label className="clinical-label">Symptom Description</label>
                  <button onClick={startListening} className={`voice-btn ${isListening ? 'listening pulse-glow' : ''}`} title="Click to speak">
                    {isListening ? <StopIcon /> : <MicIcon />}
                    <span>{isListening ? "Listening..." : "Voice Input"}</span>
                  </button>
                </div>
                
                <textarea 
                  className="clinical-textarea animated-resize"
                  placeholder="Click here to type... (e.g., I have been experiencing a mild headache for 3 days)"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                
                {/* --- AUTO-FILL SCENARIOS (Fixed hover bugs) --- */}
                <div className="quick-chips" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase' }}>
                      Auto-Fill Scenarios
                    </p>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  </div>
                  
                  <div className="chips-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <span 
                      className="medical-chip" 
                      onClick={() => handleExampleClick("severe chest pain and sweating")} 
                      style={chipStyle} 
                      onMouseOver={(e) => { e.target.style.background = '#fee2e2'; e.target.style.borderColor = '#fca5a5'; e.target.style.color = '#991b1b'; }} 
                      onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#334155'; }}
                    >
                      ❤️ Cardiac
                    </span>
                    <span 
                      className="medical-chip" 
                      onClick={() => handleExampleClick("high fever, headache, joint pain, muscle pain, rash, vomiting")} 
                      style={chipStyle} 
                      onMouseOver={(e) => { e.target.style.background = '#fef3c7'; e.target.style.borderColor = '#fcd34d'; }} 
                      onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0'; }}
                    >
                      🦟 Dengue
                    </span>
                    <span 
                      className="medical-chip" 
                      onClick={() => handleExampleClick("frequent urination, excessive thirst, fatigue, weight loss, blurred vision")} 
                      style={chipStyle} 
                      onMouseOver={(e) => { e.target.style.background = '#dbeafe'; e.target.style.borderColor = '#93c5fd'; }} 
                      onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0'; }}
                    >
                      🩸 Diabetes
                    </span>
                  </div>
                </div>

                {/* --- COMMON SYMPTOMS BUILDER --- */}
                <div className="quick-chips" style={{ marginTop: '25px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase' }}>
                      Add Individual Symptoms
                    </p>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  </div>
                  
                  <div className="chips-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {commonSymptoms.map((symptom, index) => (
                      <span 
                        key={index} 
                        className="medical-chip" 
                        onClick={() => handleAddSymptom(symptom)}
                        style={chipStyle}
                        onMouseOver={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#cbd5e1'; }}
                        onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0'; }}
                      >
                        + {symptom}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="upload-section fade-in">
                <input type="file" id="file-upload" accept=".pdf,image/*" onChange={handleFileChange} hidden />
                <label htmlFor="file-upload" className="clinical-upload-box">
                  <div className="upload-icon-wrapper float-animation"><UploadIcon /></div>
                  <h3>Drag & Drop or Click to Upload</h3>
                  <p>Supports PDF, JPG, PNG (Max 5MB)</p>
                  <span className="btn glass-btn upload-browse-btn">Browse Files</span>
                </label>

                {selectedFile && (
                  <div className="selected-file-badge bounce-in">
                    <div className="file-detail">
                      <span className="file-icon">📑</span>
                      <div>
                        <div className="file-name">{selectedFile.name}</div>
                        <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button className="remove-file-btn" onClick={() => setSelectedFile(null)}>✕</button>
                  </div>
                )}
              </div>
            )}

            <div className="analyze-action-wrapper">
              <button 
                className={`btn btn-primary btn-glow analyze-submit-btn ${loading ? 'loading-pulse' : ''}`} 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? "Processing via AI Engine..." : "Analyze Health Data →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisInput;