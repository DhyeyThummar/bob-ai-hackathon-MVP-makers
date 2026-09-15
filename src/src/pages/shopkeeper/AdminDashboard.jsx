import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, getAllCategories } from '../../data/catalogUtils.js';
import { useShoppingList } from '../../context/ShoppingListContext.jsx';
import { formatPrice, convertPrice } from '../../data/currency.js';
import styles from '../../styles/admin.module.css';

/** Format a large INR total compactly using the real exchange rate.
 *  ≥10L → ₹X.XXL  |  ≥1k → ₹X.Xk  |  else ₹X */
function formatINRCompact(priceGBP) {
  const inr = convertPrice(priceGBP, 'INR');
  if (inr >= 1000000) return `₹${(inr / 100000).toFixed(1)}L`;
  if (inr >= 100000)  return `₹${(inr / 100000).toFixed(2)}L`;
  if (inr >= 1000)    return `₹${(inr / 1000).toFixed(1)}k`;
  return `₹${Math.round(inr)}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { state: listState } = useShoppingList();

  const products = getAllProducts();
  const categories = getAllCategories();

  // Compute most-recommended products from saved lists
  const recommendFreq = useMemo(() => {
    const freq = {};
    listState.savedLists.forEach((list) => {
      (list.items || []).forEach((item) => {
        if (item.product?.id) {
          freq[item.product.id] = (freq[item.product.id] || 0) + (item.quantity || 1);
        }
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count, product: products.find((p) => p.id === id) }))
      .filter((x) => x.product);
  }, [listState.savedLists, products]);

  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  const customCount = (JSON.parse(localStorage.getItem('sra_catalog_overrides') || '[]')).filter((p) => !p.deleted).length;

  const categoryBreakdown = useMemo(() => {
    const counts = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [products]);

  return (
    <div className={styles.adminPage}>
      <h1 className={styles.pageTitle}>📊 Shopkeeper Dashboard</h1>
      <p className={styles.pageSubtitle}>Catalog overview and recommendation analytics</p>

      {/* Stat cards */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{products.length}</div>
          <div className={styles.statLabel}>Total Products</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{categories.length}</div>
          <div className={styles.statLabel}>Categories</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{customCount}</div>
          <div className={styles.statLabel}>Custom (Admin-Added)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{listState.savedLists.length}</div>
          <div className={styles.statLabel}>Saved Customer Lists</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatINRCompact(totalValue)}</div>
          <div className={styles.statLabel}>Catalog Stock Value (INR)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Category breakdown */}
        <div className={styles.card}>
          <h3 style={{ marginBottom: 10, fontWeight: 700 }}>Products by Category</h3>
          {categoryBreakdown.map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>{cat}</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Most recommended */}
        <div className={styles.card}>
          <h3 style={{ marginBottom: 10, fontWeight: 700 }}>Most Recommended Products</h3>
          {recommendFreq.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No saved lists yet — recommendations appear here as customers save lists.</p>
          ) : recommendFreq.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>{item.product?.name}</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>×{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => navigate('/shopkeeper/products')}
        >
          📦 Manage Products →
        </button>
      </div>
    </div>
  );
}
