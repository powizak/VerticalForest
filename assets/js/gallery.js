/**
 * Vertical Forest s.r.o. - Gallery JavaScript
 * This file contains the JavaScript functionality for the photo gallery
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the gallery lightbox
    initGalleryLightbox();
    
    // Initialize gallery filtering if filter buttons exist
    if (document.querySelector('.gallery-filters')) {
        initGalleryFilters();
    }
    
    // Initialize lazy loading for gallery images
    initGalleryLazyLoad();
});

/**
 * Initialize the gallery lightbox functionality
 */
function initGalleryLightbox() {
    // Get all gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (galleryItems.length === 0) return;
    
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    
    const lightboxContent = document.createElement('div');
    lightboxContent.classList.add('lightbox-content');
    
    const lightboxImage = document.createElement('img');
    lightboxImage.classList.add('lightbox-image');
    
    const lightboxCaption = document.createElement('div');
    lightboxCaption.classList.add('lightbox-caption');
    
    const lightboxClose = document.createElement('button');
    lightboxClose.classList.add('lightbox-close');
    lightboxClose.innerHTML = '&times;';
    lightboxClose.setAttribute('aria-label', 'Zavřít');
    
    const lightboxPrev = document.createElement('button');
    lightboxPrev.classList.add('lightbox-nav', 'lightbox-prev');
    lightboxPrev.innerHTML = '&#10094;';
    lightboxPrev.setAttribute('aria-label', 'Předchozí');
    
    const lightboxNext = document.createElement('button');
    lightboxNext.classList.add('lightbox-nav', 'lightbox-next');
    lightboxNext.innerHTML = '&#10095;';
    lightboxNext.setAttribute('aria-label', 'Další');
    
    // Append elements to the DOM
    lightboxContent.appendChild(lightboxImage);
    lightboxContent.appendChild(lightboxCaption);
    lightboxContent.appendChild(lightboxClose);
    lightboxContent.appendChild(lightboxPrev);
    lightboxContent.appendChild(lightboxNext);
    lightbox.appendChild(lightboxContent);
    document.body.appendChild(lightbox);
    
    // Current index of displayed image
    let currentIndex = 0;
    
    // Open lightbox when a gallery item is clicked
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            currentIndex = index;
            openLightbox(this);
        });
    });
    
    // Close lightbox when close button is clicked
    lightboxClose.addEventListener('click', closeLightbox);
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Navigate to previous image
    lightboxPrev.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        openLightbox(galleryItems[currentIndex]);
    });
    
    // Navigate to next image
    lightboxNext.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        openLightbox(galleryItems[currentIndex]);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            openLightbox(galleryItems[currentIndex]);
        } else if (e.key === 'ArrowRight') {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            openLightbox(galleryItems[currentIndex]);
        }
    });
    
    /**
     * Open the lightbox with the selected gallery item
     * @param {HTMLElement} item - The gallery item to display
     */
    function openLightbox(item) {
        const imgSrc = item.querySelector('img').getAttribute('data-full') || 
                      item.querySelector('img').getAttribute('src');
        const caption = item.querySelector('.gallery-caption')?.textContent || '';
        
        lightboxImage.src = imgSrc;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Show/hide navigation buttons based on gallery length
        if (galleryItems.length <= 1) {
            lightboxPrev.style.display = 'none';
            lightboxNext.style.display = 'none';
        } else {
            lightboxPrev.style.display = 'block';
            lightboxNext.style.display = 'block';
        }
    }
    
    /**
     * Close the lightbox
     */
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear the image source after transition
        setTimeout(() => {
            lightboxImage.src = '';
        }, 300);
    }
}

/**
 * Initialize gallery filtering functionality
 */
function initGalleryFilters() {
    const filterButtons = document.querySelectorAll('.gallery-filter');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterButtons.length === 0 || galleryItems.length === 0) return;
    
    // Add click event to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filterValue = this.getAttribute('data-filter');
            
            // Filter gallery items
            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Initialize lazy loading for gallery images
 */
function initGalleryLazyLoad() {
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
                        
                        // Add loaded class for fade-in effect
                        image.classList.add('loaded');
                    }
                    
                    observer.unobserve(image);
                }
            });
        });
        
        // Get all gallery images with data-src attribute
        const lazyImages = document.querySelectorAll('.gallery-item img[data-src]');
        lazyImages.forEach(image => {
            imageObserver.observe(image);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        const lazyImages = document.querySelectorAll('.gallery-item img[data-src]');
        
        lazyImages.forEach(image => {
            const src = image.getAttribute('data-src');
            
            if (src) {
                image.src = src;
                image.removeAttribute('data-src');
                image.classList.add('loaded');
            }
        });
    }
}

/**
 * Add masonry layout to the gallery
 * Note: This is a simple implementation without external libraries
 */
function initMasonryLayout() {
    const gallery = document.querySelector('.gallery-grid');
    
    if (!gallery) return;
    
    // Get all gallery items
    const items = gallery.querySelectorAll('.gallery-item');
    
    // Set the number of columns based on screen width
    let columns = 3;
    
    if (window.innerWidth < 768) {
        columns = 2;
    }
    
    if (window.innerWidth < 576) {
        columns = 1;
    }
    
    // Calculate column width
    const columnWidth = 100 / columns;
    
    // Set width for all items
    items.forEach(item => {
        item.style.width = `${columnWidth}%`;
    });
    
    // Recalculate layout on window resize
    window.addEventListener('resize', function() {
        let newColumns = 3;
        
        if (window.innerWidth < 768) {
            newColumns = 2;
        }
        
        if (window.innerWidth < 576) {
            newColumns = 1;
        }
        
        if (newColumns !== columns) {
            columns = newColumns;
            const newColumnWidth = 100 / columns;
            
            items.forEach(item => {
                item.style.width = `${newColumnWidth}%`;
            });
        }
    });
}

// Initialize masonry layout when images are loaded
window.addEventListener('load', initMasonryLayout);