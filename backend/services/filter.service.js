/**
 * Filter Service
 * Rule-based product filtering and ranking
 */

/**
 * Remove duplicate products based on title similarity
 * @param {Array} products - Array of products
 * @returns {Array} Deduplicated products
 */
function removeDuplicates(products) {
    const seen = new Map();

    return products.filter(product => {
        // Aggressively normalize title for better duplicate detection
        const normalizedTitle = product.title
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove all special characters and punctuation
            .replace(/\b(men|women|mens|womens|kids|unisex|cricket|running|shoes|sneakers|shoe|sneaker|puma|nike|adidas)\b/g, '') // Remove common brand/type words
            .replace(/\s+/g, '') // Remove all spaces
            .trim();

        // Check both full normalized title and first 15 characters for similarity
        const shortKey = normalizedTitle.substring(0, 15);

        // If we've seen this exact title or very similar one, it's a duplicate
        if (seen.has(normalizedTitle) || seen.has(shortKey)) {
            return false;
        }

        // Mark both versions as seen to catch future duplicates
        seen.set(normalizedTitle, true);
        seen.set(shortKey, true);
        return true;
    });
}


/**
 * Filter and rank products based on rules
 * 
 * Rules applied:
 * 1. Remove duplicates (title similarity)
 * 2. Price must be <= maxPrice (budget constraint)
 * 3. Sort by price ascending (cheapest first)
 * 4. Return top N products (configurable, default 25)
 * 
 * @param {Array} products - Raw products from SerpAPI
 * @param {number} maxPrice - Maximum price in INR
 * @param {number} limit - Maximum products to return (default 25)
 * @returns {Array} Filtered and ranked products sorted by price
 */
function filterAndRank(products, maxPrice, limit = 25) {
    if (!Array.isArray(products) || products.length === 0) {
        return [];
    }

    // Step 0: Remove duplicates based on title similarity
    const deduplicated = removeDuplicates(products);

    // Step 1: Filter by price only (relaxed to get more results)
    const filtered = deduplicated.filter(product => {
        // Must be within budget
        if (product.price > maxPrice) {
            return false;
        }
        // Accept all products with valid price (removed strict rating requirement)
        return true;
    });

    // Step 2: Calculate ranking score for quality indication
    // Formula: rating * log(reviews + 1) * priceEfficiency
    // Higher rating = better, more reviews = more trustworthy
    // priceEfficiency rewards products that use less of the budget
    const scored = filtered.map(product => {
        const ratingScore = product.rating || 3; // Default to 3 if no rating
        const reviewScore = Math.log10(product.reviews + 1) + 1;
        const priceEfficiency = 1 - (product.price / maxPrice) * 0.2;

        const score = ratingScore * reviewScore * priceEfficiency;

        return {
            ...product,
            _score: score
        };
    });

    // Step 3: Sort by PRICE (lowest first) for best deals
    scored.sort((a, b) => a.price - b.price);

    // Step 4: Return top N products
    const topProducts = scored.slice(0, limit);

    // Remove internal score before returning
    return topProducts.map(({ _score, ...product }) => product);
}

/**
 * Get filter statistics for debugging
 */
function getFilterStats(products, maxPrice) {
    const total = products.length;
    const withinBudget = products.filter(p => p.price <= maxPrice).length;
    const withRating = products.filter(p => p.rating > 0).length;
    const passing = filterAndRank(products, maxPrice).length;

    return {
        total,
        withinBudget,
        withRating,
        passing
    };
}

module.exports = {
    filterAndRank,
    getFilterStats
};
