/**
 * Filter Service
 * Rule-based product filtering and ranking
 */

/**
 * Filter and rank products based on rules
 * 
 * Rules applied:
 * 1. Price must be <= maxPrice (budget constraint)
 * 2. Must have rating data (quality signal)
 * 3. Sort by weighted score (rating * log(reviews + 1))
 * 4. Return top N products (configurable)
 * 
 * @param {Array} products - Raw products from SerpAPI
 * @param {number} maxPrice - Maximum price in INR
 * @param {number} limit - Maximum products to return (default 10)
 * @returns {Array} Filtered and ranked products
 */
function filterAndRank(products, maxPrice, limit = 10) {
    if (!Array.isArray(products) || products.length === 0) {
        return [];
    }

    // Step 1: Filter by price and rating existence
    const filtered = products.filter(product => {
        // Must be within budget
        if (product.price > maxPrice) {
            return false;
        }

        // Must have some rating data (quality indicator)
        if (!product.rating || product.rating <= 0) {
            return false;
        }

        return true;
    });

    // Step 2: Calculate ranking score
    // Formula: rating * log(reviews + 1) * priceEfficiency
    // Higher rating = better, more reviews = more trustworthy
    // priceEfficiency rewards products that use less of the budget
    const scored = filtered.map(product => {
        const ratingScore = product.rating;
        const reviewScore = Math.log10(product.reviews + 1) + 1; // +1 to avoid log(0)
        const priceEfficiency = 1 - (product.price / maxPrice) * 0.2; // Small bonus for cheaper

        const score = ratingScore * reviewScore * priceEfficiency;

        return {
            ...product,
            _score: score
        };
    });

    // Step 3: Sort by score descending
    scored.sort((a, b) => b._score - a._score);

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
