/**
 * API Input Validation Schemas
 *
 * Comprehensive Zod schemas for validating user input to prevent:
 * - Invalid data entering the database
 * - SQL injection attempts
 * - Data type mismatches
 * - Out-of-range values
 *
 * SECURITY: Always validate untrusted input at API boundaries
 */

import { z } from 'zod';

/**
 * Photo validation schema
 * Validates individual photo objects in stories
 */
const PhotoSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  filePath: z.string().optional(),
  isHero: z.boolean().optional(),
  caption: z.string().optional(),
  transform: z.union([
    // New structure: { zoom, position: { x, y } }
    z.object({
      zoom: z.number().min(0.1).max(5),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
    // Legacy structure: { x, y, scale, rotation? }
    z.object({
      x: z.number(),
      y: z.number(),
      scale: z.number().min(0.1).max(5),
      rotation: z.number().optional(),
    }),
  ]).optional(),
}).refine(
  (data) => data.url || data.filePath,
  { message: 'Photo must have either url or filePath' }
);

/**
 * Story Creation Schema (POST /api/stories)
 * Validates all inputs for creating a new story
 */
export const CreateStorySchema = z.object({
  // Required fields
  transcription: z.string()
    .min(1, 'Transcription is required')
    .max(50000, 'Transcription too long (max 50,000 characters)'),

  // Optional but validated fields
  title: z.string()
    .max(200, 'Title too long (max 200 characters)')
    .optional()
    .default('Untitled Story'),

  year: z.number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 10, 'Year cannot be more than 10 years in the future')
    .nullable()
    .optional(),

  storyYear: z.number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .nullable()
    .optional(),

  lifeAge: z.number()
    .int('Age must be an integer')
    .min(-100, 'Age cannot be less than 100 years before birth')
    .max(120, 'Age cannot exceed 120 years')
    .nullable()
    .optional(),

  age: z.number()
    .int()
    .min(-100)
    .max(120)
    .nullable()
    .optional(),

  durationSeconds: z.preprocess(
    (val) => {
      // Handle null, undefined, 0, empty string, or any falsy value
      if (!val || val === 0) return 30;
      return val;
    },
    z.number().int('Duration must be an integer').min(1, 'Duration must be at least 1 second').max(600, 'Duration cannot exceed 10 minutes (600 seconds)')
  ).optional().default(30),

  // Media fields
  audioUrl: z.union([
    z.string().url('Invalid audio URL').refine(url => !url.startsWith('blob:'), 'Blob URLs not allowed'),
    z.null(),
    z.undefined(),
  ]).optional(),

  photoUrl: z.union([
    z.string().url('Invalid photo URL').refine(url => !url.startsWith('blob:'), 'Blob URLs not allowed'),
    z.null(),
    z.undefined(),
  ]).optional(),

  photos: z.array(PhotoSchema)
    .max(20, 'Maximum 20 photos allowed per story')
    .optional()
    .default([]),

  // Wisdom/lesson fields
  wisdomClipText: z.string()
    .max(500, 'Wisdom text too long (max 500 characters)')
    .optional(),

  wisdomTranscription: z.string()
    .max(500)
    .optional(),

  wisdomClipUrl: z.string()
    .url()
    .optional(),

  // Metadata fields
  emotions: z.array(z.string()).optional(),

  pivotalCategory: z.string()
    .max(100)
    .optional(),

  storyDate: z.string()
    .datetime()
    .optional(),

  photoTransform: z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number().min(0.1).max(5),
    rotation: z.number().optional(),
  }).optional(),

  // Boolean flags
  includeInTimeline: z.boolean().optional().default(true),
  includeInBook: z.boolean().optional().default(true),
  isFavorite: z.boolean().optional().default(false),

  // Prompt tracking
  sourcePromptId: z.union([
    z.string().uuid(),
    z.null(),
    z.undefined(),
  ]).optional(),

  // Legacy field compatibility
  content: z.string().optional(),
});

/**
 * Story Update Schema (PUT /api/stories/[id])
 * Similar to create but all fields optional
 */
export const UpdateStorySchema = CreateStorySchema.partial().extend({
  id: z.string().uuid('Invalid story ID'),
});

/**
 * Auth Registration Schema (POST /api/auth/register)
 * Validates user registration inputs
 */
export const RegisterUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long (max 128 characters)'),

  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long (max 100 characters)')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  birthYear: z.number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
});

/**
 * Auth Login Schema (POST /api/auth/login)
 */
export const LoginUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255),

  password: z.string()
    .min(1, 'Password is required')
    .max(128),

  rememberMe: z.boolean().optional(),
});

/**
 * File Upload Schema
 * Validates file upload metadata
 */
export const FileUploadSchema = z.object({
  filename: z.string()
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),

  mimeType: z.string()
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/, 'Invalid MIME type'),

  size: z.number()
    .int()
    .min(1, 'File size must be positive')
    .max(25 * 1024 * 1024, 'File too large (max 25MB)'),
});

/**
 * Query Parameter Schemas
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

/**
 * Helper function to validate and parse request body
 * Returns parsed data or throws ZodError with detailed messages
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  return schema.parse(body);
}

/**
 * Helper function for safe validation (returns result object)
 * Useful when you want to handle errors yourself
 */
export function safeValidateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
