/**
 * Thin wrapper around the Gemini 1.5 Flash REST API.
 * Called by llmService.js — never call this directly from UI code.
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Call Gemini 1.5 Flash with a system instruction and user message.
 * @param {string} systemInstruction - The system prompt
 * @param {string} userMessage - The user's message content
 * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
 * @returns {Promise<string>} The raw text response from the model
 */
export async function callGemini(systemInstruction, userMessage, signal) {
  const apiKey = import.meta.env.VITE_LLM_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_LLM_API_KEY is not set');
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
}

/**
 * Call Gemini and parse the response as JSON.
 * Strips markdown code fences if present (Gemini sometimes wraps JSON in ```json).
 * @param {string} systemInstruction
 * @param {string} userMessage
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>}
 */
export async function callGeminiJSON(systemInstruction, userMessage, signal) {
  const raw = await callGemini(systemInstruction, userMessage, signal);
  // Strip markdown code fences
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}
