import React, { useState } from 'react';
import styles from './AssistantPage.module.css';
import { ChatPane } from '../../components/Chat/index.js';
import { ShoppingListPane } from '../../components/ShoppingList/index.js';
import TabBar from '../../components/Layout/TabBar.jsx';

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className={styles.page}>
      {/* Mobile tab switcher */}
      <div className={styles.tabBarWrap}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className={styles.panes}>
        <div className={activeTab !== 'chat' ? styles.mobileHide : styles.pane}>
          <ChatPane />
        </div>
        <div className={activeTab !== 'list' ? styles.mobileHide : styles.pane}>
          <ShoppingListPane />
        </div>
      </div>
    </div>
  );
}
