# Source Code

This folder contains the complete React + Vite application.

## How to run

```bash
cd src          # this folder
npm install
cp .env.example .env   # then add your Gemini API key
npm run dev     # starts at http://localhost:5173
```

## Folder map

```
src/
  src/                         ← React source files (Vite's src/)
    pages/
      LandingPage.jsx           ← Role select: Customer or Shopkeeper
      customer/
        CustomerLayout.jsx      ← Nav shell for customer section
        AssistantPage.jsx       ← Two-pane chat + live shopping list
        ShoppingListPage.jsx    ← Full-screen shopping list
        ProductDetailPage.jsx   ← Specs, usage guide, troubleshooting
        SettingsPage.jsx        ← Currency + style preference
      shopkeeper/
        ShopkeeperLayout.jsx    ← Sidebar shell for admin section
        AdminDashboard.jsx      ← Catalog stats + analytics
        ProductManagement.jsx   ← Product list, CRUD, import/export
        ProductForm.jsx         ← Add/edit product (all fields)
    components/
      Chat/                     ← ChatPane, MessageBubble, InputBar, TypingIndicator, EscalationBanner
      ShoppingList/             ← ShoppingListPane, ShoppingListItem, ExportButtons, SavedListsDrawer
      Layout/                   ← Header, TabBar
    context/                    ← ChatContext, ShoppingListContext, PreferencesContext
    data/
      catalog.json              ← 70+ products with tags, specs, usage guides, troubleshooting
      templates.js              ← 5 project templates with slot definitions
      catalogUtils.js           ← Merged catalog (bundled + admin overrides from localStorage)
      currency.js               ← formatPrice, convertPrice, getCurrencyList
      exchangeRates.json        ← Mock exchange rates (GBP base, 8 currencies)
    engine/
      recommendationEngine.js   ← Hybrid: hardcoded rules + tag engine
      tagEngine.js              ← Tag-based matching + budget allocation
      escalationEngine.js       ← Confidence-based escalation logic
      rules/                    ← diningTable.js, tvMount.js, livingRoom.js, gamingPc.js
    hooks/
      useConversation.js        ← Main orchestrator: LLM → engine → state
    services/
      geminiApi.js              ← Gemini 1.5 Flash REST wrapper
      llmService.js             ← LLM interface with try/catch + fallbacks
      llmFallbacks.js           ← Keyword/regex fallbacks (offline mode)
      prompts.js                ← Gemini system prompts
    styles/
      global.css                ← CSS custom properties + reset
      admin.module.css          ← Shared admin page styles
    utils/
      storage.js                ← JSON-safe localStorage helpers
      constants.js              ← Storage key names + schema version
      migrations.js             ← Schema migration (runs on startup)
    App.jsx                     ← React Router route definitions
    main.jsx                    ← Entry: providers + BrowserRouter + migrations
  index.html                    ← Vite HTML entry
  package.json
  vite.config.js
  .env.example                  ← Copy to .env, set VITE_LLM_API_KEY
```

## Key design decisions

- **No Redux** — React Context + useReducer (3 contexts: Chat, ShoppingList, Preferences), debounced localStorage sync
- **Hybrid engine** — LLM for NLU, hardcoded rules for exact quantities, tag engine for shopkeeper-added products
- **Fallback-safe** — every LLM call has a local fallback; app works fully offline with empty API key
- **Schema-versioned localStorage** — `migrations.js` runs on startup; `constants.js` holds `SCHEMA_VERSION = 2`
- **CSS Modules** — no heavy UI framework; all styles co-located with components
- **Role-based routing** — `/customer/*` and `/shopkeeper/*` routes; role stored in `localStorage['sra_role']`
