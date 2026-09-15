import React from 'react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">🛍️</span>
        <span className={styles.appName}>AI Product Assistant</span>
        <span className={styles.tagline}>Expert recommendations for any project</span>
      </div>
      <div className={styles.rightGroup}>
        <span className={styles.ibmBadge}>Powered by IBM Bob</span>
      </div>
    </header>
  );
}
