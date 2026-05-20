import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const testEnv: Record<string, unknown> = {};
const stubViteEnv = (key: string, value: string) => {
  testEnv[key] = value;
  return vi.stubEnv(key, value);
};

const loadLogger = async () => {
  vi.resetModules();
  const envVars = {
    ...Object.fromEntries(Object.entries(import.meta.env as Record<string, unknown>)),
    ...testEnv,
  };

  (globalThis as any).__VITE_ENV__ = Object.fromEntries(
    Object.entries(envVars).filter(([key]) => key === 'DEV' || key === 'NODE_ENV' || key === 'PROD')
  );
  return (await import('@/src/utils/logger')).logger;
};

describe('logger', () => {
  let consoleInfoMock: ReturnType<typeof vi.spyOn>;
  let consoleWarnMock: ReturnType<typeof vi.spyOn>;
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(testEnv).forEach((key) => {
      delete testEnv[key];
    });
    Object.assign(testEnv, {
      NODE_ENV: 'development',
      DEV: 'true',
    });
    stubViteEnv('NODE_ENV', 'development');
    stubViteEnv('DEV', 'true');
    consoleInfoMock = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoMock.mockRestore();
    consoleWarnMock.mockRestore();
    consoleErrorMock.mockRestore();
    delete (globalThis as any).__VITE_ENV__;
  });

  describe('info', () => {
    it('should log info messages in development environment', async () => {
      stubViteEnv('DEV', 'true');
      const logger = await loadLogger();

      const message = 'Test info message';
      const meta = { userId: '123', action: 'login' };

      logger.info(message, meta);

      expect(consoleInfoMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'info',
        message,
        meta,
      });
    });

    it('should not log info messages in production environment', async () => {
      stubViteEnv('NODE_ENV', 'production');
      stubViteEnv('DEV', 'false');
      const logger = await loadLogger();

      const message = 'Test info message';
      const meta = { userId: '123' };

      logger.info(message, meta);

      expect(consoleInfoMock).not.toHaveBeenCalled();
    });

    it('should log info messages without meta', async () => {
      stubViteEnv('DEV', 'true');
      const logger = await loadLogger();

      const message = 'Test info message';

      logger.info(message);

      expect(consoleInfoMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'info',
        message,
      });
    });
  });

  describe('warn', () => {
    it('should log warning messages in all environments', async () => {
      const logger = await loadLogger();

      const message = 'Test warning message';
      const meta = { error: 'Validation failed', field: 'email' };

      logger.warn(message, meta);

      expect(consoleWarnMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'warn',
        message,
        meta,
      });
    });

    it('should log warning messages in production environment', async () => {
      stubViteEnv('NODE_ENV', 'production');
      stubViteEnv('DEV', 'false');
      const logger = await loadLogger();

      const message = 'Test warning message';
      const meta = { error: 'Network timeout' };

      logger.warn(message, meta);

      expect(consoleWarnMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'warn',
        message,
        meta,
      });
    });

    it('should log warning messages without meta', async () => {
      const logger = await loadLogger();

      const message = 'Test warning message';

      logger.warn(message);

      expect(consoleWarnMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'warn',
        message,
      });
    });
  });

  describe('error', () => {
    it('should log error messages in all environments', async () => {
      stubViteEnv('DEV', 'true');
      const logger = await loadLogger();

      const message = 'Test error message';
      const meta = { error: new Error('Something went wrong'), userId: '456' };

      logger.error(message, meta);

      expect(consoleErrorMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'error',
        message,
        meta,
      });
    });

    it('should log error messages in production environment', async () => {
      stubViteEnv('NODE_ENV', 'production');
      stubViteEnv('DEV', 'false');
      const logger = await loadLogger();

      const message = 'Test error message';
      const meta = { stack: 'Error stack trace' };

      logger.error(message, meta);

      expect(consoleErrorMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'error',
        message,
        meta,
      });
    });

    it('should log error messages without meta', async () => {
      const logger = await loadLogger();

      const message = 'Test error message';

      logger.error(message);

      expect(consoleErrorMock).toHaveBeenCalledWith({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        level: 'error',
        message,
      });
    });
  });

  describe('format function', () => {
    it('should format log entries correctly with meta', async () => {
      const logger = await loadLogger();
      const message = 'Test message';
      const meta = { key: 'value', number: 42 };

      logger.info(message, meta);

      const loggedData = consoleInfoMock.mock.calls[0][0];
      expect(loggedData).toHaveProperty('timestamp');
      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe(message);
      expect(loggedData.meta).toEqual(meta);
    });

    it('should format log entries correctly without meta', async () => {
      const logger = await loadLogger();
      const message = 'Test message';

      logger.warn(message);

      const loggedData = consoleWarnMock.mock.calls[0][0];
      expect(loggedData).toHaveProperty('timestamp');
      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe(message);
      expect(loggedData).not.toHaveProperty('meta');
    });

    it('should generate valid ISO timestamps', async () => {
      const logger = await loadLogger();
      const message = 'Timestamp test';

      logger.error(message);

      const loggedData = consoleErrorMock.mock.calls[0][0];
      const timestamp = loggedData.timestamp;

      expect(new Date(timestamp).toISOString()).toBe(timestamp);
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Environment-specific behavior', () => {
    it('should only log info in development', async () => {
      stubViteEnv('NODE_ENV', 'development');
      stubViteEnv('DEV', 'true');
      const logger = await loadLogger();
      logger.info('Dev message');
      expect(consoleInfoMock).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      stubViteEnv('DEV', 'false');
      const loggerProd = await loadLogger();
      loggerProd.info('Prod message');
      expect(consoleInfoMock).not.toHaveBeenCalled();
    });

    it('should always log warn and error regardless of environment', async () => {
      stubViteEnv('DEV', 'true');
      const loggerDev = await loadLogger();
      loggerDev.warn('Dev warn');
      loggerDev.error('Dev error');
      expect(consoleWarnMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorMock).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      stubViteEnv('DEV', 'false');
      const loggerProd = await loadLogger();
      loggerProd.warn('Prod warn');
      loggerProd.error('Prod error');
      expect(consoleWarnMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorMock).toHaveBeenCalledTimes(1);
    });
  });
});