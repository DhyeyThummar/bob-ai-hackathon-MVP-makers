import React from 'react';
import { ShoppingListPane } from '../../components/ShoppingList/index.js';

export default function ShoppingListPage() {
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <ShoppingListPane />
    </div>
  );
}
