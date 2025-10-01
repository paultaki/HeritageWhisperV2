// Logger utility for development and production
// Only logs in development mode unless explicitly set

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG === 'true';

export const logger = {
  info: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log('[INFO]', ...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors
    console.error('[ERROR]', ...args);
  },

  warn: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.warn('[WARN]', ...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  api: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log('[API]', ...args);
    }
  }
};

export default logger;