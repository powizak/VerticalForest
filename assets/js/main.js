/**
 * Vertical Forest s.r.o. - Main JavaScript
 * This file contains the main JavaScript functionality for the Vertical Forest website
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    initMobileNav();
    
    // Initialize smooth scrolling for anchor links
    initSmoothScroll();
    
    // Initialize active navigation highlighting
    highlightActiveNav();
});

/**
 * Initialize mobile navigation functionality
 */
function initMobileNav() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');
    const body = document.body;
    
    // Create menu overlay element
    const menuOverlay = document.createElement('div');
    menuOverlay.classList.add('menu-overlay');
    body.appendChild(menuOverlay);
    
    if (mobileMenuToggle && navList) {
        // Toggle mobile menu when hamburger icon is clicked
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenuToggle.classList.toggle('active');
            navList.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
        
        // Close menu when overlay is clicked
        menuOverlay.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('active');
            navList.classList.remove('active');
            menuOverlay.classList.remove('active');
            body.classList.remove('menu-open');
        });
        
        // Close menu when a nav item is clicked
        const navItems = navList.querySelectorAll('a');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navList.classList.remove('active');
                menuOverlay.classList.remove('active');
                body.classList.remove('menu-open');
            });
        });
        
        // Close menu when Escape key is pressed
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navList.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                navList.classList.remove('active');
                menuOverlay.classList.remove('active');
                body.classList.remove('menu-open');
            }
        });
    }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
    // Get all links that have a hash
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Get the target element
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Get the header height to offset the scroll position
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                
                // Calculate the scroll position
                const scrollPosition = targetElement.offsetTop - headerHeight;
                
                // Scroll to the target
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Highlight the active navigation item based on the current page
 */
function highlightActiveNav() {
    // Get the current page URL
    const currentPage = window.location.pathname.split('/').pop();
    
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    
    // Remove active class from all items
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to the current page's nav item
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const linkHref = link.getAttribute('href');
        
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html')) {
            item.classList.add('active');
        }
    });
}

/**
 * Lazy load images to improve performance
 * This uses the Intersection Observer API to load images only when they come into view
 */
function lazyLoadImages() {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    const src = image.getAttribute('data-src');
                    
                    if (src) {
                        image.src = src;
                        image.removeAttribute('data-src');
                    }
                    
                    observer.unobserve(image);
                }
            });
        });
        
        // Get all images with data-src attribute
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(image => {
            imageObserver.observe(image);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        lazyImages.forEach(image => {
            const src = image.getAttribute('data-src');
            
            if (src) {
                image.src = src;
                image.removeAttribute('data-src');
            }
        });
    }
}

// Initialize lazy loading when the page is loaded
window.addEventListener('load', lazyLoadImages);

/**
 * Add animation to elements when they come into view
 */
function initScrollAnimations() {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.1 });
        
        // Get all elements with the 'animate-on-scroll' class
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(element => {
            animationObserver.observe(element);
        });
    }
}

// Initialize scroll animations when the page is loaded
window.addEventListener('load', initScrollAnimations);

/**
 * Handle form submissions
 * Note: This is a placeholder for future form functionality
 */
function handleFormSubmit() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation would go here
            
            // AJAX form submission would go here
            
            // For now, just show a success message
            alert('Formulář byl úspěšně odeslán!');
            form.reset();
        });
    });
}

// Initialize form handling if forms exist
window.addEventListener('load', function() {
    if (document.querySelector('form')) {
        handleFormSubmit();
    }
});