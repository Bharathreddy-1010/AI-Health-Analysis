import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  );

  const StopIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <rect x="9" y="9" width="6" height="6" fill="currentColor"></rect>
    </svg>
  );

  const UploadIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4FBFA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );

  // --- HELPER: SHOW TOAST ---
  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- VOICE LOGIC ---
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

  // --- FILE LOGIC ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      showToast(`✅ You have chosen "${file.name}"`);
    }
  };

  const handleExampleClick = (text) => setSymptoms(text);

  const handleSubmit = async () => {
    setLoading(true);
    
    // 👇 UPDATED: Point to your Render Backend
    let apiUrl = 'http://127.0.0.1:8000/analyze';
    
    let bodyData;
    let headers = { 'Content-Type': 'application/json' };

    if (activeTab === 'upload') {
      if (!selectedFile) {
        showToast("⚠️ Please select a file first!");
        setLoading(false);
        return;
      }
      // 👇 UPDATED: Point to your Render Backend
      apiUrl = 'http://127.0.0.1:8000/analyze_file';
      
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
      // Updated error message
      alert("Failed to connect to AI Backend. Is the Render server running?");
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="diagnosis-page">
      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="toast-container">
          <div className="toast-message">
            {notification}
          </div>
        </div>
      )}

      <div className="diagnosis-header">
        <h1>AI Health Analysis</h1>
        <p>Describe your symptoms or upload medical reports for AI-powered health insights.</p>
      </div>

      <div className="diagnosis-card">
        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'describe' ? 'active' : ''}`} onClick={() => setActiveTab('describe')}>📄 Describe Symptoms</button>
          <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>⬆️ Upload Report</button>
        </div>

        <div className="tab-content">
          {activeTab === 'describe' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Describe your symptoms</label>
                <button onClick={startListening} className={`voice-btn ${isListening ? 'listening' : ''}`} title="Click to speak">
                  {isListening ? <StopIcon /> : <MicIcon />}
                  <span>{isListening ? "Listening..." : "Voice Input"}</span>
                </button>
              </div>
              <textarea 
                className="symptom-textarea"
                placeholder="Type here or use Voice Input..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              
              <div className="example-chips-container">
                <p>Try an example:</p>
                <div className="chips-wrapper">
                  <span className="chip" onClick={() => handleExampleClick("severe chest pain and sweating")}>❤️ Cardiac</span>
                  <span className="chip" onClick={() => handleExampleClick("high fever and joint pain")}>🦟 Dengue</span>
                  {/* --- RESTORED DIABETES BUTTON --- */}
                  <span className="chip" onClick={() => handleExampleClick("I feel very thirsty and have blurred vision")}>🩸 Diabetes</span>
                </div>
              </div>
            </>
          ) : (
            // --- PROFESSIONAL UPLOAD UI ---
            <div className="upload-container">
              <input 
                type="file" 
                id="file-upload" 
                accept=".pdf,image/*" 
                onChange={handleFileChange}
                hidden 
              />
              <label htmlFor="file-upload" className="upload-box">
                <div className="icon-bg"><UploadIcon /></div>
                <h3>Click to Upload Report</h3>
                <p>Supported formats: PDF, JPG, PNG</p>
                <span className="btn-fake">Browse Files</span>
              </label>

              {selectedFile && (
                <div className="file-selected-box">
                  <span className="file-icon">📄</span>
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className="file-remove" onClick={() => setSelectedFile(null)}>✕</button>
                </div>
              )}
            </div>
          )}

          <button className="analyze-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Symptoms →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisInput;