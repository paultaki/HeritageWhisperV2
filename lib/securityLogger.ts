/**
 * Security-specific logging utilities
 * Structured logging for security events, audit trails, and threat detection
 */

import { logger } from './logger';

/**
 * Hash function for anonymizing sensitive data in logs
 * Uses a simple hash to create consistent identifiers without exposing PII
 */
function hashSensitiveData(data: string): string {
  // Simple hash for logging - NOT cryptographic, just for anonymization
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hashed_${Math.abs(hash).toString(36)}`;
}

export const securityLogger = {
  /**
   * Log authentication failures
   * @param userId - User ID (if known) or null
   * @param reason - Reason for failure (e.g., 'invalid_credentials', 'email_not_confirmed')
   * @param ip - IP address of the request
   * @param metadata - Additional context (e.g., user agent, attempt count)
   */
  authFailure: (
    userId: string | null,
    reason: string,
    ip: string,
    metadata?: Record<string, any>
  ) => {
    logger.error('[SECURITY] Authentication failure', {
      userId: userId ? hashSensitiveData(userId) : 'unknown',
      reason,
      ip: hashSensitiveData(ip), // Hash IP for privacy
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  },

  /**
   * Log suspicious activity that may indicate an attack
   * @param userId - User ID performing the activity
   * @param activity - Type of suspicious activity
   * @param details - Detailed information about the activity
   */
  suspiciousActivity: (
    userId: string,
    activity: string,
    details: Record<string, any>
  ) => {
    logger.error('[SECURITY] Suspicious activity detected', {
      userId: hashSensitiveData(userId),
      activity,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log rate limit exceeded events
   * @param identifier - Rate limit identifier (user ID, IP, etc.)
   * @param endpoint - API endpoint that was rate limited
   * @param limit - Rate limit configuration
   */
  rateLimitExceeded: (
    identifier: string,
    endpoint: string,
    limit?: { max: number; window: string }
  ) => {
    logger.warn('[SECURITY] Rate limit exceeded', {
      identifier: hashSensitiveData(identifier),
      endpoint,
      limit,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log successful authentication for audit trail
   * @param userId - User ID that authenticated
   * @param method - Authentication method (e.g., 'password', 'oauth')
   * @param ip - IP address of the request
   */
  authSuccess: (userId: string, method: string, ip: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.SECURITY_AUDIT_LOG === 'true') {
      logger.info('[SECURITY] Authentication success', {
        userId: hashSensitiveData(userId),
        method,
        ip: hashSensitiveData(ip),
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Log data access for sensitive resources
   * @param userId - User accessing the data
   * @param resource - Resource being accessed
   * @param action - Action performed (read, write, delete)
   */
  dataAccess: (userId: string, resource: string, action: 'read' | 'write' | 'delete') => {
    if (process.env.SECURITY_AUDIT_LOG === 'true') {
      logger.info('[SECURITY] Data access', {
        userId: hashSensitiveData(userId),
        resource,
        action,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Log permission denied events
   * @param userId - User that was denied access
   * @param resource - Resource access was denied to
   * @param reason - Reason for denial
   */
  permissionDenied: (userId: string, resource: string, reason: string) => {
    logger.warn('[SECURITY] Permission denied', {
      userId: hashSensitiveData(userId),
      resource,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log input validation failures (potential injection attempts)
   * @param endpoint - API endpoint where validation failed
   * @param validationType - Type of validation that failed
   * @param ip - IP address of the request
   */
  validationFailure: (endpoint: string, validationType: string, ip: string) => {
    logger.warn('[SECURITY] Input validation failure', {
      endpoint,
      validationType,
      ip: hashSensitiveData(ip),
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log account security events (password changes, email changes, etc.)
   * @param userId - User whose account was modified
   * @param event - Type of security event
   * @param ip - IP address of the request
   */
  accountSecurityEvent: (userId: string, event: string, ip: string) => {
    logger.info('[SECURITY] Account security event', {
      userId: hashSensitiveData(userId),
      event,
      ip: hashSensitiveData(ip),
      timestamp: new Date().toISOString(),
    });
  },
};

export default securityLogger;

