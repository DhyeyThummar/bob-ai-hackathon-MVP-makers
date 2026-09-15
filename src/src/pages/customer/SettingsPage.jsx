import React from 'react';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { getCurrencyList } from '../../data/currency.js';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { state: prefs, dispatch } = usePreferences();
  const currencies = getCurrencyList();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>⚙️ Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Currency</h2>
        <p className={styles.hint}>All prices in the app will be displayed in your chosen currency. Prices are stored in GBP and converted using a static mock exchange-rate table.</p>
        <div className={styles.currencyGrid}>
          {currencies.map((c) => (
            <button
              key={c.code}
              className={`${styles.currencyBtn} ${prefs.currency === c.code ? styles.selected : ''}`}
              onClick={() => dispatch({ type: 'SET_CURRENCY', payload: c.code })}
            >
              <span className={styles.currencySymbol}>{c.symbol}</span>
              <span className={styles.currencyName}>{c.name}</span>
              <span className={styles.currencyCode}>{c.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Style Preference</h2>
        <p className={styles.hint}>Your style preference is used as a hint when making open-ended recommendations (e.g. "furnish my living room").</p>
        <div className={styles.styleGrid}>
          {['modern', 'scandinavian', 'classic', 'boho', 'industrial', 'minimalist'].map((s) => (
            <button
              key={s}
              className={`${styles.styleBtn} ${prefs.style === s ? styles.selected : ''}`}
              onClick={() => dispatch({ type: 'SET_STYLE', payload: s })}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
