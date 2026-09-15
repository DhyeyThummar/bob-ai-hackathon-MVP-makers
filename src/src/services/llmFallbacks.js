/**
 * Deterministic local fallbacks for every LLM operation.
 * These are used when the Gemini API call fails (network error, rate limit, empty key).
 * They produce the same output shape as the LLM paths.
 */

import { TEMPLATES, getMissingSlots } from '../data/templates.js';

// ── Intent classification via keyword matching ────────────────────────────────

// Each entry: [template, keywords[], partialWords[]]
// keywords = exact substrings (space-tolerant), partialWords = single tokens that alone indicate the template
const INTENT_RULES = [
  {
    template: 'gaming_pc',
    // Checked FIRST — higher priority than dining_table ("build" overlap)
    phrases: [
      'gaming pc', 'gaming pC', 'gamin pc', 'gamin pC', 'gaming computer',
      'gaming rig', 'pc build', 'build pc', 'build a pc', 'assemble pc',
      'gaming setup', 'gaming machine', 'desktop pc', 'gaming desktop',
      'build gaming', 'new pc', 'my pc',
    ],
    // If ANY two of these tokens appear together → gaming_pc
    tokenPairs: [
      ['gaming', 'build'], ['gaming', 'pc'], ['gaming', 'computer'],
      ['build', 'pc'], ['build', 'computer'], ['pc', 'build'],
      ['cpu', 'build'], ['gpu', 'build'], ['ram', 'build'],
    ],
    // Single tokens that alone (without conflicting context) mean gaming_pc
    soloTokens: ['motherboard', 'gpu', 'cpu', 'nvme', 'ssd'],
  },
  {
    template: 'dining_table',
    phrases: [
      'dining table', 'dinner table', 'kitchen table', 'dining room table',
      'make a table', 'wooden table', 'table top', 'table legs', 'tabletop',
      'build a table', 'build table',
    ],
    tokenPairs: [
      ['build', 'table'], ['make', 'table'], ['wooden', 'table'],
      ['dining', 'table'], ['kitchen', 'table'],
    ],
    soloTokens: [],
  },
  {
    template: 'tv_mount',
    phrases: [
      'mount tv', 'tv mount', 'hang tv', 'wall mount', 'tv on wall',
      'mount my tv', 'wall-mount', 'mount television', 'hang television',
      'tv bracket', 'tv mounting', 'mount the tv',
    ],
    tokenPairs: [
      ['mount', 'tv'], ['hang', 'tv'], ['mount', 'television'],
      ['wall', 'tv'], ['tv', 'wall'],
    ],
    soloTokens: [],
  },
  {
    template: 'living_room',
    phrases: [
      'living room', 'lounge', 'sitting room', 'furnish', 'furnishing',
      'sofa', 'couch', 'decorate room', 'living area', 'front room',
    ],
    tokenPairs: [
      ['furnish', 'room'], ['living', 'room'], ['sitting', 'room'],
    ],
    soloTokens: ['sofa', 'couch', 'lounge'],
  },
  {
    template: 'decorate_room',
    phrases: [
      'decorate', 'redecorate', 'room makeover', 'furnish room', 'home decor',
      'interior design', 'buy furniture', 'room decoration', 'makeover',
    ],
    tokenPairs: [
      ['decorate', 'room'], ['room', 'makeover'],
    ],
    soloTokens: ['redecorate'],
  },
];

/**
 * Classify intent using keyword/token matching across all messages.
 * Checks gaming_pc FIRST to avoid "build" matching dining_table keywords.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {{ template: string, confidence: number, extractedSlots: object, reasoning: string }}
 */
export function classifyIntentLocal(messages) {
  const text = messages
    .filter((m) => m.role === 'user') // only user messages for intent
    .map((m) => m.content)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s£$]/g, ' '); // strip punctuation for cleaner token matching

  const tokens = new Set(text.split(/\s+/).filter(Boolean));

  for (const rule of INTENT_RULES) {
    // 1. Exact phrase match
    for (const phrase of rule.phrases) {
      if (text.includes(phrase)) {
        const slots = extractSlotsFromText(text, rule.template);
        return {
          template: rule.template,
          confidence: 0.85,
          extractedSlots: slots,
          reasoning: `Matched phrase "${phrase}".`,
        };
      }
    }

    // 2. Token-pair match (both tokens appear in text)
    for (const [a, b] of (rule.tokenPairs || [])) {
      if (tokens.has(a) && tokens.has(b)) {
        const slots = extractSlotsFromText(text, rule.template);
        return {
          template: rule.template,
          confidence: 0.80,
          extractedSlots: slots,
          reasoning: `Matched token pair "${a}" + "${b}".`,
        };
      }
    }

    // 3. Solo token match (high-signal single words)
    for (const token of (rule.soloTokens || [])) {
      if (tokens.has(token)) {
        const slots = extractSlotsFromText(text, rule.template);
        return {
          template: rule.template,
          confidence: 0.70,
          extractedSlots: slots,
          reasoning: `Matched solo token "${token}".`,
        };
      }
    }
  }

  return {
    template: 'unknown',
    confidence: 0.3,
    extractedSlots: {},
    reasoning: 'No matching keywords found for any template.',
  };
}

// ── Slot extraction via regex ─────────────────────────────────────────────────

/**
 * Extract slots from free text using simple regex patterns.
 * Returns only slots that were actually found — never returns null values.
 * @param {string} text - combined user text (already lowercased)
 * @param {string} template - the identified template id
 * @returns {object} partial slots object (no null values)
 */
export function extractSlotsFromText(text, template) {
  const slots = {};

  // Numbers — look for digits near relevant keywords
  const numMatch = text.match(/\b(\d+)\b/g);
  const numbers = numMatch ? numMatch.map(Number) : [];

  if (template === 'dining_table') {
    const seatMatch = text.match(/\b(\d+)\s*(?:seat|person|people|seater)\b/i);
    if (seatMatch) {
      slots.seatingCapacity = parseInt(seatMatch[1], 10);
    } else {
      // Only infer from bare number if it's clearly a seating-range number (2-12)
      // and context has seating-related words
      const hasSeatContext = /\bseat|people|person|seater|dining|table\b/.test(text);
      if (hasSeatContext && numbers.some((n) => n >= 2 && n <= 12)) {
        slots.seatingCapacity = numbers.find((n) => n >= 2 && n <= 12);
      }
    }

    if (/\boak\b/.test(text)) slots.material = 'oak';
    else if (/\bpine\b/.test(text)) slots.material = 'pine';
    else if (/\bplywood\b/.test(text)) slots.material = 'plywood';

    if (/\bdanish oil\b/.test(text)) slots.finish = 'danish oil';
    else if (/\bstain\b/.test(text)) slots.finish = 'stain';
    else if (/\bvarnish\b/.test(text)) slots.finish = 'varnish';
  }

  if (template === 'tv_mount') {
    const tvSizeMatch = text.match(/\b(\d{2,3})\s*(?:inch|inches|"|in\b)/i);
    if (tvSizeMatch) {
      slots.tvSize = parseInt(tvSizeMatch[1], 10);
    } else if (numbers.some((n) => n >= 24 && n <= 100)) {
      slots.tvSize = numbers.find((n) => n >= 24 && n <= 100);
    }

    if (/\bbrick\b/.test(text)) slots.wallType = 'brick';
    else if (/\bconcrete\b/.test(text)) slots.wallType = 'concrete';
    else if (/\bplasterboard\b|plaster board\b/.test(text)) slots.wallType = 'plasterboard';
    else if (/\bhollow\b/.test(text)) slots.wallType = 'hollow';

    if (/\bfull.motion\b|articul/.test(text)) slots.mountType = 'full-motion';
    else if (/\btilt\b/.test(text)) slots.mountType = 'tilt';
    else if (/\bfixed\b/.test(text)) slots.mountType = 'fixed';

    if (/\bcable management\b|hide cables?\b|conceal cables?\b/.test(text)) {
      slots.cableManagement = true;
    } else if (/\bno cable\b/.test(text)) {
      slots.cableManagement = false;
    }
  }

  if (template === 'living_room') {
    const roomMatch = text.match(/\b(\d+)\s*(?:m2|sq|square|sqm)\b/i);
    if (roomMatch) slots.roomSizeM2 = parseInt(roomMatch[1], 10);
    else if (numbers.some((n) => n >= 8 && n <= 100)) {
      slots.roomSizeM2 = numbers.find((n) => n >= 8 && n <= 100);
    }

    const occupantMatch = text.match(/\b(\d+)\s*(?:person|people|occupant|member|adult)/i);
    if (occupantMatch) slots.occupants = parseInt(occupantMatch[1], 10);

    const budgetMatch = text.match(/[£$]?\s*(\d{3,5})\s*(?:budget|gbp|pound)?/i);
    if (budgetMatch) slots.budget = parseInt(budgetMatch[1], 10);

    const styleList = ['modern', 'scandinavian', 'classic', 'boho', 'industrial', 'minimalist'];
    for (const style of styleList) {
      if (text.includes(style)) { slots.style = style; break; }
    }
  }

  if (template === 'gaming_pc') {
    const budgetMatch = text.match(/[£$]?\s*(\d{3,5})\s*(?:budget|gbp|pound)?/i);
    if (budgetMatch) {
      slots.budget = parseInt(budgetMatch[1], 10);
    } else if (numbers.some((n) => n >= 300 && n <= 5000)) {
      slots.budget = numbers.find((n) => n >= 300 && n <= 5000);
    }

    if (/\bstreaming\b/.test(text)) slots.useCase = 'streaming';
    else if (/\bcontent creation\b/.test(text)) slots.useCase = 'content creation';
    else if (/\bgaming\b/.test(text)) slots.useCase = 'gaming';

    if (/\bno rgb\b/.test(text)) slots.rgb = false;
    else if (/\brgb\b/.test(text)) slots.rgb = true;

    if (/already have.*(?:keyboard|mouse)|own.*(?:keyboard|mouse)/i.test(text)) {
      const parts = [];
      if (/keyboard/i.test(text)) parts.push('keyboard');
      if (/mouse/i.test(text)) parts.push('mouse');
      slots.existingPeripherals = parts.join(',');
    } else if (/\bno keyboard\b|\bno mouse\b/.test(text)) {
      slots.existingPeripherals = 'none';
    }
  }

  if (template === 'decorate_room') {
    const budgetMatch = text.match(/[£$]?\s*(\d{3,5})\s*(?:budget|gbp|pound)?/i);
    if (budgetMatch) {
      slots.budget = parseInt(budgetMatch[1], 10);
    } else if (numbers.some((n) => n >= 100 && n <= 20000)) {
      slots.budget = numbers.find((n) => n >= 100 && n <= 20000);
    }
    const styleList = ['modern', 'scandinavian', 'classic', 'boho', 'industrial', 'minimalist'];
    for (const style of styleList) {
      if (text.includes(style)) { slots.style = style; break; }
    }
  }

  return slots;
}

/**
 * Generate a fallback follow-up question from the missing slots list.
 * @param {Array<{key: string, question: string}>} missingSlots
 * @returns {string}
 */
export function generateFollowUpLocal(missingSlots) {
  if (!missingSlots || missingSlots.length === 0) return null;
  return missingSlots[0].question;
}
