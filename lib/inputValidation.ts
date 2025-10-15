/**
 * Input Validation Library
 *
 * Provides comprehensive input validation for API routes to prevent:
 * - Type confusion attacks
 * - Invalid data causing database errors
 * - SQL injection (defense-in-depth)
 * - Out-of-bounds values
 * - Format violations
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

/**
 * Validates a UUID string
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 */
export function validateUUID(value: any, fieldName: string = 'UUID'): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return { valid: false, error: `${fieldName} must be a valid UUID` };
  }

  return { valid: true, sanitized: value.toLowerCase() };
}

/**
 * Validates an email address
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 */
export function validateEmail(value: any, fieldName: string = 'Email'): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: `${fieldName} must be 255 characters or less` };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} must be a valid email address` };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates an integer with optional min/max bounds
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 */
export function validateInteger(
  value: any,
  fieldName: string = 'Number',
  min?: number,
  max?: number
): ValidationResult {
  if (typeof value !== 'number') {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  if (min !== undefined && value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validates a string with optional length constraints
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @param minLength - Minimum allowed length
 * @param maxLength - Maximum allowed length
 * @param allowEmpty - Whether empty strings are allowed
 */
export function validateString(
  value: any,
  fieldName: string = 'String',
  minLength?: number,
  maxLength?: number,
  allowEmpty: boolean = false
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (!allowEmpty && value.trim().length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (minLength !== undefined && value.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validates that a value is one of the allowed enum values
 * @param value - The value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Name of the field for error messages
 */
export function validateEnum(
  value: any,
  allowedValues: any[],
  fieldName: string = 'Value'
): ValidationResult {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validates a boolean value
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 */
export function validateBoolean(value: any, fieldName: string = 'Boolean'): ValidationResult {
  if (typeof value !== 'boolean') {
    return { valid: false, error: `${fieldName} must be a boolean` };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validates an optional field (allows null/undefined)
 * @param value - The value to validate
 * @param validator - Validation function to use if value is present
 */
export function validateOptional(
  value: any,
  validator: (value: any) => ValidationResult
): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true, sanitized: null };
  }

  return validator(value);
}

/**
 * Helper function to throw a 400 error if validation fails
 * @param result - Validation result
 */
export function throwIfInvalid(result: ValidationResult): void {
  if (!result.valid) {
    throw new Error(result.error);
  }
}

/**
 * Validates request body against a schema
 * @param body - Request body to validate
 * @param schema - Validation schema
 * @returns Sanitized body or throws error
 */
export function validateRequestBody<T>(
  body: any,
  schema: Record<string, (value: any) => ValidationResult>
): T {
  const sanitized: any = {};
  const errors: string[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    const result = validator(body[field]);

    if (!result.valid) {
      errors.push(result.error!);
    } else {
      sanitized[field] = result.sanitized;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }

  return sanitized as T;
}
