// PSYCHOSPACE - Chat IA avec contexte spatial
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const questionnaireBtn = document.getElementById('questionnaire-btn');

// Stats elements
const energyStat = document.getElementById('energy-stat');
const stressStat = document.getElementById('stress-stat');
const sleepStat = document.getElementById('sleep-stat');
const lastResponseStat = document.getElementById('last-response-stat');
const recentHistory = document.getElementById('recent-history');

// Conversation history
let conversationHistory = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadQuickStats();
    loadRecentHistory();
    
    // Auto-resize textarea
    chatInput.addEventListener('input', autoResizeTextarea);
    
    // Send message on Enter (Shift+Enter for new line)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Questionnaire button
    questionnaireBtn.addEventListener('click', function() {
        window.location.href = 'questionnaire.html';
    });
    
    // Load initial messages
    addWelcomeMessage();
});

// Auto-resize textarea
function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
}

// Add welcome message
function addWelcomeMessage() {
    // Welcome message is already in HTML
    // Scroll to bottom
    scrollToBottom();
}

// Send message to chat
async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Get latest questionnaire data to provide context
        const questionnaireData = await fetchLatestQuestionnaire();
        
        // Prepare the prompt with context
        const prompt = buildContextualPrompt(message, questionnaireData);
        
        // Call AI agent
        const response = await callAIAgent(prompt);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response to chat
        addMessageToChat('ai', response);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'ai',
            content: response
        });
        
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        
        // Fallback response
        const fallbackResponse = getFallbackResponse(message);
        addMessageToChat('ai', fallbackResponse);
        
        conversationHistory.push({
            role: 'ai',
            content: fallbackResponse
        });
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Add message to chat
function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(message)}</div>
            </div>
            <div class="message-avatar">👨‍🚀</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">${formatAIMessage(message)}</div>
            </div>
        `;
    }
    
    chatMessages.insertBefore(messageDiv, chatMessages.lastChild);
    return messageDiv;
}

// Add typing indicator
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.insertBefore(typingDiv, chatMessages.lastChild);
    scrollToBottom();
    return typingDiv;
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fetch latest questionnaire data
async function fetchLatestQuestionnaire() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-latest-questionnaire`);
        
        if (!response.ok) {
            throw new Error('No questionnaire data available');
        }
        
        return await response.json();
    } catch (error) {
        console.log('No questionnaire data found, using defaults');
        return null;
    }
}

// Build contextual prompt
function buildContextualPrompt(userMessage, questionnaireData) {
    let context = '';
    
    if (questionnaireData) {
        context = `
Contexte de l'utilisateur (astronaute) basé sur son dernier questionnaire :
- Niveau d'énergie : ${questionnaireData.energy_level || 'non spécifié'}/10
- Heures de sommeil : ${questionnaireData.sleep_hours || 'non spécifié'}h
- Niveau de stress : ${questionnaireData.stress_level || 'non spécifié'}/10
- Symptômes physiques : ${formatSymptoms(questionnaireData)}
- Hydratation : ${questionnaireData.hydration_goal || 'non spécifié'}
- Nutrition : ${questionnaireData.caloric_intake || 'non spécifié'}
- Ambiance équipage : ${questionnaireData.crew_mood || 'non spécifié'}
- Besoins sociaux : ${questionnaireData.social_needs || 'non spécifié'}
- Anomalies environnementales : ${questionnaireData.environment_anomalies || 'Aucune'}

`;
    } else {
        context = 'Contexte : Utilisateur astronautes sans données de questionnaire récentes. ';
    }
    
    return `{
        "role": "system",
        "content": "Tu es un assistant IA spécialisé pour les astronautes en mission spatiale. Tu donnes des conseils médicaux, psychologiques et techniques adaptés à l'environnement spatial. Sois précis, empathique et professionnel. Réponds en français.\n\n${context}"
    },
    {
        "role": "user",
        "content": "${userMessage}"
    }`;
}

// Format symptoms for context
function formatSymptoms(data) {
    const symptoms = [];
    if (data.head_symptoms && data.head_symptoms !== 'aucun') symptoms.push(`Céphalées: ${data.head_symptoms}`);
    if (data.microgravity_symptoms && data.microgravity_symptoms !== 'aucun') symptoms.push(`Microgravité: ${data.microgravity_symptoms}`);
    if (data.exercise_discomfort && data.exercise_discomfort !== 'aucun') symptoms.push(`Inconfort exercice: ${data.exercise_discomfort}`);
    if (data.mild_symptoms && data.mild_symptoms !== 'aucun') symptoms.push(`Symptômes légers: ${data.mild_symptoms}`);
    if (data.digestive_issues && data.digestive_issues !== 'aucun') symptoms.push(`Troubles digestifs: ${data.digestive_issues}`);
    
    return symptoms.length > 0 ? symptoms.join(', ') : 'Aucun symptôme signalé';
}

// Call AI agent
async function callAIAgent(prompt) {
    try {
        // For demo purposes, we'll use a fallback since we can't call OpenRouter from frontend
        // In production, this would be handled by the backend
        
        // Try to call backend AI endpoint
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: JSON.parse(prompt),
                context: conversationHistory.slice(-5) // Last 5 messages for context
            })
        });
        
        if (!response.ok) {
            throw new Error('AI service unavailable');
        }
        
        const data = await response.json();
        return data.response;
        
    } catch (error) {
        console.error('AI call failed:', error);
        throw error;
    }
}

// Fallback responses
function getFallbackResponse(userMessage) {
    const messageLower = userMessage.toLowerCase();
    
    // Check for keywords and provide contextual responses
    if (messageLower.includes('sommeil') || messageLower.includes('dormir') || messageLower.includes('nuit')) {
        return `Pour améliorer votre sommeil en microgravité, essayez de :
1. Maintenir un horaire régulier de coucher et de réveil
2. Utiliser des oreillers et sangles pour vous ancrer
3. Éviter les écrans avant le sommeil
4. Pratiquer des exercices de respiration profonde
5. Réduire la caféine après 14h

N'oubliez pas de remplir le questionnaire quotidien pour des conseils plus personnalisés !`;
    }
    
    if (messageLower.includes('stress') || messageLower.includes('anxiété') || messageLower.includes('anxiete')) {
        return `Pour gérer le stress en mission spatiale :
1. Parlez-en à votre équipage ou au contrôle au sol
2. Pratiquez la méditation ou des exercices de relaxation
3. Maintenez une routine quotidienne
4. Faites de l'exercice physique régulièrement
5. Utilisez les ressources psychologiques disponibles

Votre niveau de stress actuel est important à surveiller. Pensez à remplir le questionnaire.`;
    }
    
    if (messageLower.includes('nausée') || messageLower.includes('nausees') || messageLower.includes('vertige') || messageLower.includes('désorientation')) {
        return `Les symptômes de nausée et désorientation sont courants en microgravité :
1. Fixez un point stable à l'horizon
2. Évitez les mouvements brusques de la tête
3. Prenez des petits repas fréquents plutôt que de gros repas
4. Restez hydraté
5. Consultez le médecin de bord si les symptômes persistent

Ces symptômes sont souvent temporaires et s'améliorent avec l'adaptation.`;
    }
    
    if (messageLower.includes('hydratation') || messageLower.includes('eau') || messageLower.includes('boire')) {
        return `L'hydratation est cruciale en microgravité :
1. Buvez régulièrement, même sans soif
2. Surveillez la couleur de votre urine (doit être claire)
3. Consommez des aliments riches en eau (fruits, légumes)
4. Évitez l'excès de caféine et d'alcool
5. Utilisez une paille pour boire plus facilement

Votre apport hydrique a-t-il été suffisant aujourd'hui ?`;
    }
    
    if (messageLower.includes('nutrition') || messageLower.includes('manger') || messageLower.includes('ration')) {
        return `Pour une nutrition optimale dans l'espace :
1. Consommez toutes vos rations pour éviter les carences
2. Variez les aliments disponibles
3. Mangez régulièrement pour maintenir votre énergie
4. Surveillez votre apport en protéines et vitamines
5. Signalez tout problème d'appétit ou digestif

La nutrition est essentielle pour maintenir vos performances.`;
    }
    
    if (messageLower.includes('exercice') || messageLower.includes('sport') || messageLower.includes('entraînement')) {
        return `L'exercice en microgravité est crucial pour :
1. Maintenir la masse musculaire
2. Prévenir la perte osseuse
3. Améliorer la circulation sanguine
4. Réduire le stress
5. Maintenir un bon moral

Si vous ressentez des inconforts pendant l'exercice, adaptez l'intensité et consultez le médecin.`;
    }
    
    if (messageLower.includes('équipage') || messageLower.includes('crew') || messageLower.includes('collègue')) {
        return `La dynamique d'équipage est essentielle pour une mission réussie :
1. Communiquez ouvertement avec vos collègues
2. Participez aux activités de groupe
3. Respectez l'espace personnel de chacun
4. Soyez patient et compréhensif
5. Signalez tout conflit au commandant

Une bonne cohésion d'équipage améliore la sécurité et l'efficacité.`;
    }
    
    if (messageLower.includes('environnement') || messageLower.includes('module') || messageLower.includes('bruit') || messageLower.includes('température')) {
        return `Pour un environnement de travail optimal :
1. Signalez immédiatement toute anomalie (bruit, température, odeur)
2. Utilisez les équipements de protection individuelle
3. Maintenez votre espace de travail propre et organisé
4. Vérifiez régulièrement les systèmes de support vie
5. Collaborez avec vos collègues pour maintenir un bon environnement

La sécurité à bord est la priorité absolue.`;
    }
    
    if (messageLower.includes('bonjour') || messageLower.includes('salut') || messageLower.includes('hi') || messageLower.includes('hello')) {
        return `Bonjour astronaute ! 👨‍🚀 Comment puis-je vous aider aujourd'hui ?

N'oubliez pas de remplir votre questionnaire quotidien pour que je puisse vous fournir des conseils personnalisés basés sur votre état actuel.`;
    }
    
    if (messageLower.includes('merci') || messageLower.includes('thank')) {
        return `Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.

Bon vol et prenez soin de vous à bord !`;
    }
    
    // Generic response
    return `Je comprends votre question. Pour vous fournir la meilleure réponse possible, pourriez-vous préciser un peu plus ?

N'oubliez pas que je peux vous donner des conseils sur :
- La gestion du sommeil en microgravité
- La nutrition et l'hydratation
- Le stress et la santé mentale
- L'exercice physique
- La dynamique d'équipage
- L'environnement à bord

Et bien plus encore !`;
}

// Load quick stats
async function loadQuickStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-latest-questionnaire`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data) {
                energyStat.textContent = `${data.energy_level || '-'} / 10`;
                stressStat.textContent = `${data.stress_level || '-'} / 10`;
                sleepStat.textContent = `${data.sleep_hours || '-'}h`;
                lastResponseStat.textContent = data.timestamp ? new Date(data.timestamp).toLocaleDateString('fr-FR') : '-';
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent history
async function loadRecentHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-history`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.history && data.history.length > 0) {
                const last3 = data.history.slice(-3);
                let html = '';
                
                last3.forEach(item => {
                    const date = new Date(item.date).toLocaleDateString('fr-FR');
                    html += `
                        <div class="history-item">
                            <div class="history-date">${date}</div>
                            <div class="history-summary">
                                Énergie: ${item.energy_level || '-'}, 
                                Stress: ${item.stress_level || '-'}, 
                                Sommeil: ${item.sleep_hours || '-'}h
                            </div>
                        </div>
                    `;
                });
                
                recentHistory.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Format AI message (add line breaks, bold, etc.)
function formatAIMessage(message) {
    // Replace **text** with <strong>text</strong>
    let formatted = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace * text with <em>text</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace newlines with <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Replace numbered lists
    formatted = formatted.replace(/(\d+)\. /g, '<br>$1. ');
    
    return formatted;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Refresh stats periodically
setInterval(loadQuickStats, 30000); // Every 30 seconds
