import {createRoot} from 'react-dom/client';
import AppRoot from '@/src/app/AppRoot';
import { ENV, assertStartupReadiness, getStartupDiagnostics } from '@/src/config/env';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

const startupDiagnostics = getStartupDiagnostics();
if (startupDiagnostics.warnings.length > 0) {
  console.warn('[startup] Environment warnings:', startupDiagnostics.warnings);
}

if (!ENV.IS_DEVELOPMENT) {
  try {
    assertStartupReadiness();
  } catch (error) {
    rootElement.innerHTML =
      '<div style="padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;line-height:1.5">' +
      '<h1 style="margin:0 0 12px;font-size:24px;color:#111827">Startup configuration error</h1>' +
      '<p style="margin:0 0 12px;color:#374151">The app is blocked from starting because required production environment values are missing or invalid.</p>' +
      '<p style="margin:0;color:#6b7280">Check deployment environment variables and server configuration, then redeploy.</p>' +
      '</div>';
    throw error;
  }
}

createRoot(rootElement).render(
  <AppRoot />,
);
