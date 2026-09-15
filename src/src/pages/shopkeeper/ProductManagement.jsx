import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllProducts,
  getAllCategories,
  deleteProductOverride,
  saveProductOverride,
} from '../../data/catalogUtils.js';
import { getItem } from '../../utils/storage.js';
import { SRA_CATALOG_OVERRIDES } from '../../utils/constants.js';
import { formatPrice } from '../../data/currency.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import styles from '../../styles/admin.module.css';

export default function ProductManagement() {
  const navigate = useNavigate();
  const { state: prefs } = usePreferences();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const importRef = useRef(null);

  const products = useMemo(() => getAllProducts(), [refreshKey]);
  const categories = useMemo(() => getAllCategories(), [refreshKey]);

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, query, categoryFilter]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleDelete(id) {
    if (!window.confirm(`Delete product "${id}"? This cannot be undone.`)) return;
    deleteProductOverride(id);
    setRefreshKey((k) => k + 1);
    showToast('Product deleted.');
  }

  function handleExport() {
    const data = { schemaVersion: 2, products };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalog-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Catalog exported.');
  }

  function handleImportClick() {
    importRef.current?.click();
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const importedProducts = parsed.products ?? parsed;
        if (!Array.isArray(importedProducts)) throw new Error('Expected products array');

        let count = 0;
        importedProducts.forEach((p) => {
          if (p.id && p.name) {
            saveProductOverride(p);
            count++;
          }
        });
        setRefreshKey((k) => k + 1);
        showToast(`Imported ${count} products.`);
      } catch (err) {
        showToast(`Import failed: ${err.message}`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles.adminPage}>
      <h1 className={styles.pageTitle}>📦 Product Management</h1>
      <p className={styles.pageSubtitle}>{products.length} products in catalog</p>

      {toast && <div className={styles.alertSuccess}>{toast}</div>}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search by name, description, or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => navigate('/shopkeeper/products/new')}>
          + Add Product
        </button>
        <button className={styles.btn} onClick={handleExport}>↓ Export JSON</button>
        <button className={styles.btn} onClick={handleImportClick}>↑ Import JSON</button>
        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <p>No products match your search.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price (₹ INR)</th>
                <th>Stock</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{p.id}</div>
                  </td>
                  <td><span className={styles.categoryChip}>{p.category}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{formatPrice(p.price, 'INR')}</td>
                  <td style={{ fontSize: 13 }}>{p.stock ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {(p.tags || []).slice(0, 3).map((t) => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 99 }}>
                          {t}
                        </span>
                      ))}
                      {(p.tags || []).length > 3 && <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>+{p.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`${styles.btn} ${styles.btnSm}`}
                        onClick={() => navigate(`/shopkeeper/products/edit/${p.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
