import os
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class AIAgent:
    """AI Agent for psychological analysis using OpenRouter API"""
    
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
        Tu es un assistant psychologique bienveillant. 
        Analyse les reponses du questionnaire quotidien et fournis une evaluation 
        de l'etat psychologique, les signes detectes, et une suggestion d'exercice 
        pour ameliorer le bien-etre mental.
        
        Format de reponse attendu (JSON) :
        {
            "psychological_state": "etat psychologique (ex: bon, stresse, deprime, equilibre)",
            "detected_signs": ["liste des signes detectes"],
            "exercise_suggestion": "suggestion d'exercice concret et realisable"
        }
        
        Regles :
        - Sois empathique et constructif
        - Base tes reponses sur les donnees fournies
        - Propose des exercices simples et accessibles
        - Reponds UNIQUEMENT en JSON valide
        """
    
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
