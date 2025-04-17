/**
 * Vertical Forest s.r.o. - Cookie Consent JavaScript
 * This file contains the functionality for the cookie consent banner and Google Consent Mode v2 implementation
 */

// Default consent state - all cookies are denied by default
const defaultConsentState = {
    necessary: true,      // Always required
    analytics: false,     // Google Analytics
    marketing: false,     // Google Ads, remarketing
    preferences: false    // Site preferences, settings
};

// Store for current consent state
let currentConsentState = { ...defaultConsentState };

// DOM elements - will be initialized when DOM is loaded
let cookieConsent;
let cookiePreferences;
let cookieSettingsButton;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create cookie consent elements
    createCookieConsentElements();
    
    // Initialize Google Consent Mode v2
    initGoogleConsentMode();
    
    // Check if user has already made a choice
    if (!hasUserConsent()) {
        // If not, show the cookie banner
        showCookieBanner();
    } else {
        // If yes, load the saved preferences
        loadSavedConsent();
    }
    
    // Initialize event listeners
    initEventListeners();
});

/**
 * Create and append cookie consent HTML elements to the DOM
 */
function createCookieConsentElements() {
    // Create cookie consent banner
    const cookieConsentHTML = `
        <div class="cookie-consent">
            <div class="cookie-consent-container">
                <div class="cookie-consent-content">
                    <div class="cookie-consent-header">
                        <h3 class="cookie-consent-title">Souhlas s cookies</h3>
                        <button class="cookie-consent-close" aria-label="Zavřít">&times;</button>
                    </div>
                    <div class="cookie-consent-text">
                        <p>Tento web používá cookies pro zlepšení vašeho zážitku, analýzu návštěvnosti a personalizaci obsahu. Kliknutím na "Přijmout vše" souhlasíte s používáním všech cookies. Můžete také nastavit své preference nebo odmítnout nepovinné cookies kliknutím na "Přizpůsobit".</p>
                    </div>
                </div>
                <div class="cookie-consent-buttons">
                    <button class="cookie-consent-button cookie-consent-reject-all">Odmítnout vše</button>
                    <button class="cookie-consent-button cookie-consent-customize">Přizpůsobit</button>
                    <button class="cookie-consent-button cookie-consent-accept-all">Přijmout vše</button>
                </div>
            </div>
        </div>
    `;
    
    // Create cookie preferences modal
    const cookiePreferencesHTML = `
        <div class="cookie-preferences">
            <div class="cookie-preferences-container">
                <div class="cookie-preferences-header">
                    <h3 class="cookie-preferences-title">Nastavení cookies</h3>
                    <button class="cookie-preferences-close" aria-label="Zavřít">&times;</button>
                </div>
                <div class="cookie-preferences-content">
                    <div class="cookie-preferences-description">
                        <p>Zde můžete přizpůsobit své preference ohledně cookies. Nezbytné cookies jsou vždy povoleny, protože jsou nutné pro správné fungování webu.</p>
                    </div>
                    <div class="cookie-preferences-options">
                        <div class="cookie-option">
                            <div class="cookie-option-header">
                                <h4 class="cookie-option-title">Nezbytné cookies</h4>
                                <label class="cookie-option-toggle">
                                    <input type="checkbox" name="necessary" checked disabled>
                                    <span class="cookie-option-slider"></span>
                                </label>
                            </div>
                            <div class="cookie-option-description">
                                <p>Tyto cookies jsou nezbytné pro správné fungování webu a nemohou být vypnuty. Obvykle jsou nastaveny pouze v reakci na vaše akce, jako je nastavení soukromí, přihlášení nebo vyplňování formulářů.</p>
                            </div>
                        </div>
                        <div class="cookie-option">
                            <div class="cookie-option-header">
                                <h4 class="cookie-option-title">Analytické cookies</h4>
                                <label class="cookie-option-toggle">
                                    <input type="checkbox" name="analytics">
                                    <span class="cookie-option-slider"></span>
                                </label>
                            </div>
                            <div class="cookie-option-description">
                                <p>Tyto cookies nám umožňují počítat návštěvy a zdroje provozu, abychom mohli měřit a zlepšovat výkon našeho webu. Pomáhají nám zjistit, které stránky jsou nejpopulárnější a jak se návštěvníci na webu pohybují.</p>
                            </div>
                        </div>
                        <div class="cookie-option">
                            <div class="cookie-option-header">
                                <h4 class="cookie-option-title">Marketingové cookies</h4>
                                <label class="cookie-option-toggle">
                                    <input type="checkbox" name="marketing">
                                    <span class="cookie-option-slider"></span>
                                </label>
                            </div>
                            <div class="cookie-option-description">
                                <p>Tyto cookies jsou nastaveny prostřednictvím našeho webu našimi reklamními partnery. Mohou být použity těmito společnostmi k vytvoření profilu vašich zájmů a zobrazení relevantních reklam na jiných webech.</p>
                            </div>
                        </div>
                        <div class="cookie-option">
                            <div class="cookie-option-header">
                                <h4 class="cookie-option-title">Preferenční cookies</h4>
                                <label class="cookie-option-toggle">
                                    <input type="checkbox" name="preferences">
                                    <span class="cookie-option-slider"></span>
                                </label>
                            </div>
                            <div class="cookie-option-description">
                                <p>Tyto cookies umožňují webu poskytovat vylepšené funkce a personalizaci. Mohou být nastaveny námi nebo poskytovateli třetích stran, jejichž služby jsme přidali na naše stránky.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="cookie-preferences-buttons">
                    <button class="cookie-preferences-save">Uložit nastavení</button>
                </div>
            </div>
        </div>
    `;
    
    // Create cookie settings button (fixed)
    const cookieSettingsButtonHTML = `
        <button class="cookie-settings-button">Nastavení cookies</button>
    `;
    
    // Append elements to the body
    document.body.insertAdjacentHTML('beforeend', cookieConsentHTML);
    document.body.insertAdjacentHTML('beforeend', cookiePreferencesHTML);
    document.body.insertAdjacentHTML('beforeend', cookieSettingsButtonHTML);
    
    // Store references to DOM elements
    cookieConsent = document.querySelector('.cookie-consent');
    cookiePreferences = document.querySelector('.cookie-preferences');
    cookieSettingsButton = document.querySelector('.cookie-settings-button');
}

/**
 * Initialize Google Consent Mode v2
 */
function initGoogleConsentMode() {
    // Set default consent
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    
    // Default consent - everything denied except necessary
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied',
        'security_storage': 'granted', // Always granted for security purposes
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });
}

/**
 * Initialize event listeners for cookie consent elements
 */
function initEventListeners() {
    // Accept all cookies
    document.querySelector('.cookie-consent-accept-all').addEventListener('click', function() {
        acceptAllCookies();
        hideCookieBanner();
        showCookieSettingsButton();
    });
    
    // Reject all cookies
    document.querySelector('.cookie-consent-reject-all').addEventListener('click', function() {
        rejectAllCookies();
        hideCookieBanner();
        showCookieSettingsButton();
    });
    
    // Open cookie preferences
    document.querySelector('.cookie-consent-customize').addEventListener('click', function() {
        openCookiePreferences();
    });
    
    // Close cookie banner
    document.querySelector('.cookie-consent-close').addEventListener('click', function() {
        hideCookieBanner();
        showCookieSettingsButton();
    });
    
    // Close cookie preferences
    document.querySelector('.cookie-preferences-close').addEventListener('click', function() {
        closeCookiePreferences();
    });
    
    // Save cookie preferences
    document.querySelector('.cookie-preferences-save').addEventListener('click', function() {
        savePreferences();
        closeCookiePreferences();
        hideCookieBanner();
        showCookieSettingsButton();
    });
    
    // Open cookie preferences from settings button
    cookieSettingsButton.addEventListener('click', function() {
        openCookiePreferences();
    });
    
    // Close cookie preferences when clicking outside
    cookiePreferences.addEventListener('click', function(e) {
        if (e.target === cookiePreferences) {
            closeCookiePreferences();
        }
    });
    
    // Close cookie preferences when pressing Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && cookiePreferences.classList.contains('active')) {
            closeCookiePreferences();
        }
    });
}

/**
 * Show the cookie banner
 */
function showCookieBanner() {
    cookieConsent.classList.add('active');
}

/**
 * Hide the cookie banner
 */
function hideCookieBanner() {
    cookieConsent.classList.remove('active');
}

/**
 * Show the cookie settings button
 */
function showCookieSettingsButton() {
    cookieSettingsButton.classList.add('active');
}

/**
 * Open the cookie preferences modal
 */
function openCookiePreferences() {
    // Update checkboxes based on current consent state
    updatePreferencesCheckboxes();
    
    // Show the modal
    cookiePreferences.classList.add('active');
}

/**
 * Close the cookie preferences modal
 */
function closeCookiePreferences() {
    cookiePreferences.classList.remove('active');
}

/**
 * Update preferences checkboxes based on current consent state
 */
function updatePreferencesCheckboxes() {
    const checkboxes = cookiePreferences.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const name = checkbox.getAttribute('name');
        if (name !== 'necessary') { // Necessary is always checked and disabled
            checkbox.checked = currentConsentState[name];
        }
    });
}

/**
 * Accept all cookies
 */
function acceptAllCookies() {
    // Set all consent options to true
    currentConsentState = {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true
    };
    
    // Update Google Consent Mode
    updateGoogleConsent();
    
    // Save consent to localStorage
    saveConsent();
}

/**
 * Reject all cookies except necessary ones
 */
function rejectAllCookies() {
    // Set all consent options to false except necessary
    currentConsentState = { ...defaultConsentState };
    
    // Update Google Consent Mode
    updateGoogleConsent();
    
    // Save consent to localStorage
    saveConsent();
}

/**
 * Save user preferences from the modal
 */
function savePreferences() {
    const checkboxes = cookiePreferences.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const name = checkbox.getAttribute('name');
        if (name !== 'necessary') { // Necessary is always true
            currentConsentState[name] = checkbox.checked;
        }
    });
    
    // Update Google Consent Mode
    updateGoogleConsent();
    
    // Save consent to localStorage
    saveConsent();
}

/**
 * Update Google Consent Mode based on current consent state
 */
function updateGoogleConsent() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    
    gtag('consent', 'update', {
        'ad_storage': currentConsentState.marketing ? 'granted' : 'denied',
        'analytics_storage': currentConsentState.analytics ? 'granted' : 'denied',
        'functionality_storage': currentConsentState.preferences ? 'granted' : 'denied',
        'personalization_storage': currentConsentState.preferences ? 'granted' : 'denied',
        'security_storage': 'granted', // Always granted for security purposes
        'ad_user_data': currentConsentState.marketing ? 'granted' : 'denied',
        'ad_personalization': currentConsentState.marketing ? 'granted' : 'denied'
    });
}

/**
 * Save consent to localStorage
 */
function saveConsent() {
    // Save consent state
    localStorage.setItem('cookieConsent', JSON.stringify({
        consentState: currentConsentState,
        timestamp: new Date().getTime()
    }));
}

/**
 * Load saved consent from localStorage
 */
function loadSavedConsent() {
    try {
        const savedConsent = JSON.parse(localStorage.getItem('cookieConsent'));
        
        if (savedConsent && savedConsent.consentState) {
            currentConsentState = savedConsent.consentState;
            
            // Ensure necessary cookies are always enabled
            currentConsentState.necessary = true;
            
            // Update Google Consent Mode
            updateGoogleConsent();
            
            // Show cookie settings button
            showCookieSettingsButton();
            
            return true;
        }
    } catch (error) {
        console.error('Error loading saved consent:', error);
    }
    
    return false;
}

/**
 * Check if user has already given consent
 */
function hasUserConsent() {
    return localStorage.getItem('cookieConsent') !== null;
}

/**
 * Clear consent (for testing purposes)
 */
function clearConsent() {
    localStorage.removeItem('cookieConsent');
    location.reload();
}