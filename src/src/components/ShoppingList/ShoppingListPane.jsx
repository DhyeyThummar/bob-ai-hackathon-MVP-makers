import React, { useState } from 'react';
import styles from './ShoppingListPane.module.css';
import ShoppingListItem from './ShoppingListItem.jsx';
import EmptyState from './EmptyState.jsx';
import ExportButtons from './ExportButtons.jsx';
import SavedListsDrawer from './SavedListsDrawer.jsx';
import { useShoppingList } from '../../context/index.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatPrice } from '../../data/currency.js';

export default function ShoppingListPane() {
  const { state, dispatch } = useShoppingList();
  const { state: prefs } = usePreferences();
  const { currentList } = state;
  const items = currentList.items || [];
  const [showDrawer, setShowDrawer] = useState(false);

  // All items total
  const grandTotal = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 1),
    0
  );

  // Owned items subtotal (what the user already has)
  const ownedTotal = items.reduce(
    (sum, item) => item.owned ? sum + (item.product?.price ?? 0) * (item.quantity ?? 1) : sum,
    0
  );

  // What the user still needs to buy
  const toBuyTotal = grandTotal - ownedTotal;
  const ownedCount = items.filter((i) => i.owned).length;
  const hasOwned = ownedCount > 0;

  function handleSave() {
    if (items.length === 0) return;
    dispatch({ type: 'SAVE_LIST' });
    alert('✅ List saved! Access it via "Saved Lists".');
  }

  function handleClear() {
    if (items.length > 0 && window.confirm('Clear the current list?')) {
      dispatch({ type: 'CLEAR_CURRENT' });
    }
  }

  return (
    <div className={styles.pane}>
      <div className={styles.header}>
        <div>
          <span className={styles.title}>🛒 Shopping List</span>
          {items.length > 0 && (
            <span className={styles.itemCount}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
          )}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => setShowDrawer(true)}
            title="View saved lists"
          >
            📁 Saved
          </button>
          {items.length > 0 && (
            <>
              <button className={styles.actionBtn} onClick={handleSave} title="Save current list">
                💾 Save
              </button>
              <button className={styles.actionBtn} onClick={handleClear} title="Clear list">
                🗑 Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ownership hint — only show when list has items */}
      {items.length > 0 && (
        <p className={styles.ownedHint}>
          ☑ Check items you already own to exclude them from the total.
        </p>
      )}

      <div className={styles.itemList}>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => <ShoppingListItem key={item.id} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <div className={styles.footer}>
          {/* Prominent cost estimate */}
          <div className={styles.costBlock}>
            {hasOwned ? (
              <>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>To buy ({items.length - ownedCount} item{items.length - ownedCount !== 1 ? 's' : ''})</span>
                  <span className={styles.totalAmount}>{formatPrice(toBuyTotal, prefs.currency)}</span>
                </div>
                <div className={styles.ownedRow}>
                  <span className={styles.ownedLabel}>Already own ({ownedCount} item{ownedCount !== 1 ? 's' : ''})</span>
                  <span className={styles.ownedAmount}><s>{formatPrice(ownedTotal, prefs.currency)}</s></span>
                </div>
                <div className={styles.grandTotalRow}>
                  <span className={styles.grandTotalLabel}>Full list value</span>
                  <span className={styles.grandTotalAmount}>{formatPrice(grandTotal, prefs.currency)}</span>
                </div>
              </>
            ) : (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Estimated total ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className={styles.totalAmount}>{formatPrice(grandTotal, prefs.currency)}</span>
              </div>
            )}
          </div>
          <ExportButtons items={items} />
        </div>
      )}

      {showDrawer && <SavedListsDrawer onClose={() => setShowDrawer(false)} />}
    </div>
  );
}
