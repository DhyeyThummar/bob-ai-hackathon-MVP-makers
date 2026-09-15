import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { useShoppingList } from '../context/ShoppingListContext.jsx';
import { classifyIntent, extractSlots, generateFollowUp } from '../services/llmService.js';
import { computeRecommendations, shouldEscalate } from '../engine/index.js';
import { getMissingSlots, TEMPLATES } from '../data/templates.js';

const GREETING_MESSAGE = `👋 Hi! I'm your **AI Product Recommendation Assistant**. I can help you build a complete shopping list for:

- 🪑 **Dining table** — wood, legs, fasteners, finish
- 📺 **TV wall mount** — mount, anchors, drill bits, cables
- 🛋️ **Living room** — sofa, tables, rug, lighting, décor
- 🖥️ **Gaming PC** — full parts list matched to your budget

Tell me what you'd like to do — I'll ask a few questions and give you everything you need, with my reasoning shown.`;

// ── useConversation ───────────────────────────────────────────────────────────

export function useConversation() {
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const { dispatch: listDispatch } = useShoppingList();
  const [isLoading, setIsLoading] = useState(false);

  // ── Refs to hold the CURRENT in-flight values ─────────────────────────────
  // React state updates are batched and async — reading chatState.slots
  // at the top of sendMessage() gives the value from the PREVIOUS render.
  // We fix this by keeping a ref that we update synchronously within each call.
  const templateRef = useRef(chatState.template);
  const slotsRef = useRef(chatState.slots);
  const confidenceRef = useRef(chatState.confidence);
  const questionCountRef = useRef(chatState.questionCount);

  // AbortController for the current in-flight LLM request
  const abortControllerRef = useRef(null);

  // Keep refs in sync whenever the context state updates (i.e. after each render)
  useEffect(() => {
    templateRef.current = chatState.template;
    slotsRef.current = { ...chatState.slots };
    confidenceRef.current = chatState.confidence;
    questionCountRef.current = chatState.questionCount;
  }, [chatState.template, chatState.slots, chatState.confidence, chatState.questionCount]);

  // Send greeting on first load
  useEffect(() => {
    if (chatState.messages.length === 0) {
      chatDispatch({
        type: 'ADD_MESSAGE',
        payload: { role: 'assistant', content: GREETING_MESSAGE },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cancel the current in-flight LLM request ─────────────────────────────
  const cancelQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    chatDispatch({
      type: 'ADD_MESSAGE',
      payload: { role: 'assistant', content: '⏹ Request cancelled. What would you like to do?' },
    });
  }, [chatDispatch]);

  // ── Start fresh (keeps saved lists, clears conversation + current list) ───
  const startNew = useCallback(() => {
    // Cancel any in-flight request first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    // Reset refs
    templateRef.current = null;
    slotsRef.current = {};
    confidenceRef.current = 1.0;
    questionCountRef.current = 0;

    chatDispatch({ type: 'RESET_SESSION' });
    listDispatch({ type: 'CLEAR_CURRENT' });

    // Re-add greeting after reset
    setTimeout(() => {
      chatDispatch({
        type: 'ADD_MESSAGE',
        payload: { role: 'assistant', content: GREETING_MESSAGE },
      });
    }, 50);
  }, [chatDispatch, listDispatch]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading || chatState.escalated) return;

      // 1. Add user message to chat
      chatDispatch({
        type: 'ADD_MESSAGE',
        payload: { role: 'user', content: text },
      });

      setIsLoading(true);

      // Create a fresh AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal;

      try {
        const allMessages = [
          ...chatState.messages,
          { role: 'user', content: text },
        ];

        // Read from REFS (not chatState) — these reflect the actual current values
        // even if React hasn't re-rendered since the last dispatch.
        let template = templateRef.current;
        let confidence = confidenceRef.current;
        // Start with a local copy of the ref (the last committed slots)
        let newSlots = { ...slotsRef.current };

        // 2. Classify intent if not yet determined
        if (!template || template === 'unknown') {
          const classified = await classifyIntent(allMessages, signal);
          template = classified.template;
          confidence = classified.confidence;

          // Merge any slots the LLM extracted from the very first message
          // Filter out nulls so they don't wipe already-known slots
          const safeExtracted = Object.fromEntries(
            Object.entries(classified.extractedSlots || {}).filter(
              ([, v]) => v !== null && v !== undefined && v !== ''
            )
          );
          newSlots = { ...newSlots, ...safeExtracted };

          // Update ref immediately so step 3 sees the new template
          templateRef.current = template;
          confidenceRef.current = confidence;

          chatDispatch({ type: 'SET_TEMPLATE', payload: { template, confidence } });
          chatDispatch({ type: 'UPDATE_SLOTS', payload: newSlots });
        }

        // 3. Extract additional slots from the latest message
        if (template && template !== 'unknown') {
          const updatedSlots = await extractSlots(text, template, newSlots, signal);
          // Only keep keys that are non-null and were actually extracted
          const newlyExtracted = Object.fromEntries(
            Object.entries(updatedSlots).filter(([, v]) => v !== null && v !== undefined)
          );
          newSlots = { ...newSlots, ...newlyExtracted };

          // Update ref immediately so getMissingSlots in step 5 sees the new slots
          slotsRef.current = { ...newSlots };

          chatDispatch({ type: 'UPDATE_SLOTS', payload: newSlots });
        }

        // 4. Check escalation
        const { escalate, reason: escalationReason } = shouldEscalate(
          template,
          newSlots,
          confidence,
          questionCountRef.current
        );

        if (escalate) {
          chatDispatch({ type: 'SET_ESCALATED' });
          const slotSummary = Object.entries(newSlots)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `**${k}**: ${v}`)
            .join(', ');

          chatDispatch({
            type: 'ADD_MESSAGE',
            payload: {
              role: 'assistant',
              content: `⚠️ **This request needs a human expert.**\n\n${escalationReason}${slotSummary ? `\n\n**What I collected so far:** ${slotSummary}` : ''}`,
              isEscalation: true,
            },
          });
          return;
        }

        // 5. Check if all required slots are filled
        const missingSlots = getMissingSlots(template, newSlots);

        if (missingSlots.length > 0) {
          // Still collecting — ask the next follow-up question
          chatDispatch({ type: 'SET_PHASE', payload: 'collecting' });
          const question = await generateFollowUp(template, newSlots, missingSlots, signal);
          questionCountRef.current += 1;
          chatDispatch({ type: 'INCREMENT_QUESTION_COUNT' });
          chatDispatch({
            type: 'ADD_MESSAGE',
            payload: { role: 'assistant', content: question },
          });
        } else {
          // 6. All slots filled — run the rules engine
          chatDispatch({ type: 'SET_PHASE', payload: 'recommending' });
          const { items, reasoning } = computeRecommendations(template, newSlots);

          // Dispatch all items to shopping list
          listDispatch({ type: 'ADD_ITEMS', payload: items });

          // Build a human-readable recommendation message
          const templateLabel = TEMPLATES[template]?.label || template;
          const itemSummary = items
            .map((i) => `- **${i.product?.name}** × ${i.quantity} — ${i.reason}`)
            .join('\n');

          const assistantMessage = `✅ **Here's your complete ${templateLabel} shopping list!**\n\n*My reasoning: ${reasoning}*\n\n${itemSummary}\n\n💾 Use the panel on the right to save, copy, or download your list. You can also ask me to adjust anything.`;

          chatDispatch({
            type: 'ADD_MESSAGE',
            payload: {
              role: 'assistant',
              content: assistantMessage,
              reasoning,
            },
          });

          chatDispatch({ type: 'SET_PHASE', payload: 'done' });
        }
      } catch (err) {
        // Silently ignore intentional cancellations
        if (err.name === 'AbortError') return;
        console.error('[useConversation] Unexpected error:', err);
        chatDispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: 'assistant',
            content: '❌ Something went wrong. Please try again.',
          },
        });
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
    // chatState.escalated and chatState.messages are the only chatState fields
    // we actually read from state (not refs) in this function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatState.escalated, chatState.messages, chatDispatch, listDispatch, isLoading]
  );

  // resetConversation is now an alias for startNew (kept for back-compat)
  const resetConversation = startNew;

  return {
    sendMessage,
    cancelQuery,
    startNew,
    resetConversation,
    isLoading,
    escalated: chatState.escalated,
    phase: chatState.phase,
  };
}
