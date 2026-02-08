/**
 * SerpAPI Service
 * Handles product search using Google Shopping engine
 */

const axios = require('axios');

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPAPI_URL = 'https://serpapi.com/search.json';

/**
 * Search for products using SerpAPI Google Shopping
 * @param {string} query - Product search query
 * @returns {Promise<Array>} Array of product objects
 */
async function searchProducts(query) {
    if (!SERPAPI_KEY) {
        throw new Error('SERPAPI_KEY not configured');
    }

    const params = {
        api_key: SERPAPI_KEY,
        engine: 'google_shopping',
        q: query,
        location: 'India',
        gl: 'in',
        hl: 'en',
        num: 40 // Fetch more to have options after filtering
    };

    const response = await axios.get(SERPAPI_URL, {
        params,
        timeout: 15000 // 15 second timeout
    });

    const results = response.data.shopping_results || [];

    // Extract and normalize product data
    return results
        .map(item => extractProductData(item))
        .filter(product => product !== null);
}

/**
 * Extract and normalize product data from SerpAPI result
 * @param {Object} item - Raw SerpAPI shopping result
 * @returns {Object|null} Normalized product or null if invalid
 */
function extractProductData(item) {
    // Skip sponsored/ads
    if (item.sponsored || item.ad) {
        return null;
    }

    const price = normalizePrice(item.price || item.extracted_price);

    // Skip if no valid price
    if (!price || price <= 0) {
        return null;
    }

    const rating = parseFloat(item.rating) || 0;
    const reviews = parseInt(item.reviews) || 0;

    return {
        title: item.title || 'Unknown Product',
        price: price,
        rating: rating,
        reviews: reviews,
        image: item.thumbnail || null,
        link: item.link || item.product_link || null,
        source: item.source || 'Unknown'
    };
}

/**
 * Normalize price string to number
 * Handles formats like "₹1,999", "Rs. 2,500", "INR 3000", etc.
 * @param {string|number} priceInput - Raw price value
 * @returns {number} Price as number, or 0 if invalid
 */
function normalizePrice(priceInput) {
    if (typeof priceInput === 'number') {
        return priceInput;
    }

    if (!priceInput || typeof priceInput !== 'string') {
        return 0;
    }

    // Remove currency symbols and text
    let cleaned = priceInput
        .replace(/[₹$€£]/g, '')
        .replace(/Rs\.?/gi, '')
        .replace(/INR/gi, '')
        .replace(/,/g, '')
        .trim();

    // Handle range prices (take lower value): "1,999 - 2,499"
    if (cleaned.includes('-')) {
        cleaned = cleaned.split('-')[0].trim();
    }

    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
}

module.exports = {
    searchProducts,
    normalizePrice
};
