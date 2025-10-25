import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  bigint,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"), // Made optional for OAuth users
  name: text("name").notNull().default("User"),
  birthYear: integer("birth_year").notNull(),
  bio: text("bio"), // User bio/about section
  profilePhotoUrl: text("profile_photo_url"), // Profile photo
  storyCount: integer("story_count").default(0),
  isPaid: boolean("is_paid").default(false),
  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  familyComments: boolean("family_comments").default(true),
  printedBooksNotify: boolean("printed_books_notify").default(false),
  // Privacy settings
  defaultStoryVisibility: boolean("default_story_visibility").default(true),
  // Export tracking
  pdfExportsCount: integer("pdf_exports_count").default(0),
  lastPdfExportAt: timestamp("last_pdf_export_at"),
  dataExportsCount: integer("data_exports_count").default(0),
  lastDataExportAt: timestamp("last_data_export_at"),
  // Legal agreement tracking (for quick lookups)
  latestTermsVersion: text("latest_terms_version"), // e.g., "1.0"
  latestPrivacyVersion: text("latest_privacy_version"), // e.g., "1.0"
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
  // AI Prompt System additions
  freeStoriesUsed: integer("free_stories_used").default(0),
  subscriptionStatus: text("subscription_status").default("none"), // 'none', 'active', 'cancelled', 'expired'
  lastTier2Attempt: timestamp("last_tier2_attempt"),
  doNotAsk: jsonb("do_not_ask")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`),
  onboardingT3RanAt: timestamp("onboarding_t3_ran_at"),
  // Profile interests for personalized prompts
  profileInterests: jsonb("profile_interests").$type<{
    general: string | null;
    people: string | null;
    places: string | null;
  }>(),
  // RBAC
  role: text("role").notNull().default("user"), // 'user', 'admin', 'moderator'
  // AI Budget Control
  aiDailyBudgetUsd: integer("ai_daily_budget_usd").default(1),
  aiMonthlyBudgetUsd: integer("ai_monthly_budget_usd").default(10),
  aiProcessingEnabled: boolean("ai_processing_enabled").notNull().default(true),
  // subscriptionExpires: timestamp("subscription_expires"),
  // stripeCustomerId: text("stripe_customer_id"),
  // stripeSubscriptionId: text("stripe_subscription_id"),
  // oauthProvider: text("oauth_provider"), // 'google', 'facebook', etc.
  // oauthId: text("oauth_id"), // Provider's user ID
  // lifeGraph: jsonb("life_graph").$type<{
  //   facts: {
  //     people: any[];
  //     places: any[];
  //     events: any[];
  //     patterns: any[];
  //   };
  //   patterns: any;
  //   gaps: any;
  //   lastUpdated: string;
  // }>(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

// Passkeys table for WebAuthn authentication
export const passkeys = pgTable(
  "passkeys",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    credentialId: text("credential_id").notNull(), // Base64url encoded
    publicKey: text("public_key").notNull(), // Base64url encoded
    signCount: bigint("sign_count", { mode: "number" }).notNull().default(0),
    credentialBackedUp: boolean("credential_backed_up"),
    credentialDeviceType: text("credential_device_type"), // "singleDevice" | "multiDevice"
    transports: jsonb("transports").$type<
      ("ble" | "internal" | "nfc" | "usb" | "cable" | "hybrid")[]
    >(),
    friendlyName: text("friendly_name"), // e.g., "iPhone 14", "MacBook Touch ID"
    createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (table) => ({
    // Unique constraint on user_id + credential_id to prevent cross-tenant clashes
    uniqueUserCredential: unique("unique_user_credential").on(
      table.userId,
      table.credentialId,
    ),
  }),
);

export const stories = pgTable("stories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  audioUrl: text("audio_url"),
  transcription: text("transcription"),
  durationSeconds: integer("duration_seconds"),
  wisdomClipUrl: text("wisdom_clip_url"),
  wisdomClipText: text("wisdom_clip_text"),
  wisdomClipDuration: integer("wisdom_clip_duration"),
  storyYear: integer("story_year"), // Nullable to support undated memories
  storyDate: timestamp("story_date"),
  lifeAge: integer("life_age"),
  // AI Prompt System additions
  lessonLearned: text("lesson_learned"),
  lessonAlternatives: jsonb("lesson_alternatives")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`),
  entitiesExtracted: jsonb("entities_extracted").$type<{
    people: string[];
    places: string[];
    objects: string[];
    emotions: string[];
    temporalBoundaries: string[];
  }>(),
  sourcePromptId: uuid("source_prompt_id"),
  lifePhase: text("life_phase"), // 'childhood', 'teen', 'early_adult', 'mid_adult', 'late_adult', 'senior'
  photoUrl: text("photo_url"),
  photoTransform: jsonb("photo_transform").$type<{
    zoom: number;
    position: { x: number; y: number };
  }>(),
  photos: jsonb("photos").$type<
    Array<{
      id: string;
      url: string;
      transform?: { zoom: number; position: { x: number; y: number } };
      caption?: string;
      isHero?: boolean;
    }>
  >(),
  emotions: jsonb("emotions").$type<string[]>(),
  pivotalCategory: text("pivotal_category"),
  includeInBook: boolean("include_in_book").default(true).notNull(),
  includeInTimeline: boolean("include_in_timeline").default(true).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  formattedContent: jsonb("formatted_content").$type<{
    fullText: string;
    paragraphs: string[];
    pages: {
      left: string;
      right: string;
      splitIndex: number;
    };
    questions: Array<{
      type: "emotional" | "wisdom" | "sensory";
      text: string;
    }>;
    themes?: string[];
    processedAt: string;
    version: string;
  }>(),
  extractedFacts: jsonb("extracted_facts").$type<{
    people: Array<{
      name: string;
      relationship?: string;
      alternateNames?: string[];
      confidence: number;
    }>;
    places: Array<{
      location: string;
      year?: string;
      type: "lived" | "visited" | "worked" | "born";
      confidence: number;
    }>;
    events: Array<{
      type: string;
      year?: string;
      description: string;
      confidence: number;
    }>;
    possessions: Array<{
      item: string;
      year?: string;
      action: "bought" | "sold" | "received" | "lost";
      confidence: number;
    }>;
    extractedAt: string;
    version: string;
  }>(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const followUps = pgTable("follow_ups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: uuid("story_id")
    .references(() => stories.id)
    .notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  wasAnswered: boolean("was_answered").default(false),
});

export const ghostPrompts = pgTable("ghost_prompts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  promptText: text("prompt_text").notNull(),
  promptTitle: text("prompt_title").notNull(),
  category: text("category").notNull(),
  decade: text("decade").notNull(),
  ageRange: text("age_range").notNull(),
  isGenerated: boolean("is_generated").default(false),
  basedOnStoryId: uuid("based_on_story_id").references(() => stories.id),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

// Historical context for decades - cached per user
export const historicalContext = pgTable("historical_context", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  decade: text("decade").notNull(), // e.g., "1950s", "1960s"
  ageRange: text("age_range").notNull(), // e.g., "Age 5-15"
  facts: jsonb("facts").$type<string[]>().notNull(),
  generatedAt: timestamp("generated_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// User profile personalization settings
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),

  // Personal Timeline
  birthYear: integer("birth_year").notNull(),
  majorLifePhases: jsonb("major_life_phases").$type<{
    childhood: { start: number; end: number };
    youngAdult: { start: number; end: number };
    midLife: { start: number; end: number };
    senior: { start: number; end: number };
  }>(),

  // Character Context
  workEthic: integer("work_ethic"), // 1-10 scale
  riskTolerance: integer("risk_tolerance"), // 1-10 scale
  familyOrientation: integer("family_orientation"), // 1-10 scale
  spirituality: integer("spirituality"), // 1-10 scale

  // Communication Preferences
  preferredStyle: text("preferred_style").$type<
    "direct" | "gentle" | "curious" | "reflective"
  >(),
  emotionalComfort: integer("emotional_comfort"), // 1-10 scale
  detailLevel: text("detail_level").$type<"brief" | "moderate" | "detailed">(),
  followUpFrequency: text("follow_up_frequency").$type<
    "minimal" | "occasional" | "frequent"
  >(),

  // Metadata
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Demo stories table - mirrors the stories table structure
export const demoStories = pgTable("demo_stories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(), // Will use a fixed demo user ID
  title: text("title").notNull(),
  audioUrl: text("audio_url"),
  transcription: text("transcription"),
  durationSeconds: integer("duration_seconds"),
  wisdomClipUrl: text("wisdom_clip_url"),
  wisdomClipText: text("wisdom_clip_text"),
  wisdomClipDuration: integer("wisdom_clip_duration"),
  storyYear: integer("story_year"), // Nullable for undated memories
  storyDate: timestamp("story_date"),
  lifeAge: integer("life_age"),
  photoUrl: text("photo_url"),
  photoTransform: jsonb("photo_transform").$type<{
    zoom: number;
    position: { x: number; y: number };
  }>(),
  photos: jsonb("photos").$type<
    Array<{
      id: string;
      url: string;
      transform?: { zoom: number; position: { x: number; y: number } };
      caption?: string;
      isHero?: boolean;
    }>
  >(),
  emotions: jsonb("emotions").$type<string[]>(),
  pivotalCategory: text("pivotal_category"),
  includeInBook: boolean("include_in_book").default(true).notNull(),
  includeInTimeline: boolean("include_in_timeline").default(true).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  formattedContent: jsonb("formatted_content").$type<{
    fullText: string;
    paragraphs: string[];
    pages: {
      left: string;
      right: string;
      splitIndex: number;
    };
    questions: Array<{
      type: "emotional" | "wisdom" | "sensory";
      text: string;
    }>;
    themes?: string[];
    processedAt: string;
    version: string;
  }>(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  isOriginal: boolean("is_original").default(true), // Flag to track original vs session stories
  publicAudioUrl: text("public_audio_url"), // Public URL for demo audio files
  publicPhotoUrl: text("public_photo_url"), // Public URL for demo photo files
});

// ============================================================================
// AI PROMPT SYSTEM TABLES
// ============================================================================

// Active prompts table - stores currently active prompts (1-5 per user at any time)
export const activePrompts = pgTable("active_prompts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Prompt content
  promptText: text("prompt_text").notNull(),
  contextNote: text("context_note"), // e.g., "Based on your 1955 story"

  // Deduplication & anchoring
  anchorEntity: text("anchor_entity"), // e.g., "father's workshop", "Mrs. Henderson"
  anchorYear: integer("anchor_year"), // e.g., 1955 (NULL if not year-specific)
  anchorHash: text("anchor_hash").notNull(), // sha1(`${type}|${entity}|${year||'NA'}`)

  // Tier & quality
  tier: integer("tier").notNull(), // 0=fallback, 1=template, 2=on-demand, 3=milestone
  memoryType: text("memory_type"), // person_expansion, object_origin, decade_gap, etc.
  promptScore: integer("prompt_score"), // 0-100 (recording likelihood from GPT-4o)
  scoreReason: text("score_reason"), // 1-sentence explanation for audit
  modelVersion: text("model_version").default("gpt-4o"), // Track which model generated it

  // Lifecycle
  createdAt: timestamp("created_at").default(sql`NOW()`),
  expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup after expiry
  isLocked: boolean("is_locked").default(false), // true = hidden until payment

  // Engagement tracking
  shownCount: integer("shown_count").default(0),
  lastShownAt: timestamp("last_shown_at"),
});

// Prompt history table - archives used/skipped/expired prompts
export const promptHistory = pgTable("prompt_history", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Original prompt data
  promptText: text("prompt_text").notNull(),
  anchorHash: text("anchor_hash"),
  anchorEntity: text("anchor_entity"),
  anchorYear: integer("anchor_year"),
  tier: integer("tier"),
  memoryType: text("memory_type"),
  promptScore: integer("prompt_score"),

  // Outcome tracking
  shownCount: integer("shown_count"),
  outcome: text("outcome").notNull(), // 'used' | 'skipped' | 'expired'
  storyId: uuid("story_id").references(() => stories.id), // NULL if skipped/expired

  // Timestamps
  createdAt: timestamp("created_at"),
  resolvedAt: timestamp("resolved_at").default(sql`NOW()`),
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  storyCount: true,
  isPaid: true,
  subscriptionExpires: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export const insertFollowUpSchema = createInsertSchema(followUps).omit({
  id: true,
});

export const insertGhostPromptSchema = createInsertSchema(ghostPrompts).omit({
  id: true,
  createdAt: true,
});

export const insertDemoStorySchema = createInsertSchema(demoStories).omit({
  id: true,
  createdAt: true,
});

// Family members table
export const familyMembers = pgTable("family_members", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(), // The storyteller
  email: text("email").notNull(),
  name: text("name"),
  relationship: text("relationship").notNull(), // Son, Daughter, Grandchild, etc.
  status: text("status").notNull().default("pending"), // pending, active, declined
  invitedAt: timestamp("invited_at").default(sql`NOW()`),
  acceptedAt: timestamp("accepted_at"),
  lastViewedAt: timestamp("last_viewed_at"),
  customMessage: text("custom_message"),
  permissions: jsonb("permissions")
    .$type<{
      canView: boolean;
      canComment: boolean;
      canDownload: boolean;
    }>()
    .default({ canView: true, canComment: true, canDownload: false }),
});

// Family activity/feed
export const familyActivity = pgTable("family_activity", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(), // The storyteller
  familyMemberId: uuid("family_member_id")
    .references(() => familyMembers.id)
    .notNull(),
  storyId: uuid("story_id").references(() => stories.id),
  activityType: text("activity_type").notNull(), // viewed, commented, favorited, shared
  details: text("details"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  invitedAt: true,
  acceptedAt: true,
  lastViewedAt: true,
});

export const insertFamilyActivitySchema = createInsertSchema(
  familyActivity,
).omit({
  id: true,
  createdAt: true,
});

// Shared access table for timeline/book sharing with permissions
export const sharedAccess = pgTable("shared_access", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ownerUserId: uuid("owner_user_id")
    .references(() => users.id)
    .notNull(), // The person sharing their timeline
  sharedWithEmail: text("shared_with_email").notNull(), // Email of person being granted access
  sharedWithUserId: uuid("shared_with_user_id").references(() => users.id), // Populated when they sign up/sign in
  permissionLevel: text("permission_level").notNull().default("view"), // 'view' or 'edit'
  shareToken: text("share_token").notNull().unique(), // Unique token for the share link
  createdAt: timestamp("created_at").default(sql`NOW()`),
  expiresAt: timestamp("expires_at"), // Optional expiration
  isActive: boolean("is_active").default(true).notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const insertSharedAccessSchema = createInsertSchema(sharedAccess).omit({
  id: true,
  createdAt: true,
  lastAccessedAt: true,
});

// User agreements table for tracking Terms of Service and Privacy Policy acceptance
export const userAgreements = pgTable("user_agreements", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  agreementType: text("agreement_type").notNull(), // 'terms' or 'privacy'
  version: text("version").notNull(), // e.g., "1.0", "1.1", "2.0"
  acceptedAt: timestamp("accepted_at")
    .default(sql`NOW()`)
    .notNull(),
  ipAddress: text("ip_address"), // Optional: IP address at time of acceptance
  userAgent: text("user_agent"), // Optional: User agent at time of acceptance
  method: text("method").notNull().default("signup"), // 'signup', 'reacceptance', 'oauth'
});

export const insertUserAgreementSchema = createInsertSchema(
  userAgreements,
).omit({
  id: true,
  acceptedAt: true,
});

export const insertActivePromptSchema = createInsertSchema(activePrompts).omit({
  id: true,
  createdAt: true,
  shownCount: true,
  lastShownAt: true,
});

export const insertPromptHistorySchema = createInsertSchema(promptHistory).omit(
  {
    id: true,
    resolvedAt: true,
  },
);

export const insertPasskeySchema = createInsertSchema(passkeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type FollowUp = typeof followUps.$inferSelect;
export type InsertGhostPrompt = z.infer<typeof insertGhostPromptSchema>;
export type GhostPrompt = typeof ghostPrompts.$inferSelect;
export type HistoricalContext = typeof historicalContext.$inferSelect;
export type InsertHistoricalContext = {
  userId: string;
  decade: string;
  ageRange: string;
  facts: string[];
};
export type InsertDemoStory = z.infer<typeof insertDemoStorySchema>;
export type DemoStory = typeof demoStories.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyActivity = z.infer<typeof insertFamilyActivitySchema>;
export type FamilyActivity = typeof familyActivity.$inferSelect;
export type InsertSharedAccess = z.infer<typeof insertSharedAccessSchema>;
export type SharedAccess = typeof sharedAccess.$inferSelect;
export type InsertUserAgreement = z.infer<typeof insertUserAgreementSchema>;
export type UserAgreement = typeof userAgreements.$inferSelect;
export type InsertActivePrompt = z.infer<typeof insertActivePromptSchema>;
export type ActivePrompt = typeof activePrompts.$inferSelect;
export type InsertPromptHistory = z.infer<typeof insertPromptHistorySchema>;
export type PromptHistory = typeof promptHistory.$inferSelect;
export type InsertPasskey = z.infer<typeof insertPasskeySchema>;
export type Passkey = typeof passkeys.$inferSelect;
