import React from 'react';
import styles from './TabBar.module.css';

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="View switcher">
      <button
        className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
        role="tab"
        aria-selected={activeTab === 'chat'}
        onClick={() => onTabChange('chat')}
      >
        💬 Chat
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
        role="tab"
        aria-selected={activeTab === 'list'}
        onClick={() => onTabChange('list')}
      >
        🛒 Shopping List
      </button>
    </div>
  );
}
