// PSYCHOSPACE - Chat IA avec OpenRouter
const API_BASE_URL = 'http://localhost:8000';

// Medication list for reference
const MEDICATIONS = {
    1: { name: "Antidépresseur léger", description: "Pour les symptômes de déprime et tristesse passagère" },
    2: { name: "Anxiolytique naturel", description: "Pour réduire l'anxiété et le stress modéré" },
    3: { name: "Somnifère doux", description: "Pour améliorer la qualité du sommeil" },
    4: { name: "Stimulant mental", description: "Pour la concentration et la vigilance réduite" },
    5: { name: "Analgésique spatial", description: "Pour les maux de tête et migraines en microgravité" },
    6: { name: "Régulateur digestif", description: "Pour les troubles digestifs et nausées" },
    7: { name: "Renforçateur immunitaire", description: "Pour soutenir le système immunitaire" },
    8: { name: "Tonifiant musculaire", description: "Pour soulager les tensions et courbatures" },
    9: { name: "Équilibreur émotionnel", description: "Pour stabiliser l'humeur et les émotions" }
};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const questionnaireBtn = document.getElementById('questionnaire-btn');
const medicationBtn = document.getElementById('medication-btn');

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
    
    // Medication button
    if (medicationBtn) {
        medicationBtn.addEventListener('click', function() {
            window.location.href = 'medication.html';
        });
    }
    
    // Add prescription styles
    addPrescriptionStyles();
    
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
        // Prepare the messages for AI
        const messages = [
            {
                role: 'user',
                content: message
            }
        ];
        
        // Call AI agent via backend
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                context: conversationHistory.slice(-5) // Last 5 messages for context
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erreur de l\'API IA');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response to chat with prescription detection
        addMessageToChat('ai', data.response);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'ai',
            content: data.response
        });
        
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        
        // Show error message in chat
        addMessageToChat('ai', `❌ **Erreur** : ${error.message}\n\nVeuillez vérifier que :\n1. Le backend est démarré (python -m uvicorn main:app --reload)\n2. Votre clé API OpenRouter est configurée dans le backend\n3. Le service OpenRouter est accessible`);
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Add message to chat
function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Ensure message is a string
    const messageText = message || '';
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(messageText)}</div>
            </div>
            <div class="message-avatar">👨‍🚀</div>
        `;
    } else {
        // For AI messages, use the enhanced formatter that detects prescriptions
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">${formatAIMessageWithPrescription(messageText)}</div>
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
    if (!message || typeof message !== 'string') {
        return '';
    }
    
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

// Extract prescription from AI response
function extractPrescription(message) {
    // Check if message is valid
    if (!message || typeof message !== 'string') {
        return null;
    }
    
    // Try to parse as JSON first (for questionnaire analysis)
    try {
        const parsed = JSON.parse(message);
        if (parsed && parsed.medication && 
            parsed.medication.code && 
            parsed.medication.medication_name &&
            parsed.medication.medication_id) {
            return {
                code: parsed.medication.code,
                name: parsed.medication.medication_name,
                id: parsed.medication.medication_id,
                reason: parsed.medication.reason || 'Prescription basée sur l\'analyse',
                isBilan: false
            };
        }
    } catch (e) {
        // Not JSON, try text format
    }
    
    // Try to extract from [PRESCRIPTION]...[/PRESCRIPTION] format
    const prescriptionMatch = message.match(/\[PRESCRIPTION\]\s*Code: (\d{6})\s*Médicament: ([^\n]+)\s*Raison: ([^\n]+)\s*\[\/PRESCRIPTION\]/i);
    if (prescriptionMatch) {
        const code = prescriptionMatch[1];
        const name = prescriptionMatch[2].trim();
        const reason = prescriptionMatch[3].trim();
        const id = parseInt(code[0]);
        return { code, name, id, reason, isBilan: false };
    }
    
    // Try to extract from [BILAN]...[FIN_BILAN] format
    const bilanMatch = message.match(/\[BILAN\](.*?)\[PRESCRIPTION\]\s*Code: (\d{6})\s*Médicament: ([^\n]+)\s*Raison: ([^\n]+)\s*\[\/PRESCRIPTION\](.*?)\[FIN_BILAN\]/is);
    if (bilanMatch) {
        const code = bilanMatch[2];
        const name = bilanMatch[3].trim();
        const reason = bilanMatch[4].trim();
        const id = parseInt(code[0]);
        return { code, name, id, reason, isBilan: true };
    }
    
    // Try to extract just a 6-digit code from the message
    const codeMatch = message.match(/(\d{6})/);
    if (codeMatch) {
        const code = codeMatch[1];
        const id = parseInt(code[0]);
        if (id >= 1 && id <= 9 && MEDICATIONS[id]) {
            return {
                code: code,
                name: MEDICATIONS[id].name,
                id: id,
                reason: "Prescription détectée dans le message",
                isBilan: false
            };
        }
    }
    
    return null;
}

// Format AI message with prescription detection
function formatAIMessageWithPrescription(message) {
    if (!message || typeof message !== 'string') {
        return '';
    }
    
    const prescription = extractPrescription(message);
    
    // Check if it's a bilan format
    const isBilan = message.includes('[BILAN]');
    
    if (isBilan && prescription) {
        // Extract bilan content
        const bilanContentMatch = message.match(/\[BILAN\](.*?)\[PRESCRIPTION\]/is);
        const bilanContent = bilanContentMatch ? bilanContentMatch[1].trim() : '';
        
        // Format the bilan
        let formatted = `<div class="bilan-box">`;
        formatted += `<strong>📊 BILAN PSYCHOLOGIQUE</strong><br><br>`;
        formatted += formatAIMessage(bilanContent) + `<br><br>`;
        formatted += `</div>`;
        
        // Add prescription separately
        formatted += `<div class="prescription-box" data-code="${prescription.code}">`;
        formatted += `<strong>💊 PRESCRIPTION : ${prescription.name}</strong><br>`;
        formatted += `Code : <span class="prescription-code">${prescription.code}</span><br>`;
        formatted += `Raison : ${prescription.reason || 'Non spécifiée'}<br>`;
        formatted += `<button class="claim-med-btn" onclick="window.location.href='medication.html?code=${prescription.code}'">Récupérer le médicament</button>`;
        formatted += `</div>`;
        
        return formatted;
    }
    
    // First format the basic message
    let formatted = formatAIMessage(message);
    
    // If prescription found (but not bilan), add it as a clickable button
    if (prescription && !prescription.isBilan) {
        // Don't add duplicate prescription if already in message
        if (!message.includes('[PRESCRIPTION]')) {
            formatted += `<br><br><div class="prescription-box" data-code="${prescription.code}">`;
            formatted += `<strong>💊 PRESCRIPTION : ${prescription.name}</strong><br>`;
            formatted += `Code : <span class="prescription-code">${prescription.code}</span><br>`;
            formatted += `Raison : ${prescription.reason || 'Non spécifiée'}<br>`;
            formatted += `<button class="claim-med-btn" onclick="window.location.href='medication.html?code=${prescription.code}'">Récupérer le médicament</button>`;
            formatted += `</div>`;
        }
    }
    
    return formatted;
}

// Add CSS for prescription box dynamically
function addPrescriptionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .prescription-box {
            background: rgba(79, 195, 247, 0.15);
            border: 2px solid #4fc3f7;
            border-radius: 10px;
            padding: 15px;
            margin-top: 10px;
        }
        .bilan-box {
            background: rgba(103, 58, 183, 0.15);
            border: 2px solid #9c27b0;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .prescription-code {
            font-family: monospace;
            font-size: 1.1em;
            font-weight: bold;
            color: #4fc3f7;
        }
        .claim-med-btn {
            background: #4fc3f7;
            border: none;
            border-radius: 5px;
            padding: 8px 15px;
            color: #000;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s;
        }
        .claim-med-btn:hover {
            background: #81d4fa;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}

// Refresh stats periodically
setInterval(loadQuickStats, 30000); // Every 30 seconds
