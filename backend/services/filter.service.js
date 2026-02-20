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


// Keywords that identify a product as footwear
const SHOE_KEYWORDS = [
    'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots',
    'sandal', 'sandals', 'slipper', 'slippers', 'loafer', 'loafers',
    'heel', 'heels', 'footwear', 'trainer', 'trainers', 'moccasin',
    'moccasins', 'wedge', 'pump', 'stiletto', 'oxford', 'derby',
    'ballet flat', 'espadrille', 'clog', 'clogs', 'flip flop',
    'flip-flop', 'mule', 'mules', 'canvas shoe', 'sports shoe',
    'running shoe', 'walking shoe', 'leather shoe', 'court shoe',
    'juta', 'jutti', 'mojari', 'chappal', 'jooti'
];

// Blocklist: products with these words are NEVER shoes
const NON_SHOE_KEYWORDS = [
    't-shirt', 'tshirt', 't shirt', 'shirt', 'polo', 'top',
    'dress', 'kurta', 'kurti', 'saree', 'sari', 'lehenga',
    'jeans', 'trouser', 'pant', 'shorts', 'skirt', 'palazzo',
    'jacket', 'hoodie', 'sweater', 'sweatshirt', 'blazer', 'coat',
    'bag', 'backpack', 'handbag', 'purse', 'wallet', 'clutch',
    'watch', 'belt', 'sunglasses', 'glasses', 'cap', 'hat',
    'earring', 'necklace', 'bracelet', 'ring', 'jewel',
    'dumbbell', 'weight', 'barbell', 'kettlebell', 'gym equipment',
    'ball', 'bat', 'racket', 'helmet', 'glove', 'pad',
    'perfume', 'deodorant', 'cream', 'lotion', 'shampoo',
    'phone', 'charger', 'cable', 'headphone', 'earphone', 'speaker',
    'toy', 'game', 'puzzle', 'book', 'notebook',
    'wardrobe', 'furniture', 'bedsheet', 'pillow', 'curtain',
    'bra', 'underwear', 'boxer', 'lingerie', 'innerwear',
    'dupatta', 'stole', 'scarf', 'shawl',
    'tracksuit', 'track pant', 'jogger pant', 'legging',
    'mask', 'towel', 'sock set', 'gift set'
];

/**
 * Returns true if the product title is a shoe/footwear product.
 * Rejects anything containing blocklisted non-shoe words first,
 * then requires at least one shoe keyword.
 * @param {string} title
 * @returns {boolean}
 */
function isShoeProduct(title) {
    const lower = title.toLowerCase();

    // Reject if title contains any non-shoe keyword (T-shirts, bags, etc.)
    if (NON_SHOE_KEYWORDS.some(blocked => lower.includes(blocked))) {
        return false;
    }

    // Must contain a shoe keyword
    return SHOE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Filter and rank products based on rules
 *
 * Rules applied:
 * 1. Remove duplicates (title similarity)
 * 2. Keep only shoe/footwear products (blocks unrelated items like dumbbells)
 * 3. Price must be <= maxPrice (budget constraint)
 * 4. Sort by price ascending (cheapest first)
 * 5. Return top N products (configurable, default 25)
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

    // Step 1: Keep only shoe/footwear products — blocks non-shoe items
    // (e.g. dumbbells returned when user searches "sports")
    const shoeOnly = deduplicated.filter(product => isShoeProduct(product.title));

    // Step 2: Filter by price
    const filtered = shoeOnly.filter(product => {
        if (product.price > maxPrice) {
            return false;
        }
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
