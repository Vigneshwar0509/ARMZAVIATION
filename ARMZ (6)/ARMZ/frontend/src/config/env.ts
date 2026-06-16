const parseBoolean = (value: string | boolean | undefined): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const runtimeEnv = (globalThis as any).__VITE_ENV__ as Record<string, unknown> | undefined;
const getEnv = <T = string>(key: string): T | undefined => {
  if (runtimeEnv && key in runtimeEnv) {
    return runtimeEnv[key] as T;
  }
  return (import.meta.env as any)[key] as T | undefined;
};

const configuredApiUrl = ((getEnv('VITE_API_URL') || getEnv('VITE_API_BASE_URL') || '') as string).trim();
const localHttpApiPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i;
const envMode = getEnv('NODE_ENV') as string | undefined;
const devFlag = getEnv('DEV');
const prodFlag = getEnv('PROD');
const isDev = devFlag !== undefined ? parseBoolean(devFlag) : envMode === 'development';
const isProd = prodFlag !== undefined ? parseBoolean(prodFlag) : envMode === 'production';
const shouldUseDevProxy = isDev && localHttpApiPattern.test(configuredApiUrl);
const defaultApiBase = isProd ? '/api' : '';
const apiUrl = shouldUseDevProxy ? '/api' : configuredApiUrl || defaultApiBase;
const appName = ((getEnv('VITE_APP_NAME') as string) || 'ARMZ').trim();
const frontendOnlyRequested = parseBoolean(getEnv('VITE_FRONTEND_ONLY'));
const frontendOnly = frontendOnlyRequested && !isProd;

const razorpayKeyId = ((getEnv('VITE_RAZORPAY_KEY_ID') as string) || '').trim();
const googleClientId = (getEnv('VITE_GOOGLE_CLIENT_ID') as string) || '';
const googleSignInEnabled = getEnv('VITE_GOOGLE_SIGN_IN_ENABLED') === undefined
  ? true
  : parseBoolean(getEnv('VITE_GOOGLE_SIGN_IN_ENABLED'));

export const ENV = {
  API_BASE_URL: apiUrl,
  APP_NAME: appName,
  IS_DEVELOPMENT: isDev,
  ENABLE_ANALYTICS: parseBoolean(getEnv('VITE_ENABLE_ANALYTICS')),
  STRICT_PRODUCTION: isProd,
  RAZORPAY_KEY_ID: razorpayKeyId,
  GOOGLE_CLIENT_ID: googleClientId,
  GOOGLE_SIGN_IN_ENABLED: googleSignInEnabled,
  FRONTEND_ONLY: frontendOnly,
};

export type StartupDiagnostics = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export const getStartupDiagnostics = (): StartupDiagnostics => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isBrowser = typeof window !== 'undefined';
  const isHttpsPage = isBrowser && window.location.protocol === 'https:';
  const isHttpApi = apiUrl.toLowerCase().startsWith('http://');

  if (!frontendOnly && !apiUrl) {
    errors.push('Missing API base URL while frontend-only mode is disabled.');
  }

  if (isProd && frontendOnlyRequested) {
    errors.push('VITE_FRONTEND_ONLY=true is blocked in production.');
  }

  if (isProd && !razorpayKeyId) {
    warnings.push('Missing VITE_RAZORPAY_KEY_ID. Payment flow will not work.');
  }

  if (isProd && !googleClientId) {
    warnings.push('Missing VITE_GOOGLE_CLIENT_ID. Google sign-in will not work.');
  }

  if (!googleSignInEnabled && googleClientId) {
    warnings.push('Google sign-in is disabled by VITE_GOOGLE_SIGN_IN_ENABLED.');
  }

  if (isHttpsPage && isHttpApi) {
    warnings.push('Mixed-content risk: HTTPS app is configured with an HTTP API URL. Use HTTPS API URL to avoid blocked requests.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
};

export const assertStartupReadiness = (): StartupDiagnostics => {
  const diagnostics = getStartupDiagnostics();
  if (!diagnostics.ok) {
    throw new Error(`Startup readiness check failed:\n- ${diagnostics.errors.join('\n- ')}`);
  }
  return diagnostics;
};
