/**
 * LLM Service — public interface for all AI operations.
 * Each function tries the Gemini API first, falls back to local deterministic logic on failure.
 * Callers see a consistent return shape regardless of which path ran.
 */

import { callGemini, callGeminiJSON } from './geminiApi.js';
import {
  INTENT_CLASSIFICATION_PROMPT,
  SLOT_EXTRACTION_PROMPT,
  FOLLOW_UP_PROMPT,
} from './prompts.js';
import {
  classifyIntentLocal,
  extractSlotsFromText,
  generateFollowUpLocal,
} from './llmFallbacks.js';
import { TEMPLATES } from '../data/templates.js';

// ── Intent Classification ─────────────────────────────────────────────────────

/**
 * Classify the user's intent from the conversation messages.
 * @param {Array<{role: string, content: string}>} messages
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ template: string, confidence: number, extractedSlots: object, reasoning: string }>}
 */
export async function classifyIntent(messages, signal) {
  const userText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

  try {
    const result = await callGeminiJSON(INTENT_CLASSIFICATION_PROMPT, userText, signal);
    // Validate shape
    if (!result.template || typeof result.confidence !== 'number') {
      throw new Error('Invalid LLM response shape');
    }
    return result;
  } catch (err) {
    // Don't fall back if the request was intentionally cancelled
    if (err.name === 'AbortError') throw err;
    console.warn('[llmService] classifyIntent fallback:', err.message);
    return classifyIntentLocal(messages);
  }
}

// ── Slot Extraction ───────────────────────────────────────────────────────────

/**
 * Extract slot values from the latest user message given the current template context.
 * @param {string} userMessage - the latest user message text
 * @param {string} templateId - the current template id
 * @param {object} existingSlots - slots already collected
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>} updated slots (merged with existingSlots)
 */
export async function extractSlots(userMessage, templateId, existingSlots, signal) {
  const template = TEMPLATES[templateId];
  if (!template) return existingSlots;

  const prompt = SLOT_EXTRACTION_PROMPT
    .replace('{{TEMPLATE_LABEL}}', template.label)
    .replace('{{CURRENT_SLOTS}}', JSON.stringify(existingSlots || {}))
    .replace('{{USER_MESSAGE}}', userMessage);

  try {
    const raw = await callGeminiJSON(prompt, 'Extract slots from the message above.', signal);
    // Strip nulls/empty — never let extracted nulls wipe confirmed slots
    const extracted = Object.fromEntries(
      Object.entries(raw || {}).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    return { ...existingSlots, ...extracted };
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('[llmService] extractSlots fallback:', err.message);
    const localExtracted = extractSlotsFromText(userMessage.toLowerCase(), templateId);
    // Also strip nulls from local fallback
    const safe = Object.fromEntries(
      Object.entries(localExtracted || {}).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    return { ...existingSlots, ...safe };
  }
}

// ── Follow-up Question Generation ────────────────────────────────────────────

/**
 * Generate the next follow-up question for the user.
 * @param {string} templateId
 * @param {object} filledSlots
 * @param {Array} missingSlots - from getMissingSlots()
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} the question to ask
 */
export async function generateFollowUp(templateId, filledSlots, missingSlots, signal) {
  if (!missingSlots || missingSlots.length === 0) return null;

  const template = TEMPLATES[templateId];
  if (!template) return missingSlots[0]?.question ?? null;

  const knownSlotsText = Object.entries(filledSlots || {})
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ') || 'nothing yet';

  const missingSlotsText = missingSlots.map((s) => s.key).join(', ');

  const prompt = FOLLOW_UP_PROMPT
    .replace('{{TEMPLATE_LABEL}}', template.label)
    .replace('{{KNOWN_SLOTS}}', knownSlotsText)
    .replace('{{MISSING_SLOTS}}', missingSlotsText);

  try {
    const question = await callGemini(prompt, 'Generate the follow-up question now.', signal);
    return question.trim();
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('[llmService] generateFollowUp fallback:', err.message);
    return generateFollowUpLocal(missingSlots);
  }
}
