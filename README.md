# AI Smart Product Recommendation Assistant

> **IBM Bob Hackathon 2025 — Team MVP Makers**

An AI-powered retail assistant that takes a customer from *"I want to do something"* to *"here is everything you need"* — complete shopping list, quantities, and reasoning shown. Includes a full shopkeeper admin module for catalog management and knowledge preservation.

---

## Team

| Name | Role |
|---|---|
| Vraj Choksi | Lead |
| Dhyey Thummar | Developer |
| Parthiv Panchal | Developer |
| Crish Macwan | Developer |

---

## Problem Statement

Retail stores rely on experienced staff to guide customers through complex product decisions. A customer saying "I want to build a dining table" doesn't know they need plywood sheets, hairpin legs, M8 bolts, PVA glue, sandpaper in two grits, and a varnish — in specific quantities based on table size. As customer volume grows, expert staff become a bottleneck. When they leave, their knowledge goes with them.

Generic e-commerce filters and search bars don't solve this. They require customers to already know what they need. An expert reasons over product relationships, project requirements, and quantities — this assistant does the same. The shopkeeper module is how expert knowledge gets **preserved** — not in a staff member's head, but in structured product data anyone can query.

See [`docs/problem-statement.md`](docs/problem-statement.md) for the full write-up.

---

## Solution

A **hybrid LLM + rules + tag engine** assistant built as a frontend-only React app with two distinct user roles:

**Customer side:**
- **LLM layer (Gemini 1.5 Flash)**: classifies intent, extracts slot values, generates follow-up questions
- **Deterministic rules layer (pure JS)**: computes product lists and quantities from explicit formulas
- **Tag engine**: matches any product tagged with the right use-cases — including shopkeeper-added products
- **Escalation state**: visible human-expert banner when confidence is low
- **Live shopping list**: fills in as the conversation progresses, currency-adjusted

**Shopkeeper side:**
- **Admin module**: add/edit/delete products with full specs, tags, usage guides, troubleshooting
- **Tag-driven recommendations**: a shopkeeper adds a product with `"tags": ["dining-table-build"]` → it immediately appears in dining table recommendations
- **Bulk import/export**: onboard a new store with a JSON catalog upload
- **Dashboard**: catalog stats and most-recommended products from customer sessions

See [`docs/solution-overview.md`](docs/solution-overview.md) for the full design explanation.

---

## Key Features

- 🤖 **Natural language input** — customers describe what they want in plain English
- 🔍 **Follow-up questioning** — never re-asks for info already given
- 🧮 **Quantity reasoning** — explicit formulas (table area ÷ sheet size → sheet count), shown to user
- 💡 **Per-item reasoning** — every item explains *why* it was selected
- 🏪 **Shopkeeper admin** — full product CRUD with specs, tags, usage guide, troubleshooting, import/export
- 🏷️ **Tag-based engine** — shopkeeper-added products become recommendable instantly via tags
- 💰 **Budget allocation** — open-ended goals ("decorate my room for £1000") distribute budget sensibly
- ⚠️ **Human expert escalation** — visible banner with slot summary for low-confidence requests
- 💱 **Multi-currency** — 8 currencies with mock exchange rates, persisted preference
- 📱 **Multi-screen** — Landing, Assistant, Shopping List, Product Detail (specs + guide + troubleshooting), Settings, Shopkeeper Dashboard
- 📵 **Offline fallback** — all scenarios work without an API key via keyword/regex matching
- 💾 **Export & save** — copy, .txt, .json, saved list history

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + Vite 5 |
| Routing | React Router v6 |
| State management | React Context + useReducer (3 contexts) |
| Persistence | Browser localStorage (schema-versioned with migrations) |
| LLM | Gemini 1.5 Flash (direct browser fetch) |
| Styling | Plain CSS Modules |
| AI tooling | IBM Bob |

---

## Repository Structure

```
├── src/                   ← Vite React app (run npm install + npm run dev here)
│   ├── src/               ← Application source files
│   │   ├── components/    ← Chat, ShoppingList, Layout components
│   │   ├── context/       ← ChatContext, ShoppingListContext, PreferencesContext
│   │   ├── data/          ← catalog.json (70+ products), templates.js, currency.js, exchangeRates.json
│   │   ├── engine/        ← Rules engine + tag engine + escalation engine
│   │   ├── hooks/         ← useConversation orchestrator hook
│   │   ├── pages/         ← customer/ (5 pages) + shopkeeper/ (3 pages) + LandingPage
│   │   ├── services/      ← Gemini API, LLM service, fallbacks, prompts
│   │   ├── styles/        ← global.css, admin.module.css
│   │   └── utils/         ← storage.js, constants.js, migrations.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                  ← Architecture, problem statement, setup guide, solution overview
├── demo/                  ← Demo video link and screenshots
└── submission.yaml        ← Hackathon submission metadata
```

---

## How to Run

```bash
cd src
npm install
cp .env.example .env
# Edit .env → set VITE_LLM_API_KEY=your_gemini_api_key
npm run dev
# Opens at http://localhost:5173
```

See [`docs/setup-guide.md`](docs/setup-guide.md) for full instructions including offline mode and troubleshooting.

---

## Demo

### Quick test scenarios

| Role | Action | Try saying |
|---|---|---|
| Customer | Dining table | "I want to build a dining table for 6 people" |
| Customer | TV wall mount | "I need to mount my 55 inch TV on a brick wall" |
| Customer | Living room | "Help me furnish a 20m² living room, modern style" |
| Customer | Gaming PC | "Build me a gaming PC for £1000" |
| Customer | Open-ended | "I want to decorate my room with a £500 budget, boho style" |
| Shopkeeper | Add product | Enter Shopkeeper mode → Products → Add Product |
| Shopkeeper | Import catalog | Products → Import JSON |

Demo video: [`demo/demo-video-link.txt`](demo/demo-video-link.txt)
Screenshots: [`demo/screenshots/`](demo/screenshots/)

---

## Known Limitations

- Mock product catalog — prices are approximate and illustrative; not connected to live inventory
- Gemini 1.5 Flash free tier has rate limits — deterministic fallback activates automatically
- Role selection is UI-only (no authentication) — see `docs/architecture.md` Security Note
- No PDF export — lists export as .txt or .json
- Currency rates are a static mock table — swap `exchangeRates.json` for a live API call in production

---

## What We're Most Proud Of

The **shopkeeper module closing the knowledge-preservation loop**: an expert can add a new product with tags like `dining-table-build` and usage/troubleshooting guides, and that knowledge is immediately available to every customer conversation — no code changes. This is the problem statement's core ask ("preserve expert knowledge permanently") implemented as a working feature, not just a narrative claim. The hybrid tag engine + LLM + hardcoded rules architecture makes it reliable enough to demo under rate limits while remaining extensible through the admin UI.

---

*Built with IBM Bob · AI track · IBM Bob Hackathon 2025*
