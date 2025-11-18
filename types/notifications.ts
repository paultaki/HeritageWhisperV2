/**
 * Type definitions for the notification system
 * Used by daily story digest cron job and email templates
 */

/**
 * Result of the daily notification cron job
 */
export interface DailyNotificationResult {
  success: boolean;
  duration: number; // Execution time in milliseconds
  totalFamilyMembers: number; // Total family members checked
  emailsSent: number; // Number of emails successfully sent
  skipped: number; // Number of family members skipped (no new stories, preferences, etc.)
  errorCount: number; // Number of errors encountered
  errors?: string[]; // Array of error messages (if any)
}

/**
 * Family member with their new stories to be notified about
 */
export interface FamilyMemberWithStories {
  familyMember: {
    id: string;
    email: string;
    name: string | null;
    relationship: string | null;
    lastStoryNotificationSentAt: string | null;
  };
  storyteller: {
    id: string;
    name: string;
    emailNotifications: boolean;
  };
  newStories: StoryForNotification[];
}

/**
 * Story information for email notifications
 */
export interface StoryForNotification {
  id: string;
  title: string;
  year: number | null;
  photoUrl: string | null;
  createdAt: string;
}

/**
 * Email content structure returned by email template functions
 */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Parameters for sending a question notification email
 */
export interface QuestionNotificationParams {
  storytellerUserId: string;
  submitterFamilyMemberId: string;
  questionText: string;
  context?: string;
}

/**
 * Parameters for sending story notification emails
 */
export interface StoryNotificationParams {
  storytellerUserId: string;
  storyId: string;
  storyTitle: string;
  storyYear?: number;
  heroPhotoPath?: string;
  transcript: string;
}
