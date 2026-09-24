# SpAIce

**Suivi du bien-être des astronautes en mission, assisté par IA.** Projet de Workshop EPSI B3.

SpAIce est une console web de type HUD qui permet à chaque membre d'équipage de remplir un bilan quotidien, de consulter son état (stable / attention / alerte) et son historique, de recevoir un programme sportif adapté à la microgravité, de retirer des médicaments prescrits par code, et d'échanger avec un assistant IA qui connaît son dernier bilan et les données du vaisseau.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Installation et lancement](#installation-et-lancement)
- [API](#api)
- [Données](#données)
- [Intelligence artificielle](#intelligence-artificielle)
- [Limitations connues](#limitations-connues)
- [Technologies](#technologies)

---

## Fonctionnalités

| Page | Route | Description |
|------|-------|-------------|
| Connexion / Inscription | `/login`, `/register` | Comptes utilisateurs, mots de passe hachés (bcrypt), session par jeton JWT |
| Tableau de bord | `/dashboard` | Statut global, métriques (sommeil, humeur, stress, fatigue), courbe de tendance sur 7 jours, recommandation |
| Questionnaire | `/questionnaire` | Bilan quotidien en 5 catégories (curseurs et choix) |
| Historique | `/history` | Graphique, tableau des bilans et médicaments retirés sur la période |
| Analyse | `/analysis` | Observations détaillées du dernier bilan et section activité sportive |
| Médicaments | `/medication` | Catalogue des 9 médicaments et retrait par code de prescription à 6 chiffres |
| Exercice | `/exercise` | Programme sportif généré automatiquement, avec cases fait / pas fait |
| Assistant | `/chat` | Chat IA contextuel en français, avec mémoire de conversation |

L'interface est disponible en **français et en anglais** (sélecteur de langue, choix mémorisé dans le navigateur). La barre latérale affiche en continu l'état de connexion à l'API (vérifié toutes les 15 s).

### Questionnaire quotidien

1. **Bilan physique et paramètres vitaux** : énergie (1-10), céphalées ou troubles visuels, symptômes liés à la microgravité, inconfort à l'effort, symptômes légers
2. **Sommeil et rythme circadien** : heures de sommeil, difficultés d'endormissement ou réveils, vigilance
3. **Nutrition, hydratation et digestion** : objectif hydrique, rations caloriques, troubles digestifs
4. **Santé mentale et dynamique d'équipage** : stress (1-10), ambiance de l'équipage, besoins sociaux
5. **Environnement et sécurité à bord** : anomalies d'ambiance, signalement d'incident

Le frontend calcule à partir des réponses des scores sur 100 (humeur, stress, fatigue, qualité du sommeil) et en déduit un statut **stable**, **attention** ou **alerte** (voir [scoring.js](frontend/src/services/scoring.js) et [status.js](frontend/src/utils/status.js)).

### Programme sportif adaptatif

À chaque bilan, le backend transforme les réponses en signaux (sommeil court ou perturbé, stress ≥ 6, douleurs à l'effort, énergie basse ou vigilance réduite). Il tire ensuite un exercice par catégorie concernée (`stress`, `sommeil`, `energie`, `musculaire`) dans la bibliothèque [data/exercises.json](data/exercises.json). La logique se trouve dans `suggest_exercise_plan()` ([agent/ai_agent.py](agent/ai_agent.py)).

### Médicaments

Neuf médicaments fictifs sont définis dans `AIAgent.MEDICATIONS`. Un code de prescription compte 6 chiffres et **son premier chiffre donne l'identifiant du médicament** (1 à 9). Un code ne peut être retiré qu'une fois.

---

## Architecture

```
┌──────────────────────────────┐   /api/*    ┌──────────────────────────────┐
│  Frontend React (Vite)       │ ──────────► │  Backend FastAPI             │
│  localhost:5173              │  proxy Vite │  localhost:8000              │
│  - JWT stocké en localStorage│  (réécrit   │  - auth.py : bcrypt + JWT    │
│  - scoring et statut côté    │   /api → /) │  - main.py : routes          │
│    client                    │             │                              │
└──────────────────────────────┘             └───────┬──────────────┬───────┘
                                                     │              │
                                   ┌─────────────────▼───┐   ┌──────▼─────────────┐
                                   │  data/ (JSON)       │   │  agent/ai_agent.py │
                                   │  - users.json       │   │  AIAgent           │
                                   │  - users/<id>/...   │   │  - analyse du bilan│
                                   │  - data.json        │   │  - prog. sportif   │
                                   │  - exercises.json   │   │  - médicaments     │
                                   │  - medications.json │   └──────┬─────────────┘
                                   └─────────────────────┘          │
                                                             ┌──────▼─────────────┐
                                                             │  OpenRouter API    │
                                                             │  (modèles gratuits)│
                                                             └────────────────────┘
```

---

## Structure du projet

```
workshop_epsi3/
├── frontend/                  # Application React (Vite + Tailwind CSS 4)
│   ├── src/
│   │   ├── pages/             # Dashboard, Questionnaire, History, Analysis, Medication, Exercise, Chat, Login, Register
│   │   ├── components/        # Layout (Sidebar, Header), Dashboard, History, Analysis, Questionnaire, ui
│   │   ├── contexts/          # AuthContext (jeton JWT)
│   │   ├── i18n/              # Traductions FR / EN
│   │   ├── services/          # api.js (client HTTP), scoring.js, checkinMap.js
│   │   └── utils/             # status.js, format.js
│   └── vite.config.js         # Proxy /api → http://127.0.0.1:8000
├── frontend-legacy/           # Ancienne interface HTML/JS, conservée pour référence
├── backend/
│   ├── main.py                # API FastAPI
│   ├── auth.py                # Utilisateurs, hachage bcrypt, JWT
│   └── requirements.txt
├── agent/
│   ├── ai_agent.py            # AIAgent : appels OpenRouter, programme sportif, médicaments
│   └── requirements.txt
└── data/
    ├── users.json             # Comptes utilisateurs
    ├── users/<user_id>/       # Données par utilisateur : data.json, conversations.json, medications.json
    ├── data.json              # Données de référence du vaisseau et programmes sportifs
    ├── exercises.json         # Bibliothèque d'exercices
    └── medications.json       # Registre global des prescriptions
```

---

## Installation et lancement

### Prérequis

- Python 3.10+
- Node.js 18+ et npm
- Une clé API [OpenRouter](https://openrouter.ai/) (les modèles gratuits suffisent)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
pip install bcrypt "python-jose[cryptography]"   # requis par auth.py, absents du requirements.txt
```

Créez un fichier `backend/.env` (et `agent/.env` si vous lancez l'agent seul) :

```env
OPENROUTER_API_KEY="votre_clé_openrouter"
SECRET_KEY="une_chaîne_aléatoire_longue"
```

`SECRET_KEY` signe les jetons JWT. Sans cette variable, une valeur par défaut non sécurisée est utilisée. Les fichiers `.env` sont ignorés par git.

Lancez l'API :

```bash
cd backend
python -m uvicorn main:app --reload
```

L'API écoute sur `http://localhost:8000`. La documentation interactive est disponible sur `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrez `http://localhost:5173`, créez un compte, puis remplissez un premier questionnaire.

Autres scripts : `npm run build` (build de production), `npm run preview`, `npm run lint` (oxlint).

### 3. Tester l'agent seul (optionnel)

```bash
cd agent
python ai_agent.py
```

---

## API

Les routes marquées 🔒 exigent l'en-tête `Authorization: Bearer <jeton>`.

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/register` | Crée un compte (formulaire `username` / `password`) et renvoie un jeton |
| POST | `/token` | Connexion et renvoi d'un jeton JWT (valide 15 min) |

### Bilans et analyse

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/submit-questionnaire` 🔒 | Enregistre un bilan et génère le programme sportif associé |
| GET | `/get-latest-questionnaire` 🔒 | Dernier bilan de l'utilisateur |
| GET | `/get-recommendation` 🔒 | Dernière analyse |
| GET | `/get-history` 🔒 | Historique des bilans et analyses, et médicaments retirés |
| POST | `/analyze-questionnaire` 🔒 | Analyse IA du dernier bilan, avec programme sportif et prescription éventuelle |
| POST | `/store-analysis` | Enregistre une analyse (format `SpaceRecommendation`) |

### Assistant

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/chat` 🔒 | Envoie `{ messages: [...] }` et renvoie `{ response }` |
| GET | `/get-conversation` 🔒 | Historique de conversation de l'utilisateur |
| GET | `/get-user-info` | Nom mémorisé par l'assistant |

### Exercices

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/get-exercise-plan` | Programme sportif le plus récent |
| POST | `/update-exercise-status` | `{ category, completed }` : marque un exercice fait ou pas fait |

### Médicaments

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/get-all-medications` | Catalogue des 9 médicaments |
| GET | `/get-medication-info/{code}` | Médicament correspondant à un code, sans le retirer |
| POST | `/prescribe-medication` | Enregistre une prescription |
| POST | `/claim-medication` | `{ code }` : retire le médicament (usage unique) |
| GET | `/get-prescription/{code}` | Détail d'une prescription |

### Données de référence (lecture seule, issues de `data/data.json`)

`/get-crew` (50 membres d'équipage), `/get-food-stock`, `/get-station-rooms`, `/get-travel-data`, `/get-station-systems`, `/get-space-diseases`.

### Données utilisateur génériques

`GET /get-user-data/{filename}` 🔒 et `POST /save-user-data/{filename}` 🔒 lisent et écrivent un fichier JSON dans `data/users/<id>/`.

---

## Données

Le stockage repose uniquement sur des fichiers JSON, sans base de données.

### Bilan (`POST /submit-questionnaire`)

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
  "incident_report": null,
  "sleep_quality": 6,
  "mood": 7,
  "stress": 4,
  "fatigue": 5
}
```

Les quatre derniers champs sont optionnels.

### Analyse IA (`POST /analyze-questionnaire`)

```json
{
  "psychological_state": "stressé",
  "detected_signs": ["stress élevé", "réveils fréquents"],
  "exercise_suggestion": "5 minutes de cohérence cardiaque dans la salle de détente",
  "medication": {
    "code": "234567",
    "medication_id": 2,
    "medication_name": "Anxiolytique naturel",
    "reason": "Stress élevé détecté"
  },
  "exercise_plan": { "triggered": true, "plan": [ "..." ] },
  "timestamp": "2026-09-24T10:30:00"
}
```

Le champ `medication` n'est présent que si l'IA juge une prescription nécessaire.

### Programme sportif (`GET /get-exercise-plan`)

```json
{
  "triggered": true,
  "plan": [
    {
      "category": "stress",
      "exercise": {
        "name": "Respiration guidée 4-7-8",
        "description": "Inspirer 4s, retenir 7s, expirer 8s, répéter 5 fois",
        "duration_min": 5
      },
      "completed": false
    }
  ]
}
```

---

## Intelligence artificielle

L'IA passe par **OpenRouter** avec une chaîne de repli entre modèles gratuits : `nex-agi/nex-n2.5-mini:free`, puis `nex-agi/nex-n2.5-pro:free`, puis `nvidia/nemotron-3-super-120b-a12b:free`. Si un modèle renvoie une réponse vide, la requête est retentée une fois.

**Analyse du bilan** (`AIAgent.analyze_response`) : l'agent reçoit le sommeil, l'humeur, le stress et un texte libre. Il répond en JSON avec l'état psychologique, les signes détectés, une suggestion d'exercice et, si besoin, une prescription.

**Assistant conversationnel** (`/chat`) :
- le prompt système contient le dernier bilan de l'utilisateur ;
- les données de référence du vaisseau ne sont ajoutées **que si le message les évoque** (mots-clés : équipage, nourriture, salle de sport, voyage, systèmes, maladies). Cela évite de surcharger les modèles gratuits ;
- l'historique de conversation et le prénom de l'utilisateur sont conservés dans `data/users/<id>/conversations.json` ;
- sur une demande de bilan, l'assistant répond dans un format structuré `[BILAN] … [PRESCRIPTION] … [FIN_BILAN]` ;
- l'activité physique en salle de sport est recommandée en priorité, car c'est le principal moyen de lutter contre l'atrophie musculaire en microgravité.

Exemples de questions :
- « Comment mieux dormir en microgravité ? »
- « Fais-moi un bilan. »
- « Qui est dans l'équipage ? »
- « Combien de temps reste-t-il avant l'arrivée ? »
- « Quels exercices pour garder ma masse musculaire ? »

Sans clé OpenRouter, `/chat` renvoie une erreur 400 et `/analyze-questionnaire` renvoie une analyse par défaut.

> ⚠️ Les médicaments, prescriptions et conseils médicaux sont **fictifs** et servent uniquement à la démonstration pédagogique.

---

## Limitations connues

- **Stockage partiellement partagé** : les bilans, analyses et conversations sont isolés par utilisateur, mais les programmes sportifs (`data/data.json`) et le registre utilisé par `/claim-medication` (`data/medications.json`) sont globaux. Les prescriptions générées par `/analyze-questionnaire` sont écrites dans le fichier de l'utilisateur, alors que `/claim-medication` lit le registre global.
- **Routes non protégées** : les routes d'exercices, de médicaments et de données de référence ne vérifient pas le jeton.
- **Jeton court** : un JWT expire après 15 minutes, sans mécanisme de rafraîchissement.
- **CORS ouvert** (`allow_origins=["*"]`) : acceptable en développement uniquement.
- **Données de démonstration versionnées** : `data/users.json` et `data/users/` sont suivis par git.

---

## Technologies

- **Frontend** : React 19, Vite 6, Tailwind CSS 4, React Router 7, Recharts, lucide-react, oxlint
- **Backend** : Python, FastAPI, Uvicorn, Pydantic, python-jose (JWT), bcrypt
- **IA** : API OpenRouter (modèles gratuits avec repli automatique)
- **Stockage** : fichiers JSON

---

## Contexte pédagogique

Projet réalisé dans le cadre du Workshop B3 à l'EPSI. Il met en pratique :
- la séparation frontend / backend et la conception d'une API REST ;
- l'authentification par JWT ;
- l'intégration d'un LLM via OpenRouter, avec construction d'un contexte ciblé ;
- la réalisation d'une interface React complète, bilingue et responsive.


