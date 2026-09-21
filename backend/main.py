from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import requests

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "data.json")

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "mistralai/mistral-7b-instruct:free"

# Initialize data file if it doesn't exist
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump({"responses": [], "analysis_history": []}, f)

class SpaceQuestionnaireResponse(BaseModel):
    # Bilan physique & paramètres vitaux
    energy_level: int
    head_symptoms: str
    microgravity_symptoms: str
    exercise_discomfort: str
    mild_symptoms: str
    
    # Sommeil & rythme circadien
    sleep_hours: float
    sleep_difficulties: str
    vigilance_level: str
    
    # Nutrition, hydratation & digestion
    hydration_goal: str
    caloric_intake: str
    digestive_issues: str
    
    # Santé mentale & dynamique d'équipage
    stress_level: int
    crew_mood: str
    social_needs: str
    
    # Environnement & sécurité à bord
    environment_anomalies: str
    incident_report: Optional[str] = None

class SpaceRecommendation(BaseModel):
    psychological_state: str
    risk_level: str
    detected_issues: List[str]
    recommendations: List[str]
    exercise_suggestions: List[str]
    timestamp: str
    context_summary: str

class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    context: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str

@app.post("/submit-questionnaire")
async def submit_questionnaire(response: SpaceQuestionnaireResponse):
    """Receives space questionnaire data and stores it"""
    try:
        # Load existing data
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        # Add new response with timestamp
        response_data = {
            "timestamp": datetime.now().isoformat(),
            # Bilan physique & paramètres vitaux
            "energy_level": response.energy_level,
            "head_symptoms": response.head_symptoms,
            "microgravity_symptoms": response.microgravity_symptoms,
            "exercise_discomfort": response.exercise_discomfort,
            "mild_symptoms": response.mild_symptoms,
            # Sommeil & rythme circadien
            "sleep_hours": response.sleep_hours,
            "sleep_difficulties": response.sleep_difficulties,
            "vigilance_level": response.vigilance_level,
            # Nutrition, hydratation & digestion
            "hydration_goal": response.hydration_goal,
            "caloric_intake": response.caloric_intake,
            "digestive_issues": response.digestive_issues,
            # Santé mentale & dynamique d'équipage
            "stress_level": response.stress_level,
            "crew_mood": response.crew_mood,
            "social_needs": response.social_needs,
            # Environnement & sécurité à bord
            "environment_anomalies": response.environment_anomalies,
            "incident_report": response.incident_report
        }
        
        data["responses"].append(response_data)
        
        # Save updated data
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {"status": "success", "message": "Space questionnaire submitted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/store-analysis")
async def store_analysis(analysis: SpaceRecommendation):
    """Stores space AI analysis results"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        analysis_data = {
            "timestamp": analysis.timestamp,
            "psychological_state": analysis.psychological_state,
            "risk_level": analysis.risk_level,
            "detected_issues": analysis.detected_issues,
            "recommendations": analysis.recommendations,
            "exercise_suggestions": analysis.exercise_suggestions,
            "context_summary": analysis.context_summary
        }
        
        data["analysis_history"].append(analysis_data)
        
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {"status": "success", "message": "Space analysis stored successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-latest-questionnaire")
async def get_latest_questionnaire():
    """Returns the latest questionnaire response"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        if not data["responses"]:
            return {}
        
        return data["responses"][-1]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-recommendation")
async def get_recommendation():
    """Returns the latest recommendation"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        if not data["analysis_history"]:
            return {"recommendation": "No recommendations available yet"}
        
        latest_analysis = data["analysis_history"][-1]
        return latest_analysis
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-history")
async def get_history():
    """Returns the history of responses and recommendations"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        history = []
        for i, response in enumerate(data["responses"]):
            analysis = {}
            if i < len(data["analysis_history"]):
                analysis = data["analysis_history"][i]
            
            history.append({
                "date": response.get("timestamp", ""),
                "energy_level": response.get("energy_level", 0),
                "stress_level": response.get("stress_level", 0),
                "sleep_hours": response.get("sleep_hours", 0),
                "psychological_state": analysis.get("psychological_state", ""),
                "risk_level": analysis.get("risk_level", ""),
                "detected_issues": analysis.get("detected_issues", []),
                "recommendations": analysis.get("recommendations", []),
                "exercise_suggestions": analysis.get("exercise_suggestions", [])
            })
        
        return {"history": history}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    """Handle chat with OpenRouter AI - requires API key"""
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=400, 
            detail="OpenRouter API key is required. Please set OPENROUTER_API_KEY environment variable"
        )
    
    try:
        # Get the latest questionnaire data for context
        latest_questionnaire = await get_latest_questionnaire()
        
        # Build context from questionnaire
        context_prompt = build_context_prompt(latest_questionnaire)
        
        # Prepare messages for AI
        messages = request.messages
        
        # Add system message with context if not already present
        if not any(msg.get("role") == "system" for msg in messages):
            system_message = {
                "role": "system",
                "content": f"""Tu es un assistant IA spécialisé pour les astronautes en mission spatiale. 
Tu donnes des conseils médicaux, psychologiques et techniques adaptés à l'environnement spatial. 
Sois précis, empathique et professionnel. Réponds UNIQUEMENT en français.

{context_prompt}
"""
            }
            messages = [system_message] + messages
        
        # Call OpenRouter API
        payload = {
            "model": MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1500
        }
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )
        
        response.raise_for_status()
        
        result = response.json()
        
        if 'choices' not in result or len(result['choices']) == 0:
            raise HTTPException(status_code=500, detail="No response from AI")
        
        ai_response = result['choices'][0]['message']['content']
        
        return {"response": ai_response}
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def build_context_prompt(questionnaire_data: dict) -> str:
    """Build context prompt from questionnaire data"""
    if not questionnaire_data:
        return "Contexte : Aucun questionnaire rempli pour le moment."
    
    context_parts = []
    
    # Bilan physique
    context_parts.append(f"Niveau d'énergie : {questionnaire_data.get('energy_level', '?')}/10")
    if questionnaire_data.get('head_symptoms', 'aucun') != 'aucun':
        context_parts.append(f"Symptômes crâniens : {questionnaire_data.get('head_symptoms')}")
    if questionnaire_data.get('microgravity_symptoms', 'aucun') != 'aucun':
        context_parts.append(f"Symptômes microgravité : {questionnaire_data.get('microgravity_symptoms')}")
    
    # Sommeil
    context_parts.append(f"Heures de sommeil : {questionnaire_data.get('sleep_hours', '?')}h")
    if questionnaire_data.get('sleep_difficulties', 'aucun') != 'aucun':
        context_parts.append(f"Difficultés sommeil : {questionnaire_data.get('sleep_difficulties')}")
    context_parts.append(f"Vigilance : {questionnaire_data.get('vigilance_level', '?')}")
    
    # Nutrition
    context_parts.append(f"Hydratation : {questionnaire_data.get('hydration_goal', '?')}")
    context_parts.append(f"Apport calorique : {questionnaire_data.get('caloric_intake', '?')}")
    if questionnaire_data.get('digestive_issues', 'aucun') != 'aucun':
        context_parts.append(f"Troubles digestifs : {questionnaire_data.get('digestive_issues')}")
    
    # Santé mentale
    context_parts.append(f"Niveau de stress : {questionnaire_data.get('stress_level', '?')}/10")
    context_parts.append(f"Ambiance équipage : {questionnaire_data.get('crew_mood', '?')}")
    context_parts.append(f"Besoins sociaux : {questionnaire_data.get('social_needs', '?')}")
    
    # Environnement
    if questionnaire_data.get('environment_anomalies', 'aucun') != 'aucun':
        context_parts.append(f"Anomalies environnementales : {questionnaire_data.get('environment_anomalies')}")
    if questionnaire_data.get('incident_report'):
        context_parts.append(f"Incident signalé : {questionnaire_data.get('incident_report')}")
    
    return "Contexte actuel de l'astronaute :\n" + "\n".join(context_parts)

@app.get("/")
async def root():
    return {"message": "PSYCHOSPACE Backend API - OpenRouter AI enabled"}
