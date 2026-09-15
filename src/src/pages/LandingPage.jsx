import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext.jsx';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { dispatch } = usePreferences();

  function enterAsCustomer() {
    dispatch({ type: 'SET_ROLE', payload: 'customer' });
    navigate('/customer/assistant');
  }

  function enterAsShopkeeper() {
    dispatch({ type: 'SET_ROLE', payload: 'shopkeeper' });
    navigate('/shopkeeper/dashboard');
  }

  return (
    <div className={styles.landing}>
      <div className={styles.hero}>
        <div className={styles.logoMark}>🛍️</div>
        <h1 className={styles.title}>AI Product Assistant</h1>
        <p className={styles.tagline}>
          Expert-level product guidance — from idea to complete shopping list
        </p>
      </div>

      <div className={styles.roleCards}>
        <button className={`${styles.roleCard} ${styles.customer}`} onClick={enterAsCustomer}>
          <span className={styles.roleIcon}>👤</span>
          <div className={styles.roleInfo}>
            <span className={styles.roleTitle}>I'm a Customer</span>
            <span className={styles.roleDesc}>Get personalised product recommendations and build a complete shopping list</span>
          </div>
          <span className={styles.roleArrow}>→</span>
        </button>

        <button className={`${styles.roleCard} ${styles.shopkeeper}`} onClick={enterAsShopkeeper}>
          <span className={styles.roleIcon}>🏪</span>
          <div className={styles.roleInfo}>
            <span className={styles.roleTitle}>I'm a Shopkeeper</span>
            <span className={styles.roleDesc}>Manage your product catalog, add new items, and configure recommendations</span>
          </div>
          <span className={styles.roleArrow}>→</span>
        </button>
      </div>

      <p className={styles.disclaimer}>
        Role selection is a UI convenience only — no authentication is required for this demo.
      </p>
    </div>
  );
}
