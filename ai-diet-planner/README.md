# 🏥 NutriCare AI - Your Personal Health & Diet Assistant


> **Hackathon Project:** Bridging the gap between medical diagnosis and lifestyle management through AI.

## 💡 The Problem
In the current healthcare ecosystem, patients often get a diagnosis but lack immediate, actionable guidance on lifestyle changes. There is a disconnect between **"You have Diabetes"** and **"Here is exactly what you should eat and buy today."**

## 🚀 The Solution
**NutriCare AI** is a full-stack health platform that acts as an intelligent bridge. It analyzes symptoms or medical reports, predicts potential conditions, and immediately branches into two actionable paths:
1.  **Serious Conditions:** Directs users to nearby specialists and generates emergency reports.
2.  **Mild Conditions:** Generates a personalized 7-day diet plan and creates a custom grocery shopping list.

---

## ✨ Key Features

### 🧠 1. AI Symptom Analysis (Expert System)
* **Natural Language Processing:** Users can describe symptoms in plain English (e.g., *"I have a splitting headache and feel nauseous"*).
* **Voice Input:** Integrated Speech-to-Text for accessibility.
* **Multi-Modal Input:** Analyzes both text and uploaded medical reports (PDF/Images).
* **Smart Detection:** Uses a proprietary Knowledge Graph of **40+ diseases** to provide accurate, rule-based predictions with 100% consistency.

### 🥗 2. Dynamic Diet & Grocery Engine
* **Personalized Plans:** Generates specific meal plans (Breakfast, Lunch, Dinner) based on the diagnosis (e.g., *Low Sodium for Hypertension*).
* **Smart Grocery Store:** Automatically filters e-commerce products based on the user's health condition (e.g., *Hides high-sugar items for Diabetics*).
* **One-Click Checkout:** Seamless integration from diet plan to cart.

### 🏥 3. Hospital Locator & Emergency Mode
* **Severity Detection:** Automatically flags critical symptoms (like Chest Pain) and overrides the diet logic to force a "Hospital Search."
* **Real-Time Navigation:** Connects to Google Maps for directions and Phone Dialer for immediate calls.

### 📄 4. Professional Medical Reports
* **PDF Generation:** Instantly generates a downloadable, professional-grade medical report summarizing the analysis, precautions, and recommended specialist.

---

## 🛠️ Tech Stack

### **Frontend**
* **React.js:** Component-based UI architecture.
* **CSS3:** Custom responsive styling (Glassmorphism & Clean UI).
* **Web Speech API:** Native browser voice recognition.

### **Backend**
* **Python (FastAPI):** High-performance API server.
* **ReportLab:** Programmatic PDF generation.
* **Pandas/JSON:** Data handling for the Disease Knowledge Graph.
* **PyTesseract / PDFPlumber:** OCR and text extraction from reports.

---

## 📸 Screenshots

| Landing Page | AI Diagnosis |
|:---:|:---:|
| ![Landing](https://via.placeholder.com/400x200?text=Landing+Page) | ![Diagnosis](https://via.placeholder.com/400x200?text=Diagnosis+Page) |

| Smart Results | Diet & Grocery |
|:---:|:---:|
| ![Results](https://via.placeholder.com/400x200?text=Results+Dashboard) | ![Grocery](https://via.placeholder.com/400x200?text=Grocery+Shop) |

---

## ⚙️ How to Run Locally

### Prerequisites
* Node.js & npm
* Python 3.8+

### 1. Backend Setup (The Brain)
```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pydantic reportlab pdfplumber pytesseract pillow

# Run the server
uvicorn main:app --reload