import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('SW Registered:', reg);
        // Check for updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
            }
          };
        };
      })
      .catch(err => console.error('SW Failed:', err));
  });
}

// Debug PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  // e.preventDefault();
  console.log('👍 beforeinstallprompt fired');
  // Stash the event so it can be triggered later.
  window.deferredPrompt = e;
});

window.addEventListener('appinstalled', (evt) => {
  console.log('🚀 App was installed');
});
