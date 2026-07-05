import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('main.tsx running - 2026-05-15 01:25');

// Catch Vite dynamic import / preload failures and reload to load the latest build components
const safeReload = (reason: string) => {
  try {
    const lastReloadStr = sessionStorage.getItem('last_preload_reload');
    const now = Date.now();
    
    // If we reloaded less than 15 seconds ago, do not reload again to prevent infinite loops
    if (lastReloadStr) {
      const lastReload = parseInt(lastReloadStr, 10);
      if (now - lastReload < 15000) {
        console.error(
          `Asset/script error occurred repeatedly within 15 seconds, suppressing reload to prevent infinite loop: ${reason}`
        );
        return;
      }
    }
    
    sessionStorage.setItem('last_preload_reload', String(now));
    console.warn(`Dynamic asset or script error caught, reloading page to refresh files... Reason: ${reason}`);
    window.location.reload();
  } catch (e) {
    // Session storage not available, fall back to simple reload but log first
    console.error('sessionStorage is not available for reload guard, reloading anyway...');
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, reloading page to fetch latest build...', event);
  safeReload('Vite preload error');
});

window.addEventListener('error', (event) => {
  const message = (event.message || '').toLowerCase();
  const srcElement = event.target as any;
  const isScriptOrLink = srcElement && (srcElement.tagName === 'SCRIPT' || srcElement.tagName === 'LINK');
  
  if (
    isScriptOrLink ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading third-party script') ||
    message.includes('load chunk') ||
    message.includes('unexpected token \'<\'')
  ) {
    event.preventDefault();
    const reason = isScriptOrLink 
      ? `Failed to load script or stylesheet: ${srcElement.src || srcElement.href || (srcElement.tagName + ' tag')}` 
      : message;
    safeReload(reason);
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
