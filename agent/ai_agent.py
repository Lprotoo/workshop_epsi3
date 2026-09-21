import os
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional

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
        self.model = "mistralai/mistral-7b-instruct:free"
        
        # System prompt for psychological analysis
        self.system_prompt = """
        Tu es un assistant psychologique bienveillant. 
        Analyse les réponses du questionnaire quotidien et fournis une évaluation 
        de l'état psychologique, les signes détectés, et une suggestion d'exercice 
        pour améliorer le bien-être mental.
        
        Format de réponse attendu (JSON) :
        {
            "psychological_state": "état psychologique (ex: bon, stressé, déprimé, équilibré)",
            "detected_signs": ["liste des signes détectés"],
            "exercise_suggestion": "suggestion d'exercice concret et réalisable"
        }
        
        Règles :
        - Sois empathique et constructif
        - Base tes réponses sur les données fournies
        - Propose des exercices simples et accessibles
        - Réponds UNIQUEMENT en JSON valide
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
            raise ValueError("OpenRouter API key is required")
        
        # Prepare user message
        user_message = f"""
        Analyse cette réponse de questionnaire quotidien :
        - Heures de sommeil : {sleep_hours}
        - Humeur : {mood}
        - Niveau de stress : {stress_level}/10
        - Texte libre : {free_text or 'Aucun'}
        
        Fournis ton analyse au format JSON comme spécifié dans les instructions.
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
                    "detected_signs": ["pas de réponse de l'AI"],
                    "exercise_suggestion": "Essaie de prendre un moment pour toi",
                    "timestamp": datetime.now().isoformat()
                }
                
        except requests.exceptions.RequestException as e:
            # Fallback analysis if API fails
            print(f"AI API error: {e}")
            return self._fallback_analysis(sleep_hours, mood, stress_level, free_text)
    
    def _fallback_analysis(self, sleep_hours: float, mood: str, stress_level: int, 
                          free_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Fallback analysis when AI API is unavailable
        
        Args:
            sleep_hours: Number of hours slept
            mood: Mood description
            stress_level: Stress level (0-10)
            free_text: Optional free text
            
        Returns:
            Basic analysis based on simple rules
        """
        detected_signs = []
        
        # Analyze sleep
        if sleep_hours < 6:
            detected_signs.append("manque de sommeil")
        elif sleep_hours > 9:
            detected_signs.append("excès de sommeil")
        
        # Analyze stress
        if stress_level >= 8:
            detected_signs.append("stress élevé")
        elif stress_level >= 5:
            detected_signs.append("stress modéré")
        
        # Analyze mood
        mood_lower = mood.lower()
        if any(word in mood_lower for word in ['triste', 'déprimé', 'mauvais']):
            detected_signs.append("humeur négative")
        elif any(word in mood_lower for word in ['joyeux', 'bon', 'excellent']):
            detected_signs.append("humeur positive")
        
        # Determine psychological state
        if stress_level >= 7 or sleep_hours < 5:
            psychological_state = "fatigué/stressé"
        elif stress_level <= 3 and sleep_hours >= 7:
            psychological_state = "équilibré"
        else:
            psychological_state = "normal"
        
        # Generate exercise suggestion
        if stress_level >= 7:
            exercise_suggestion = "Pratique 10 minutes de respiration profonde ou de méditation"
        elif sleep_hours < 6:
            exercise_suggestion = "Essaie de te coucher plus tôt ce soir et de te détendre"
        elif any(word in mood_lower for word in ['triste', 'déprimé']):
            exercise_suggestion = "Fais une activité qui te plaît : marche, musique, ou appel à un ami"
        else:
            exercise_suggestion = "Continue à prendre soin de toi avec une routine équilibrée"
        
        return {
            "psychological_state": psychological_state,
            "detected_signs": detected_signs or ["aucune anomalie détectée"],
            "exercise_suggestion": exercise_suggestion,
            "timestamp": datetime.now().isoformat()
        }

# Example usage
if __name__ == "__main__":
    # Test the AI agent (will fail without API key)
    agent = AIAgent()
    
    # Example analysis
    analysis = agent.analyze_response(
        sleep_hours=6.5,
        mood="un peu stressé",
        stress_level=7,
        free_text="J'ai beaucoup de travail en ce moment"
    )
    
    print("AI Analysis:")
    print(json.dumps(analysis, indent=2, ensure_ascii=False))
