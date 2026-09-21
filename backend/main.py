from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
from typing import Optional

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

class QuestionnaireResponse(BaseModel):
    sleep_hours: float
    mood: str
    stress_level: int
    free_text: Optional[str] = None

class Recommendation(BaseModel):
    psychological_state: str
    detected_signs: list
    exercise_suggestion: str
    timestamp: str

class HistoryItem(BaseModel):
    date: str
    sleep_hours: float
    mood: str
    stress_level: int
    recommendation: str

@app.post("/submit-questionnaire")
async def submit_questionnaire(response: QuestionnaireResponse):
    """Receives questionnaire data and stores it"""
    try:
        # Load existing data
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        # Add new response with timestamp
        response_data = {
            "timestamp": datetime.now().isoformat(),
            "sleep_hours": response.sleep_hours,
            "mood": response.mood,
            "stress_level": response.stress_level,
            "free_text": response.free_text
        }
        
        data["responses"].append(response_data)
        
        # Save updated data
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {"status": "success", "message": "Questionnaire submitted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/store-analysis")
async def store_analysis(analysis: Recommendation):
    """Stores AI analysis results"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        analysis_data = {
            "timestamp": analysis.timestamp,
            "psychological_state": analysis.psychological_state,
            "detected_signs": analysis.detected_signs,
            "exercise_suggestion": analysis.exercise_suggestion
        }
        
        data["analysis_history"].append(analysis_data)
        
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {"status": "success", "message": "Analysis stored successfully"}
    
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
            recommendation = ""
            if i < len(data["analysis_history"]):
                recommendation = data["analysis_history"][i].get("exercise_suggestion", "")
            
            history.append({
                "date": response.get("timestamp", ""),
                "sleep_hours": response.get("sleep_hours", 0),
                "mood": response.get("mood", ""),
                "stress_level": response.get("stress_level", 0),
                "recommendation": recommendation
            })
        
        return {"history": history}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "PSYCHOSPACE Backend API"}
