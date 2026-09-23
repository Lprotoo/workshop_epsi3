/**
 * SpAIce - Medication Claim System
 * Handles medication code validation and claiming
 */

const API_BASE = "http://localhost:8000";

// DOM Elements
const medicationCodeInput = document.getElementById('medication-code');
const claimBtn = document.getElementById('claim-btn');
const codeInfoDiv = document.getElementById('code-info');
const codeMedName = document.getElementById('code-med-name');
const successResult = document.getElementById('success-result');
const successMessage = document.getElementById('success-message');
const errorResult = document.getElementById('error-result');
const errorMessage = document.getElementById('error-message');
const medicationDetails = document.getElementById('medication-details');
const detailName = document.getElementById('detail-name');
const detailId = document.getElementById('detail-id');
const detailDescription = document.getElementById('detail-description');
const medicationList = document.getElementById('medication-list');
const medicationGrid = document.getElementById('medication-grid');

// Add helpful info banner
const infoBanner = document.createElement('div');
infoBanner.style.cssText = `
    background: rgba(79, 195, 247, 0.2);
    border: 2px solid #4fc3f7;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
    color: #81d4fa;
    font-size: 0.95rem;
`;
infoBanner.innerHTML = `
    <strong>ℹ️ Comment ça marche ?</strong><br>
    1. Entrez votre code de prescription à 6 chiffres<br>
    2. Le système valide automatiquement le code<br>
    3. Cliquez sur "Récupérer" pour valider votre médicament
    <br><br>
    <strong>ℹ️ Codes d'exemple :</strong> 100000, 212345, 367890, 454321, 598765, 611223, 777888, 845678, 999000
`;
document.querySelector('.code-input-section').prepend(infoBanner);

// State
let isCodeValid = false;
let currentCode = '';
let medicationInfo = null;

/**
 * Validate the medication code format
 * Must be 6 digits, first digit determines the medication (1-9)
 */
function validateCode(code) {
    if (!code || code.length !== 6) {
        return false;
    }
    
    // Check if all characters are digits
    if (!/^\d{6}$/.test(code)) {
        return false;
    }
    
    // First digit must be 1-9
    const firstDigit = parseInt(code[0]);
    return firstDigit >= 1 && firstDigit <= 9;
}

/**
 * Check if code is valid by calling the API
 */
async function checkCodeValidity(code) {
    try {
        const response = await fetch(`${API_BASE}/get-medication-info/${code}`);
        if (!response.ok) {
            throw new Error('API Error');
        }
        const data = await response.json();
        return data.valid ? data.medication : null;
    } catch (error) {
        console.error('Error checking code:', error);
        return null;
    }
}

/**
 * Claim the medication using the code
 */
async function claimMedication(code) {
    try {
        const response = await fetch(`${API_BASE}/claim-medication`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        });
        
        if (!response.ok) {
            throw new Error('API Error');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error claiming medication:', error);
        throw error;
    }
}

/**
 * Update button state based on code validity
 */
function updateButtonState() {
    claimBtn.disabled = !isCodeValid || currentCode.length !== 6;
}

/**
 * Display code validation info
 */
function displayCodeInfo() {
    if (isCodeValid && medicationInfo) {
        codeInfoDiv.style.display = 'block';
        codeMedName.textContent = `${medicationInfo.name} (ID: ${medicationInfo.id})`;
        codeInfoDiv.style.background = 'rgba(76, 175, 80, 0.15)';
        codeInfoDiv.style.borderColor = '#4caf50';
    } else {
        codeInfoDiv.style.display = 'none';
    }
}

/**
 * Show success result
 */
function showSuccess(result) {
    // Hide error
    errorResult.style.display = 'none';
    
    // Show success
    successResult.style.display = 'block';
    successMessage.textContent = result.message;
    
    // Show details if available
    if (result.medication_info) {
        medicationDetails.style.display = 'block';
        detailName.textContent = result.medication_info.name;
        detailId.textContent = result.medication_info.id.toString();
        detailDescription.textContent = result.medication_info.description;
    }
    
    // Scroll to success result
    successResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Show error result
 */
function showError(message) {
    // Hide success
    successResult.style.display = 'none';
    medicationDetails.style.display = 'none';
    
    // Show error
    errorResult.style.display = 'block';
    errorMessage.textContent = message;
    
    // Scroll to error result
    errorResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Load and display all medications
 */
async function loadMedications() {
    try {
        const response = await fetch(`${API_BASE}/get-all-medications`);
        if (!response.ok) {
            throw new Error('Failed to load medications');
        }
        
        const data = await response.json();
        displayMedications(data.medications);
    } catch (error) {
        console.error('Error loading medications:', error);
    }
}

/**
 * Display medications in the grid
 */
function displayMedications(medications) {
    medicationGrid.innerHTML = '';
    
    medications.forEach(med => {
        const card = document.createElement('div');
        card.className = 'medication-card';
        card.innerHTML = `
            <span class="med-id">${med.id}</span>
            <h4>${med.name}</h4>
            <p>${med.description}</p>
            <button class="medication-select-btn" onclick="selectMedication('${med.id}')">
                Sélectionner
            </button>
        `;
        medicationGrid.appendChild(card);
    });
}

// Global function for button click
function selectMedication(medId) {
    const exampleCodes = {
        '1': '100000',
        '2': '212345',
        '3': '367890',
        '4': '454321',
        '5': '598765',
        '6': '611223',
        '7': '777888',
        '8': '845678',
        '9': '999000'
    };
    
    const code = exampleCodes[medId];
    if (code) {
        medicationCodeInput.value = code;
        currentCode = code;
        
        // Trigger validation
        setTimeout(async () => {
            isCodeValid = validateCode(currentCode);
            if (currentCode.length === 6) {
                medicationInfo = await checkCodeValidity(currentCode);
                isCodeValid = medicationInfo !== null;
            }
            updateButtonState();
            displayCodeInfo();
            medicationCodeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// Event Listeners
medicationCodeInput.addEventListener('input', async (e) => {
    currentCode = e.target.value.toString();
    
    // Only allow digits
    if (!/^\d*$/.test(currentCode)) {
        currentCode = currentCode.replace(/\D/g, '');
        e.target.value = currentCode;
    }
    
    // Check validity
    isCodeValid = validateCode(currentCode);
    
    // If code is 6 digits, check with API
    if (currentCode.length === 6) {
        medicationInfo = await checkCodeValidity(currentCode);
        isCodeValid = medicationInfo !== null;
    } else {
        medicationInfo = null;
    }
    
    updateButtonState();
    displayCodeInfo();
});

claimBtn.addEventListener('click', async () => {
    if (!isCodeValid || currentCode.length !== 6) {
        showError('Veuillez entrer un code de prescription valide (6 chiffres)');
        return;
    }
    
    // Disable button during request
    claimBtn.disabled = true;
    claimBtn.textContent = 'Traitement...';
    
    try {
        const result = await claimMedication(currentCode);
        
        if (result.success) {
            showSuccess(result);
            
            // Clear input
            medicationCodeInput.value = '';
            currentCode = '';
            isCodeValid = false;
            medicationInfo = null;
            
            // Disable the button again (user needs to enter new code)
            updateButtonState();
            displayCodeInfo();
        } else {
            showError(result.message || 'Code invalide ou déjà utilisé');
        }
    } catch (error) {
        showError('Erreur lors de la récupération. Veuillez réessayer.');
    } finally {
        claimBtn.disabled = isCodeValid && currentCode.length === 6;
        claimBtn.textContent = 'Récupérer';
    }
});

// Check URL for pre-filled code
function checkUrlForCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && /^\d{6}$/.test(code)) {
        medicationCodeInput.value = code;
        currentCode = code;
        
        // Trigger validation
        setTimeout(async () => {
            isCodeValid = validateCode(currentCode);
            if (currentCode.length === 6) {
                medicationInfo = await checkCodeValidity(currentCode);
                isCodeValid = medicationInfo !== null;
            }
            updateButtonState();
            displayCodeInfo();
            
            // Auto-scroll to the input
            medicationCodeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// Load medications on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMedications();
    medicationList.style.display = 'block';
    checkUrlForCode();
    
    // Add keyboard shortcuts help
    const shortcutsDiv = document.createElement('div');
    shortcutsDiv.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 15px;
        margin-top: 20px;
        font-size: 0.9rem;
        color: #a0a0a0;
    `;
    shortcutsDiv.innerHTML = `
        <strong>⌨️ Raccourcis clavier :</strong><br>
        • Entrée : Valider le code<br>
        • Tab : Passer au champ suivant
    `;
    document.querySelector('.medication-container').appendChild(shortcutsDiv);
});

// Keyboard support
medicationCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !claimBtn.disabled) {
        claimBtn.click();
    }
});

// Add focus styles for better UX
const style = document.createElement('style');
style.textContent = `
    .medication-select-btn {
        background: linear-gradient(135deg, #4fc3f7, #29b6f6);
        border: none;
        border-radius: 5px;
        padding: 8px 15px;
        color: white;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 600;
        margin-top: 10px;
        width: 100%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .medication-select-btn:hover {
        background: linear-gradient(135deg, #81d4fa, #4fc3f7);
        transform: translateY(-2px);
    }
    
    input:focus, textarea:focus, button:focus {
        outline: 2px solid #4fc3f7;
        outline-offset: 2px;
    }
`;
document.head.appendChild(style);
