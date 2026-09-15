import React from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState() {
  return (
    <div className={styles.empty} aria-label="Shopping list is empty">
      <span className={styles.icon}>🛒</span>
      <p className={styles.title}>Your list is empty</p>
      <p className={styles.sub}>
        Start a conversation on the left — I'll fill your shopping list as I learn about your project.
      </p>
    </div>
  );
}
