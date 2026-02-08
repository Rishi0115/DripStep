/**
 * Gemini Service
 * AI-powered product selection using Google Gemini
 * 
 * CRITICAL: Gemini ONLY selects from provided products
 * It does NOT search or scrape - SerpAPI handles that
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
let model = null;

function initializeGemini() {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    if (!genAI) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    return model;
}

/**
 * Use Gemini to select the best product from filtered list
 * 
 * WHY use AI here instead of pure logic?
 * - AI can understand semantic relevance (is "Nike Air Max" good for "running shoes"?)
 * - AI weighs multiple factors holistically (price vs rating vs brand reputation)
 * - AI handles edge cases like misleading titles or fake ratings
 * 
 * @param {string} userQuery - What the user is looking for
 * @param {number} maxPrice - User's budget
 * @param {Array} products - Pre-filtered products (5-8 items max)
 * @returns {Object|null} Selected product or null if no match
 */
async function selectBestProduct(userQuery, maxPrice, products) {
    const geminiModel = initializeGemini();

    // Prepare product list for prompt (minimize tokens)
    const productList = products.map((p, i) => ({
        id: i + 1,
        title: p.title.substring(0, 100),
        price: p.price,
        rating: p.rating,
        reviews: p.reviews,
        source: p.source
    }));

    const prompt = buildPrompt(userQuery, maxPrice, productList);

    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1, // Low temperature for deterministic output
            maxOutputTokens: 200 // Limit response size
        }
    });

    const responseText = result.response.text();

    // Parse Gemini's JSON response
    const selection = parseGeminiResponse(responseText);

    if (!selection || selection.selectedId === 'NO_MATCH_FOUND') {
        return null;
    }

    // Map back to original product
    const selectedIndex = selection.selectedId - 1;
    if (selectedIndex >= 0 && selectedIndex < products.length) {
        return {
            ...products[selectedIndex],
            aiReason: selection.reason
        };
    }

    return null;
}

/**
 * Build the production-grade Gemini prompt
 * Designed for deterministic, JSON-only output
 */
function buildPrompt(userQuery, maxPrice, products) {
    return `You are a product recommendation engine. Your task is to select the SINGLE BEST product from the provided list.

USER REQUEST:
- Looking for: "${userQuery}"
- Maximum budget: ₹${maxPrice}

AVAILABLE PRODUCTS (already filtered within budget):
${JSON.stringify(products, null, 2)}

SELECTION CRITERIA (in order of priority):
1. RELEVANCE: Product must match what user is looking for
2. VALUE: Best balance of quality (rating/reviews) and price
3. TRUSTWORTHINESS: Prefer products with more reviews
4. PRICE: If similar quality, prefer lower price

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON, no other text
- Use this exact schema:
{
  "selectedId": <number from 1-${products.length} OR "NO_MATCH_FOUND">,
  "reason": "<brief 1-sentence explanation>"
}

If NO product is a good match for the user's request, use "NO_MATCH_FOUND".

Respond with JSON only:`;
}

/**
 * Parse Gemini response and extract selection
 */
function parseGeminiResponse(responseText) {
    try {
        // Clean response - remove markdown code blocks if present
        let cleaned = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleaned);

        if (parsed.selectedId !== undefined && parsed.reason) {
            return {
                selectedId: parsed.selectedId,
                reason: parsed.reason
            };
        }

        return null;
    } catch (error) {
        console.error('[Gemini Parse Error]', error.message, responseText);
        return null;
    }
}

module.exports = {
    selectBestProduct
};
