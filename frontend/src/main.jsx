import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: false,
  onNeedRefresh() { },
  onOfflineReady() { },
})

import { GoogleOAuthProvider } from '@react-oauth/google';
import usePWAStore from './store/pwaStore';

// Capturar el evento de instalación lo antes posible
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  usePWAStore.getState().setDeferredPrompt(e);
});

window.addEventListener('appinstalled', () => {
  usePWAStore.getState().setDeferredPrompt(null);
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

