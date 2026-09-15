# Setup Guide

## Prerequisites

- **Node.js** ≥ 18.0 (check with `node --version`)
- **npm** ≥ 9.0 (check with `npm --version`)
- A **Gemini API key** — get one free at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Environment Variables

The app requires one environment variable:

| Variable | Description |
|---|---|
| `VITE_LLM_API_KEY` | Your Gemini API key |

```bash
# Inside the src/ directory, copy the example file:
cd src
cp .env.example .env
# Then edit .env and replace the placeholder with your real key:
# VITE_LLM_API_KEY=your_actual_gemini_key_here
```

> **Security note:** `.env` is already in `.gitignore`. Never commit your real API key.

## Installation & Running

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-directory>

# 2. Move into the application source
cd src

# 3. Install dependencies
npm install

# 4. Set up your API key (see Environment Variables above)
cp .env.example .env
# Edit .env and add your Gemini API key

# 5. Start the development server
npm run dev
```

The app will open automatically at [http://localhost:5173](http://localhost:5173).

## Verifying LLM Is Connected

1. Open the browser console (F12 → Console tab)
2. Type "I want to build a dining table" in the chat
3. If the LLM is connected, you should see intent classified quickly with no `[llmService] fallback` warnings in the console
4. If you see `[llmService] classifyIntent fallback:` warnings, the app is running in offline/fallback mode — recommendations still work but use keyword matching

## Running Without an API Key (Offline / Demo Mode)

The app works without a Gemini API key. Leave `VITE_LLM_API_KEY` empty or set to a dummy value:

```bash
VITE_LLM_API_KEY=
```

All four scenarios still run end-to-end using the deterministic local fallback engine. The conversation
will feel slightly less natural but all product recommendations, quantities, and reasoning are identical.

## Building for Production

```bash
cd src
npm run build
# Output is in src/dist/
npm run preview  # preview production build locally
```

## Quick Demo — Try These Phrases

| Scenario | Starter phrase |
|---|---|
| Dining table | "I want to build a dining table for 6 people" |
| TV wall mount | "I need to mount my 55 inch TV on a brick wall" |
| Living room | "I want to furnish a 20 square metre living room" |
| Gaming PC | "Help me build a gaming PC for £1000" |

Each scenario will ask 1–2 follow-up questions and then produce a complete shopping list in the right panel.

## Troubleshooting

| Issue | Fix |
|---|---|
| `npm install` fails | Ensure Node.js ≥ 18. Run `node --version` to check |
| App shows blank screen | Open browser console — check for import errors |
| LLM returns empty responses | Verify your API key in `.env` starts with `AI` (Gemini keys do) |
| CORS error calling Gemini | This shouldn't happen — Gemini allows browser requests. Check your key is valid |
| localStorage full | Clear browser storage: DevTools → Application → Storage → Clear site data |
