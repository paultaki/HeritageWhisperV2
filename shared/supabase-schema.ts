// Supabase schema - matches the actual database structure
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, uuid, jsonb, inet } from "drizzle-orm/pg-core";

// This matches the actual Supabase database schema
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`NOW()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  transcript: text("transcript"), // Note: 'transcript' not 'transcription'
  durationSeconds: integer("duration_seconds"),
  isSaved: boolean("is_saved").default(false),
  isEnhanced: boolean("is_enhanced").default(false),
  wordCount: integer("word_count"),
  playCount: integer("play_count").default(0),
  shareCount: integer("share_count").default(0),
  voiceNotes: text("voice_notes"),
  metadata: jsonb("metadata").default({}),
  title: text("title"),
  year: integer("year"), // Note: 'year' not 'story_year'
  audioUrl: text("audio_url"),
  wisdomClipUrl: text("wisdom_clip_url"),
  wisdomText: text("wisdom_text"),
  photoUrl: text("photo_url"),
  emotions: text("emotions").array(),
  sessionId: uuid("session_id"),
});

// No users table in public schema - uses auth.users from Supabase Auth