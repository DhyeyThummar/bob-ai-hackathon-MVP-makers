# Solution Overview

## What We Built

**AI Smart Product Recommendation Assistant** — a fully client-side React application that takes a
customer from "I want to do something" to "here is everything you need, with quantities and my reasoning."

The assistant supports four fully worked scenarios out of the box:
- 🪑 **Dining table** — wood sheet(s), legs, fasteners, glue, sandpaper, finish
- 📺 **TV wall mount** — mount bracket, wall plugs, drill bits, spirit level, HDMI, cable management
- 🛋️ **Living room** — sofa, coffee table, TV unit, rug, curtains, lamp, décor, plants
- 🖥️ **Gaming PC** — CPU, GPU, motherboard, RAM, SSD, PSU, case, cooler, peripherals (budget-tiered)

## Core Design: Hybrid LLM + Rules Engine

The key architectural decision is that this is **not** a pure "ask the LLM and display the answer"
system. That approach produces plausible-sounding but unreliable recommendations. Instead:

### Layer 1 — LLM (Gemini 1.5 Flash)
The language model handles what LLMs are actually good at:
- **Intent classification** — converting free-form text into a structured project template ID
- **Slot extraction** — pulling specific values (e.g. "6-seat" → `seatingCapacity: 6`) from natural language
- **Follow-up question generation** — asking the *next most useful* question in a conversational way

The LLM never decides *what products to recommend*. It only extracts structured information from text.

### Layer 2 — Deterministic Rules Engine (pure JavaScript)
Once the LLM has extracted slot values, a pure-JS rules layer makes the actual product decisions:
- Looks up products in `catalog.json` by relationship graph
- Computes quantities using explicit formulas (e.g. `Math.ceil(tableArea / sheetArea)`)
- Selects appropriate variants based on slot values (e.g. heavy-duty cavity anchors for plasterboard walls)
- Produces a human-readable `reason` string for every recommended item

This layer is **fully deterministic and testable**. It works identically with or without the LLM. If the
API is unavailable, the LLM layer falls back to keyword-matching and regex extraction — and the rules
engine still produces the same correct output.

### Why This Beats a Pure LLM Wrapper

| Concern | Pure LLM | Our Hybrid |
|---|---|---|
| Hallucinated product names | Common | Impossible — only catalog products |
| Wrong quantities | Frequent | Exact — computed from formulas |
| Breaks when API is down | Yes | No — deterministic fallback |
| Reasoning is visible | Rarely | Always — shown per item |
| Can be audited / extended | Hard | Yes — edit catalog.json or rules file |

## Escalation to Human Experts

When the system is not confident — template is unrecognised, LLM confidence below 50%, or 3+ rounds
without filling required slots — it surfaces a visible "This needs a human expert" banner rather than
silently guessing. The banner shows what the system collected before escalating, so the human expert
can pick up without starting from scratch.

This is a deliberate design choice: AI should augment expert staff, not hallucinate in their place.

## IBM Bob Integration

IBM Bob was used throughout this project as the actual engineering tool:
- Designed the hybrid architecture (plan mode)
- Authored all source code (agent mode)
- Reviewed each major subsystem before moving to the next
- Produced this documentation

Bob's contribution is substantive and load-bearing, not cosmetic boilerplate generation.
See `docs/architecture.md` for the full component map and `bob_sessions/` for exported task reports.
