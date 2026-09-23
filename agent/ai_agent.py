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
        
        # System prompt for psychological analysis
        self.system_prompt = """
        Tu es un assistant psychologique bienveillant et MEDICAL. 
        Analyse les reponses du questionnaire quotidien et fournis une evaluation 
        de l'etat psychologique, les signes detectes, et une suggestion d'exercice 
        pour ameliorer le bien-etre mental.
        
        **REGLE PRINCIPALE : TU DOIS prescrire un medicament a chaque analyse qui presente au moins un symptome.**
        Memes les petits symptomes meritent une attention medicale. Sois generaux et proactif dans tes prescriptions.
        
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
        1. TU DOIS TOUJOURS prescrire un medicament quand il y a au moins un symptome dans les reponses
        2. Si plusieurs symptomes correspondent a different medicaments, choisis LE PLUS PERTINENT
        3. Si aucun symptome clair n'est detecte, prescris le medicament 9 (Equilibreur emotionnel) par defaut
        4. Genere TOUJOURS un code a 6 chiffres aleatoires (mais le premier chiffre = medication_id)
        5. Le champ "medication" DOIT etre present dans chaque reponse avec symptomes
        
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
        
        **Si ABSOLUMENT aucun symptome (tout est parfait) :**
        {
            "psychological_state": "optimal",
            "detected_signs": ["aucun"],
            "exercise_suggestion": "Continuez ainsi !",
            "medication": {
                "code": "900000",
                "medication_id": 9,
                "medication_name": "Équilibreur émotionnel",
                "reason": "Maintenance preventive du bien-etre"
            }
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
        
        # Prepare request payload
        payload = {
            "model": self.model,
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
            # Make API request
            response = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Extract and parse the JSON content from the AI response
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                
                try:
                    # Parse the JSON string
                    analysis = json.loads(content)
                    
                    # Add timestamp
                    analysis['timestamp'] = datetime.now().isoformat()
                    
                    return analysis
                except json.JSONDecodeError:
                    # If parsing fails, return a structured response
                    return {
                        "psychological_state": "inconnu",
                        "detected_signs": ["analyse impossible"],
                        "exercise_suggestion": "Essaie de prendre un moment pour toi",
                        "timestamp": datetime.now().isoformat()
                    }
            else:
                return {
                    "psychological_state": "inconnu",
                    "detected_signs": ["pas de reponse de l'AI"],
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
