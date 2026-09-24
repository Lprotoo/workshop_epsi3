import os
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class AIAgent:
    """AI Agent for psychological analysis using OpenRouter API"""
    
    # List of 9 available medications with their descriptions
    MEDICATIONS = {
        1: {"name": "Antidépresseur léger", "description": "Pour les symptômes de déprime et tristesse passagère"},
        2: {"name": "Anxiolytique naturel", "description": "Pour réduire l'anxiété et le stress modéré"},
        3: {"name": "Somnifère doux", "description": "Pour améliorer la qualité du sommeil"},
        4: {"name": "Stimulant mental", "description": "Pour la concentration et la vigilance réduite"},
        5: {"name": "Analgésique spatial", "description": "Pour les maux de tête et migraines en microgravité"},
        6: {"name": "Régulateur digestif", "description": "Pour les troubles digestifs et nausées"},
        7: {"name": "Renforçateur immunitaire", "description": "Pour soutenir le système immunitaire"},
        8: {"name": "Tonifiant musculaire", "description": "Pour soulager les tensions et courbatures"},
        9: {"name": "Équilibreur émotionnel", "description": "Pour stabiliser l'humeur et les émotions"}
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the AI Agent
        
        Args:
            api_key: OpenRouter API key. If None, will try to get from environment variable
        """
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        
        # Default model (free tier)
        self.model = "nex-agi/nex-n2.5-mini:free"
        # Fallback chain: if the primary free model returns an empty response,
        # OpenRouter automatically retries with the next model in this list.
        # OpenRouter accepts 3 models maximum in this array.
        self.fallback_models = [
            self.model,
            "nex-agi/nex-n2.5-pro:free",
            "nvidia/nemotron-3-super-120b-a12b:free",
        ]
        
        # System prompt for psychological analysis
        self.system_prompt = """
        Tu es un assistant psychologique bienveillant et MEDICAL. 
        Analyse les reponses du questionnaire quotidien et fournis une evaluation 
        de l'etat psychologique, les signes detectes, et une suggestion d'exercice 
        pour ameliorer le bien-etre mental.
        
        **REGLE PRINCIPALE : Prescrire un médicament uniquement si des symptômes nécessitent un traitement.**
        Sois généreux en proposant des exercices adaptés et des conseils pour améliorer le bien-être mental.
        Ne prescris un médicament que si les symptômes détectés correspondent clairement à une condition médicale.
        
        **CORRESPONDANCE SYMPTOMES -> MEDICAMENTS (A RESPECTER ABSOLUMENT) :**
        
        MEDICAMENT 1 - Antidépresseur léger :
        - Humeur : deprime, triste, abattu, moral bas, demotive
        - Signes : perte d'interet, sentiment de vide, pleurs
        
        MEDICAMENT 2 - Anxiolytique naturel :
        - Stress level : >= 4/10
        - Humeur : stresse, angoisse, anxieux, inquiet
        - Signes : nervosite, agitation, crisis d'angoisse, panique
        
        MEDICAMENT 3 - Somnifère doux :
        - Heures de sommeil : < 7h
        - Signes : insomnie, difficulte a s'endormir, reveils nocturnes, fatigue au reveil
        
        MEDICAMENT 4 - Stimulant mental :
        - Heures de sommeil : > 9h (sommeil trop long)
        - Signes : difficulte a se concentrer, brouillard mental, manque de vigilance
        - Humeur : fatigue mentalement, epuise
        
        MEDICAMENT 5 - Analgésique spatial :
        - Signes : mal de tete, migraine, douleur cranienne, pression dans la tete
        - Contexte : microgravite, changement de pression
        
        MEDICAMENT 6 - Régulateur digestif :
        - Signes : ballonnements, nausees, troubles digestifs, maux de ventre, diarrhee, constipation
        - Contexte : digestion difficile
        
        MEDICAMENT 7 - Renforçateur immunitaire :
        - Signes : fatigue persistante, infections frequentes, systeme immunitaire affaibli
        - Contexte : environnement spatial stressant
        
        MEDICAMENT 8 - Tonifiant musculaire :
        - Signes : courbatures, douleurs musculaires, tensions physiques, fatigue musculaire
        - Contexte : effort physique, exercice
        
        MEDICAMENT 9 - Équilibreur émotionnel :
        - Humeur : labile, changeante, irritable, emocions instables
        - Signes : sautes d'humeur, colere, frustration, hypersensibilite
        
        **REGLES DE PRESCRIPTION :**
        1. Ne prescris un médicament que si les symptômes détectés correspondent clairement à une condition médicale.
        2. Si plusieurs symptômes correspondent à différents médicaments, choisis LE PLUS PERTINENT.
        3. Si aucun symptôme médical n'est détecté, ne prescris PAS de médicament. Dans ce cas, le champ "medication" ne doit PAS être présent dans la réponse.
        4. Si un médicament est prescrit, génère TOUJOURS un code à 6 chiffres aléatoires (le premier chiffre = medication_id).
        
        **ANALYSE DES DONNEES DU QUESTIONNAIRE POUR LES EXERCICES SPORTIFS :**
        Voici comment adapter les suggestions d'exercices en fonction des données du questionnaire :
        
        - **Courbatures/Douleurs musculaires (exercise_discomfort = douleurs_articulaires, fatigue_extreme)** : 
          "Fais 10-15 minutes d'étirements doux ou de yoga dans la salle de sport pour soulager les tensions musculaires."
        
        - **Stress/Anxiété (stress_level >= 4/10)** : 
          "Pratique 5-10 minutes de respiration profonde ou de méditation guidée dans la salle de détente pour réduire le stress."
        
        - **Sommeil perturbé (sleep_hours < 7 ou sleep_difficulties != 'aucun')** : 
          "Fais une séance de relaxation musculaire ou de yoga doux avant de dormir pour améliorer la qualité du sommeil."
        
        - **Fatigue persistante (fatigue >= 7/10 ou energy_level <= 3)** : 
          "Fais 15-20 minutes de vélo ou de tapis de course pour stimuler ta circulation sanguine et réduire la fatigue."
        
        - **Baisse de concentration (vigilance_level = baisse_concentration, fatigue_mentale)** : 
          "Fais une pause active avec des exercices de mobilité ou de stretching pour relancer ta vigilance."
        
        - **Microgravité (microgravity_symptoms != 'aucun')** : 
          "Fais des exercices de mobilité articulaire et de renforcement musculaire pour lutter contre l'atrophie en microgravité."
        
        **IMPORTANT :** Ces suggestions doivent être incluses dans la réponse JSON sous le champ `exercise_suggestion`.
        
        **FORMAT OBLIGATOIRE avec medicament :**
        {
            "psychological_state": "etat psychologique",
            "detected_signs": ["liste des signes detectes"],
            "exercise_suggestion": "suggestion d'exercice concret",
            "medication": {
                "code": "CODE_A_6_CHIFFRES",
                "medication_id": NUMERO_DE_1_A_9,
                "medication_name": "nom du medicament parmi la liste",
                "reason": "explication claire de pourquoi ce medicament est prescrit"
            }
        }
        
        **EXEMPLES DE SUGGESTIONS D'EXERCICES SPORTIFS (à inclure quand pertinent) :**
        - Si l'utilisateur a des courbatures ou des douleurs musculaires : "Fais 10 minutes d'étirements doux dans la salle de sport du vaisseau pour soulager les tensions."
        - Si l'utilisateur est stressé ou anxieux : "Pratique 5 minutes de respiration profonde ou de méditation guidée dans la salle de détente."
        - Si l'utilisateur a un sommeil perturbé : "Fais une séance de yoga ou de relaxation musculaire avant de dormir."
        - Si l'utilisateur a une fatigue persistante : "Fais 15 minutes de vélo ou de tapis de course pour stimuler ta circulation sanguine."
        - Si l'utilisateur a une baisse de concentration : "Fais une pause active avec des exercices de mobilité pour relancer ta vigilance."
        
        **Si aucun symptôme médical n'est détecté :**
        {
            "psychological_state": "optimal",
            "detected_signs": ["aucun symptôme nécessitant un traitement"],
            "exercise_suggestion": "Continuez ainsi ! L'exercice physique régulier est excellent pour maintenir votre bien-être en mission spatiale."
        }
        
        **IMPORTANT :**
        - Le code DOIT etre une chaine de EXACTEMENT 6 chiffres
        - Le medication_id DOIT correspondre au premier chiffre du code
        - Le medication_name DOIT etre exactement celui de la liste ci-dessus
        - Reponds UNIQUEMENT en JSON valide
        - Sois proactif : meme un petit symptome merit une prescription
        
        Format de reponse attendu (JSON) :
        {
            "psychological_state": "etat psychologique (ex: bon, stresse, deprime, equilibre)",
            "detected_signs": ["liste des signes detectes"],
            "exercise_suggestion": "suggestion d'exercice concret et realisable"
        }
        
        Regles generales :
        - Sois empathique et constructif
        - Base tes reponses UNIQUEMENT sur les donnees fournies
        - Propose des exercices simples et accessibles
        - Reponds UNIQUEMENT en JSON valide
        """
    
    def generate_medication_code(self, medication_id: int) -> str:
        """
        Generate a fake medication code where only the first digit matters
        
        Args:
            medication_id: The medication ID (1-9)
            
        Returns:
            A 6-digit code string where the first digit is the medication_id
        """
        import random
        if medication_id < 1 or medication_id > 9:
            raise ValueError("Medication ID must be between 1 and 9")
        
        # Generate 5 random digits for the rest of the code
        random_digits = ''.join([str(random.randint(0, 9)) for _ in range(5)])
        return f"{medication_id}{random_digits}"
    
    def get_medication_info(self, code: str) -> Dict[str, Any]:
        """
        Get medication information from a code
        
        Args:
            code: The medication code (6-digit string)
            
        Returns:
            Dictionary with medication info, or None if invalid
        """
        if not code or len(code) < 1:
            return None
        
        try:
            # Extract the first digit (the only one that matters)
            medication_id = int(code[0])
            
            if medication_id >= 1 and medication_id <= 9:
                med_info = self.MEDICATIONS[medication_id].copy()
                med_info['id'] = medication_id
                med_info['code'] = code
                return med_info
            return None
        except (ValueError, IndexError):
            return None
    
    def analyze_response(self, sleep_hours: float, mood: str, stress_level: int, 
                        free_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze questionnaire response using AI
        
        Args:
            sleep_hours: Number of hours slept
            mood: Mood description (string)
            stress_level: Stress level (0-10)
            free_text: Optional free text response
            
        Returns:
            Dictionary with psychological analysis
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key is required. No fallback available.")
        
        # Prepare user message
        user_message = f"""
        Analyse cette reponse de questionnaire quotidien :
        - Heures de sommeil : {sleep_hours}
        - Humeur : {mood}
        - Niveau de stress : {stress_level}/10
        - Texte libre : {free_text or 'Aucun'}
        
        Fournis ton analyse au format JSON comme specifie dans les instructions.
        """
        
        # Prepare request payload ("models" = fallback chain on OpenRouter)
        payload = {
            "models": self.fallback_models,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_message}
            ],
            "response_format": {"type": "json_object"}
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            # Make API request (retry once on empty content, a known
            # intermittent failure of free-tier models)
            import time
            analysis = None
            for attempt in range(2):
                response = requests.post(
                    self.base_url,
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                response.raise_for_status()
                
                result = response.json()
                
                if 'choices' in result and len(result['choices']) > 0:
                    content = result['choices'][0]['message'].get('content')
                    if content and content.strip():
                        try:
                            analysis = json.loads(content)
                        except json.JSONDecodeError:
                            analysis = None
                        if analysis is not None:
                            break
                if attempt == 0:
                    time.sleep(2)
            
            if analysis is not None:
                analysis['timestamp'] = datetime.now().isoformat()
                return analysis
            
            # Both attempts failed (empty or unparseable content)
            return {
                "psychological_state": "inconnu",
                "detected_signs": ["analyse impossible"],
                "exercise_suggestion": "Essaie de prendre un moment pour toi",
                "timestamp": datetime.now().isoformat()
            }
                
        except requests.exceptions.RequestException as e:
            # No fallback - AI is required
            raise ValueError(f"AI API error: {e}. OpenRouter API is required for this application.")

# Example usage
if __name__ == "__main__":
    # Test the AI agent (will fail without API key)
    agent = AIAgent()
    
    # Example analysis
    analysis = agent.analyze_response(
        sleep_hours=6.5,
        mood="un peu stresse",
        stress_level=7,
        free_text="J'ai beaucoup de travail en ce moment"
    )
    
    print("AI Analysis:")
    print(json.dumps(analysis, indent=2, ensure_ascii=False))
