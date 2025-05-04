/**
 * Vertical Forest s.r.o. - Cookie Consent JavaScript
 * This file contains the functionality for the cookie consent banner and Google Consent Mode v2 implementation
 */

// Debug mode - set to true to enable detailed logging
const DEBUG_MODE = true;

// Default consent state - all cookies are denied by default
const defaultConsentState = {
    necessary: true,      // Always required
    analytics: false,     // Google Analytics
    marketing: false,     // Google Ads, remarketing
    preferences: false    // Site preferences, settings
};

// Use the global GA_TRACKING_ID if available, otherwise use a fallback
const GA_TRACKING_ID = (typeof window.GA_TRACKING_ID !== 'undefined') ?
                        window.GA_TRACKING_ID : 'G-RKP8S23T31';

console.log('Cookie consent script using tracking ID:', GA_TRACKING_ID);

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
    
    // Verify Google Analytics tag is loaded
    verifyGoogleAnalytics();
});

/**
 * Verify that Google Analytics is properly loaded
 */
function verifyGoogleAnalytics() {
    // Check after a longer delay to ensure scripts have fully loaded
    setTimeout(() => {
        if (DEBUG_MODE) console.log('Verifying Google Analytics tag...');
        
        // Dump the entire dataLayer for debugging
        if (DEBUG_MODE && window.dataLayer) {
            console.log('Current dataLayer contents:', JSON.stringify(window.dataLayer));
        }
        
        // Check if the GA script is loaded
        const gaScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}"]`);
        if (!gaScript) {
            console.error(`Google Analytics script tag with ID ${GA_TRACKING_ID} not found in the document`);
            console.log('Possible solutions:');
            console.log('1. Check if the script tag is present in the HTML head');
            console.log('2. Verify that the tracking ID is correct');
            console.log('3. Check for any script blockers that might be preventing the script from loading');
            
            // Force reload the script
            const newScript = document.createElement('script');
            newScript.async = true;
            newScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
            document.head.appendChild(newScript);
            console.log('Attempted to reload the Google Analytics script');
            return;
        }
        
        // Check if gtag function exists
        if (typeof window.gtag !== 'function') {
            console.error('Google Analytics tag not loaded properly - gtag function not found');
            console.log('Possible solutions:');
            console.log('1. Check for JavaScript errors that might be preventing the gtag function from being defined');
            console.log('2. Ensure the GA script is loaded before any code that uses gtag');
            
            // Attempt to redefine gtag
            window.dataLayer = window.dataLayer || [];
            window.gtag = function() { window.dataLayer.push(arguments); };
            console.log('Attempted to redefine gtag function');
            return;
        }
        
        if (DEBUG_MODE) console.log('Google Analytics tag appears to be loaded (gtag function exists)');
        
        // Improved dataLayer inspection for objects with numeric keys
        let gtagConfigured = false;
        let consentFound = false;
        let consentUpdateFound = false;
        
        if (window.dataLayer) {
            for (let i = 0; i < window.dataLayer.length; i++) {
                const item = window.dataLayer[i];
                
                // Check for config entries
                if (item && typeof item === 'object') {
                    // Check for array-like objects with numeric keys
                    if ('0' in item && '1' in item) {
                        // Check for config
                        if (item['0'] === 'config' && item['1'] === GA_TRACKING_ID) {
                            gtagConfigured = true;
                            if (DEBUG_MODE) console.log('Found GA config in dataLayer at index', i);
                        }
                        
                        // Check for consent
                        if (item['0'] === 'consent') {
                            if (item['1'] === 'default') {
                                consentFound = true;
                                if (DEBUG_MODE) console.log('Found consent default in dataLayer at index', i);
                            }
                            if (item['1'] === 'update') {
                                consentUpdateFound = true;
                                if (DEBUG_MODE) console.log('Found consent update in dataLayer at index', i);
                                
                                // Check if analytics_storage is granted
                                if (item['2'] && item['2'].analytics_storage === 'granted') {
                                    if (DEBUG_MODE) console.log('Analytics storage is granted, Google Analytics should be collecting data');
                                }
                            }
                        }
                    }
                    
                    // Also check for standard event objects
                    if (item.event === 'gtm.js' || item.event === 'gtm.dom' || item.event === 'gtm.load') {
                        if (DEBUG_MODE) console.log('Found GTM event in dataLayer:', item.event);
                    }
                }
            }
        }
        
        // Report on findings
        if (gtagConfigured) {
            if (DEBUG_MODE) console.log(`Google Analytics tracking ID ${GA_TRACKING_ID} has been configured`);
        } else {
            console.warn(`Google Analytics tracking ID ${GA_TRACKING_ID} may not be properly configured`);
            console.log('Possible solutions:');
            console.log(`1. Ensure gtag('config', '${GA_TRACKING_ID}') is called after the consent is updated`);
            console.log('2. Check the browser console for any JavaScript errors');
            
            // Attempt to reconfigure GA
            console.log('Attempting to reconfigure Google Analytics');
            window.gtag('js', new Date());
            window.gtag('config', GA_TRACKING_ID, {
                'debug_mode': true,
                'send_page_view': currentConsentState.analytics
            });
        }
        
        if (consentFound) {
            if (DEBUG_MODE) console.log('Default consent found in dataLayer');
        } else {
            console.warn('Default consent not found in dataLayer');
        }
        
        if (consentUpdateFound) {
            if (DEBUG_MODE) console.log('Consent update found in dataLayer');
        } else {
            console.warn('Consent update not found in dataLayer - this may prevent tracking');
            
            // If we have consent but no update in dataLayer, try to update again
            if (currentConsentState.analytics) {
                console.log('Attempting to update consent again');
                const consentObject = {
                    'ad_storage': currentConsentState.marketing ? 'granted' : 'denied',
                    'analytics_storage': currentConsentState.analytics ? 'granted' : 'denied',
                    'functionality_storage': currentConsentState.preferences ? 'granted' : 'denied',
                    'personalization_storage': currentConsentState.preferences ? 'granted' : 'denied',
                    'security_storage': 'granted',
                    'ad_user_data': currentConsentState.marketing ? 'granted' : 'denied',
                    'ad_personalization': currentConsentState.marketing ? 'granted' : 'denied'
                };
                window.gtag('consent', 'update', consentObject);
            }
        }
        
        // Check for common ad blockers that might interfere with GA
        if (window.ga === undefined && window.google_tag_manager === undefined) {
            console.warn('Possible ad blocker detected that might be blocking Google Analytics');
            console.log('This could prevent data from being sent to Google Analytics even if consent is granted');
        }
        
    }, 2000); // Increased delay to ensure everything is loaded
}

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
 * Note: Default consent is already set in the HTML head, so we don't need to set it again here
 */
function initGoogleConsentMode() {
    console.log('Google Consent Mode initialized from cookie-consent.js');
    // Default consent is already set in the HTML head
    // This function is kept for potential future initialization needs
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
    
    // Debug event listeners removed as requested
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
    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    
    console.log('Updating Google Consent with state:', JSON.stringify(currentConsentState));
    
    // Store previous analytics state to detect changes
    const wasAnalyticsEnabled = window.analyticsEnabled || false;
    
    // Create consent object
    const consentObject = {
        'ad_storage': currentConsentState.marketing ? 'granted' : 'denied',
        'analytics_storage': currentConsentState.analytics ? 'granted' : 'denied',
        'functionality_storage': currentConsentState.preferences ? 'granted' : 'denied',
        'personalization_storage': currentConsentState.preferences ? 'granted' : 'denied',
        'security_storage': 'granted', // Always granted for security purposes
        'ad_user_data': currentConsentState.marketing ? 'granted' : 'denied',
        'ad_personalization': currentConsentState.marketing ? 'granted' : 'denied'
    };
    
    // Update consent state
    gtag('consent', 'update', consentObject);
    
    // Log the consent update for debugging
    console.log('Consent update sent to dataLayer:', consentObject);

    // Track analytics state
    window.analyticsEnabled = currentConsentState.analytics;
    
    // If analytics was just enabled, send a page view
    if (currentConsentState.analytics) {
        console.log('Analytics consent granted, configuring GA');
        
        // Ensure gtag is defined
        if (typeof gtag !== 'function') {
            console.error('gtag function not found when trying to configure GA');
            window.gtag = function() { window.dataLayer.push(arguments); };
            console.log('Redefined gtag function');
        }
        
        // Reconfigure GA with page view - with a slight delay to ensure consent is processed
        setTimeout(() => {
            console.log('Reconfiguring GA with tracking ID:', GA_TRACKING_ID);
            
            // Use a more robust configuration
            gtag('config', GA_TRACKING_ID, {
                'send_page_view': true,
                'page_location': window.location.href,
                'page_title': document.title,
                'debug_mode': DEBUG_MODE,
                'cookie_domain': 'auto',
                'cookie_flags': 'SameSite=None;Secure',
                'cookie_update': true,
                'transport_type': 'beacon'
            });
            
            // Verify the configuration was added to dataLayer
            let configFound = false;
            for (let i = 0; i < window.dataLayer.length; i++) {
                const item = window.dataLayer[i];
                // Check for array-like objects with numeric keys
                if (item && typeof item === 'object' && '0' in item && '1' in item) {
                    if (item['0'] === 'config' && item['1'] === GA_TRACKING_ID) {
                        configFound = true;
                        console.log('Confirmed GA configuration in dataLayer at index', i);
                        break;
                    }
                }
            }
            
            if (!configFound) {
                console.warn('GA configuration not found in dataLayer after update - trying alternative approach');
                // Try an alternative approach - direct event
                gtag('event', 'page_view', {
                    'send_to': GA_TRACKING_ID,
                    'page_title': document.title,
                    'page_location': window.location.href,
                    'page_path': window.location.pathname
                });
            }
            
            // Verify consent state wasn't reset
            let consentUpdateFound = false;
            for (let i = 0; i < window.dataLayer.length; i++) {
                const item = window.dataLayer[i];
                if (item && typeof item === 'object' && '0' in item && '1' in item) {
                    if (item['0'] === 'consent' && item['1'] === 'update') {
                        consentUpdateFound = true;
                        console.log('Confirmed consent update in dataLayer');
                        break;
                    }
                }
            }
            
            if (!consentUpdateFound) {
                console.warn('Consent update not found in dataLayer - reapplying consent');
                // Reapply consent
                gtag('consent', 'update', consentObject);
            }
        }, 200); // Increased delay for more reliability
        
        // If this is the first time analytics is enabled in this session, track it
        if (!wasAnalyticsEnabled) {
            console.log('First analytics consent in session, sending explicit page view');
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
            
            // Send a test event to verify tracking is working
            setTimeout(() => {
                console.log('Sending test event to verify analytics tracking');
                gtag('event', 'consent_granted', {
                    'event_category': 'Consent',
                    'event_label': 'Analytics consent granted',
                    'non_interaction': true
                });
            }, 1000);
        }
    } else {
        console.log('Analytics consent denied');
    }
}

/**
 * Set a cookie with expiration
 */
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
}

/**
 * Get a cookie by name
 */
function getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return null;
}

/**
 * Delete a cookie
 */
function deleteCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
}

/**
 * Save consent to localStorage and cookies (for Safari compatibility)
 */
function saveConsent() {
    // Create consent data object
    const consentData = JSON.stringify({
        consentState: currentConsentState,
        timestamp: new Date().getTime()
    });
    
    // Try localStorage
    try {
        localStorage.setItem('cookieConsent', consentData);
    } catch (e) {
        console.warn('localStorage not available, falling back to cookies only');
    }
    
    // Also set as cookie (as backup for Safari)
    setCookie('cookieConsent', consentData, 365); // Store for 1 year
}

/**
 * Load saved consent from localStorage or cookies
 */
function loadSavedConsent() {
    let savedConsent = null;
    
    console.log('Loading saved consent preferences');
    
    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];
    
    // Try to get from localStorage first
    try {
        savedConsent = JSON.parse(localStorage.getItem('cookieConsent'));
        if (savedConsent) {
            console.log('Found consent in localStorage:', savedConsent);
        }
    } catch (error) {
        console.warn('Error loading from localStorage:', error);
    }
    
    // If not in localStorage, try cookies
    if (!savedConsent) {
        const cookieData = getCookie('cookieConsent');
        if (cookieData) {
            try {
                savedConsent = JSON.parse(cookieData);
                console.log('Found consent in cookies:', savedConsent);
            } catch (error) {
                console.error('Error parsing cookie consent data:', error);
            }
        }
    }
    
    // Process the consent data if we found it
    if (savedConsent && savedConsent.consentState) {
        console.log('Applying saved consent state:', savedConsent.consentState);
        
        // Check consent age - if older than 6 months, consider it expired
        const consentAge = new Date().getTime() - savedConsent.timestamp;
        const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
        
        if (consentAge > sixMonthsInMs) {
            console.log('Consent is older than 6 months, treating as expired');
            return false;
        }
        
        // Verify gtag function exists
        if (typeof window.gtag !== 'function') {
            console.warn('gtag function not found when loading saved consent');
            window.gtag = function() { window.dataLayer.push(arguments); };
            console.log('Redefined gtag function');
        }
        
        // Apply saved consent state
        currentConsentState = savedConsent.consentState;
        
        // Ensure necessary cookies are always enabled
        currentConsentState.necessary = true;
        
        // Check if GA script is loaded
        const gaScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}"]`);
        if (!gaScript) {
            console.warn(`Google Analytics script tag with ID ${GA_TRACKING_ID} not found when loading saved consent`);
            // Wait longer for script to load
            setTimeout(() => {
                console.log('Applying saved consent to Google Consent Mode (delayed)');
                updateGoogleConsent();
                
                // Verify consent was applied
                verifyGoogleAnalytics();
            }, 1000);
        } else {
            // Update Google Consent Mode with a slight delay to ensure GA is loaded
            setTimeout(() => {
                console.log('Applying saved consent to Google Consent Mode');
                updateGoogleConsent();
                
                // Verify consent was applied
                setTimeout(verifyGoogleAnalytics, 500);
            }, 100);
        }
        
        // Show cookie settings button
        showCookieSettingsButton();
        
        return true;
    }
    
    console.log('No valid saved consent found');
    return false;
}

/**
 * Check if user has already given consent (in either localStorage or cookies)
 */
function hasUserConsent() {
    // Check localStorage
    const localStorageConsent = localStorage.getItem('cookieConsent') !== null;
    
    // Check cookies
    const cookieConsent = getCookie('cookieConsent') !== null;
    
    // Return true if consent exists in either storage method
    return localStorageConsent || cookieConsent;
}

/**
 * Clear consent from both localStorage and cookies (for testing purposes)
 */
function clearConsent() {
    localStorage.removeItem('cookieConsent');
    deleteCookie('cookieConsent');
    location.reload();
}