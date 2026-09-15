import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage.js';
import { SRA_PREFERENCES, SRA_ROLE } from '../utils/constants.js';

const DEFAULT_PREFS = {
  currency: 'GBP',
  style: 'modern',
};

const initialState = {
  currency: 'GBP',
  style: 'modern',
  role: 'customer', // 'customer' | 'shopkeeper'
};

function prefsReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };
    case 'SET_STYLE':
      return { ...state, style: action.payload };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'LOAD':
      return { ...initialState, ...action.payload };
    default:
      return state;
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const persisted = getItem(SRA_PREFERENCES);
  const role = getItem(SRA_ROLE);
  const [state, dispatch] = useReducer(prefsReducer, {
    ...initialState,
    ...(persisted ?? {}),
    role: role ?? 'customer',
  });

  useEffect(() => {
    setItem(SRA_PREFERENCES, { currency: state.currency, style: state.style });
    setItem(SRA_ROLE, state.role);
  }, [state]);

  return (
    <PreferencesContext.Provider value={{ state, dispatch }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be inside <PreferencesProvider>');
  return ctx;
}
