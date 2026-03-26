import pickle
import json
import re
import numpy as np
from fuzzywuzzy import process

# ==========================================
# LOAD MODEL & DATA AT STARTUP
# ==========================================
print("🔄 Loading ML model...")

with open("model.pkl", "rb") as f:
    model = pickle.load(f)

with open("symptoms_list.pkl", "rb") as f:
    ALL_SYMPTOMS = pickle.load(f)

with open("disease_metadata.json", "r") as f:
    metadata = json.load(f)

DESCRIPTIONS = metadata["descriptions"]
PRECAUTIONS  = metadata["precautions"]
SPECIALISTS  = metadata["specialists"]
DIETS        = metadata["diets"]

print(f"✅ ML Model loaded! Tracking {len(ALL_SYMPTOMS)} symptoms.")

# ==========================================
# VERY DETAILED SYMPTOM ALIASES
# Maps everyday simple words → exact dataset symptom names
# ==========================================
SYMPTOM_ALIASES = {
    # --- FEVER & TEMPERATURE ---
    "fever": "high_fever",
    "high fever": "high_fever",
    "high temperature": "high_fever",
    "temperature": "high_fever",
    "mild fever": "mild_fever",
    "low grade fever": "mild_fever",
    "slight fever": "mild_fever",
    "burning body": "high_fever",
    "body heat": "high_fever",

    # --- HEAD ---
    "headache": "headache",
    "head pain": "headache",
    "head ache": "headache",
    "head hurts": "headache",
    "head is paining": "headache",
    "head paining": "headache",
    "migraine": "headache",

    # --- COLD & NOSE ---
    "cold": "continuous_sneezing",
    "sneezing": "continuous_sneezing",
    "runny nose": "runny_nose",
    "blocked nose": "runny_nose",
    "stuffy nose": "runny_nose",
    "nose block": "runny_nose",
    "nasal congestion": "runny_nose",
    "watery nose": "runny_nose",

    # --- THROAT ---
    "sore throat": "throat_irritation",
    "throat pain": "throat_irritation",
    "throat irritation": "throat_irritation",
    "throat hurts": "throat_irritation",
    "difficulty swallowing": "throat_irritation",
    "swollen throat": "throat_irritation",
    "throat infection": "throat_irritation",

    # --- COUGH ---
    "cough": "cough",
    "coughing": "cough",
    "dry cough": "cough",
    "wet cough": "cough",
    "mucus cough": "cough",
    "phlegm": "cough",

    # --- BODY PAIN ---
    "body pain": "muscle_pain",
    "body ache": "muscle_pain",
    "muscle pain": "muscle_pain",
    "muscle ache": "muscle_pain",
    "muscle weakness": "muscle_weakness",
    "joint pain": "joint_pain",
    "joint ache": "joint_pain",
    "knee pain": "joint_pain",
    "back pain": "back_pain",
    "lower back pain": "back_pain",
    "chest pain": "chest_pain",
    "chest tightness": "chest_pain",
    "chest discomfort": "chest_pain",
    "neck pain": "neck_pain",

    # --- STOMACH ---
    "stomach pain": "stomach_pain",
    "stomach ache": "stomach_pain",
    "abdominal pain": "abdominal_pain",
    "belly pain": "abdominal_pain",
    "cramps": "abdominal_pain",
    "stomach cramps": "abdominal_pain",
    "nausea": "nausea",
    "feel like vomiting": "nausea",
    "urge to vomit": "nausea",
    "vomiting": "vomiting",
    "vomit": "vomiting",
    "throwing up": "vomiting",
    "diarrhea": "diarrhoea",
    "loose motion": "diarrhoea",
    "loose stools": "diarrhoea",
    "watery stools": "diarrhoea",
    "diarrhoea": "diarrhoea",
    "constipation": "constipation",
    "no bowel movement": "constipation",
    "indigestion": "indigestion",
    "bloating": "indigestion",
    "gas": "indigestion",
    "acidity": "acidity",
    "heartburn": "acidity",
    "acid reflux": "acidity",

    # --- FATIGUE & ENERGY ---
    "fatigue": "fatigue",
    "tired": "fatigue",
    "tiredness": "fatigue",
    "weakness": "weakness",
    "weak": "weakness",
    "no energy": "fatigue",
    "lethargy": "lethargy",
    "lethargic": "lethargy",
    "drowsy": "lethargy",
    "sleepy": "lethargy",

    # --- SKIN ---
    "rash": "skin_rash",
    "skin rash": "skin_rash",
    "red skin": "skin_rash",
    "itching": "itching",
    "itch": "itching",
    "itchy skin": "itching",
    "itchy body": "itching",
    "dry skin": "skin_peeling",
    "peeling skin": "skin_peeling",
    "blisters": "fluid_overload",
    "pus": "yellow_crust_ooze",
    "acne": "acne",
    "pimples": "acne",
    "blackheads": "blackheads",

    # --- EYES ---
    "red eyes": "redness_of_eyes",
    "eye redness": "redness_of_eyes",
    "watery eyes": "watering_from_eyes",
    "eye pain": "pain_in_anal_region",
    "blurred vision": "blurred_and_distorted_vision",
    "vision problem": "blurred_and_distorted_vision",
    "yellow eyes": "yellowing_of_eyes",
    "eye irritation": "redness_of_eyes",

    # --- BREATHING ---
    "breathlessness": "breathlessness",
    "difficulty breathing": "breathlessness",
    "short of breath": "breathlessness",
    "breathing problem": "breathlessness",
    "can't breathe": "breathlessness",
    "wheezing": "breathlessness",

    # --- URINE ---
    "burning urination": "burning_micturition",
    "painful urination": "burning_micturition",
    "frequent urination": "polyuria",
    "urinating frequently": "polyuria",
    "dark urine": "dark_urine",
    "yellow urine": "dark_urine",
    "blood in urine": "dark_urine",

    # --- APPETITE & WEIGHT ---
    "loss of appetite": "loss_of_appetite",
    "no appetite": "loss_of_appetite",
    "not hungry": "loss_of_appetite",
    "weight loss": "weight_loss",
    "losing weight": "weight_loss",
    "excessive hunger": "excessive_hunger",
    "always hungry": "excessive_hunger",
    "increased thirst": "increased_appetite",
    "excessive thirst": "increased_appetite",
    "always thirsty": "increased_appetite",

    # --- MENTAL / MOOD ---
    "anxiety": "anxiety",
    "anxious": "anxiety",
    "nervousness": "anxiety",
    "depression": "depression",
    "depressed": "depression",
    "sad": "depression",
    "mood swings": "mood_swings",
    "irritability": "irritability",
    "irritable": "irritability",
    "restlessness": "restlessness",
    "restless": "restlessness",
    "confusion": "altered_sensorium",
    "confused": "altered_sensorium",

    # --- SWELLING ---
    "swelling": "swelling_joints",
    "swollen": "swelling_joints",
    "swollen legs": "swollen_legs",
    "puffy": "puffy_face_and_eyes",
    "puffy face": "puffy_face_and_eyes",
    "swollen lymph nodes": "swelled_lymph_nodes",
    "lymph node swelling": "swelled_lymph_nodes",

    # --- HEART ---
    "palpitations": "palpitations",
    "heart racing": "palpitations",
    "fast heartbeat": "palpitations",
    "irregular heartbeat": "palpitations",

    # --- SWEATING & CHILLS ---
    "sweating": "sweating",
    "excessive sweating": "sweating",
    "night sweats": "sweating",
    "chills": "chills",
    "shivering": "shivering",
    "cold sweats": "cold_hands_and_feets",
    "cold hands": "cold_hands_and_feets",
    "cold feet": "cold_hands_and_feets",

    # --- DIZZINESS ---
    "dizziness": "dizziness",
    "dizzy": "dizziness",
    "lightheaded": "dizziness",
    "vertigo": "dizziness",
    "spinning": "dizziness",
    "fainting": "loss_of_balance",
    "fainted": "loss_of_balance",

    # --- JAUNDICE ---
    "yellow skin": "yellowish_skin",
    "yellowish skin": "yellowish_skin",
    "jaundice": "yellowish_skin",
    "skin turned yellow": "yellowish_skin",

    # --- OTHER COMMON ---
    "hair loss": "hair_loss",
    "losing hair": "hair_loss",
    "stiff neck": "stiff_neck",
    "neck stiffness": "stiff_neck",
    "sensitivity to light": "photo_phobia",
    "light sensitivity": "photo_phobia",
    "loss of smell": "loss_of_smell",
    "cannot smell": "loss_of_smell",
    "loss of taste": "loss_of_smell",
    "cannot taste": "loss_of_smell",
    "memory loss": "loss_of_balance",
    "forgetfulness": "loss_of_balance",
    "numbness": "numbness",
    "tingling": "tingling",
}

# ==========================================
# DISEASE-SYMPTOM MAPPING
# This ensures when THESE specific symptoms are given
# together, they map to the CORRECT disease
# ==========================================
DISEASE_SYMPTOM_RULES = {
    "Common Cold": [
        "continuous_sneezing", "runny_nose", "headache",
        "mild_fever", "cough", "throat_irritation"
    ],
    "Dengue": [
        "high_fever", "headache", "joint_pain",
        "muscle_pain", "skin_rash", "vomiting"
    ],
    "Malaria": [
        "high_fever", "chills", "sweating",
        "headache", "vomiting", "muscle_pain"
    ],
    "Typhoid": [
        "high_fever", "headache", "nausea",
        "stomach_pain", "constipation", "weakness"
    ],
    "Diabetes": [
        "polyuria", "increased_appetite", "fatigue",
        "weight_loss", "blurred_and_distorted_vision"
    ],
    "Migraine": [
        "headache", "nausea", "vomiting",
        "sensitivity to light", "dizziness"
    ],
    "Pneumonia": [
        "cough", "high_fever", "breathlessness",
        "chest_pain", "fatigue", "sweating"
    ],
    "Urinary tract infection": [
        "burning_micturition", "polyuria",
        "dark_urine", "fatigue"
    ],
    "Hypertension": [
        "headache", "chest_pain", "dizziness",
        "fatigue", "palpitations"
    ],
    "Jaundice": [
        "yellowish_skin", "yellowing_of_eyes",
        "dark_urine", "fatigue", "loss_of_appetite"
    ],
}

# ==========================================
# TEXT → SYMPTOMS CONVERTER
# ==========================================
def text_to_symptoms(user_text: str) -> list:
    user_text = user_text.lower().strip()
    matched = set()

    # Step 1: Check aliases (longest match first for accuracy)
    sorted_aliases = sorted(SYMPTOM_ALIASES.keys(), key=len, reverse=True)
    for phrase in sorted_aliases:
        if phrase in user_text:
            symptom = SYMPTOM_ALIASES[phrase]
            if symptom in ALL_SYMPTOMS:
                matched.add(symptom)

    # Step 2: Direct word match against symptom list
    clean_text = re.sub(r"[^a-z0-9 ]", " ", user_text)
    for symptom in ALL_SYMPTOMS:
        symptom_words = symptom.replace("_", " ")
        if symptom_words in clean_text:
            matched.add(symptom)

    # Step 3: Fuzzy match for typos (only if very few matches found)
    if len(matched) < 2:
        words = clean_text.split()
        readable_symptoms = [s.replace("_", " ") for s in ALL_SYMPTOMS]
        for word in words:
            if len(word) > 4:
                result = process.extractOne(word, readable_symptoms, score_cutoff=85)
                if result:
                    idx = readable_symptoms.index(result[0])
                    matched.add(ALL_SYMPTOMS[idx])

    print(f"🔍 Matched symptoms: {list(matched)}")
    return list(matched)

# ==========================================
# RULE-BASED OVERRIDE
# If matched symptoms clearly point to one disease → use it
# ==========================================
def check_disease_rules(symptoms_list: list) -> str | None:
    symptoms_set = set(symptoms_list)
    best_disease = None
    best_score = 0

    for disease, required_symptoms in DISEASE_SYMPTOM_RULES.items():
        matched_count = len(symptoms_set.intersection(set(required_symptoms)))
        total = len(required_symptoms)
        score = matched_count / total

        # If more than 40% of key symptoms match → strong candidate
        if score > best_score and matched_count >= 2:
            best_score = score
            best_disease = disease

    if best_score >= 0.4:
        print(f"✅ Rule override → {best_disease} (score: {best_score:.2f})")
        return best_disease
    return None

# ==========================================
# CORE PREDICTION FUNCTION
# ==========================================
def predict_disease(symptoms_list: list) -> dict:
    if not symptoms_list:
        return {
            "condition": "No Symptoms Detected",
            "confidence": "0%",
            "description": "Please describe your symptoms more clearly. Try words like 'fever', 'headache', 'cough', 'vomiting'.",
            "precautions": [],
            "specialist": "General Physician",
            "diet_plan": DIETS["default"]
        }

    # Step 1: Check rule-based override first
    rule_disease = check_disease_rules(symptoms_list)

    # Step 2: ML Model prediction
    input_vector = np.array([
        1 if symptom in symptoms_list else 0
        for symptom in ALL_SYMPTOMS
    ]).reshape(1, -1)

    ml_prediction = model.predict(input_vector)[0]
    probabilities = model.predict_proba(input_vector)[0]
    ml_confidence = round(max(probabilities) * 100, 1)

    # Step 3: Final decision
    # Use rule override if confidence is high, else trust ML
    if rule_disease and ml_confidence < 80:
        final_disease = rule_disease
        final_confidence = 85.0
    else:
        final_disease = ml_prediction
        final_confidence = ml_confidence

    # Fetch metadata
    description = DESCRIPTIONS.get(final_disease, "No description available.")
    precautions = PRECAUTIONS.get(final_disease, [])
    specialist  = SPECIALISTS.get(final_disease, "General Physician")
    diet        = DIETS.get(final_disease, DIETS["default"])

    # Confidence label
    if final_confidence >= 85:
        conf_label = f"{final_confidence}% (High)"
    elif final_confidence >= 60:
        conf_label = f"{final_confidence}% (Moderate)"
    else:
        conf_label = f"{final_confidence}% (Low - please consult a doctor)"

    return {
        "condition": final_disease,
        "confidence": conf_label,
        "matched_symptoms": symptoms_list,
        "description": description,
        "precautions": precautions,
        "specialist": specialist,
        "diet_plan": diet
    }

# ==========================================
# PUBLIC FUNCTIONS
# ==========================================
def predict_from_text(user_text: str) -> dict:
    symptoms = text_to_symptoms(user_text)
    result = predict_disease(symptoms)
    result["input_type"] = "text"
    return result

def predict_from_checklist(symptoms: list) -> dict:
    normalized = [s.strip().lower().replace(" ", "_") for s in symptoms]
    valid = [s for s in normalized if s in ALL_SYMPTOMS]
    result = predict_disease(valid)
    result["input_type"] = "checklist"
    return result

def get_all_symptoms() -> list:
    return sorted([s.replace("_", " ").title() for s in ALL_SYMPTOMS])