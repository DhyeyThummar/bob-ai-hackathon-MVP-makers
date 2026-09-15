import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import styles from './ShopkeeperLayout.module.css';

export default function ShopkeeperLayout() {
  const navigate = useNavigate();
  const { dispatch } = usePreferences();

  function switchToCustomer() {
    dispatch({ type: 'SET_ROLE', payload: 'customer' });
    navigate('/customer/assistant');
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarIcon}>🏪</span>
          <span className={styles.sidebarTitle}>Shopkeeper</span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/shopkeeper/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/shopkeeper/products" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            📦 Products
          </NavLink>
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.switchBtn} onClick={switchToCustomer}>
            👤 Switch to Customer
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
