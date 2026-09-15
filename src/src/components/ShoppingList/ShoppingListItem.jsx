import React, { useState } from 'react';
import styles from './ShoppingListItem.module.css';
import { useShoppingList } from '../../context/index.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatPrice } from '../../data/currency.js';

export default function ShoppingListItem({ item }) {
  const { dispatch } = useShoppingList();
  const { state: prefs } = usePreferences();
  const [showAlts, setShowAlts] = useState(false);
  const { product, quantity, reason, alternatives = [], owned = false } = item;

  if (!product) return null;

  const totalPriceGBP = product.price * quantity;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock < 5;

  function handleRemove() {
    dispatch({ type: 'REMOVE_ITEM', payload: item.id });
  }

  function handleToggleOwned() {
    dispatch({ type: 'TOGGLE_OWNED', payload: item.id });
  }

  return (
    <div className={`${styles.item} ${owned ? styles.itemOwned : ''} ${isOutOfStock ? styles.itemOutOfStock : ''}`}>
      <div className={styles.header}>
        {/* Already-own checkbox */}
        <label className={styles.ownedLabel} title="Check if you already own this item">
          <input
            type="checkbox"
            className={styles.ownedCheckbox}
            checked={owned}
            onChange={handleToggleOwned}
            aria-label={`Mark ${product.name} as already owned`}
          />
        </label>

        <div className={styles.nameQty}>
          <p className={`${styles.name} ${owned ? styles.nameStruck : ''}`}>{product.name}</p>
          <p className={styles.meta}>
            {quantity} {product.unit}{quantity > 1 ? 's' : ''} · {product.category}
            {owned && <span className={styles.ownedBadge}>✓ Already own</span>}
            {isOutOfStock && <span className={styles.outOfStockBadge}>Out of stock</span>}
            {isLowStock && <span className={styles.lowStockBadge}>Low stock ({product.stock})</span>}
          </p>
        </div>

        <span className={`${styles.price} ${owned ? styles.priceOwned : ''}`}>
          {owned ? <s>{formatPrice(totalPriceGBP, prefs.currency)}</s> : formatPrice(totalPriceGBP, prefs.currency)}
        </span>

        <button
          className={styles.removeBtn}
          onClick={handleRemove}
          aria-label={`Remove ${product.name}`}
          title="Remove item"
        >
          ×
        </button>
      </div>

      {reason && <p className={styles.reason}>💡 {reason}</p>}

      {alternatives.length > 0 && (
        <div>
          <button
            className={styles.altToggle}
            onClick={() => setShowAlts((v) => !v)}
            aria-expanded={showAlts}
          >
            {showAlts ? '▲ Hide alternatives' : `▼ See ${alternatives.length} alternative${alternatives.length > 1 ? 's' : ''}`}
          </button>
          {showAlts && (
            <div className={styles.altList}>
              {alternatives.map((alt) => (
                <span key={alt.id} className={styles.altChip} title={alt.description}>
                  {alt.name} — £{alt.price}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
