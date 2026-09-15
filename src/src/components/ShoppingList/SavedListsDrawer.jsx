import React from 'react';
import styles from './SavedListsDrawer.module.css';
import { useShoppingList } from '../../context/index.js';

export default function SavedListsDrawer({ onClose }) {
  const { state, dispatch } = useShoppingList();
  const { savedLists } = state;

  function handleLoad(savedList) {
    dispatch({ type: 'LOAD_LIST', payload: savedList });
    onClose();
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SAVED', payload: id });
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-label="Saved shopping lists">
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span>📁 Saved Lists</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.list}>
          {savedLists.length === 0 ? (
            <p className={styles.empty}>No saved lists yet. Save a list to see it here.</p>
          ) : (
            savedLists.map((list) => {
              const total = list.items.reduce(
                (sum, i) => sum + (i.product?.price ?? 0) * (i.quantity ?? 1),
                0
              );
              return (
                <div
                  key={list.id}
                  className={styles.savedItem}
                  onClick={() => handleLoad(list)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoad(list)}
                  aria-label={`Load ${list.name}`}
                >
                  <div>
                    <div className={styles.savedName}>{list.name}</div>
                    <div className={styles.savedMeta}>
                      {list.items.length} item{list.items.length !== 1 ? 's' : ''} · ~£{total} · Saved {new Date(list.savedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, list.id)}
                    aria-label={`Delete ${list.name}`}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
