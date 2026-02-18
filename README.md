# 👟 DripStep — AI-Powered Shoe Shop

## 🔍 About
- A modern, responsive shoe shopping website
- Features a real-time **AI-powered product recommendation engine**
- Finds the best shoe deals within your budget using live search results

---

## ✨ Features
- 🔍 Search for any shoe and get live results via **SerpAPI**
- 💰 Enter your max price — only products within budget are shown
- 🤖 **Google Gemini AI** ranks and recommends the best products
- 🎠 Smooth **Swiper carousel** for browsing results
- 📱 Fully responsive — works on mobile, tablet & desktop
- ⭐ Displays star ratings and review counts per product
- 🔗 One-click links to buy directly from the listing page

---

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS (Vanilla), JavaScript
- **Backend:** Node.js, Express.js
- **AI:** Google Gemini AI (`@google/generative-ai`)
- **Search:** SerpAPI (Google Shopping)
- **UI Libraries:** Swiper.js, Font Awesome, Rellax.js

---

## 📁 Project Structure
```
DripStep/
├── index.html              # Main frontend page
├── css/
│   ├── style.css           # Main styles
│   └── responsive.css      # Responsive styles
├── js/
│   ├── recommendation.js   # Recommendation UI logic
│   └── visuals.js          # Animations & effects
├── imgs/                   # Images
└── backend/
    ├── server.js           # Express API server
    └── services/
        ├── serpapi.service.js   # Product search
        ├── filter.service.js    # Price filtering & ranking
        └── gemini.service.js    # Gemini AI integration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- [SerpAPI key](https://serpapi.com)
- [Google Gemini API key](https://makersuite.google.com)

### Steps
1. Clone the repo: `git clone https://github.com/Rishi0115/DripStep.git`
2. Navigate to backend: `cd DripStep/backend`
3. Install dependencies: `npm install`
4. Create a `.env` file in `backend/`:
   ```env
   SERPAPI_KEY=your_serpapi_key
   GEMINI_API_KEY=your_gemini_key
   PORT=3000
   ```
5. Start the server: `npm start`
6. Open `index.html` in your browser

---

## 📡 API Endpoints
- `GET /api/health` — Server health check
- `POST /api/recommend` — Get product recommendations
  - Body: `{ "productName": "Nike Air Max", "maxPrice": 5000 }`
  - Returns: list of matching products with price, rating, image & buy link

---

## 📬 Contact
- 💼 [LinkedIn](https://linkedin.com)
- 💬 [WhatsApp](https://wa.me/)
- 🐙 [GitHub](https://github.com/Rishi0115)

> ⭐ Star this repo if you found it helpful!
