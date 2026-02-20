/**
 * Drip Step Backend Server
 * AI-powered product recommendation system
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const serpApiService = require('./services/serpapi.service');
const filterService = require('./services/filter.service');
const geminiService = require('./services/gemini.service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Handle preflight requests
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Main recommendation endpoint
 * POST /api/recommend
 * Body: { productName: string, maxPrice: number }
 */
app.post('/api/recommend', async (req, res) => {
    const startTime = Date.now();

    try {
        const { productName, maxPrice } = req.body;

        // Input validation
        if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INPUT',
                message: 'Product name is required'
            });
        }

        if (!maxPrice || typeof maxPrice !== 'number' || maxPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INPUT',
                message: 'Valid max price (positive number) is required'
            });
        }

        const cleanProductName = productName.trim().substring(0, 100);

        console.log(`[Recommendation] Searching for: "${cleanProductName}" with budget: ₹${maxPrice}`);

        // Step 1: Fetch products from SerpAPI
        let products;
        try {
            products = await serpApiService.searchProducts(cleanProductName, maxPrice);
        } catch (serpError) {
            console.error('[SerpAPI Error]', serpError.message);
            return res.status(503).json({
                success: false,
                error: 'SEARCH_SERVICE_UNAVAILABLE',
                message: 'Product search service is temporarily unavailable'
            });
        }

        if (!products || products.length === 0) {
            return res.json({
                success: true,
                products: [],
                message: 'No products found matching your search'
            });
        }

        console.log(`[SerpAPI] Found ${products.length} products`);

        // Step 2: Apply rule-based filtering - get up to 25 products
        const filteredProducts = filterService.filterAndRank(products, maxPrice, 25);

        if (filteredProducts.length === 0) {
            return res.json({
                success: true,
                products: [],
                message: 'No products found within your budget'
            });
        }

        console.log(`[Filter] ${filteredProducts.length} products after filtering`);

        const duration = Date.now() - startTime;
        console.log(`[Recommendation] Completed in ${duration}ms`);

        // Format products for response
        const formattedProducts = filteredProducts.map(product => ({
            title: product.title,
            price: product.price,
            priceFormatted: `₹${product.price.toLocaleString('en-IN')}`,
            rating: product.rating,
            reviews: product.reviews,
            image: product.image,
            link: product.link,
            source: product.source
        }));

        return res.json({
            success: true,
            products: formattedProducts,
            meta: {
                searchQuery: cleanProductName,
                budget: maxPrice,
                productsFound: products.length,
                productsReturned: formattedProducts.length,
                processingTimeMs: duration
            },
            message: filteredProducts.length < 25
                ? `Found ${filteredProducts.length} product(s) within your budget`
                : null
        });

    } catch (error) {
        console.error('[Server Error]', error);
        return res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Drip Step Backend running on http://localhost:${PORT}`);
    console.log(`📡 Recommendation endpoint: POST http://localhost:${PORT}/api/recommend`);
    console.log(`❤️  Health check: GET http://localhost:${PORT}/api/health\n`);
});
