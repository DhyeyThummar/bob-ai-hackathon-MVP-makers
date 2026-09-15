import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useShoppingList } from '../../context/ShoppingListContext.jsx';
import styles from './CustomerLayout.module.css';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const { dispatch } = usePreferences();
  const { state: listState } = useShoppingList();
  const itemCount = listState.currentList.items.length;

  function switchRole() {
    dispatch({ type: 'SET_ROLE', payload: 'customer' });
    navigate('/');
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand} onClick={() => navigate('/customer/assistant')} style={{ cursor: 'pointer' }}>
          <span className={styles.brandIcon}>🛍️</span>
          <span className={styles.brandName}>AI Product Assistant</span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/customer/assistant" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            💬 Assistant
          </NavLink>
          <NavLink to="/customer/list" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            🛒 List{itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
          </NavLink>
          <NavLink to="/customer/settings" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            ⚙️ Settings
          </NavLink>
        </nav>
        <button className={styles.switchBtn} onClick={switchRole} title="Switch role">
          Switch role
        </button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
