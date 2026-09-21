// PSYCHOSPACE - Frontend JavaScript
// Configuration de l'API backend
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const questionnaireForm = document.getElementById('questionnaire-form');
const recommendationSection = document.getElementById('recommendation-section');
const recommendationContent = document.getElementById('recommendation-content');
const historySection = document.getElementById('history-section');
const historyContent = document.getElementById('history-content');
const refreshRecommendationBtn = document.getElementById('refresh-recommendation');
const submitBtn = document.querySelector('.btn-primary');

// Stress level display
const stressLevelInput = document.getElementById('stress-level');
const stressValueDisplay = document.getElementById('stress-value');

// Recommendation elements
const psychologicalStateEl = document.getElementById('psychological-state');
const detectedSignsEl = document.getElementById('detected-signs');
const exerciseSuggestionEl = document.getElementById('exercise-suggestion');
const recommendationTimestampEl = document.getElementById('recommendation-timestamp');

// Update stress level display
stressLevelInput.addEventListener('input', function() {
    stressValueDisplay.textContent = this.value;
});

// Form submission handler
questionnaireForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const sleepHours = parseFloat(document.getElementById('sleep-hours').value);
    const mood = document.getElementById('mood').value;
    const stressLevel = parseInt(document.getElementById('stress-level').value);
    const freeText = document.getElementById('free-text').value;
    
    // Validate form
    if (!sleepHours || !mood) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // Submit questionnaire to backend
        const questionnaireResponse = await fetch(`${API_BASE_URL}/submit-questionnaire`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sleep_hours: sleepHours,
                mood: mood,
                stress_level: stressLevel,
                free_text: freeText || null
            })
        });
        
        if (!questionnaireResponse.ok) {
            throw new Error('Erreur lors de la soumission du questionnaire');
        }
        
        // Call AI agent to analyze the response
        // In production, this would be handled by the backend
        // For demo purposes, we'll use a fallback analysis
        const analysis = await performLocalAnalysis(sleepHours, mood, stressLevel, freeText);
        
        // Store analysis in backend
        const storeResponse = await fetch(`${API_BASE_URL}/store-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analysis)
        });
        
        if (!storeResponse.ok) {
            throw new Error('Erreur lors du stockage de l\'analyse');
        }
        
        // Display recommendation
        displayRecommendation(analysis);
        
        // Show success message
        showMessage('Questionnaire soumis avec succès !', 'success');
        
        // Load updated history
        await loadHistory();
        
        // Show recommendation section
        recommendationSection.classList.remove('hidden');
        
        // Scroll to recommendation
        recommendationSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(`Erreur: ${error.message}`, 'error');
        
        // Fallback: perform local analysis and display
        const analysis = await performLocalAnalysis(sleepHours, mood, stressLevel, freeText);
        displayRecommendation(analysis);
        recommendationSection.classList.remove('hidden');
    } finally {
        // Reset form and button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        questionnaireForm.reset();
        stressValueDisplay.textContent = '5';
    }
});

// Refresh recommendation button
refreshRecommendationBtn.addEventListener('click', async function() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-recommendation`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de la recommandation');
        }
        
        const analysis = await response.json();
        
        if (analysis.recommendation) {
            // No recommendation available
            showMessage('Aucune recommandation disponible', 'error');
        } else {
            displayRecommendation(analysis);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(`Erreur: ${error.message}`, 'error');
    }
});

// Load history on page load
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-history`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de l\'historique');
        }
        
        const data = await response.json();
        
        if (data.history && data.history.length > 0) {
            displayHistory(data.history);
        } else {
            historyContent.innerHTML = '<p class="empty-message">Aucun historique disponible pour le moment.</p>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        historyContent.innerHTML = '<p class="empty-message">Erreur lors du chargement de l\'historique.</p>';
    }
}

// Display recommendation
function displayRecommendation(analysis) {
    psychologicalStateEl.textContent = analysis.psychological_state || '-';
    detectedSignsEl.textContent = Array.isArray(analysis.detected_signs) 
        ? analysis.detected_signs.join(', ') 
        : analysis.detected_signs || '-';
    exerciseSuggestionEl.textContent = analysis.exercise_suggestion || '-';
    recommendationTimestampEl.textContent = new Date(analysis.timestamp).toLocaleString('fr-FR');
}

// Display history
function displayHistory(history) {
    let html = '';
    
    history.forEach(item => {
        const date = new Date(item.date).toLocaleDateString('fr-FR');
        const time = new Date(item.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div class="history-item">
                <div class="date">${date} à ${time}</div>
                <div class="data">
                    <div class="data-item">
                        <span class="label">Sommeil:</span> ${item.sleep_hours}h
                    </div>
                    <div class="data-item">
                        <span class="label">Humeur:</span> ${item.mood}
                    </div>
                    <div class="data-item">
                        <span class="label">Stress:</span> ${item.stress_level}/10
                    </div>
                </div>
                ${item.recommendation ? `
                    <div class="recommendation">
                        💡 ${item.recommendation}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    historyContent.innerHTML = html;
}

// Show message (success or error)
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;
    
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Insert new message at the top of the form
    const form = document.getElementById('questionnaire-form');
    if (form) {
        form.insertBefore(messageEl, form.firstChild);
    }
    
    // Remove message after 5 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

// Local analysis fallback (when AI API is not available)
async function performLocalAnalysis(sleepHours, mood, stressLevel, freeText) {
    // Simple rule-based analysis
    const detectedSigns = [];
    let psychologicalState = 'normal';
    let exerciseSuggestion = 'Continue à prendre soin de toi avec une routine équilibrée';
    
    // Analyze sleep
    if (sleepHours < 6) {
        detectedSigns.push('manque de sommeil');
    } else if (sleepHours > 9) {
        detectedSigns.push('excès de sommeil');
    }
    
    // Analyze stress
    if (stressLevel >= 8) {
        detectedSigns.push('stress élevé');
    } else if (stressLevel >= 5) {
        detectedSigns.push('stress modéré');
    }
    
    // Analyze mood
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('triste') || moodLower.includes('déprimé') || moodLower.includes('mauvais')) {
        detectedSigns.push('humeur négative');
    } else if (moodLower.includes('joyeux') || moodLower.includes('bon') || moodLower.includes('excellent')) {
        detectedSigns.push('humeur positive');
    }
    
    // Determine psychological state
    if (stressLevel >= 7 || sleepHours < 5) {
        psychologicalState = 'fatigué/stressé';
    } else if (stressLevel <= 3 && sleepHours >= 7) {
        psychologicalState = 'équilibré';
    }
    
    // Generate exercise suggestion
    if (stressLevel >= 7) {
        exerciseSuggestion = 'Pratique 10 minutes de respiration profonde ou de méditation';
    } else if (sleepHours < 6) {
        exerciseSuggestion = 'Essaie de te coucher plus tôt ce soir et de te détendre';
    } else if (moodLower.includes('triste') || moodLower.includes('déprimé')) {
        exerciseSuggestion = 'Fais une activité qui te plaît : marche, musique, ou appel à un ami';
    }
    
    return {
        psychological_state: psychologicalState,
        detected_signs: detectedSigns.length > 0 ? detectedSigns : ['aucune anomalie détectée'],
        exercise_suggestion: exerciseSuggestion,
        timestamp: new Date().toISOString()
    };
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load history on page load
    loadHistory();
    
    // Check if there's already a recommendation to display
    fetch(`${API_BASE_URL}/get-recommendation`)
        .then(response => response.json())
        .then(analysis => {
            if (!analysis.recommendation) {
                displayRecommendation(analysis);
                recommendationSection.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.log('No existing recommendation found');
        });
});
