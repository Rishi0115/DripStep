/**
 * Drip Step - AI Recommendation Frontend
 * Handles user input, API calls, and Swiper carousel display
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:3000';

    // DOM Elements - populated on init
    let elements = {};
    let swiperInstance = null;

    /**
     * Initialize the recommendation feature
     */
    function init() {
        elements = {
            form: document.getElementById('recommendation-form'),
            productInput: document.getElementById('product-input'),
            priceInput: document.getElementById('price-input'),
            submitBtn: document.getElementById('submit-btn'),
            resultContainer: document.getElementById('recommendation-result'),
            swiperWrapper: document.getElementById('swiper-products'),
            loadingSpinner: document.getElementById('recommendation-loading'),
            errorContainer: document.getElementById('recommendation-error'),
            countContainer: document.getElementById('recommendation-count')
        };

        if (!elements.form) {
            console.warn('Recommendation form not found');
            return;
        }

        elements.form.addEventListener('submit', handleSubmit);
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        const productName = elements.productInput.value.trim();
        const maxPrice = parseFloat(elements.priceInput.value);

        // Validate inputs
        if (!productName) {
            showError('Please enter a product name');
            return;
        }

        if (!maxPrice || maxPrice <= 0) {
            showError('Please enter a valid maximum price');
            return;
        }

        // Show loading state
        showLoading(true);
        hideError();
        hideResult();
        hideCount();

        try {
            const response = await fetch(`${API_BASE}/api/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productName: productName,
                    maxPrice: maxPrice
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            if (data.success && data.products && data.products.length > 0) {
                showCount(data.products.length, data.meta.budget);
                showResults(data.products);
            } else {
                showError(data.message || 'No products found matching your criteria');
            }

        } catch (error) {
            console.error('Recommendation error:', error);
            if (error.message.includes('Failed to fetch')) {
                showError('Cannot connect to server. Please ensure the backend is running.');
            } else {
                showError(error.message || 'Something went wrong. Please try again.');
            }
        } finally {
            showLoading(false);
        }
    }

    /**
     * Display products count
     */
    function showCount(count, budget) {
        const message = count < 10
            ? `Found ${count} product${count > 1 ? 's' : ''} within ₹${budget.toLocaleString('en-IN')}`
            : `Showing top 10 products within ₹${budget.toLocaleString('en-IN')}`;

        elements.countContainer.innerHTML = `
            <div class="count-badge">
                <i class="fas fa-check-circle"></i> ${message}
            </div>
        `;
        elements.countContainer.style.display = 'block';
    }

    /**
     * Display products in Swiper carousel
     */
    function showResults(products) {
        // Destroy existing Swiper instance if any
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
            swiperInstance = null;
        }

        // Generate slides HTML
        const slidesHtml = products.map(product => `
            <div class="swiper-slide">
                <div class="rec-product-card">
                    <div class="rec-product-image">
                        <img src="${product.image || 'imgs/BG.webp'}" alt="${escapeHtml(product.title)}" onerror="this.src='imgs/BG.webp'">
                    </div>
                    <div class="rec-product-info">
                        <h3 class="rec-product-title">${escapeHtml(product.title)}</h3>
                        <div class="rec-product-price">${product.priceFormatted}</div>
                        <div class="rec-product-rating">
                            ${generateStars(product.rating)}
                            <span class="rec-rating-text">${product.rating.toFixed(1)} (${product.reviews.toLocaleString()} reviews)</span>
                        </div>
                        <div class="rec-product-source">From: ${escapeHtml(product.source)}</div>
                        <a href="${product.link}" target="_blank" rel="noopener noreferrer" class="rec-product-btn">
                            View Product <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        elements.swiperWrapper.innerHTML = slidesHtml;
        elements.resultContainer.style.display = 'block';

        // Initialize Swiper
        swiperInstance = new Swiper('.recommendation-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: products.length > 3,
            grabCursor: true,
            keyboard: {
                enabled: true
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30
                }
            }
        });
    }

    /**
     * Generate star rating HTML
     */
    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let html = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                html += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalf) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }

        return html;
    }

    /**
     * Show/hide loading spinner
     */
    function showLoading(show) {
        elements.loadingSpinner.style.display = show ? 'flex' : 'none';
        elements.submitBtn.disabled = show;
    }

    /**
     * Show error message
     */
    function showError(message) {
        elements.errorContainer.textContent = message;
        elements.errorContainer.style.display = 'block';
    }

    /**
     * Hide error message
     */
    function hideError() {
        elements.errorContainer.style.display = 'none';
    }

    /**
     * Hide result container
     */
    function hideResult() {
        elements.resultContainer.style.display = 'none';
    }

    /**
     * Hide count container
     */
    function hideCount() {
        elements.countContainer.style.display = 'none';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
