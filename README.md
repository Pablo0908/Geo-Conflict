# CONFLICTLY — Conflict Intelligence Platform

Interactive world map powered by Claude AI for geopolitical conflict prediction.

## Setup

```bash
# Install dependencies
npm install

# Add your API key
# Edit .env and replace the placeholder:
ANTHROPIC_API_KEY=sk-ant-...

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
- Claude claude-sonnet-4-6 via Anthropic SDK
- Express proxy (keeps API key server-side)
- Pure CSS, no UI libraries
