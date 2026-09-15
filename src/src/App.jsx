import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePreferences } from './context/PreferencesContext.jsx';

// Pages — lazy loaded for better performance
import LandingPage from './pages/LandingPage.jsx';
import CustomerLayout from './pages/customer/CustomerLayout.jsx';
import AssistantPage from './pages/customer/AssistantPage.jsx';
import ShoppingListPage from './pages/customer/ShoppingListPage.jsx';
import ProductDetailPage from './pages/customer/ProductDetailPage.jsx';
import SettingsPage from './pages/customer/SettingsPage.jsx';
import ShopkeeperLayout from './pages/shopkeeper/ShopkeeperLayout.jsx';
import AdminDashboard from './pages/shopkeeper/AdminDashboard.jsx';
import ProductManagement from './pages/shopkeeper/ProductManagement.jsx';
import ProductForm from './pages/shopkeeper/ProductForm.jsx';

export default function App() {
  const { state: prefs } = usePreferences();
  const isShopkeeper = prefs.role === 'shopkeeper';

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Customer routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<AssistantPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="list" element={<ShoppingListPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Shopkeeper routes */}
      <Route
        path="/shopkeeper"
        element={isShopkeeper ? <ShopkeeperLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
