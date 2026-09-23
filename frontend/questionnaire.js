// PSYCHOSPACE - Questionnaire Spatial
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const form = document.getElementById('space-questionnaire-form');
const energyLevelInput = document.getElementById('energy-level');
const energyValueDisplay = document.getElementById('energy-value');
const stressLevelInput = document.getElementById('stress-level');
const stressValueDisplay = document.getElementById('stress-value');
const submitBtn = document.querySelector('.btn-primary');

// Update displays
energyLevelInput.addEventListener('input', function() {
    energyValueDisplay.textContent = this.value;
});

stressLevelInput.addEventListener('input', function() {
    stressValueDisplay.textContent = this.value;
});

// Form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // Collect all form data
        const formData = {
            // Bilan physique & paramètres vitaux
            energy_level: parseInt(energyLevelInput.value),
            head_symptoms: document.getElementById('head-symptoms').value,
            microgravity_symptoms: document.getElementById('microgravity-symptoms').value,
            exercise_discomfort: document.getElementById('exercise-discomfort').value,
            mild_symptoms: document.getElementById('mild-symptoms').value,
            
            // Sommeil & rythme circadien
            sleep_hours: parseFloat(document.getElementById('sleep-hours').value),
            sleep_difficulties: document.getElementById('sleep-difficulties').value,
            vigilance_level: document.getElementById('vigilance-level').value,
            
            // Nutrition, hydratation & digestion
            hydration_goal: document.getElementById('hydration-goal').value,
            caloric_intake: document.getElementById('caloric-intake').value,
            digestive_issues: document.getElementById('digestive-issues').value,
            
            // Santé mentale & dynamique d'équipage
            stress_level: parseInt(stressLevelInput.value),
            crew_mood: document.getElementById('crew-mood').value,
            social_needs: document.getElementById('social-needs').value,
            
            // Environnement & sécurité à bord
            environment_anomalies: document.getElementById('environment-anomalies').value,
            incident_report: document.getElementById('incident-report').value || null
        };
        
        // Submit to backend
        const response = await fetch(`${API_BASE_URL}/submit-questionnaire`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
                if (!response.ok) {
            throw new Error('Erreur lors de la soumission du questionnaire');
        }
        
        // Trigger AI analysis (includes exercise_plan generation)
        await fetch(`${API_BASE_URL}/analyze-questionnaire`, {
            method: 'POST'
        });
        
        // Show success message
        showMessage('Questionnaire soumis avec succès ! Redirection vers le chat...', 'success');
        
        // Redirect to main page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(`Erreur: ${error.message}`, 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// Perform space-specific analysis
async function performSpaceAnalysis(data) {
    const detected_issues = [];
    const recommendations = [];
    let psychological_state = 'normal';
    let risk_level = 'faible';
    
    // === Bilan physique & paramètres vitaux ===
    
    // Énergie
    if (data.energy_level <= 3) {
        detected_issues.push('niveau d\'énergie très bas');
        recommendations.push('Augmenter les apports caloriques et vérifier l\'hydratation');
        risk_level = 'élevé';
    } else if (data.energy_level <= 5) {
        detected_issues.push('niveau d\'énergie bas');
        recommendations.push('Vérifier le sommeil et l\'alimentation');
    }
    
    // Symptômes crâniens
    if (data.head_symptoms && data.head_symptoms !== 'aucun') {
        detected_issues.push(`symptômes crâniens: ${data.head_symptoms}`);
        recommendations.push('Surveillance médicale recommandée');
        if (data.head_symptoms.includes('pression')) {
            risk_level = 'élevé';
        }
    }
    
    // Symptômes de microgravité
    if (data.microgravity_symptoms && data.microgravity_symptoms !== 'aucun') {
        detected_issues.push(`symptômes de microgravité: ${data.microgravity_symptoms}`);
        recommendations.push('Adaptation en cours, symptômes normaux les premiers jours');
    }
    
    // Inconfort à l'exercice
    if (data.exercise_discomfort && data.exercise_discomfort !== 'aucun') {
        detected_issues.push(`inconfort à l\'exercice: ${data.exercise_discomfort}`);
        recommendations.push('Adapter l\'intensité de l\'exercice');
        if (data.exercise_discomfort.includes('fatigue_extreme')) {
            risk_level = 'élevé';
        }
    }
    
    // Symptômes légers
    if (data.mild_symptoms && data.mild_symptoms !== 'aucun') {
        detected_issues.push(`symptômes légers: ${data.mild_symptoms}`);
        recommendations.push('Surveiller l\'évolution des symptômes');
    }
    
    // === Sommeil & rythme circadien ===
    
    // Heures de sommeil
    if (data.sleep_hours < 6) {
        detected_issues.push('manque de sommeil');
        recommendations.push('Améliorer les conditions de sommeil (bruit, température, lumière)');
        risk_level = 'moyen';
    } else if (data.sleep_hours > 9) {
        detected_issues.push('excès de sommeil');
        recommendations.push('Vérifier si lié à la fatigue ou à des médicaments');
    }
    
    // Difficultés de sommeil
    if (data.sleep_difficulties && data.sleep_difficulties !== 'aucun') {
        detected_issues.push(`difficultés de sommeil: ${data.sleep_difficulties}`);
        recommendations.push('Techniques de relaxation avant le coucher');
    }
    
    // Niveau de vigilance
    if (data.vigilance_level === 'fatigue_mentale' || data.vigilance_level === 'baisse_concentration') {
        detected_issues.push('baisse de vigilance');
        recommendations.push('Pauses régulières et vérification du sommeil');
        risk_level = 'moyen';
    }
    
    // === Nutrition, hydratation & digestion ===
    
    // Hydratation
    if (data.hydration_goal === 'non' || data.hydration_goal === 'partiellement') {
        detected_issues.push('hydratation insuffisante');
        recommendations.push('Augmenter la consommation d\'eau');
        risk_level = 'moyen';
    }
    
    // Apport calorique
    if (data.caloric_intake === 'non' || data.caloric_intake === 'partiellement') {
        detected_issues.push('apport calorique insuffisant');
        recommendations.push('Consommer toutes les rations prévues');
    }
    
    // Troubles digestifs
    if (data.digestive_issues && data.digestive_issues !== 'aucun') {
        detected_issues.push(`troubles digestifs: ${data.digestive_issues}`);
        recommendations.push('Adapter l\'alimentation et consulter le médecin');
    }
    
    // === Santé mentale & dynamique d'équipage ===
    
    // Niveau de stress
    if (data.stress_level >= 8) {
        detected_issues.push('niveau de stress élevé');
        recommendations.push('Techniques de gestion du stress et soutien psychologique');
        risk_level = 'élevé';
    } else if (data.stress_level >= 5) {
        detected_issues.push('niveau de stress modéré');
        recommendations.push('Surveillance et techniques de relaxation');
    }
    
    // Ambiance équipage
    if (data.crew_mood === 'tendue' || data.crew_mood === 'conflits') {
        detected_issues.push('tensions au sein de l\'équipage');
        recommendations.push('Communication ouverte et médiation si nécessaire');
        risk_level = 'moyen';
    }
    
    // Besoins sociaux
    if (data.social_needs === 'besoin_isolement' || data.social_needs === 'manque_soutien') {
        detected_issues.push('déséquilibre des besoins sociaux');
        recommendations.push('Activités de groupe ou temps seul selon le besoin');
    }
    
    // === Environnement & sécurité à bord ===
    
    // Anomalies environnementales
    if (data.environment_anomalies && data.environment_anomalies !== 'aucun') {
        detected_issues.push(`anomalies environnementales: ${data.environment_anomalies}`);
        recommendations.push('Signalement immédiat au contrôle de mission');
        risk_level = 'élevé';
    }
    
    // Incident rapporté
    if (data.incident_report) {
        detected_issues.push('incident signalé');
        recommendations.push('Documentation et suivi de l\'incident');
        risk_level = 'élevé';
    }
    
    // Déterminer l'état psychologique global
    const issueCount = detected_issues.length;
    const recommendationCount = recommendations.length;
    
    if (risk_level === 'élevé' || issueCount >= 4) {
        psychological_state = 'nécessite attention médicale';
    } else if (risk_level === 'moyen' || issueCount >= 2) {
        psychological_state = 'à surveiller';
    } else if (issueCount === 0) {
        psychological_state = 'optimal';
    } else {
        psychological_state = 'normal';
    }
    
    // Générer des suggestions d'exercices adaptées
    const exercise_suggestions = [];
    
    if (data.stress_level >= 6) {
        exercise_suggestions.push('10 minutes de méditation guidée');
        exercise_suggestions.push('Exercices de respiration profonde (4-7-8)');
    }
    
    if (data.energy_level <= 5) {
        exercise_suggestions.push('Séance de yoga doux');
        exercise_suggestions.push('Étirements et mobilité articulaire');
    }
    
    if (data.sleep_hours < 7) {
        exercise_suggestions.push('Routine de relaxation avant le coucher');
    }
    
    if (data.crew_mood === 'tendue' || data.crew_mood === 'conflits') {
        exercise_suggestions.push('Activité de team-building avec l\'équipage');
        exercise_suggestions.push('Session de communication ouverte');
    }
    
    if (data.microgravity_symptoms && data.microgravity_symptoms !== 'aucun') {
        exercise_suggestions.push('Exercices d\'adaptation à la microgravité');
    }
    
    if (exercise_suggestions.length === 0) {
        exercise_suggestions.push('Maintenir la routine actuelle');
        exercise_suggestions.push('Continuer les exercices de maintien physique');
    }
    
    return {
        psychological_state: psychological_state,
        risk_level: risk_level,
        detected_issues: detected_issues.length > 0 ? detected_issues : ['Aucun problème détecté'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continuer la routine actuelle'],
        exercise_suggestions: exercise_suggestions,
        timestamp: new Date().toISOString(),
        context_summary: `Énergie: ${data.energy_level}/10, Stress: ${data.stress_level}/10, Sommeil: ${data.sleep_hours}h`
    };
}

// Show message
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;
    
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Insert new message at the top of the form
    const form = document.getElementById('space-questionnaire-form');
    if (form) {
        form.insertBefore(messageEl, form.firstChild);
    }
    
    // Remove message after 5 seconds (except for success which redirects)
    if (type !== 'success') {
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
}
