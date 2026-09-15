# AI Smart Product Recommendation Assistant — Implementation Plan

## Top-Level Overview

**Goal:** Build a frontend-only React (Vite) app inside `src/` that acts as an AI-powered retail
product recommendation assistant. A customer describes what they want to build or do in natural
language; the assistant asks follow-up questions, reasons over a static product catalog, and
produces a complete shopping list with quantities and reasoning shown.

**Approach — Hybrid Engine:**
- **Gemini 1.5 Flash** (direct browser fetch) handles intent classification, slot extraction, and
  follow-up question generation.
- **Deterministic rules layer** (plain JS) reads `catalog.json` relationships, computes quantities
  from extracted slot values, and owns the final item list. The demo works even if the LLM is
  unavailable.
- **localStorage** (via a thin `storage.js` utility) persists chat sessions and saved shopping lists.

**Scope boundary:** Everything goes inside `src/`. No new top-level folders. No external backend.
Template files (`submission.yaml`, `README.md`, `docs/`, etc.) get filled in — not deleted or moved.

---

## Architecture Overview

```
User Input
    │
    ▼
Chat UI (React)
    │
    ├──► LLM Layer (Gemini 1.5 Flash REST)
    │       • Classifies project template
    │       • Extracts slot values from conversation
    │       • Generates next follow-up question
    │       • Falls back to local classifier if API fails
    │
    ├──► Rules Engine (pure JS)
    │       • catalog.json relationship graph
    │       • Quantity computation per template
    │       • Confidence scoring → escalation flag
    │
    └──► Shopping List Panel (React Context + useReducer)
             • Live-builds as items are recommended
             • Persisted to localStorage[sra_shopping_lists]
             • Export: copy-to-clipboard, .txt, .json
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffold & Storage Layer

**Intent:** Bootstrap a working React + Vite app inside `src/`, establish the folder structure,
wire up `localStorage` persistence utilities, and set the environment variable plumbing so every
subsequent sub-task can import from a stable base.

**Expected Outcomes:**
- `src/package.json`, `src/vite.config.js`, `src/index.html` exist and `npm run dev` starts a blank
  React app.
- `src/.env.example` has `VITE_LLM_API_KEY=your_gemini_api_key_here` (and nothing else sensitive).
- `src/utils/storage.js` exports `getItem`, `setItem`, `removeItem`, `clearNamespace` — all JSON-safe
  with try/catch for quota errors.
- `src/utils/constants.js` exports storage key names (`SRA_SESSION`, `SRA_SHOPPING_LISTS`).
- App boots with no console errors.

**Todo List:**
1. Run `npm create vite@latest . -- --template react` inside `src/` (or write the minimal files
   manually since we can't run shell commands in Plan mode — Agent mode will handle this).
2. Add `src/.env.example` with only `VITE_LLM_API_KEY=your_gemini_api_key_here`.
3. Create `src/utils/storage.js` with get/set/remove/clear helpers (JSON parse/stringify, try/catch).
4. Create `src/utils/constants.js` with `SRA_SESSION` and `SRA_SHOPPING_LISTS` key names.
5. Strip Vite's default demo content — leave a blank `<App />` that renders "Hello".
6. Verify `npm run dev` launches without errors.

**Relevant Context:**
- `src/` currently has only `README.md` and `.env.example`.
- The `.gitignore` already covers `node_modules/`, `dist/`, and `.env`.
- Must NOT create files outside `src/`.

**Status:** `[ ] pending`

---

### Sub-Task 2 — Product Catalog (catalog.json)

**Intent:** Design and seed the static product graph that the rules engine consumes. This is the
"knowledge" that makes recommendations expert-level rather than generic. All four required scenarios
must be fully coverable from this single file.

**Expected Outcomes:**
- `src/data/catalog.json` exists with 50+ products covering all four scenarios.
- Each product has: `id`, `name`, `category`, `unit`, `description`, `price` (approximate),
  `attributes` (size options, materials, etc.), `relatedTo` (array of ids), `alternatives` (array of ids).
- A `src/data/templates.js` file defines the four project templates
  (`dining_table`, `tv_mount`, `living_room`, `gaming_pc`) with:
  - `slots`: required info to collect (name, question, type, options if enum).
  - `rules`: a JS function signature (implemented in sub-task 4) that maps slot values → item list.
- Catalog passes a simple sanity check: every `relatedTo` and `alternatives` id resolves to a real product.

**Todo List:**
1. Design the catalog schema (as described above).
2. Write `src/data/catalog.json` covering:
   - **Dining table**: wood sheet, table legs (set), nut & bolt set, wood screws, wood glue,
     sandpaper (coarse + fine), wood polish/stain, clamps, measuring tape.
   - **TV wall mount**: fixed wall mount, tilting wall mount, full-motion mount, wall plugs/anchors,
     M6 bolt set, masonry drill bit, spirit level, HDMI cable, cable management kit.
   - **Living room**: 2-seater sofa, 3-seater sofa, L-shaped sofa, coffee table (small/large),
     TV unit, blackout curtains, sheer curtains, area rug (small/large), floor lamp, wall art set,
     indoor plant set.
   - **Gaming PC**: Intel i5/i7/i9, AMD Ryzen 5/7, NVIDIA RTX 3060/4060/4070, AMD RX 7600,
     16GB/32GB DDR5 RAM, 500GB/1TB NVMe SSD, 650W/750W/850W PSU, ATX mid-tower case,
     air cooler, 240mm AIO liquid cooler, 80+ Bronze/Gold rated PSU, mechanical keyboard,
     gaming mouse, B650/Z790 motherboard.
3. Write `src/data/templates.js` defining the four template objects (slots + metadata only; rule
   functions are stubs that will be filled in sub-task 4).
4. Write `src/data/catalogUtils.js` with helpers: `getProductById(id)`, `getProductsByIds(ids)`,
   `searchProducts(query)` (simple name/category substring search).

**Relevant Context:**
- This file is bundled as a static asset imported by JS — not fetched at runtime.
- Prices are approximate/illustrative — not a live API.
- The rules engine (sub-task 4) imports from this file directly.

**Status:** `[ ] pending`

---

### Sub-Task 3 — LLM Integration Layer

**Intent:** Wrap the Gemini 1.5 Flash REST API in a clean module that the chat state machine can
call. Include a deterministic local fallback so the app never crashes if the API is unavailable.

**Expected Outcomes:**
- `src/services/llmService.js` exports:
  - `classifyIntent(messages)` → `{ template, confidence, slots }` — calls Gemini with a structured
    system prompt; falls back to keyword-matching if the API call fails.
  - `generateFollowUp(template, slots, missingSlots)` → `string` — returns the next question;
    falls back to `missingSlots[0].question` from `templates.js` if the API call fails.
  - `extractSlots(userMessage, template, existingSlots)` → updated slots object; falls back to
    regex-based extractors if the API call fails.
- Every exported function is wrapped in try/catch; the fallback path is tested and documented.
- API key is read via `import.meta.env.VITE_LLM_API_KEY` only — never hardcoded.
- `src/services/geminiApi.js` is the thin fetch wrapper (URL construction, headers, response parsing).

**Todo List:**
1. Create `src/services/geminiApi.js`: `callGemini(systemPrompt, userMessage, schema)` function
   that POSTs to `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
   with `Content-Type: application/json` and `?key=${VITE_LLM_API_KEY}`.
   Request body uses `contents` array with a system message and user message.
   Parse response: extract `candidates[0].content.parts[0].text`, JSON.parse if a schema is expected.
2. Create `src/services/llmFallbacks.js`: keyword-based `classifyIntentLocal(messages)`,
   regex-based `extractSlotsLocal(userMessage, template)`, and default `generateFollowUpLocal(missingSlots)`.
3. Create `src/services/llmService.js`: the three exported functions described above, each calling
   `geminiApi.js` then catching and calling the corresponding fallback.
4. Write system prompts as string constants in `src/services/prompts.js` — one for intent
   classification (returns JSON `{ template, confidence, extractedSlots }`), one for slot extraction,
   one for follow-up generation. Prompts instruct Gemini to return only valid JSON.

**Relevant Context:**
- Gemini's browser CORS is allowed for direct API key requests to `generativelanguage.googleapis.com`.
- The API key is `VITE_LLM_API_KEY` in `.env` / `.env.example`.
- Fallbacks must produce the same shape/type as the LLM path so callers don't need to branch.

**Status:** `[ ] pending`

---

### Sub-Task 4 — Recommendation Rules Engine

**Intent:** Build the deterministic JS layer that converts a filled-in slot set (from the LLM layer)
into a concrete item list with quantities and human-readable reasoning. This is the core
differentiator — it makes recommendations reliable and auditable, not just LLM-guessed.

**Expected Outcomes:**
- `src/engine/recommendationEngine.js` exports `computeRecommendations(template, slots)` which
  returns `{ items: [{ product, quantity, reason }], reasoning: string, confidence: number }`.
- All four scenario rules are implemented:
  - **dining_table**: table area from seating count → sheet count; standard leg spacing → leg count;
    hardware quantities derived from joint count.
  - **tv_mount**: TV size → mount type recommendation; wall type → anchor/plug type; cable management
    conditionally added.
  - **living_room**: room size → sofa size; occupant count → sofa seating validation; budget filter
    applied to alternatives; style → décor items.
  - **gaming_pc**: budget tiers map to GPU/CPU combos; existing peripherals removed from list; RGB
    flag adds case fans / lighting.
- `src/engine/escalationEngine.js` exports `shouldEscalate(template, slots, confidence)` → boolean
  with reason string. Escalates if template is `unknown`, confidence < 0.5 after 2 follow-up
  rounds, or if any required slot is still empty after 3 rounds.
- `src/engine/index.js` re-exports both for clean imports.

**Todo List:**
1. Implement `diningTableRules(slots)` in `src/engine/rules/diningTable.js` — slot inputs:
   `seatingCapacity`, `material`, `dimensions` (derived or given), `finish`. Map → items + reasons.
2. Implement `tvMountRules(slots)` in `src/engine/rules/tvMount.js` — slot inputs: `tvSize`,
   `wallType`, `mountType`, `cableManagement`. Map → items + reasons.
3. Implement `livingRoomRules(slots)` in `src/engine/rules/livingRoom.js` — slot inputs:
   `roomSize`, `budget`, `style`, `occupants`. Map → items + reasons.
4. Implement `gamingPcRules(slots)` in `src/engine/rules/gamingPc.js` — slot inputs:
   `budget`, `useCase`, `rgb`, `existingPeripherals`. Map → items + reasons.
5. Write `src/engine/recommendationEngine.js` — dispatch to correct rule file by template name.
6. Write `src/engine/escalationEngine.js` with the three escalation triggers described above.
7. Export everything from `src/engine/index.js`.

**Relevant Context:**
- Rules import `catalog.json` and `catalogUtils.js` from sub-task 2.
- Quantity formulas (e.g. `Math.ceil(tableArea / sheetArea)`) should be explained in the `reason`
  string so the UI can show them.
- This layer must produce correct output even if the LLM is completely disabled — set
  `VITE_LLM_API_KEY=` to empty to test.

**Status:** `[ ] pending`

---

### Sub-Task 5 — App State (Context + useReducer)

**Intent:** Wire up the global state management: chat session state and shopping list state, both
synced to localStorage. No Redux — pure React Context + useReducer + a debounced localStorage sync.

**Expected Outcomes:**
- `src/context/ChatContext.jsx` provides `chatState` and `chatDispatch` to the whole tree.
  - State shape: `{ messages: [], template: null, slots: {}, confidence: 1.0, escalated: false,
    phase: 'greeting' | 'collecting' | 'recommending' | 'escalated', questionCount: 0 }`.
  - Actions: `ADD_MESSAGE`, `SET_TEMPLATE`, `UPDATE_SLOTS`, `SET_ESCALATED`, `SET_PHASE`,
    `RESET_SESSION`, `LOAD_SESSION`.
  - Syncs to `localStorage[SRA_SESSION]` on every dispatch (debounced 300ms).
  - Loads from localStorage on mount.
- `src/context/ShoppingListContext.jsx` provides `listState` and `listDispatch`.
  - State shape: `{ currentList: { items: [], createdAt: null }, savedLists: [] }`.
  - Actions: `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `SAVE_LIST`, `LOAD_LISTS`,
    `CLEAR_CURRENT`, `SET_CURRENT_LIST`.
  - `savedLists` synced to `localStorage[SRA_SHOPPING_LISTS]`.
- `src/context/index.js` re-exports both contexts and their custom hooks (`useChat`, `useShoppingList`).

**Todo List:**
1. Write `src/context/ChatContext.jsx` with the full reducer, initial state, provider component,
   and `useChat` hook.
2. Write `src/context/ShoppingListContext.jsx` with reducer, initial state, provider, and
   `useShoppingList` hook.
3. Write `src/context/index.js` re-exporting everything.
4. Wrap `<App>` in both providers in `src/main.jsx`.
5. Test: dispatch an action, confirm localStorage is updated, reload page, confirm state is restored.

**Relevant Context:**
- `src/utils/storage.js` (sub-task 1) must be used — do not call `localStorage` directly.
- Debounce is important for the shopping list which may update rapidly as items are added.

**Status:** `[ ] pending`

---

### Sub-Task 6 — Chat Orchestrator (useConversation hook)

**Intent:** Build the central hook that ties the LLM layer, rules engine, and state contexts
together into a single `sendMessage(text)` function the chat UI calls. This is the "brain" that
coordinates the full conversation flow.

**Expected Outcomes:**
- `src/hooks/useConversation.js` exports a hook that returns `{ sendMessage, isLoading, escalated }`.
- `sendMessage(text)` flow:
  1. Appends user message to chat state.
  2. If `phase === 'greeting'` or `template` is null: calls `classifyIntent` (LLM) → dispatches
     `SET_TEMPLATE`, `UPDATE_SLOTS`.
  3. Calls `extractSlots` (LLM) on latest message → dispatches `UPDATE_SLOTS`.
  4. Checks `shouldEscalate` → if true, dispatches `SET_ESCALATED`, sends escalation message.
  5. If required slots still missing: calls `generateFollowUp` (LLM) → appends assistant message,
     increments `questionCount`.
  6. If all required slots filled: calls `computeRecommendations` → dispatches items to shopping
     list, appends reasoning message to chat.
  7. Phase transitions: `greeting → collecting → recommending → done`.
- `isLoading` is true during any async operation — drives a typing indicator in the UI.

**Todo List:**
1. Write `src/hooks/useConversation.js` implementing the 7-step flow above.
2. Add the `ADD_ITEM` dispatch to `ShoppingListContext` inside step 6.
3. Format the assistant's reasoning message: "Recommended because you said X → item + quantity".
4. Handle the `escalated` state: set a special message and lock input.
5. Add a `useEffect` to send a greeting message on first load.
6. Export `useConversation` from `src/hooks/index.js`.

**Relevant Context:**
- Imports `useChat`, `useShoppingList` from `src/context/index.js`.
- Imports LLM functions from `src/services/llmService.js`.
- Imports engine functions from `src/engine/index.js`.
- The fallback path is transparent — if `llmService` returns a fallback result, the orchestrator
  does not need to know; the shape is identical.

**Status:** `[ ] pending`

---

### Sub-Task 7 — Chat UI Components

**Intent:** Build the left-pane chat interface — message bubbles, typing indicator, input bar,
reasoning cards, and the escalation state banner.

**Expected Outcomes:**
- `src/components/Chat/ChatPane.jsx` — the left column; renders the message list and input bar.
- `src/components/Chat/MessageBubble.jsx` — renders a single message (user or assistant).
  Assistant messages may contain a `reasoning` block (shown as a styled card below the bubble).
- `src/components/Chat/TypingIndicator.jsx` — three-dot animation shown while `isLoading`.
- `src/components/Chat/InputBar.jsx` — text input + send button; disabled when `escalated` or
  `isLoading`; Enter key submits.
- `src/components/Chat/EscalationBanner.jsx` — full-width warning card shown when `escalated` is
  true: "This request needs a human expert. Here's what we know so far: [slots summary]."
- All components use CSS Modules (`*.module.css`).
- No console errors. Accessible (labels, roles).

**Todo List:**
1. Create `src/components/Chat/` folder with the five components listed above.
2. Create matching `*.module.css` files for each component.
3. Connect `ChatPane` to `useConversation` and `useChat`.
4. Implement auto-scroll to bottom on new messages.
5. Add keyboard shortcut (Enter) on `InputBar`.
6. Implement `EscalationBanner` with a slot summary renderer.
7. Export all from `src/components/Chat/index.js`.

**Relevant Context:**
- Uses `useChat` from context to read messages and `escalated` flag.
- Uses `useConversation` for `sendMessage`, `isLoading`.
- Styling should be clean and minimal — no heavy framework.

**Status:** `[ ] pending`

---

### Sub-Task 8 — Shopping List Panel Components

**Intent:** Build the right-pane live-building shopping list — the visual proof that the assistant
produces a complete, actionable list as the conversation progresses.

**Expected Outcomes:**
- `src/components/ShoppingList/ShoppingListPane.jsx` — the right column; shows current list items
  and action buttons (Save, Export, Clear).
- `src/components/ShoppingList/ShoppingListItem.jsx` — shows name, quantity, unit, short reason,
  and an "Alternatives" expand toggle that reveals alternative product names.
- `src/components/ShoppingList/ExportButtons.jsx` — three buttons: Copy to Clipboard, Download .txt,
  Download .json. All three work offline.
- `src/components/ShoppingList/SavedListsDrawer.jsx` — slide-in or bottom panel listing all saved
  lists from `localStorage[SRA_SHOPPING_LISTS]`, with timestamp and item count; clicking one loads
  it into the current view.
- `src/components/ShoppingList/EmptyState.jsx` — shown when the current list has no items yet:
  "Start a conversation to build your shopping list."
- All use CSS Modules.

**Todo List:**
1. Create `src/components/ShoppingList/` with the five components above.
2. Connect `ShoppingListPane` to `useShoppingList` context.
3. Implement copy-to-clipboard (`navigator.clipboard.writeText`).
4. Implement `.txt` download (formatted line-per-item) and `.json` download (raw list object).
5. Implement `SavedListsDrawer` open/close toggle.
6. Implement "Save Current List" action that dispatches `SAVE_LIST`.
7. Export all from `src/components/ShoppingList/index.js`.

**Relevant Context:**
- The shopping list panel fills in **live** as items are added — this is the key visual for the
  demo video.
- Export buttons should produce sensible filenames (e.g. `shopping-list-2025-01-01.json`).

**Status:** `[ ] pending`

---

### Sub-Task 9 — App Shell & Layout

**Intent:** Assemble the full two-pane layout, add global styles, connect all providers and panels,
and ensure the app is fully responsive.

**Expected Outcomes:**
- `src/App.jsx` renders a two-column layout: `<ChatPane>` (left) and `<ShoppingListPane>` (right).
- A simple `<Header>` component shows the app name and a "Saved Lists" button.
- `src/styles/global.css` defines CSS custom properties (color tokens, font, spacing) used across
  all modules.
- The layout is responsive: on narrow screens (<768px) the two panes stack vertically; a tab bar
  switches between Chat and List views.
- No console errors. All four scenario happy paths produce a populated list without crashing.
- `src/main.jsx` wraps everything in both context providers.

**Todo List:**
1. Write `src/styles/global.css` with color tokens and base reset.
2. Write `src/components/Layout/Header.jsx` and `Header.module.css`.
3. Update `src/App.jsx` to render the two-pane layout using CSS Grid.
4. Add responsive breakpoint in `src/styles/global.css` (stack on mobile).
5. Add a tab-bar component for mobile (`src/components/Layout/TabBar.jsx`).
6. Smoke-test all four scenarios by typing starter phrases and confirming the list builds.
7. Check browser console — resolve any errors or warnings.

**Relevant Context:**
- Two-pane layout is critical for the demo video judges will watch.
- Keep CSS lightweight — no Tailwind, no Bootstrap unless already in the project (it's not).

**Status:** `[ ] pending`

---

### Sub-Task 10 — Documentation & Submission Metadata

**Intent:** Fill in all template documentation files and update the submission metadata so the
GitHub Action passes and judges have everything they need.

**Expected Outcomes:**
- `docs/problem-statement.md` — fully written, no placeholders.
- `docs/solution-overview.md` — explains hybrid engine, why it beats a naive LLM wrapper.
- `docs/architecture.md` — Mermaid diagram + component table (no double-quotes or parens in brackets).
- `docs/setup-guide.md` — exact commands: `cd src && npm install && npm run dev`; env var
  instructions; how to verify LLM is connected.
- `README.md` — all `[placeholder]` replaced; all 6 required sections filled.
- `src/README.md` — updated with actual `src/` folder map.
- `src/.env.example` — contains only `VITE_LLM_API_KEY=your_gemini_api_key_here`.
- `submission.yaml` — title, problem_statement, solution_summary, key_features, tech_stack updated
  to describe this project (not the old Drug Safety Copilot).
- GitHub Action validation passes (no red checks).

**Todo List:**
1. Write `docs/problem-statement.md` based on the retail-expert scenario.
2. Write `docs/solution-overview.md` explaining hybrid engine design.
3. Write `docs/architecture.md` with Mermaid diagram and component table.
4. Write `docs/setup-guide.md` with step-by-step instructions.
5. Update `README.md` — replace all `[placeholder]` text.
6. Update `src/README.md` with real folder map.
7. Update `src/.env.example` with the correct variable name.
8. Update `submission.yaml` with new project title, summary, key features, and tech stack.

**Relevant Context:**
- `submission.yaml` currently describes "Drug Safety Copilot" — must be replaced entirely.
- The `validate.yml` GitHub Action checks that README.md contains no `[placeholder]` text.
- Do NOT rename, delete, or move any of these files — only edit their content.

**Status:** `[ ] pending`

---

## Implementation Notes

### File Structure (final)
```
src/
  components/
    Chat/
      ChatPane.jsx + .module.css
      MessageBubble.jsx + .module.css
      TypingIndicator.jsx + .module.css
      InputBar.jsx + .module.css
      EscalationBanner.jsx + .module.css
      index.js
    ShoppingList/
      ShoppingListPane.jsx + .module.css
      ShoppingListItem.jsx + .module.css
      ExportButtons.jsx + .module.css
      SavedListsDrawer.jsx + .module.css
      EmptyState.jsx + .module.css
      index.js
    Layout/
      Header.jsx + .module.css
      TabBar.jsx + .module.css
  context/
    ChatContext.jsx
    ShoppingListContext.jsx
    index.js
  data/
    catalog.json
    templates.js
    catalogUtils.js
  engine/
    rules/
      diningTable.js
      tvMount.js
      livingRoom.js
      gamingPc.js
    recommendationEngine.js
    escalationEngine.js
    index.js
  hooks/
    useConversation.js
    index.js
  services/
    geminiApi.js
    llmFallbacks.js
    llmService.js
    prompts.js
  styles/
    global.css
  utils/
    storage.js
    constants.js
  App.jsx
  App.module.css
  main.jsx
  index.html
  package.json
  vite.config.js
  .env.example
  README.md
```

### Execution Order
Sub-tasks 1 → 2 → 3 → 4 are foundational; 5 → 6 builds the state wiring; 7 → 8 → 9 builds the UI;
10 is documentation and can proceed in parallel with UI work but must be finalized last.

### Assumptions Made
1. Gemini 1.5 Flash is called via the `v1beta` endpoint with `generateContent` — the free-tier API
   that accepts browser requests with an `?key=` parameter.
2. The app is run from inside `src/` (`cd src && npm install && npm run dev`) — the Vite root is `src/`.
3. `submission.yaml` title/metadata will be replaced to describe this new project.
4. No TypeScript — plain `.js` / `.jsx` per the existing template style.
5. No test framework required for the hackathon — smoke-testing manually is sufficient.

---

## End-of-Task Checklist (Agent to confirm before declaring done)

- [ ] All 4 scenarios run end-to-end without console errors
- [ ] LLM fallback path tested (works with `VITE_LLM_API_KEY` set to empty)
- [ ] Nothing outside `src/` was created, renamed, or deleted (only edited)
- [ ] `.env` is not committed; `src/.env.example` has only `VITE_LLM_API_KEY`
- [ ] `docs/*.md` and root `README.md` fully filled in, no `[placeholder]` text
- [ ] `submission.yaml` updated to describe this project
- [ ] **Reminder to user: export Bob session reports into `bob_sessions/` folder before submitting**
