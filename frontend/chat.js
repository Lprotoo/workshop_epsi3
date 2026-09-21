// PSYCHOSPACE - Chat IA avec OpenRouter
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
        
        // Add AI response to chat
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
