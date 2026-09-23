# spAICE - Projet de Workshop B3

## 🚀 Suivi Spatial avec Assistant IA

spAIce est une application web complète pour le suivi du bien-être des astronautes en mission spatiale, avec un système de questionnaire quotidien et un assistant IA contextuel.

## 🏗️ Architecture du Projet

```
┌─────────────────────────────────────────────────────────────────┐
│           spAIce — ARCHITECTURE SPATIALE (v2)               │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────┐
                    │   PAGE PRINCIPALE             │
                    │   (index.html)                │
                    │                             │
                    │  ┌─────────────────────────┐│
                    │  │  💬 CHAT IA                ││
                    │  │  - Messages en temps réel ││
                    │  │  - Réponses contextuelles  ││
                    │  │  - Historique conversation  ││
                    │  └──────────┬───────────────┘│
                    │             │                 │
                    │  ┌──────────┴─────────────┐ │
                    │  │  📋 BOUTON QUESTIONNAIRE   │ │
                    │  │  (Redirige vers            │ │
                    │  │   questionnaire.html)       │ │
                    │  └─────────────────────────┘ │
                    │                             │
                    │  ┌─────────────────────────┐│
                    │  │  📊 SIDEBAR                ││
                    │  │  - Bilan rapide           ││
                    │  │  - Historique récent       ││
                    │  └─────────────────────────┘│
                    └──────────────┬───────────────┘
                                   │ HTTP/REST (JSON)
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│   BACKEND (FastAPI)                                              │
│                                                                   │
│  - /submit-questionnaire    (POST) - Soumet questionnaire spatial │
│  - /store-analysis           (POST) - Stocke analyse IA          │
│  - /get-latest-questionnaire (GET)  - Récupère dernier questionnaire│
│  - /get-recommendation        (GET)  - Récupère dernière analyse   │
│  - /get-history              (GET)  - Récupère historique         │
│  - /chat                     (POST) - Chat avec IA contextuel     │
└─────────────────────────────┬───────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────┐
│  data.json       │   │   AGENT IA           │   │  Chat Context   │
│  (Stockage)      │   │   (Backend intégré)   │   │  (Adapté aux     │
│                 │   │                     │   │   réponses)      │
│  - Réponses     │   │  - Analyse spatiale  │   │                 │
│  - Analyses IA  │   │  - Génération de      │   │  - Réponses     │
│  - Historique   │   │    recommandations   │   │    personnalisées│
└─────────────────┘   └─────────────────────┘   └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│   PAGE QUESTIONNAIRE                                          │
│   (questionnaire.html)                                         │
│                                                                   │
│  📋 Questionnaire Spatial avec 5 catégories :                  │
│  1. Bilan physique & paramètres vitaux                         │
│  2. Sommeil & rythme circadien                                 │
│  3. Nutrition, hydratation & digestion                         │
│  4. Santé mentale & dynamique d'équipage                         │
│  5. Environnement & sécurité à bord                           │
│                                                                   │
│  [Soumettre] → Redirige vers index.html avec analyse         │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Structure du Projet

```
workshop_epsi3/
├── frontend/                    # App React (Vite)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── frontend-legacy/             # Ancien frontend HTML
│   ├── index.html
│   ├── questionnaire.html
│   └── medication.html
├── backend/
│   ├── main.py                 # API FastAPI avec 6 endpoints
│   └── requirements.txt        # Dépendances Python
├── agent/
│   ├── ai_agent.py             # Agent IA avec OpenRouter
│   └── requirements.txt        # Dépendances agent
├── data/
│   └── data.json               # Stockage des données
└── README.md                   # Documentation
```

## 🎯 Fonctionnalités

### 📋 Questionnaire Spatial
Le questionnaire comprend **5 catégories** avec des questions spécifiques à l'environnement spatial :

#### 1. Bilan physique & paramètres vitaux
- Niveau d'énergie (1-10)
- Céphalées, troubles de la vision, pression intracrânienne
- Nausées, désorientation, vertiges liés à la microgravité
- Inconforts physiques lors des exercices
- Symptômes légers (éruptions, irritations, saignements)

#### 2. Sommeil & rythme circadien
- Heures de sommeil effectif
- Difficultés à s'endormir / réveils fréquents
- Niveau de vigilance actuel

#### 3. Nutrition, hydratation & digestion
- Objectif d'apport hydrique atteint
- Rations caloriques consommées
- Troubles digestifs ou perte d'appétit

#### 4. Santé mentale & dynamique d'équipage
- Niveau de stress/anxiété (1-10)
- Ambiance et communication dans l'équipage
- Besoin d'isolement ou manque de soutien social

#### 5. Environnement & sécurité à bord
- Anomalies d'ambiance (bruit, température, odeurs)
- Signalement d'incidents techniques

### 💬 Chat IA Contextuel
- **Réponses adaptées** en fonction des dernières réponses au questionnaire
- **Mémoire de conversation** pour maintenir le contexte
- **Réponses par mots-clés** pour les questions courantes


### 📊 Tableau de bord
- **Bilan rapide** (énergie, stress, sommeil, dernière réponse)
- **Historique récent** (3 dernières entrées)
- **Statistiques en temps réel**

## 🚀 Installation et Exécution

### Prérequis
- Python 3.7+
- pip
- Node.js (npm)
- Un navigateur web moderne

### 1. Installation des dépendances

```bash
# Backend
cd backend
pip install -r requirements.txt
```

### 2. Configuration (optionnelle)

Pour utiliser l'API OpenRouter, créez un fichier `.env` dans le dossier `agent/` et dans le dossier `backend/` :

```env
OPENROUTER_API_KEY="votre_clé_api_ici"
```

> **Note** : L'application **nécessite** une clé API OpenRouter pour fonctionner. Aucune solution de secours (fallback) n'est disponible.

### 3. Lancement du backend

```bash
cd backend
python -m uvicorn main:app --reload
```

Le backend sera accessible sur `http://localhost:8000`

### 4. Accès au frontend (React)

Le frontend spAIce (dashboard, questionnaire, historique, analyse, médicaments, assistant) est dans `frontend/`. L’ancien HTML est conservé dans `frontend-legacy/`.

```bash
cd frontend
npm install
npm run dev
```

Puis ouvrez `http://localhost:5173` (le proxy Vite envoie `/api` vers FastAPI sur le port 8000).

## 🔌 Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/submit-questionnaire` | Soumet un questionnaire spatial |
| POST | `/store-analysis` | Stocke une analyse IA |
| GET | `/get-latest-questionnaire` | Récupère le dernier questionnaire |
| GET | `/get-recommendation` | Récupère la dernière recommandation |
| GET | `/get-history` | Récupère l'historique complet |
| POST | `/chat` | Chat avec l'IA (réponses contextuelles) |

## 📊 Format des données

### Questionnaire Spatial
```json
{
    "energy_level": 7,
    "head_symptoms": "aucun",
    "microgravity_symptoms": "nausees",
    "exercise_discomfort": "douleurs_articulaires",
    "mild_symptoms": "secheresse",
    "sleep_hours": 6.5,
    "sleep_difficulties": "reveils_frequents",
    "vigilance_level": "normal",
    "hydration_goal": "presque",
    "caloric_intake": "oui",
    "digestive_issues": "aucun",
    "stress_level": 4,
    "crew_mood": "bonne",
    "social_needs": "equilibre",
    "environment_anomalies": "aucun",
    "incident_report": null
}
```

### Analyse IA
```json
{
    "psychological_state": "normal",
    "risk_level": "faible",
    "detected_issues": ["niveau d'énergie bas", "réveils fréquents"],
    "recommendations": [
        "Vérifier le sommeil et l'alimentation",
        "Techniques de relaxation avant le coucher"
    ],
    "exercise_suggestions": [
        "10 minutes de méditation guidée",
        "Routine de relaxation avant le coucher"
    ],
    "timestamp": "2024-01-15T10:30:00",
    "context_summary": "Énergie: 7/10, Stress: 4/10, Sommeil: 6.5h"
}
```

## 🎨 Design

- **Couleurs principales** : Violet spatial (#6c5ce7) avec dégradés
- **Design responsive** : Adapté mobile, tablette et desktop
- **Animations** : Effets de fade-in, typing indicator, float
- **Layout** : Sidebar + Chat principal pour la page d'accueil

## 🤖 Intelligence Artificielle

### Fonctionnement
1. L'utilisateur remplit le questionnaire quotidien
2. Les données sont stockées dans `data.json`
3. Le chat IA utilise ces données pour adapter ses réponses
4. Les réponses sont générées en fonction du contexte spatial

### Capacités
- ✅ Réponses personnalisées basées sur l'état actuel
- ✅ Conseils spécifiques à l'environnement spatial
- ✅ Gestion du stress, sommeil, nutrition, etc.
- ✅ Détection de problèmes et recommandations
- ✅ Mémoire de conversation

## 📝 Exemples de questions pour le chat

- "Comment puis-je améliorer mon sommeil en microgravité ?"
- "Je ressens des vertiges, que faire ?"
- "Mon niveau de stress est élevé, des conseils ?"
- "Quels exercices pour maintenir ma masse musculaire ?"
- "Comment gérer les tensions dans l'équipage ?"
- "Quels sont les signes d'une mauvaise hydratation ?"

## 🛠️ Technologies Utilisées

- **Frontend**: React, Vite, Tailwind CSS, React Router, Recharts
- **Backend**: FastAPI, Python 3.7+
- **IA**: OpenRouter API (obligatoire)
- **Stockage**: JSON
- **Design**: CSS moderne avec variables, animations, responsive

## 🎓 Contexte Pédagogique

Projet réalisé dans le cadre d'un cours EPSI. L'architecture illustre :
- La séparation frontend/backend
- L'utilisation d'une API REST
- Le stockage de données simple
- L'intégration d'une IA avec OpenRouter API
- Le développement d'une interface utilisateur complète

## 📜 Licence

MIT
