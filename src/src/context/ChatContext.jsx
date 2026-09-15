import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { getItem, setItem } from '../utils/storage.js';
import { SRA_SESSION } from '../utils/constants.js';

// ── State Shape ───────────────────────────────────────────────────────────────
const initialState = {
  messages: [],          // { id, role: 'user'|'assistant', content, reasoning?, timestamp }
  template: null,        // dining_table | tv_mount | living_room | gaming_pc | unknown | null
  slots: {},             // filled slot key→value pairs
  confidence: 1.0,       // last LLM confidence score
  escalated: false,      // true when escalation threshold hit
  phase: 'greeting',     // greeting | collecting | recommending | done | escalated
  questionCount: 0,      // number of follow-up questions asked
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            ...action.payload,
          },
        ],
      };

    case 'SET_TEMPLATE':
      return {
        ...state,
        template: action.payload.template,
        confidence: action.payload.confidence ?? state.confidence,
      };

    case 'UPDATE_SLOTS': {
      // Never let a null/undefined value overwrite an already-filled slot.
      // LLMs sometimes return null for slots they "saw but couldn't extract" —
      // filtering here prevents filled answers from being wiped out.
      const safe = Object.fromEntries(
        Object.entries(action.payload || {}).filter(
          ([, v]) => v !== null && v !== undefined && v !== ''
        )
      );
      return {
        ...state,
        slots: { ...state.slots, ...safe },
      };
    }

    case 'SET_ESCALATED':
      return {
        ...state,
        escalated: true,
        phase: 'escalated',
      };

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'INCREMENT_QUESTION_COUNT':
      return { ...state, questionCount: state.questionCount + 1 };

    case 'RESET_SESSION':
      return { ...initialState };

    case 'LOAD_SESSION':
      return { ...initialState, ...action.payload };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  // Only restore a session that is actively mid-conversation (collecting phase).
  // If the previous session was 'done', 'escalated', or 'greeting' (fresh start),
  // always start clean so a new query never inherits a stale template.
  const persisted = getItem(SRA_SESSION);
  const shouldRestore =
    persisted &&
    persisted.phase === 'collecting' &&
    persisted.template &&
    persisted.template !== 'unknown' &&
    Array.isArray(persisted.messages) &&
    persisted.messages.length > 0;

  const [state, dispatch] = useReducer(chatReducer, shouldRestore ? persisted : initialState);

  // Debounced localStorage sync
  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setItem(SRA_SESSION, state);
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
