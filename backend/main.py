from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

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
    """Handle chat with AI agent"""
    try:
        # For demo purposes, we'll use a fallback response
        # In production, this would call the AI agent
        
        # Get the latest questionnaire data for context
        latest_questionnaire = await get_latest_questionnaire()
        
        # Build context
        context = """
        Contexte de l'astronaute :
        """
        
        if latest_questionnaire:
            context += f"""
        - Niveau d'énergie : {latest_questionnaire.get('energy_level', 'non spécifié')}/10
        - Heures de sommeil : {latest_questionnaire.get('sleep_hours', 'non spécifié')}h
        - Niveau de stress : {latest_questionnaire.get('stress_level', 'non spécifié')}/10
        - Symptômes physiques : {latest_questionnaire.get('head_symptoms', 'Aucun')}, {latest_questionnaire.get('microgravity_symptoms', 'Aucun')}
        - Hydratation : {latest_questionnaire.get('hydration_goal', 'non spécifié')}
        - Nutrition : {latest_questionnaire.get('caloric_intake', 'non spécifié')}
        - Ambiance équipage : {latest_questionnaire.get('crew_mood', 'non spécifié')}
        - Anomalies environnementales : {latest_questionnaire.get('environment_anomalies', 'Aucune')}
        """
        
        # Get user message
        user_message = request.messages[-1].get('content', '') if request.messages else ''
        
        # Generate fallback response based on context
        response = generate_contextual_response(user_message, context)
        
        return {"response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_contextual_response(user_message: str, context: str) -> str:
    """Generate a response based on the user message and context"""
    message_lower = user_message.lower()
    
    # Check for keywords and provide contextual responses
    if any(word in message_lower for word in ['sommeil', 'dormir', 'nuit', 'repos']):
        return f"""Pour améliorer votre sommeil en microgravité :

1. **Maintenez un horaire régulier** de coucher et de réveil
2. Utilisez des oreillers et sangles pour vous ancrer
3. Évitez les écrans avant le sommeil
4. Pratiquez des exercices de respiration profonde
5. Réduisez la caféine après 14h

{context}

N'oubliez pas de remplir le questionnaire quotidien pour des conseils plus personnalisés !"""
    
    if any(word in message_lower for word in ['stress', 'anxiété', 'anxiete', 'pression', 'nerveux']):
        return f"""Pour gérer le stress en mission spatiale :

1. Parlez-en à votre équipage ou au contrôle au sol
2. Pratiquez la méditation ou des exercices de relaxation
3. Maintenez une routine quotidienne
4. Faites de l'exercice physique régulièrement
5. Utilisez les ressources psychologiques disponibles

{context}

Votre niveau de stress actuel est important à surveiller."""
    
    if any(word in message_lower for word in ['nausée', 'nausees', 'vertige', 'désorientation', 'étourdi']):
        return f"""Les symptômes de nausée et désorientation sont courants en microgravité :

1. Fixez un point stable à l'horizon
2. Évitez les mouvements brusques de la tête
3. Prenez des petits repas fréquents plutôt que de gros repas
4. Restez hydraté
5. Consultez le médecin de bord si les symptômes persistent

{context}

Ces symptômes sont souvent temporaires et s'améliorent avec l'adaptation."""
    
    if any(word in message_lower for word in ['hydratation', 'eau', 'boire', 'soif']):
        return f"""L'hydratation est cruciale en microgravité :

1. Buvez régulièrement, même sans soif
2. Surveillez la couleur de votre urine (doit être claire)
3. Consommez des aliments riches en eau (fruits, légumes)
4. Évitez l'excès de caféine et d'alcool
5. Utilisez une paille pour boire plus facilement

{context}

Votre apport hydrique a-t-il été suffisant aujourd'hui ?"""
    
    if any(word in message_lower for word in ['nutrition', 'manger', 'ration', 'alimentation', 'faim']):
        return f"""Pour une nutrition optimale dans l'espace :

1. Consommez toutes vos rations pour éviter les carences
2. Variez les aliments disponibles
3. Mangez régulièrement pour maintenir votre énergie
4. Surveillez votre apport en protéines et vitamines
5. Signalez tout problème d'appétit ou digestif

{context}

La nutrition est essentielle pour maintenir vos performances."""
    
    if any(word in message_lower for word in ['exercice', 'sport', 'entraînement', 'musculation']):
        return f"""L'exercice en microgravité est crucial pour :

1. Maintenir la masse musculaire
2. Prévenir la perte osseuse
3. Améliorer la circulation sanguine
4. Réduire le stress
5. Maintenir un bon moral

{context}

Si vous ressentez des inconforts pendant l'exercice, adaptez l'intensité et consultez le médecin."""
    
    if any(word in message_lower for word in ['équipage', 'crew', 'collègue', 'coéquipier', 'communication']):
        return f"""La dynamique d'équipage est essentielle pour une mission réussie :

1. Communiquez ouvertement avec vos collègues
2. Participez aux activités de groupe
3. Respectez l'espace personnel de chacun
4. Soyez patient et compréhensif
5. Signalez tout conflit au commandant

{context}

Une bonne cohésion d'équipage améliore la sécurité et l'efficacité."""
    
    if any(word in message_lower for word in ['environnement', 'module', 'bruit', 'température', 'odeur', 'sécurité']):
        return f"""Pour un environnement de travail optimal :

1. Signalez immédiatement toute anomalie (bruit, température, odeur)
2. Utilisez les équipements de protection individuelle
3. Maintenez votre espace de travail propre et organisé
4. Vérifiez régulièrement les systèmes de support vie
5. Collaborez avec vos collègues pour maintenir un bon environnement

{context}

La sécurité à bord est la priorité absolue."""
    
    if any(word in message_lower for word in ['bonjour', 'salut', 'hi', 'hello', 'hey']):
        return f"""Bonjour astronaute ! 👨‍🚀 Comment puis-je vous aider aujourd'hui ?

Je suis votre assistant IA dédié au suivi spatial. Je peux vous aider avec :
- La gestion du sommeil en microgravité
- La nutrition et l'hydratation
- Le stress et la santé mentale
- L'exercice physique
- La dynamique d'équipage
- L'environnement à bord

{context}

N'oubliez pas de remplir votre questionnaire quotidien pour que je puisse vous fournir des conseils personnalisés !"""
    
    if any(word in message_lower for word in ['merci', 'thank', 'remercie', 'thanks']):
        return """Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.

Bon vol et prenez soin de vous à bord !"""
    
    # Generic response
    return f"""Je comprends votre question : "{user_message}"

Pour vous fournir la meilleure réponse possible, pourriez-vous préciser un peu plus ?

Je peux vous donner des conseils sur :
- La gestion du sommeil en microgravité
- La nutrition et l'hydratation
- Le stress et la santé mentale
- L'exercice physique
- La dynamique d'équipage
- L'environnement à bord

{context}

N'oubliez pas que plus vous remplissez régulièrement le questionnaire, plus mes réponses seront adaptées à votre situation actuelle."""

@app.get("/")
async def root():
    return {"message": "PSYCHOSPACE Backend API"}
