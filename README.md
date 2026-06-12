# CONFLICTLY — Conflict Intelligence Platform

Interactive world map powered by Claude AI for geopolitical conflict prediction.

## Setup

```bash
# Install dependencies
npm install

# Add your API key
# Edit .env and replace the placeholder with your Google Gemini key:
GEMINI_API_KEY=AIza...        # get one at https://aistudio.google.com/apikey
# Optional: GEMINI_MODEL=gemini-2.0-flash

# Terminal 1 — start the proxy server
npm run server

# Terminal 2 — start the frontend
npm run dev

# Open in browser
http://localhost:5173
```

## Stack

- React 18 + Vite
- react-simple-maps (Robinson/Natural Earth projection)
- Google Gemini (gemini-2.0-flash) via the Generative Language REST API
- Express proxy (keeps API key server-side)
- Pure CSS, no UI libraries
