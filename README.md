# PSYCHOSPACE - Projet de cours EPSI

## Architecture du Projet

PSYCHOSPACE est une application web pour le suivi du bien-être mental quotidien avec analyse IA.

```
┌─────────────────────────────────────────────────────────────────┐
│              PSYCHOSPACE — ARCHITECTURE (projet de cours)         │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐
│   INTERFACE WEB (Frontend)   │
│   (HTML / CSS / JS)          │
│                              │
│  - Questionnaire quotidien    │
│    (sommeil, humeur,          │
│     stress, texte libre)      │
│  - Affichage recommandation    │
│  - Historique simple            │
└──────────────┬───────────────┘
               │ HTTP/REST (JSON)
               ▼
┌────────────────────────────┐
│   BACKEND (FastAPI)          │
│                              │
│  - Reçoit le questionnaire     │
│  - Écrit dans le fichier JSON  │
│  - Appelle l'agent IA          │
│  - Renvoie la recommandation    │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────────────┐
│  data.json    │  │   AGENT IA             │
│  (stockage     │  │   (OpenRouter API)      │
│   simple)      │  │                         │
│                │  │  Envoie les réponses      │
│  - réponses    │  │  du jour → modèle gratuit  │
│    par jour    │  │  (:free)                   │
│  - analyses IA │  │       ↓                     │
│                │  │  Reçoit en retour :          │
└──────┬────────┘  │  - état psychologique          │
       │           │  - signes détectés               │
       │           │  - suggestion d'exercice           │
       │           └───────────┬───────────────────────┘
       │                       │
       └───────────┬───────────┘
                    ▼
       ┌────────────────────────┐
       │  RECOMMANDATION          │
       │  renvoyée au frontend      │
       │  et affichée à l'écran       │
       └────────────────────────┘
```

## Structure du Projet

```
workshop_epsi3/
├── frontend/
│   ├── index.html          # Page principale
│   ├── styles.css          # Styles CSS
│   └── app.js              # JavaScript du frontend
├── backend/
│   ├── main.py             # API FastAPI
│   └── requirements.txt    # Dépendances backend
├── agent/
│   ├── ai_agent.py         # Agent IA avec OpenRouter
│   └── requirements.txt    # Dépendances agent
├── data/
│   └── data.json           # Stockage des données
└── README.md               # Documentation
```

## Installation et Exécution

### Prérequis
- Python 3.7+
- Node.js (optionnel, pour le frontend)
- pip

### 1. Installation des dépendances

```bash
# Backend
cd backend
pip install -r requirements.txt

# Agent IA
cd ../agent
pip install -r requirements.txt
```

### 2. Configuration

Créez un fichier `.env` dans le dossier `agent/` avec votre clé API OpenRouter :

```env
OPENROUTER_API_KEY=votre_clé_api_ici
```

> **Note** : L'application fonctionne aussi sans clé API grâce à un système de fallback.

### 3. Lancement du backend

```bash
cd backend
uvicorn main:app --reload
```

Le backend sera accessible sur `http://localhost:8000`

### 4. Accès au frontend

Ouvrez simplement le fichier `frontend/index.html` dans votre navigateur.

> **Note** : Pour une meilleure expérience, vous pouvez utiliser un serveur web simple :
> ```bash
> cd frontend
> python -m http.server 8001
> ```
> Puis accédez à `http://localhost:8001`

## Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/submit-questionnaire` | Soumet un questionnaire |
| POST | `/store-analysis` | Stocke une analyse IA |
| GET | `/get-recommendation` | Récupère la dernière recommandation |
| GET | `/get-history` | Récupère l'historique complet |

## Format des données

### Questionnaire
```json
{
    "sleep_hours": 7.5,
    "mood": "bon",
    "stress_level": 3,
    "free_text": "J'ai bien dormi"
}
```

### Analyse IA
```json
{
    "psychological_state": "équilibré",
    "detected_signs": ["humeur positive"],
    "exercise_suggestion": "Continue à prendre soin de toi",
    "timestamp": "2024-01-15T10:30:00"
}
```

### Historique
```json
{
    "history": [
        {
            "date": "2024-01-15T10:30:00",
            "sleep_hours": 7.5,
            "mood": "bon",
            "stress_level": 3,
            "recommendation": "Continue à prendre soin de toi"
        }
    ]
}
```

## Fonctionnalités

### Frontend
- ✅ Questionnaire quotidien (sommeil, humeur, stress, texte libre)
- ✅ Affichage des recommandations IA
- ✅ Historique des réponses et recommandations
- ✅ Design responsive et moderne
- ✅ Messages de succès/erreur
- ✅ Fallback local si l'API IA n'est pas disponible

### Backend
- ✅ API REST avec FastAPI
- ✅ Stockage des données dans `data.json`
- ✅ Endpoints pour le questionnaire, les analyses et l'historique
- ✅ CORS configuré pour le développement

### Agent IA
- ✅ Intégration avec OpenRouter API
- ✅ Modèle gratuit (Mistral 7B Instruct)
- ✅ Analyse psychologique structurée
- ✅ Fallback local avec règles simples

## Technologies Utilisées

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: FastAPI, Python 3.7+
- **IA**: OpenRouter API (Mistral 7B Instruct)
- **Stockage**: JSON

## Auteurs

Projet réalisé dans le cadre d'un cours EPSI.

## Licence

MIT
