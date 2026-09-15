/**
 * Escalation Engine — determines when a request should be handed to a human expert.
 */

/**
 * Check whether the conversation should escalate to a human expert.
 *
 * Escalation triggers:
 * 1. Template is 'unknown' — we couldn't classify the request
 * 2. Confidence < 0.5 — LLM is unsure about the classification
 * 3. Required slots still missing after 3+ follow-up rounds
 *
 * @param {string} template
 * @param {object} slots - currently filled slot values
 * @param {number} confidence - 0.0 to 1.0
 * @param {number} questionCount - number of follow-up questions asked so far
 * @returns {{ escalate: boolean, reason: string }}
 */
export function shouldEscalate(template, slots, confidence, questionCount) {
  if (template === 'unknown') {
    return {
      escalate: true,
      reason: "I couldn't identify what you're trying to build or set up. This request is outside my product catalog — a human expert can help you find the right solution.",
    };
  }

  if (typeof confidence === 'number' && confidence < 0.5) {
    return {
      escalate: true,
      reason: `I'm not confident enough about what you need (confidence: ${Math.round(confidence * 100)}%). A human expert can better understand your specific requirements.`,
    };
  }

  // After 3+ questions, if we still have no slots filled, escalate
  if (questionCount >= 3 && Object.keys(slots || {}).length === 0) {
    return {
      escalate: true,
      reason: "We've had several exchanges but I still don't have enough information to make a reliable recommendation. A human expert can discuss your specific situation in more detail.",
    };
  }

  return { escalate: false, reason: null };
}
