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
import certifi
from groq import Groq
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import List

# ✅ ML Engine Import
from ml_engine import predict_from_text, predict_from_checklist, get_all_symptoms

load_dotenv()
app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PYDANTIC MODELS
# ==========================================
class SymptomInput(BaseModel):
    text: str

class ChecklistInput(BaseModel):
    symptoms: List[str]

class ChatRequest(BaseModel):
    message: str

class UserAuth(BaseModel):
    email: str
    password: str
    custom_id: str

# ==========================================
# 1. LAB REPORT RULES (for file analysis only)
# ==========================================
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

# ==========================================
# 2. FILE TEXT EXTRACTOR
# ==========================================
def extract_text_from_file(file: UploadFile):
    text = ""
    try:
        if file.content_type == "application/pdf":
            with pdfplumber.open(file.file) as pdf:
                for page in pdf.pages:
                    extract = page.extract_text()
                    if extract:
                        text += extract + " "
        elif "image" in file.content_type:
            image = Image.open(file.file)
            text = pytesseract.image_to_string(image)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
    return text

# ==========================================
# 3. ENDPOINTS
# ==========================================

# --- A. GET ALL SYMPTOMS (for frontend checklist) ---
@app.get("/symptoms")
async def get_symptoms():
    return {"symptoms": get_all_symptoms()}

# --- B. PREDICT FROM TEXT (replaces old /analyze) ---
@app.post("/analyze")
async def analyze_symptoms(input_data: SymptomInput):
    """
    Main symptom analysis endpoint.
    Now powered by ML model instead of JSON rules.
    Accepts simple text like 'fever and headache'
    """
    print(f"🧠 ML Predicting for: {input_data.text}")
    result = predict_from_text(input_data.text)

    if result["condition"] == "No Symptoms Detected":
        return {
            "condition": "Unclear Symptoms",
            "severity": "mild",
            "confidence": "0%",
            "description": "Try specific symptoms like 'fever', 'headache', 'cough', 'vomiting'.",
            "precautions": [],
            "specialty": "General Physician",
            "diet_plan": "Balanced Diet"
        }

    return {
        "condition": result["condition"],
        "severity": "mild",  # you can add severity logic later
        "confidence": result["confidence"],
        "description": result["description"],
        "precautions": result["precautions"],
        "specialty": result["specialist"],
        "diet_plan": result["diet_plan"],
        "matched_symptoms": result.get("matched_symptoms", [])
    }

# --- C. PREDICT FROM TEXT (new dedicated ML endpoint) ---
@app.post("/ml/predict_text")
async def ml_predict_text(input_data: SymptomInput):
    """
    ML prediction from free text input.
    e.g. { "text": "I have fever and headache" }
    """
    print(f"🧠 ML Text Predict: {input_data.text}")
    result = predict_from_text(input_data.text)
    return result

# --- D. PREDICT FROM CHECKLIST ---
@app.post("/ml/predict_checklist")
async def ml_predict_checklist(input_data: ChecklistInput):
    """
    ML prediction from checklist selection.
    e.g. { "symptoms": ["Fever", "Headache", "Nausea"] }
    """
    print(f"🧠 ML Checklist Predict: {input_data.symptoms}")
    result = predict_from_checklist(input_data.symptoms)
    return result

# --- E. ANALYZE FILE (Lab Reports) ---
@app.post("/analyze_file")
async def analyze_file(file: UploadFile = File(...)):
    extracted_text = extract_text_from_file(file)

    if not extracted_text.strip():
        return {
            "condition": "File Read Failed",
            "severity": "mild",
            "confidence": "0%",
            "description": "Could not read text. If using an image, make sure Tesseract OCR is installed.",
            "diet_plan": "N/A"
        }

    # For lab reports → use rule-based check first
    text_lower = extracted_text.lower()
    for disease_key, markers in LAB_REPORT_RULES.items():
        for marker in markers:
            if marker in text_lower:
                print(f"🚨 LAB ALERT: Found '{marker}' -> {disease_key}")
                # Also run through ML for full details
                ml_result = predict_from_text(disease_key)
                return {
                    "condition": ml_result["condition"],
                    "severity": "serious",
                    "confidence": "100%",
                    "description": ml_result["description"],
                    "precautions": ml_result["precautions"],
                    "specialty": ml_result["specialist"],
                    "diet_plan": ml_result["diet_plan"]
                }

    # No lab marker found → run ML on extracted text
    ml_result = predict_from_text(extracted_text)
    return {
        "condition": ml_result["condition"],
        "severity": "mild",
        "confidence": ml_result["confidence"],
        "description": ml_result["description"],
        "precautions": ml_result["precautions"],
        "specialty": ml_result["specialist"],
        "diet_plan": ml_result["diet_plan"]
    }

# --- F. HEALTH REPORT PDF ---
@app.post("/generate_pdf")
async def generate_pdf(data: dict):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    c.setFillColor(colors.teal)
    c.rect(0, height - 100, width, 100, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 60, "NutriCare AI Health Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

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
    draw_line("Specialist:", data.get('specialty', data.get('specialist', '')))
    draw_line("Diet:", data.get('diet_plan', ''))

    c.save()
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"}
    )

# --- G. DIET PLAN PDF ---
@app.post("/generate_diet_pdf")
async def generate_diet_pdf(data: dict):
    print("📄 PDF Generation Request Received")
    days_data = data.get('days', {})

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    c.setFillColor(colors.teal)
    c.rect(0, height - 120, width, 120, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(50, height - 60, "7-Day Personalized Diet Plan")
    c.setFont("Helvetica", 16)
    c.drawString(50, height - 90, f"Plan Type: {data.get('title', 'Healthy Living')}")

    y = height - 150
    c.setFillColor(colors.black)

    for day, info in days_data.items():
        if y < 200:
            c.showPage()
            y = height - 50
            c.setFillColor(colors.black)

        c.setFillColor(colors.teal)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, y, f"📅 {day}")
        y -= 25

        c.setFillColor(colors.black)
        c.setFont("Helvetica", 11)

        meals = [
            f"• Breakfast: {info.get('breakfast', '-')}",
            f"• Lunch: {info.get('lunch', '-')}",
            f"• Dinner: {info.get('dinner', '-')}",
            f"• Snacks: {info.get('snacks', '-')}"
        ]

        for meal in meals:
            if c.stringWidth(meal) > 500:
                c.drawString(70, y, meal[:90] + "...")
            else:
                c.drawString(70, y, meal)
            y -= 15

        y -= 5
        groceries = info.get('grocery', [])
        g_text = "🛒 Grocery Needed: " + (", ".join(groceries) if isinstance(groceries, list) else str(groceries))

        c.setFillColor(colors.darkgrey)
        c.setFont("Helvetica-Oblique", 10)

        if c.stringWidth(g_text) > 480:
            c.drawString(70, y, g_text[:95] + "-")
            y -= 12
            c.drawString(85, y, g_text[95:])
        else:
            c.drawString(70, y, g_text)

        y -= 40

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.grey)
    c.drawString(250, 30, "Generated by NutriCare AI")
    c.save()
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=diet_plan.pdf"}
    )

# ==========================================
# 4. DATABASE CONNECTION (MongoDB)
# ==========================================
MONGO_URI = os.getenv("MONGO_URI")

try:
    if not MONGO_URI:
        print("⚠️ WARNING: MONGO_URI not found in .env file!")
    else:
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client["nutricare_db"]
        users_collection = db["users"]
        print("✅ Successfully connected to MongoDB Cloud!")
except Exception as e:
    print(f"⚠️ Database Connection Error: {e}")

# ==========================================
# 5. AI CHATBOT (Groq / Llama 3)
# ==========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
        return completion.choices[0].message.content.replace("**", "").replace("*", "")
    except Exception as e:
        print(f"⚠️ Groq Error: {e}")
        return "I am currently offline. Please check your internet connection."

# ==========================================
# 6. CHAT + AUTH ENDPOINTS
# ==========================================
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"📩 Received Message: {request.message}")
    bot_reply = get_ai_response(request.message)
    print(f"🤖 AI Reply: {bot_reply}")
    return {"reply": bot_reply}

@app.post("/signup")
async def signup(user: UserAuth):
    print(f"📝 Signup Attempt: {user.email}")

    if users_collection.find_one({"email": user.email}):
        return {"status": "error", "message": "Email already registered!"}

    clean_id = user.custom_id.strip().upper()
    if users_collection.find_one({"id": clean_id}):
        return {"status": "error", "message": f"ID '{clean_id}' is already taken."}

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