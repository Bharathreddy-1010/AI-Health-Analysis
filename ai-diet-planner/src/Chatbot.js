import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css'; // Make sure you create this file for styling

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! 👋 I'm NutriCare AI. How can I help you today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of the chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    
    // Cache the input value before clearing it
    const messageToSend = input;
    setInput(""); 
    setIsTyping(true);

    try {
      // 2. Call Backend
      // NOTE: Use the Render URL here when deployed, e.g., 'https://your-render-url.onrender.com/chat'
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });
      
      // Check if the response was successful (200 OK)
      if (!response.ok) {
        console.error("Backend responded with non-200 status:", response.status);
        throw new Error(`Server returned status: ${response.status}`);
      }

      // Read the successful JSON response
      const data = await response.json();

      // 3. Add Bot Response
      // Use data.reply because the backend sends {"reply": "..."}
      const botResponseText = data.reply || "I received an empty reply from the AI model."; 

      setTimeout(() => {
        setMessages(prev => [...prev, { text: botResponseText, sender: "bot" }]);
        setIsTyping(false);
      }, 600); // Small fake delay for realism

    } catch (error) {
      console.error("Fetch/Processing Error:", error);
      // Display a clear error message in the chat
      setMessages(prev => [...prev, { text: `⚠️ Connection failed: ${error.message || 'Check terminal.'}`, sender: "bot" }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <span className="bot-avatar">🤖</span>
              <div>
                <h3>NutriCare Assistant</h3>
                <span className="online-status">● Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="bubble">{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="message bot"><div className="bubble typing">...</div></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask about diet or symptoms..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}

      {/* FLOATING TOGGLE BUTTON */}
      <button 
        className={`chat-toggle ${isOpen ? 'hidden' : ''}`} 
        onClick={() => setIsOpen(true)}
      >
        💬
      </button>
    </div>
  );
};

export default Chatbot;   