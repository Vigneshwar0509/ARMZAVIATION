import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const testEnv: Record<string, unknown> = {};
const stubViteEnv = (key: string, value: string) => {
  testEnv[key] = value;
  return vi.stubEnv(key, value);
};

const defaultLocation = {
  protocol: 'http:',
  hostname: 'localhost',
  pathname: '/dashboard',
  href: '',
};

Object.defineProperty(window, 'location', {
  value: { ...defaultLocation },
  writable: true,
});

const loadEnvModule = async () => {
  vi.resetModules();
  const envVars = {
    ...Object.fromEntries(Object.entries(import.meta.env as Record<string, unknown>)),
    ...testEnv,
  };

  (globalThis as any).__VITE_ENV__ = Object.fromEntries(
    Object.entries(envVars).filter(([key]) =>
      key.startsWith('VITE_') || key === 'DEV' || key === 'PROD' || key === 'NODE_ENV'
    )
  );

  return await import('@/src/config/env');
};
describe('ENV Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(testEnv, {
      VITE_API_URL: '',
      VITE_API_BASE_URL: '',
      VITE_APP_NAME: '',
      VITE_FRONTEND_ONLY: '',
      VITE_ENABLE_ANALYTICS: '',
      VITE_RAZORPAY_KEY_ID: '',
      VITE_GOOGLE_CLIENT_ID: '',
      DEV: 'false',
      PROD: 'false',
      NODE_ENV: 'test',
    });
    stubViteEnv('VITE_API_URL', '');
    stubViteEnv('VITE_API_BASE_URL', '');
    stubViteEnv('VITE_APP_NAME', '');
    stubViteEnv('VITE_FRONTEND_ONLY', '');
    stubViteEnv('VITE_ENABLE_ANALYTICS', '');
    stubViteEnv('VITE_RAZORPAY_KEY_ID', '');
    stubViteEnv('VITE_GOOGLE_CLIENT_ID', '');
    stubViteEnv('DEV', 'false');
    stubViteEnv('PROD', 'false');

    window.location.protocol = 'http:';
    window.location.pathname = '/dashboard';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).__VITE_ENV__;
  });

  describe('API URL Configuration', () => {
    it('should use VITE_API_URL when provided', async () => {
      stubViteEnv('VITE_API_URL', 'https://api.example.com');
      const { ENV } = await loadEnvModule();

      expect(ENV.API_BASE_URL).toBe('https://api.example.com');
    });

    it('should fallback to VITE_API_BASE_URL when VITE_API_URL is not provided', async () => {
      stubViteEnv('VITE_API_BASE_URL', 'https://api.fallback.com');
      const { ENV } = await loadEnvModule();

      expect(ENV.API_BASE_URL).toBe('https://api.fallback.com');
    });

    it('should use dev proxy for localhost HTTP URLs in development', async () => {
      stubViteEnv('DEV', 'true');
      stubViteEnv('VITE_API_URL', 'http://localhost:8000');
      const { ENV } = await loadEnvModule();

      expect(ENV.API_BASE_URL).toBe('/api');
    });

    it('should use dev proxy for 127.0.0.1 HTTP URLs in development', async () => {
      stubViteEnv('DEV', 'true');
      stubViteEnv('VITE_API_URL', 'http://127.0.0.1:8000');
      const { ENV } = await loadEnvModule();

      expect(ENV.API_BASE_URL).toBe('/api');
    });

    it('should not use dev proxy in production', async () => {
      stubViteEnv('PROD', 'true');
      stubViteEnv('VITE_API_URL', 'http://localhost:8000');
      const { ENV } = await loadEnvModule();

      expect(ENV.API_BASE_URL).toBe('http://localhost:8000');
    });

    it('should throw error for missing API URL in production', async () => {
      stubViteEnv('PROD', 'true');
      stubViteEnv('VITE_API_URL', '');

      const { assertStartupReadiness } = await loadEnvModule();
      expect(() => assertStartupReadiness()).toThrow('Startup readiness check failed');
    });
  });

  describe('App Name Configuration', () => {
    it('should use VITE_APP_NAME when provided', async () => {
      stubViteEnv('VITE_APP_NAME', 'My Custom App');
      const { ENV } = await loadEnvModule();

      expect(ENV.APP_NAME).toBe('My Custom App');
    });

    it('should default to "ARMZ" when VITE_APP_NAME is not provided', async () => {
      const { ENV } = await loadEnvModule();

      expect(ENV.APP_NAME).toBe('ARMZ');
    });
  });

  describe('Frontend Only Mode', () => {
    it('should enable frontend-only mode in development when requested', async () => {
      stubViteEnv('DEV', 'true');
      stubViteEnv('VITE_FRONTEND_ONLY', 'true');
      const { ENV } = await loadEnvModule();

      expect(ENV.FRONTEND_ONLY).toBe(true);
    });

    it('should parse boolean values correctly', async () => {
      stubViteEnv('DEV', 'true');
      stubViteEnv('VITE_FRONTEND_ONLY', 'TRUE');
      const { ENV } = await loadEnvModule();

      expect(ENV.FRONTEND_ONLY).toBe(true);
    });
  });

  describe('Analytics Configuration', () => {
    it('should enable analytics when VITE_ENABLE_ANALYTICS is true', async () => {
      stubViteEnv('VITE_ENABLE_ANALYTICS', 'true');
      const { ENV } = await loadEnvModule();

      expect(ENV.ENABLE_ANALYTICS).toBe(true);
    });

    it('should disable analytics by default', async () => {
      const { ENV } = await loadEnvModule();

      expect(ENV.ENABLE_ANALYTICS).toBe(false);
    });
  });

  describe('Third-party Keys', () => {
    it('should set Razorpay key ID', async () => {
      stubViteEnv('VITE_RAZORPAY_KEY_ID', 'rzp_test_key');
      const { ENV } = await loadEnvModule();

      expect(ENV.RAZORPAY_KEY_ID).toBe('rzp_test_key');
    });

    it('should set Google client ID', async () => {
      stubViteEnv('VITE_GOOGLE_CLIENT_ID', 'google_client_id');
      const { ENV } = await loadEnvModule();

      expect(ENV.GOOGLE_CLIENT_ID).toBe('google_client_id');
    });

  });

});

describe('getStartupDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubViteEnv('VITE_API_URL', 'https://api.example.com');
    stubViteEnv('VITE_APP_NAME', 'Test App');
    stubViteEnv('VITE_FRONTEND_ONLY', '');
    stubViteEnv('VITE_ENABLE_ANALYTICS', '');
    stubViteEnv('VITE_RAZORPAY_KEY_ID', 'test_key');
    stubViteEnv('VITE_GOOGLE_CLIENT_ID', 'test_client');
    stubViteEnv('DEV', 'false');
    stubViteEnv('PROD', 'false');
    window.location.protocol = 'https:';
  });

  it('should return ok status for valid configuration', async () => {
    const { getStartupDiagnostics } = await loadEnvModule();
    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.errors).toHaveLength(0);
    expect(diagnostics.warnings).toHaveLength(0);
  });

  it('should detect missing API URL when not in frontend-only mode', async () => {
    stubViteEnv('VITE_API_URL', '');
    const { getStartupDiagnostics } = await loadEnvModule();

    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.ok).toBe(false);
    expect(diagnostics.errors).toContain('Missing API base URL while frontend-only mode is disabled.');
  });

  it('should detect frontend-only mode in production', async () => {
    stubViteEnv('PROD', 'true');
    stubViteEnv('VITE_FRONTEND_ONLY', 'true');
    const { getStartupDiagnostics } = await loadEnvModule();

    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.ok).toBe(false);
    expect(diagnostics.errors).toContain('VITE_FRONTEND_ONLY=true is blocked in production.');
  });

  it('should warn about missing Razorpay key in production', async () => {
    stubViteEnv('PROD', 'true');
    stubViteEnv('VITE_RAZORPAY_KEY_ID', '');
    const { getStartupDiagnostics } = await loadEnvModule();

    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.warnings).toContain('Missing VITE_RAZORPAY_KEY_ID. Payment flow will not work.');
  });

  it('should warn about missing Google client ID in production', async () => {
    stubViteEnv('PROD', 'true');
    stubViteEnv('VITE_GOOGLE_CLIENT_ID', '');
    const { getStartupDiagnostics } = await loadEnvModule();

    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.warnings).toContain('Missing VITE_GOOGLE_CLIENT_ID. Google sign-in will not work.');
  });

  it('should warn about mixed content (HTTPS app with HTTP API)', async () => {
    stubViteEnv('VITE_API_URL', 'http://api.example.com');
    const { getStartupDiagnostics } = await loadEnvModule();

    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.warnings).toContain('Mixed-content risk: HTTPS app is configured with an HTTP API URL. Use HTTPS API URL to avoid blocked requests.');
  });

  it('should not warn about mixed content when API is HTTPS', async () => {
    stubViteEnv('VITE_API_URL', 'https://api.example.com');
    const { getStartupDiagnostics } = await loadEnvModule();

    const diagnostics = getStartupDiagnostics();

    expect(diagnostics.warnings).not.toContain('Mixed-content risk');
  });
});

describe('assertStartupReadiness', () => {
  it('should return diagnostics when configuration is valid', async () => {
    stubViteEnv('VITE_API_URL', 'https://api.example.com');
    const { assertStartupReadiness } = await loadEnvModule();

    const diagnostics = assertStartupReadiness();

    expect(diagnostics.ok).toBe(true);
  });

  it('should throw error when configuration is invalid', async () => {
    stubViteEnv('PROD', 'true');
    stubViteEnv('VITE_API_URL', '');
    const { assertStartupReadiness } = await loadEnvModule();

    expect(() => assertStartupReadiness()).toThrow('Startup readiness check failed');
  });
});