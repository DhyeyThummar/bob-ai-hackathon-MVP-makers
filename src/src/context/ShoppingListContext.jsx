import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { getItem, setItem } from '../utils/storage.js';
import { SRA_SHOPPING_LISTS } from '../utils/constants.js';

// ── State Shape ───────────────────────────────────────────────────────────────
const initialState = {
  currentList: {
    items: [],      // { id, product, quantity, reason, alternatives, owned }
    createdAt: null,
  },
  savedLists: [],   // Array of { id, items, createdAt, savedAt, name }
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function listReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Prevent duplicate products — update quantity if already present
      const exists = state.currentList.items.find(
        (i) => i.product?.id === action.payload.product?.id
      );
      if (exists) {
        return {
          ...state,
          currentList: {
            ...state.currentList,
            items: state.currentList.items.map((i) =>
              i.product?.id === action.payload.product?.id
                ? { ...i, quantity: action.payload.quantity ?? i.quantity }
                : i
            ),
          },
        };
      }
      return {
        ...state,
        currentList: {
          ...state.currentList,
          createdAt: state.currentList.createdAt ?? new Date().toISOString(),
          items: [
            ...state.currentList.items,
            { id: Date.now() + Math.random(), ...action.payload },
          ],
        },
      };
    }

    case 'ADD_ITEMS': {
      // Bulk add — replace current list entirely
      return {
        ...state,
        currentList: {
          items: action.payload.map((item, idx) => ({ id: Date.now() + idx, ...item })),
          createdAt: new Date().toISOString(),
        },
      };
    }

    case 'TOGGLE_OWNED':
      return {
        ...state,
        currentList: {
          ...state.currentList,
          items: state.currentList.items.map((i) =>
            i.id === action.payload ? { ...i, owned: !i.owned } : i
          ),
        },
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        currentList: {
          ...state.currentList,
          items: state.currentList.items.filter((i) => i.id !== action.payload),
        },
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        currentList: {
          ...state.currentList,
          items: state.currentList.items.map((i) =>
            i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
          ),
        },
      };

    case 'SAVE_LIST': {
      const saved = {
        id: Date.now(),
        name: action.payload?.name || `List ${new Date().toLocaleDateString()}`,
        items: state.currentList.items,
        createdAt: state.currentList.createdAt,
        savedAt: new Date().toISOString(),
      };
      return {
        ...state,
        savedLists: [saved, ...state.savedLists],
      };
    }

    case 'LOAD_LIST':
      return {
        ...state,
        currentList: {
          items: action.payload.items,
          createdAt: action.payload.createdAt,
        },
      };

    case 'CLEAR_CURRENT':
      return {
        ...state,
        currentList: { items: [], createdAt: null },
      };

    case 'DELETE_SAVED':
      return {
        ...state,
        savedLists: state.savedLists.filter((l) => l.id !== action.payload),
      };

    case 'LOAD_LISTS':
      return { ...initialState, savedLists: action.payload };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const ShoppingListContext = createContext(null);

export function ShoppingListProvider({ children }) {
  const persisted = getItem(SRA_SHOPPING_LISTS);
  const [state, dispatch] = useReducer(listReducer, {
    ...initialState,
    savedLists: persisted ?? [],
  });

  // Debounced sync of savedLists only (currentList is ephemeral)
  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setItem(SRA_SHOPPING_LISTS, state.savedLists);
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state.savedLists]);

  return (
    <ShoppingListContext.Provider value={{ state, dispatch }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingList must be used inside <ShoppingListProvider>');
  return ctx;
}
