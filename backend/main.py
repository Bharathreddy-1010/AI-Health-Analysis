from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import io
from datetime import datetime
import json
import os
import pdfplumber
import pytesseract
from PIL import Image
import uuid 
import certifi
from groq import Groq
from pymongo import MongoClient
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-health-analysis-847z.vercel.app",  # Old Vercel URL
        "https://ai-health-analysis-1.onrender.com",   # Your own Render URL
        "https://ai-health-analysis-847z-fql22kbhx-bharath-bs-projects-63053a7d.vercel.app", # <--- NEW VERCEL URL
        "*"                                            # Final fallback
    ],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomInput(BaseModel):
    text: str

# GLOBAL VARIABLES
diseases_db = []

# ==========================================
# 1. LOAD DATABASE
# ==========================================
@app.on_event("startup")
def load_db():
    global diseases_db
    try:
        with open('diseases.json', 'r') as f:
            diseases_db = json.load(f)
        print(f"✅ Loaded {len(diseases_db)} diseases from diseases.json")
    except FileNotFoundError:
        print("❌ Error: diseases.json not found!")

# ==========================================
# 2. ANALYSIS ENGINE (Lab + Symptoms)
# ==========================================

# 🩸 LAB REPORT LOGIC (The New Brain)
# Maps specific medical keywords found in reports to diseases
LAB_REPORT_RULES = {
    "dengue": ["ns1", "dengue positive", "platelet count low", "platelets < 100000", "igg positive", "igm positive"],
    "malaria": ["plasmodium", "malaria detected", "parasite seen", "rings seen"],
    "typhoid": ["salmonella", "typhi", "widal positive", "typhoid positive"],
    "diabetes": ["glucose high", "sugar high", "hba1c > 6.5", "fasting > 126", "diabetes", "diabetic"],
    "jaundice": ["bilirubin high", "bilirubin > 1.2", "jaundice"],
    "anemia": ["hemoglobin low", "hb < 12", "anemic"],
    "urinary tract infection": ["pus cells", "bacteria present", "nitrite positive", "uti"],
    "heart attack": ["troponin positive", "ck-mb high", "ecg abnormal", "st elevation"],
    "thyroid": ["tsh high", "tsh > 5", "tsh low", "t3", "t4"],
    "pneumonia": ["consolidation", "infiltrates", "opacity", "pneumonia"]
}

def find_best_match(user_text):
    user_text = user_text.lower()
    print(f"🔍 Analyzing Text: {user_text[:200]}...") # Debug Print

    best_disease = None
    highest_score = 0
    matched_symptoms = []
    confidence = "0%"

    # --- LEVEL 1: LAB REPORT CHECK (Highest Priority) ---
    for disease_key, markers in LAB_REPORT_RULES.items():
        for marker in markers:
            if marker in user_text:
                print(f"🚨 LAB ALERT: Found '{marker}' -> Mapping to {disease_key}")
                
                # Find the exact disease name in our DB (Fuzzy Match)
                for d in diseases_db:
                    if disease_key.lower() in d['name'].lower():
                        return d, "100%", [f"Lab Result: {marker.upper()}"]
    
    # --- LEVEL 2: SYMPTOM MATCHING (Fallback) ---
    for disease in diseases_db:
        current_score = 0
        current_matches = []
        
        for symptom in disease['symptoms']:
            # Flexible Match: Check if words exist
            # e.g. "chest pain" matches "pain in chest"
            symptom_lower = symptom.lower()
            if symptom_lower in user_text:
                current_score += 3
                current_matches.append(symptom)
            else:
                # Word-by-word check
                words = symptom_lower.split()
                if len(words) > 1 and all(w in user_text for w in words):
                    current_score += 1
                    current_matches.append(symptom)

        if disease['name'].lower() in user_text:
            current_score += 10

        if current_score > highest_score:
            highest_score = current_score
            best_disease = disease
            matched_symptoms = current_matches
            
    # Calculate Confidence
    if highest_score > 0:
        if highest_score <= 2: confidence = "75%"
        elif highest_score <= 5: confidence = "90%"
        else: confidence = "99%"
        
    return best_disease, confidence, matched_symptoms

# ==========================================
# 3. ENDPOINTS
# ==========================================


# Initialize FastAPI App

# --- TEXT EXTRACTION HELPER ---
def extract_text_from_file(file: UploadFile):
    text = ""
    try:
        if file.content_type == "application/pdf":
            with pdfplumber.open(file.file) as pdf:
                for page in pdf.pages:
                    extract = page.extract_text()
                    if extract: text += extract + " "
                    
        elif "image" in file.content_type:
            # TESSERACT OCR logic
            # Ensure Tesseract is installed on your machine!
            image = Image.open(file.file)
            text = pytesseract.image_to_string(image)
            
    except Exception as e:
        print(f"❌ Error reading file: {e}")
    return text

@app.post("/analyze_file")
async def analyze_file(file: UploadFile = File(...)):
    # 1. Read File
    extracted_text = extract_text_from_file(file)
    
    # 2. Handle Empty Read (OCR Fail)
    if not extracted_text.strip():
        return {
            "condition": "File Read Failed",
            "severity": "mild",
            "confidence": "0%",
            "description": "Could not read text. If using an image, make sure Tesseract OCR is installed. If PDF, ensure it's text-based.",
            "diet_plan": "N/A"
        }

    # 3. Run Analysis
    disease_data, conf, symptoms = find_best_match(extracted_text)
    
    if not disease_data:
        return {
            "condition": "Unknown Condition",
            "severity": "mild",
            "confidence": "0%",
            "description": f"Analyzed report but found no specific diseases. Extracted Text Sample: '{extracted_text[:50]}...'",
            "diet_plan": "Balanced Diet"
        }

    return {
        "condition": disease_data['name'],
        "severity": disease_data['severity'],
        "confidence": conf,
        "description": disease_data['description'],
        "precautions": disease_data.get('precautions', []),
        "specialty": disease_data['specialty'],
        "diet_plan": disease_data['diet_plan']
    }

@app.post("/analyze")
async def analyze_symptoms(input_data: SymptomInput):
    disease_data, conf, symptoms = find_best_match(input_data.text)
    
    if not disease_data:
        return {
            "condition": "Unclear Symptoms",
            "severity": "mild",
            "confidence": "0%",
            "description": "Try specific symptoms like 'fever', 'rash', 'vomiting'.",
            "diet_plan": "Balanced Diet"
        }

    return {
        "condition": disease_data['name'],
        "severity": disease_data['severity'],
        "confidence": conf,
        "description": disease_data['description'],
        "precautions": disease_data.get('precautions', []),
        "specialty": disease_data['specialty'],
        "diet_plan": disease_data['diet_plan']
    }

# --- PDF GENERATOR (Keep existing) ---
@app.post("/generate_pdf")
async def generate_pdf(data: dict):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    c.setFillColor(colors.teal)
    c.rect(0, height - 100, width, 100, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 60, "NutriCare AI Health Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # Body
    c.setFillColor(colors.black)
    y = height - 150
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, f"Condition: {data.get('condition', 'Unknown')}")
    y -= 30
    
    sev = data.get('severity', 'mild').upper()
    c.setFillColor(colors.red if sev == "SERIOUS" else colors.green)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, f"Severity: {sev}")
    y -= 40

    c.setFillColor(colors.black)
    c.setFont("Helvetica", 12)
    
    def draw_line(title, text):
        nonlocal y
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, title)
        y -= 20
        c.setFont("Helvetica", 11)
        c.drawString(50, y, str(text)[:90]) 
        y -= 30

    draw_line("Description:", data.get('description', ''))
    
    precs = data.get('precautions', [])
    if isinstance(precs, list): precs = ", ".join(precs)
    draw_line("Precautions:", precs)
    
    draw_line("Specialist:", data.get('specialty', ''))
    draw_line("Diet:", data.get('diet_plan', ''))

    c.save()
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=report.pdf"})

# ==========================================
# 4. DIET PLAN PDF GENERATOR (Fixed Multi-Page)
# ==========================================
@app.post("/generate_diet_pdf")
async def generate_diet_pdf(data: dict):
    print("📄 PDF Generation Request Received")
    
    days_data = data.get('days', {})
    print(f"✅ Days found in data: {len(days_data)} (Should be 7)") # Debug print

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # --- TITLE PAGE ---
    c.setFillColor(colors.teal)
    c.rect(0, height - 120, width, 120, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(50, height - 60, "7-Day Personalized Diet Plan")
    
    c.setFont("Helvetica", 16)
    plan_title = data.get('title', 'Healthy Living')
    c.drawString(50, height - 90, f"Plan Type: {plan_title}")
    
    y = height - 150
    c.setFillColor(colors.black)
    
    # --- LOOP THROUGH DAYS ---
    day_counter = 0
    
    for day, info in days_data.items():
        day_counter += 1
        
        # CHECK SPACE: If we are near the bottom (y < 200), start a new page
        if y < 200:
            c.showPage() # Create new page
            y = height - 50 # Reset Y to top
            
            # Re-set font for new page
            c.setFillColor(colors.black)

        # Draw Day Header
        c.setFillColor(colors.teal)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, y, f"📅 {day}")
        y -= 25
        
        # Draw Meals
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 11)
        
        meals = [
            f"• Breakfast: {info.get('breakfast', '-')}",
            f"• Lunch: {info.get('lunch', '-')}",
            f"• Dinner: {info.get('dinner', '-')}",
            f"• Snacks: {info.get('snacks', '-')}"
        ]
        
        for meal in meals:
            # Simple text wrap logic
            if c.stringWidth(meal) > 500:
                c.drawString(70, y, meal[:90] + "...")
            else:
                c.drawString(70, y, meal)
            y -= 15
            
        y -= 5
        
        # Grocery List
        groceries = info.get('grocery', [])
        # Convert list to string safely
        if isinstance(groceries, list):
            g_text = "🛒 Grocery Needed: " + ", ".join(groceries)
        else:
            g_text = "🛒 Grocery Needed: " + str(groceries)

        c.setFillColor(colors.darkgrey)
        c.setFont("Helvetica-Oblique", 10)
        
        # Wrap grocery text
        if c.stringWidth(g_text) > 480:
            c.drawString(70, y, g_text[:95] + "-")
            y -= 12
            c.drawString(85, y, g_text[95:])
        else:
            c.drawString(70, y, g_text)
            
        y -= 40 # Add space before next day

    # Footer on the last page
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.grey)
    c.drawString(250, 30, "Generated by NutriCare AI")

    c.save()
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=diet_plan.pdf"})


# ==========================================
# 3. DATABASE CONNECTION (MongoDB)
# ==========================================
MONGO_URI = os.getenv("MONGO_URI")

try:
    if not MONGO_URI:
        print("⚠️ WARNING: MONGO_URI not found in .env file!")
    else:
        # Connect to MongoDB with SSL fix
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client["nutricare_db"]
        users_collection = db["users"]
        print("✅ Successfully connected to MongoDB Cloud!")
except Exception as e:
    print(f"⚠️ Database Connection Error: {e}")


# ==========================================
# 4. AI CHATBOT (Groq / Llama 3)
# ==========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq Client
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in .env file!")
    groq_client = None
else:
    groq_client = Groq(api_key=GROQ_API_KEY)

def get_ai_response(user_text):
    if not groq_client:
        return "System Error: AI Key missing."

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {
                    "role": "system", 
                    "content": "You are NutriCare AI. Answer in plain text only. Do not use markdown, bolding, or special characters."
                },
                {
                    "role": "user", 
                    "content": user_text
                }
            ],
            temperature=0.7,
            max_tokens=200,
        )
        
        raw_reply = completion.choices[0].message.content
        # Cleanup: Remove bolding symbols
        return raw_reply.replace("**", "").replace("*", "")

    except Exception as e:
        print(f"⚠️ Groq Error: {e}")
        return "I am currently offline. Please check your internet connection."

# ==========================================
# 5. API ENDPOINTS
# ==========================================

# --- A. Chat Endpoint ---
class ChatRequest(BaseModel):
    message: str

from fastapi import Response

@app.options("/chat")
async def chat_options(response: Response):
    # Manually tell the browser "It's okay to talk to me"
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return {}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"📩 Received Message: {request.message}") 
    bot_reply = get_ai_response(request.message)
    print(f"🤖 AI Reply: {bot_reply}") 
    return {"reply": bot_reply}


# --- B. Authentication Endpoints ---
class UserAuth(BaseModel):
    email: str
    password: str
    custom_id: str

@app.post("/signup")
async def signup(user: UserAuth):
    print(f"📝 Signup Attempt: {user.email}")
    
    # Check existing user
    if users_collection.find_one({"email": user.email}):
        return {"status": "error", "message": "Email already registered!"}
    
    clean_id = user.custom_id.strip().upper()
    if users_collection.find_one({"id": clean_id}):
        return {"status": "error", "message": f"ID '{clean_id}' is already taken."}
    
    # Create User
    new_user = {
        "id": clean_id,
        "email": user.email,
        "password": user.password 
    }
    users_collection.insert_one(new_user)
    print(f"✅ User Created: {clean_id}")
    
    return {"status": "success", "message": "Account created successfully!"}

@app.post("/login")
async def login(user: UserAuth):
    print(f"🔑 Login Attempt: {user.email}")
    
    found_user = users_collection.find_one({
        "email": user.email, 
        "password": user.password
    })
    
    if found_user:
        print(f"✅ Login Success: {found_user['id']}")
        return {
            "status": "success", 
            "message": "Login successful", 
            "user_id": found_user['id'],
            "email": found_user['email']
        }
            
    print("❌ Login Failed")
    return {"status": "error", "message": "Invalid email or password"} 