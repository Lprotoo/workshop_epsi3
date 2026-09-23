from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any
import requests
from dotenv import load_dotenv

# Add agent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agent'))
from ai_agent import AIAgent

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

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
MEDICATION_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "medications.json")

# Initialize AI Agent for medication management
ai_agent = AIAgent()

# Initialize medication data file
os.makedirs(os.path.dirname(MEDICATION_FILE), exist_ok=True)
if not os.path.exists(MEDICATION_FILE):
    with open(MEDICATION_FILE, 'w') as f:
        json.dump({"prescriptions": []}, f)

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "nex-agi/nex-n2.5-mini:free"

# Initialize data files if they don't exist
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
os.makedirs(os.path.dirname(os.path.join(os.path.dirname(__file__), "..", "data", "conversations.json")), exist_ok=True)

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump({"responses": [], "analysis_history": []}, f)

conversations_file = os.path.join(os.path.dirname(__file__), "..", "data", "conversations.json")
if not os.path.exists(conversations_file):
    with open(conversations_file, 'w') as f:
        json.dump({"user_name": None, "conversation_history": []}, f)

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
    sleep_quality: Optional[int] = None
    mood: Optional[int] = None
    stress: Optional[int] = None
    fatigue: Optional[int] = None

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

class MedicationPrescription(BaseModel):
    code: str
    medication_id: int
    medication_name: str
    reason: str
    timestamp: Optional[str] = None

class MedicationClaimRequest(BaseModel):
    code: str

class ExerciseStatusUpdate(BaseModel):
    category: str
    completed: bool

class MedicationClaimResponse(BaseModel):
    success: bool
    medication_info: Optional[Dict[str, Any]] = None
    message: str

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
            "incident_report": response.incident_report,
            "sleep_quality": response.sleep_quality,
            "mood": response.mood,
            "stress": response.stress,
            "fatigue": response.fatigue,
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
                **response,
                "date": response.get("timestamp", ""),
                "energy_level": response.get("energy_level", 0),
                "stress_level": response.get("stress_level", 0),
                "sleep_hours": response.get("sleep_hours", 0),
                "psychological_state": analysis.get("psychological_state", ""),
                "risk_level": analysis.get("risk_level", ""),
                "detected_issues": analysis.get("detected_issues", []),
                "recommendations": analysis.get("recommendations", []),
                "exercise_suggestions": analysis.get("exercise_suggestions", []),
                "analysis": analysis,
            })

        claims = []
        try:
            with open(MEDICATION_FILE, "r", encoding="utf-8") as meds_file:
                meds = json.load(meds_file)
            claims = [item for item in meds.get("prescriptions", []) if item.get("claimed")]
        except Exception:
            claims = []

        return {"history": history, "claims": claims}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-user-info")
async def get_user_info():
    """Returns only the user name"""
    try:
        with open(conversations_file, 'r') as f:
            data = json.load(f)
        
        return {
            "user_name": data.get("user_name")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-conversation")
async def get_conversation():
    """Returns only the conversation history"""
    try:
        with open(conversations_file, 'r') as f:
            data = json.load(f)
        
        return {
            "conversation": data.get("conversation_history", [])
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Reference data endpoints (read-only) ---
# Personnel, nourriture, salles, voyage, systèmes du vaisseau et maladies spatiales.
# Ces données se modifient directement dans data/data.json ; pas de CRUD ici.

@app.get("/get-crew")
async def get_crew():
    """Personnel de bord (grade, titre, sexe, nom, prénom, âge)"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return {"crew": data.get("crew", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-food-stock")
async def get_food_stock():
    """Nourriture à bord (type, nom, quantité, production locale ou importée)"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return {"food_stock": data.get("food_stock", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-station-rooms")
async def get_station_rooms():
    """Salles et espaces de vie à bord (superficie, capacité, activités)"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return {"station_rooms": data.get("station_rooms", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-travel-data")
async def get_travel_data():
    """Données du voyage (départ, arrivée, distance, temps écoulé/restant)"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return data.get("travel_data", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-station-systems")
async def get_station_systems():
    """Fonctionnement des systèmes du vaisseau (propulsion, support de vie, énergie...)"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return {"station_systems": data.get("station_systems", {})}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-space-diseases")
async def get_space_diseases():
    """Maladies spatiales connues (symptômes, cause, traitement)"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return {"space_diseases": data.get("space_diseases", [])}
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

        # Load extended ship/crew reference data (crew, food, rooms, travel, systems, diseases)
        with open(DATA_FILE, 'r') as f:
            _extra_data = json.load(f)
        crew_context = build_crew_context(_extra_data.get("crew", []))
        food_context = build_food_context(_extra_data.get("food_stock", []))
        rooms_context = build_rooms_context(_extra_data.get("station_rooms", []))
        travel_context = build_travel_context(_extra_data.get("travel_data", {}))
        systems_context = build_systems_context(_extra_data.get("station_systems", {}))
        diseases_context = build_diseases_context(_extra_data.get("space_diseases", []))
        
        # Load conversation history from file
        with open(conversations_file, 'r') as f:
            conversations_data = json.load(f)
        
        # Get existing conversation history
        conversation_history = conversations_data.get("conversation_history", [])
        
        # Prepare messages for AI - add conversation history
        messages = request.messages
        
        # Get user name from conversations data
        user_name = conversations_data.get("user_name")
        
        # If this is a new conversation, add system message
        if not any(msg.get("role") == "system" for msg in messages):
            greeting = f"Bonjour {user_name}!" if user_name else "Bonjour!"
            
            system_message = {
                "role": "system",
                "content": f"""{greeting} Tu es un assistant IA spécialisé pour les astronautes en mission spatiale. 
Tu donnes des conseils médicaux, psychologiques et techniques adaptés à l'environnement spatial. 
Sois précis, empathique et professionnel. Réponds UNIQUEMENT en français.

**CONTEXTE IMPORTANT :**
Tu as accès à l'historique complet de la conversation avec l'utilisateur {user_name or 'anonyme'}. 

**INFORMATIONS SUR L'UTILISATEUR :**
{'- Nom: ' + user_name if user_name else '- Utilisateur anonyme'}

Utilise ces informations pour fournir des réponses cohérentes et personnalisées.

**INSTRUCTIONS SPECIFIQUES POUR LES DEMANDES DE BILAN :**
Si l'utilisateur demande : "fais un bilan", "analyse mon état", "quel est mon diagnostic", 
"Donne-moi un bilan psychologique", ou toute autre demande similaire pour une analyse complète :

1. TU DOIS analyser TOUTES les données disponibles dans le contexte (questionnaire)
2. TU DOIS TOUJOURS prescrire un medicament basé sur les symptômes détectés
3. TU DOIS utiliser le format suivant :

[BILAN]
État psychologique: [etat]
Signes détectés: [liste des signes]
Suggestion: [exercice ou conseil]

[PRESCRIPTION]
Code: CODE_A_6_CHIFFRES
Médicament: NOM_DU_MEDICAMENT
Raison: [raison claire]
[/PRESCRIPTION]

[FIN_BILAN]

**REGLE GENERALE : TU DOIS prescrire un medicament chaque fois que l'utilisateur mentionne un symptome ou un problème.**
Sois très proactif : meme les petits problèmes meritent une prescription.

**CORRESPONDANCE SYMPTOMES -> MEDICAMENTS :**
- Stress/Anxiété/Angoisse/Panique → MEDICAMENT 2 (Anxiolytique naturel)
- Déprime/Tristesse/Abattu/Démotivé → MEDICAMENT 1 (Antidépresseur léger)
- Insomnie/Troubles sommeil/Fatigue au réveil/Sommeil < 7h → MEDICAMENT 3 (Somnifère doux)
- Sommeil > 9h/Brouillard mental/Manque de vigilance → MEDICAMENT 4 (Stimulant mental)
- Maux de tête/Migraine/Douleur cranienne → MEDICAMENT 5 (Analgésique spatial)
- Ballonnements/Nausées/Troubles digestifs/Maux de ventre → MEDICAMENT 6 (Régulateur digestif)
- Courbatures/Douleurs musculaires/Tensions → MEDICAMENT 8 (Tonifiant musculaire)
- Fatigue persistante/Infections fréquentes → MEDICAMENT 7 (Renforçateur immunitaire)
- Humeur changeante/Irritable/Émotions instables → MEDICAMENT 9 (Équilibreur émotionnel)
- Tout autre symptome ou demande de bilan → MEDICAMENT 9 (Équilibreur émotionnel) par défaut

**FORMAT DE PRESCRIPTION (a inclure dans CHAQUE reponse avec symptome) :**
Si l'utilisateur a un symptome ou demande un bilan, TU DOIS inclure :

[PRESCRIPTION]
Code: CODE_A_6_CHIFFRES (le premier chiffre = ID du medicament)
Médicament: NOM_DU_MEDICAMENT
Raison: EXPLICATION
[/PRESCRIPTION]

Exemple pour un bilan :
"Je veux un bilan" → 
[BILAN]
État psychologique: stressé
Signes détectés: stress level 7/10, sommeil 5h
Suggestion: Prendre du repos

[PRESCRIPTION]
Code: 234567
Médicament: Anxiolytique naturel
Raison: Stress élevé détecté
[/PRESCRIPTION]

[FIN_BILAN]

**IMPORTANT :**
- Ne réponds JAMAIS avec une réponse vide
- Si tu ne comprends pas, demande des clarifications OU prescris le médicament 9 par défaut
- TOUJOURS inclure une prescription quand il y a des données disponibles
- Utilise l'historique de conversation pour maintenir la cohérence

**CONSIGNE IMPORTANTE — PRIORITÉ AU SPORT :**
Chaque fois que c'est pertinent (fatigue, stress, douleurs osseuses ou musculaires, sommeil, moral,
ou en complément d'une prescription), recommande en priorité une activité physique concrète réalisable
dans la salle de sport du vaisseau (voir les salles ci-dessous), car l'exercice est le principal moyen
de lutter contre l'atrophie musculaire et la décalcification osseuse en microgravité. Ne l'impose pas
si c'est hors sujet (urgence médicale grave, question purement technique), mais privilégie
systématiquement cette recommandation dès que le contexte le permet.

{context_prompt}

{crew_context}

{food_context}

{rooms_context}

{travel_context}

{systems_context}

{diseases_context}
"""
            }
            messages = [system_message] + messages
        
        # Call OpenRouter API with conversation history
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
        
        # Extract user name from message if provided
        user_name = None
        message_content = ""
        if request.messages and request.messages[-1].get("content"):
            message_content = request.messages[-1].get("content", "")
            
            # Check if message contains a name
            import re
            name_match = re.search(r'(?:je m\'appelle|appelle moi|mon nom est|mon prénom est) ([A-Za-zéèêëàâäùûüïöô]+)', message_content, re.IGNORECASE)
            if name_match:
                user_name = name_match.group(1)
                # Store the name in conversations_data
                conversations_data["user_name"] = user_name
                # Update the message to remove the name mention
                message_content = re.sub(r'(?:je m\'appelle|appelle moi|mon nom est|mon prénom est) [A-Za-zéèêëàâäùûüïöô]+', '', message_content, flags=re.IGNORECASE).strip()
            
            # Check if user is asking for their name
            if "comment je m'appelle" in message_content.lower() or "quel est mon nom" in message_content.lower():
                if conversations_data.get("user_name"):
                    ai_response = f"Tu t’appelles {conversations_data['user_name']}! Comment puis-je t’aider aujourd’hui ?"
                else:
                    ai_response = "Je ne connais pas encore ton nom. Comment veux-tu que je t’appelle ?"
                
                # Store the conversation in history
                new_message = {
                    "timestamp": datetime.now().isoformat(),
                    "role": "user",
                    "content": message_content
                }
                
                # Add AI response to history
                ai_message = {
                    "timestamp": datetime.now().isoformat(),
                    "role": "assistant",
                    "content": ai_response
                }
                
                # Update conversation history
                conversation_history.append(new_message)
                conversation_history.append(ai_message)
                
                # Save updated conversations data with conversation history and user name
                conversations_data["conversation_history"] = conversation_history
                with open(conversations_file, 'w') as f:
                    json.dump(conversations_data, f, indent=2)
                
                return {"response": ai_response}
        
        # Store the conversation in history
        new_message = {
            "timestamp": datetime.now().isoformat(),
            "role": "user",
            "content": message_content
        }
        
        # Add AI response to history
        ai_message = {
            "timestamp": datetime.now().isoformat(),
            "role": "assistant",
            "content": ai_response
        }
        
        # Update conversation history
        conversation_history.append(new_message)
        conversation_history.append(ai_message)
        
        # Save updated conversations data with conversation history and user name
        conversations_data["conversation_history"] = conversation_history
        if user_name:
            conversations_data["user_name"] = user_name
        with open(conversations_file, 'w') as f:
            json.dump(conversations_data, f, indent=2)
        
        return {"response": ai_response}
        
    except requests.exceptions.HTTPError as e:
        error_detail = e.response.text if e.response is not None else str(e)
        raise HTTPException(status_code=500, detail=f"AI API error: {error_detail}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def ensure_exercise_plans_key(data: dict) -> dict:
    """S'assure que la cle exercise_plans existe dans data.json"""
    if "exercise_plans" not in data:
        data["exercise_plans"] = []
    return data

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


def build_crew_context(crew: list) -> str:
    """Build a context block listing the crew, to help orient the user."""
    if not crew:
        return "Personnel de bord : aucune donnée enregistrée."
    lines = ["Personnel de bord :"]
    for member in crew:
        lines.append(
            f"- {member.get('grade', '?')} {member.get('titre', '?')} : "
            f"{member.get('prenom', '?')} {member.get('nom', '?')} "
            f"({member.get('sexe', '?')}, {member.get('age', '?')} ans)"
        )
    return "\n".join(lines)


def build_food_context(food_stock: list) -> str:
    """Build a context block summarizing onboard food supplies."""
    if not food_stock:
        return "Stock de nourriture : aucune donnée enregistrée."
    lines = ["Stock de nourriture à bord :"]
    for item in food_stock:
        origine = "produit à bord" if item.get("production") else "importé depuis la Terre"
        lines.append(
            f"- [{item.get('type', '?')}] {item.get('nom', '?')} : "
            f"{item.get('quantite', '?')} {item.get('unite', '?')} ({origine})"
        )
    return "\n".join(lines)


def build_rooms_context(rooms: list) -> str:
    """Build a context block describing the ship's rooms and activities."""
    if not rooms:
        return "Salles et espaces de vie : aucune donnée enregistrée."
    lines = ["Salles et espaces de vie à bord :"]
    for room in rooms:
        activites = ", ".join(room.get("activites", [])) or "aucune activité recensée"
        lines.append(
            f"- {room.get('nom_salle', '?')} : {room.get('superficie_m2', '?')} m², "
            f"capacité {room.get('capacite', '?')} personnes — activités : {activites}"
        )
    return "\n".join(lines)


def build_travel_context(travel: dict) -> str:
    """Build a context block describing the interstellar journey progress."""
    if not travel:
        return "Données de voyage : aucune donnée enregistrée."
    return (
        "Données du voyage :\n"
        f"- Départ : {travel.get('point_depart', '?')} (le {travel.get('date_depart', '?')})\n"
        f"- Arrivée prévue : {travel.get('point_arrivee', '?')}\n"
        f"- Distance : {travel.get('distance_annees_lumiere', '?')} années-lumière, "
        f"vitesse de croisière : {travel.get('vitesse_pourcentage_c', '?')}% de la vitesse de la lumière\n"
        f"- Durée totale du voyage : {travel.get('temps_voyage_total_annees', '?')} ans\n"
        f"- Temps écoulé : {travel.get('temps_ecoule_annees', '?')} ans\n"
        f"- Temps restant estimé : {travel.get('temps_restant_annees', '?')} ans"
    )


def build_systems_context(systems: dict) -> str:
    """Build a context block describing how the ship's systems currently operate."""
    if not systems:
        return "Fonctionnement de la station : aucune donnée enregistrée."
    lines = ["Fonctionnement des systèmes du vaisseau :"]
    for name, info in systems.items():
        lines.append(
            f"- {name.capitalize()} : {info.get('description', '?')} "
            f"(statut : {info.get('statut', '?')})"
        )
    return "\n".join(lines)


def build_diseases_context(diseases: list) -> str:
    """Build a context block listing known space-related illnesses and their treatment."""
    if not diseases:
        return "Maladies spatiales connues : aucune donnée enregistrée."
    lines = ["Maladies spatiales connues (base de connaissance médicale du vaisseau) :"]
    for disease in diseases:
        symptomes = ", ".join(disease.get("symptomes", []))
        traitement = ", ".join(disease.get("traitement", []))
        lines.append(
            f"- {disease.get('nom', '?')} (gravité : {disease.get('gravite', '?')})\n"
            f"  Symptômes : {symptomes}\n"
            f"  Cause : {disease.get('cause', '?')}\n"
            f"  Traitement recommandé : {traitement}"
        )
    return "\n".join(lines)


@app.post("/prescribe-medication")
async def prescribe_medication(prescription: MedicationPrescription):
    """Store a medication prescription"""
    try:
        with open(MEDICATION_FILE, 'r') as f:
            data = json.load(f)
        
        prescription_data = {
            "code": prescription.code,
            "medication_id": prescription.medication_id,
            "medication_name": prescription.medication_name,
            "reason": prescription.reason,
            "timestamp": datetime.now().isoformat(),
            "claimed": False,
            "claim_timestamp": None
        }
        
        data["prescriptions"].append(prescription_data)
        
        with open(MEDICATION_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {"status": "success", "message": "Prescription stored successfully", "code": prescription.code}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/claim-medication")
async def claim_medication(request: MedicationClaimRequest):
    """Claim/redeem a medication using its code"""
    try:
        with open(MEDICATION_FILE, 'r') as f:
            data = json.load(f)
        
        # Find the prescription by code
        prescription = None
        for p in data["prescriptions"]:
            if p["code"] == request.code and not p.get("claimed", False):
                prescription = p
                break
        
        if not prescription:
            return MedicationClaimResponse(
                success=False,
                medication_info=None,
                message="Code invalide ou déjà utilisé"
            )
        
        # Mark as claimed
        prescription["claimed"] = True
        prescription["claim_timestamp"] = datetime.now().isoformat()
        
        with open(MEDICATION_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Get medication info
        med_info = ai_agent.get_medication_info(request.code)
        
        return MedicationClaimResponse(
            success=True,
            medication_info=med_info,
            message=f"Livraison de votre médicament : {prescription['medication_name']}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-medication-info/{code}")
async def get_medication_info(code: str):
    """Get medication information from a code without claiming it"""
    try:
        med_info = ai_agent.get_medication_info(code)
        
        if med_info:
            return {
                "valid": True,
                "medication": med_info
            }
        else:
            return {
                "valid": False,
                "message": "Code invalide"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-all-medications")
async def get_all_medications():
    """Get list of all available medications"""
    try:
        medications = []
        for med_id, med_data in ai_agent.MEDICATIONS.items():
            medications.append({
                "id": med_id,
                "name": med_data["name"],
                "description": med_data["description"]
            })
        return {"medications": medications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-prescription/{code}")
async def get_prescription(code: str):
    """Check if a prescription code exists and get its details"""
    try:
        with open(MEDICATION_FILE, 'r') as f:
            data = json.load(f)
        
        for p in data["prescriptions"]:
            if p["code"] == code:
                return {
                    "found": True,
                    "prescription": p
                }
        
        return {
            "found": False,
            "message": "Prescription non trouvée"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-questionnaire")
async def analyze_questionnaire():
    """Analyze the latest questionnaire and return psychological analysis with medication prescription"""
    try:
        # Get the latest questionnaire data
        latest_questionnaire = await get_latest_questionnaire()
        
        if not latest_questionnaire:
            return {
                "error": "No questionnaire data available",
                "psychological_state": "inconnu",
                "detected_signs": ["pas de données"],
                "exercise_suggestion": "Veuillez remplir le questionnaire d'abord",
                "timestamp": datetime.now().isoformat()
            }
        
        # Use AI Agent to analyze
        agent = AIAgent()
        
        analysis = agent.analyze_response(
            sleep_hours=latest_questionnaire.get('sleep_hours', 8.0),
            mood=latest_questionnaire.get('crew_mood', 'neutre'),
            stress_level=latest_questionnaire.get('stress_level', 5),
            free_text=latest_questionnaire.get('incident_report', None) or 
                      latest_questionnaire.get('social_needs', None)
        )
                # Store the exercise plan if present
        if analysis.get('exercise_plan') and analysis['exercise_plan'].get('triggered'):
            with open(DATA_FILE, 'r') as f:
                exercise_data = json.load(f)
            
            exercise_data = ensure_exercise_plans_key(exercise_data)
            exercise_data["exercise_plans"].append(analysis['exercise_plan'])
            
            with open(DATA_FILE, 'w') as f:
                json.dump(exercise_data, f, indent=2)
        
        
        # Store the prescription if medication is present
        if analysis.get('medication'):
            prescription_data = {
                "code": analysis['medication']['code'],
                "medication_id": analysis['medication']['medication_id'],
                "medication_name": analysis['medication']['medication_name'],
                "reason": analysis['medication']['reason'],
                "timestamp": datetime.now().isoformat()
            }
            
            with open(MEDICATION_FILE, 'r') as f:
                med_data = json.load(f)
            
            med_data["prescriptions"].append(prescription_data)
            
            with open(MEDICATION_FILE, 'w') as f:
                json.dump(med_data, f, indent=2)
        
        return analysis
        
    except ValueError as e:
        # If AI API is not available, return a fallback analysis with medication
        # Generate a random medication code
        import random
        medication_id = random.randint(1, 9)
        code = f"{medication_id}{random.randint(10000, 99999)}"
        
        return {
            "psychological_state": "analyse automatique",
            "detected_signs": ["API IA non disponible"],
            "exercise_suggestion": "Veuillez configurer votre clé API OpenRouter",
            "medication": {
                "code": code,
                "medication_id": medication_id,
                "medication_name": ai_agent.MEDICATIONS[medication_id]["name"],
                "reason": "Prescription par défaut"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/get-exercise-plan")
async def get_exercise_plan():
    """Returns the latest sport/exercise plan generated by the AI agent"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        data = ensure_exercise_plans_key(data)
        
        if not data["exercise_plans"]:
            return {"triggered": False, "plan": []}
        
        return data["exercise_plans"][-1]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/update-exercise-status")
async def update_exercise_status(update: ExerciseStatusUpdate):
    """Mark an exercise as completed or not in the latest plan"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        data = ensure_exercise_plans_key(data)
        
        if not data["exercise_plans"]:
            raise HTTPException(status_code=404, detail="No exercise plan found")
        
        latest_plan = data["exercise_plans"][-1]
        found = False
        for item in latest_plan.get("plan", []):
            if item["category"] == update.category:
                item["completed"] = update.completed
                found = True
        
        if not found:
            raise HTTPException(status_code=404, detail="Exercise category not found")
        
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {"status": "success", "message": "Exercise status updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "spAIce Backend API - OpenRouter AI enabled"}