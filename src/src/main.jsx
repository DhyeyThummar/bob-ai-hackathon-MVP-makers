import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ChatProvider } from './context/ChatContext.jsx'
import { ShoppingListProvider } from './context/ShoppingListContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { runMigrations } from './utils/migrations.js'
import App from './App.jsx'
import './styles/global.css'

// Run localStorage migrations on every app load (fast, no-op if already migrated)
runMigrations()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ChatProvider>
          <ShoppingListProvider>
            <App />
          </ShoppingListProvider>
        </ChatProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </React.StrictMode>
)
