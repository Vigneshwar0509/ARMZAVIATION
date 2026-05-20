type LogMeta = Record<string, unknown>;

const format = (level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...(meta ? { meta } : {}),
  };
};

const runtimeEnv = (globalThis as any).__VITE_ENV__ as Record<string, unknown> | undefined;
const getEnvValue = (key: string): unknown => {
  if (runtimeEnv && key in runtimeEnv) {
    return runtimeEnv[key];
  }
  return (import.meta.env as any)[key];
};

const parseBoolean = (value: unknown): boolean => {
  if (value === true) {
    return true;
  }

  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const envMode = getEnvValue('NODE_ENV') as string | undefined;
const devFlag = getEnvValue('DEV');
const isDev = devFlag !== undefined ? parseBoolean(devFlag) : envMode === 'development';

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    if (isDev) {
      console.info(format('info', message, meta));
    }
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(format('warn', message, meta));
  },
  error: (message: string, meta?: LogMeta) => {
    console.error(format('error', message, meta));
  },
};
