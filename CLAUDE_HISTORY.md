# HeritageWhisperV2 - Historical Fixes & Migration Notes

This document contains detailed historical information about the V2 migration and past issues. For current working documentation, see `CLAUDE.md`.

---

## 🎉 Migration Timeline

### October 1, 2025 - Initial Migration
**Duration:** ~7 hours (9:30 AM - 4:30 PM PST)

**Completed:**
- Next.js 15 with App Router setup
- All authentication pages migrated
- Core components and pages
- API routes (auth, stories, transcription, profile)
- Supabase integration (auth, database, storage)
- Photo and audio management
- Book view with pagination
- Mobile responsive design

---

## 📝 Major Feature Additions

### January 3, 2025 - Database & Photo Persistence
- **Migration to Supabase Database**: Switched from Neon to Supabase's built-in PostgreSQL
- **Photo Persistence Fix**: Photos now stored as file paths, signed URLs generated on-demand
- **Audio Controls**: Added delete and re-record functionality
- **Memory Box Page**: Created story management view with filters and bulk actions
- **Onboarding Flow**: Birth year collection for new users
- **Auth Flow Pages**: Complete email verification, password reset, OAuth callback
- **Sharing System**: Permission-based sharing (view/edit) - 80% complete

### January 4, 2025 - Mobile UX Optimization
- **Book View Mobile**: Fixed navigation footer z-index, photo carousel redesign
- **Timeline Spacing**: Optimized left margin for wider cards on mobile
- **Audio Upload Formats**: Added support for MP3, WAV, OGG, M4A
- **Text Justification**: Fixed huge gaps on mobile by changing to left-align
- **Mobile Header**: Better spacing and tap targets (44x44px minimum)

### October 4, 2025 - Legal Compliance
- **Terms & Privacy Tracking**: Full GDPR/CCPA compliant system
- **Database Schema**: `users` and `user_agreements` tables with audit trail
- **API Endpoints**: Accept, status, and registration integration
- **Frontend Components**: AgreementGuard, AgreementModal, status hook
- **Resend Email Integration**: Verification and welcome emails

### October 5, 2025 - Critical Fixes
- **Login to Register Navigation**: Fixed inline form toggle, now properly navigates to `/auth/register`
- **Audio Upload MIME Types**: Updated Supabase bucket to allow all audio formats (was only allowing webm/ogg)
- **Timeline Decade Sorting**: Birth year section now correctly appears before same-decade stories
- **Legal Documents Update**: Removed wisdom clips and character traits references from Terms & Privacy pages
- **RLS Security**: Enabled RLS on `recording_sessions` and `usage_tracking` tables
- **RLS Performance**: Optimized all policies to use `(SELECT auth.uid())` pattern instead of `auth.uid()`
- **Function Security**: Fixed `increment_view_count` search path with `SET search_path = public, pg_temp`
- **Email Confirmation Flow**: Fixed redirect to go directly to `/timeline` after email verification
- **Duplicate Agreement Modal**: Fixed by using service role key in registration to properly set agreement versions
- **Resend SMTP**: Configured email sending via custom domain (no-reply@updates.heritagewhisper.com)

---

## 🐛 Historical Issues & Solutions

### Audio Upload Issues (October 5, 2025)

**Multiple Attempts:**
1. ❌ Tried removing explicit contentType → Defaulted to text/plain
2. ❌ Tried setting contentType to `audio/mpeg` → Rejected as unsupported
3. ❌ Tried wrapping File in new File() → Converted to string
4. ❌ Tried direct Blob upload → Still MIME type issues
5. ✅ **ROOT CAUSE**: Supabase bucket `allowed_mime_types` only had webm/ogg

**Final Solution:**
```sql
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/wave', 'audio/mp4', 'audio/m4a',
  'image/jpeg', 'image/png', 'image/webp'
]
WHERE name = 'heritage-whisper-files';
```

**Key Learning:** When Supabase says "mime type X is not supported", check the bucket configuration first, not the code.

### Timeline Sorting (Recurring Issue)

**Problem:** Stories from same decade as birth year appearing before birth year section

**Iterations:**
1. October 4, 2025: Fixed by using earliest story year for decade sorting
2. October 5, 2025: Re-fixed after issue recurred - now detects birth decade and uses earliest story year only for that decade

**Solution Location:** `/app/timeline/page.tsx:1194-1199`

### Photo Upload Issues (January 3, 2025)

**Problem:** Photos stored as blob URLs instead of Supabase paths

**Solution:**
- Store file paths in database (not URLs)
- Generate signed URLs with 1-week expiry on-demand
- Blob URL filtering in API endpoints
- Proper upload flow for both new and edited stories

### Authentication Race Conditions

**Problem:** 401 errors when timeline/book view loaded immediately after login

**Solution:**
- Session retry logic (5x 100ms delays)
- Query invalidation after login
- Check for both `user` AND `session` before fetching data

### Email Confirmation & Agreement Modal (October 5, 2025)

**Problem:** After email confirmation, users saw duplicate agreement modal even though they accepted at signup

**Root Causes:**
1. Email confirmation redirected to homepage instead of `/auth/callback`
2. `/auth/callback` had conditional logic checking birth year
3. Registration used anon key instead of service role key
4. RLS policies blocked setting `latest_terms_version`/`latest_privacy_version` columns
5. Agreement status check didn't properly query `user_agreements` table

**Solutions:**
1. Updated Supabase redirect URLs to include `https://dev.heritagewhisper.com/auth/callback`
2. Changed `/auth/callback` to always redirect to `/timeline` (birth year already collected at signup)
3. Changed registration to use service role key: `createClient(supabaseUrl, supabaseServiceKey)`
4. Fixed `/api/agreements/status` fallback to check both terms AND privacy in `user_agreements` table
5. Updated agreement status query to properly detect both agreement types

**Key Files Modified:**
- `/app/api/auth/register/route.ts` - Service role key
- `/app/auth/callback/page.tsx` - Direct timeline redirect
- `/app/api/agreements/status/route.ts` - Improved fallback logic

---

## 📁 Key File Locations

### Audio Management
- `/app/api/upload/audio/route.ts` - Audio file upload to Supabase
- `/components/AudioRecorder.tsx` - Web Audio API recording component
- `/components/BookStyleReview.tsx` - Audio playback and controls

### Photo Management
- `/app/api/upload/photo/route.ts` - Photo upload to Supabase
- `/app/api/stories/[id]/photos/route.ts` - Add photos to stories
- `/components/MultiPhotoUploader.tsx` - Photo upload with cropping

### Timeline & Book View
- `/app/timeline/page.tsx` - Timeline with decade organization
- `/app/book/page.tsx` - Book view with pagination
- `/lib/bookPagination.ts` - Text measurement and page splitting

### Authentication
- `/app/api/auth/login/route.ts` - Email/password login
- `/app/api/auth/register/route.ts` - User registration with agreements
- `/lib/auth.tsx` - Auth context and provider
- `/app/auth/callback/page.tsx` - OAuth callback handler

---

## 🔧 Database Schema Changes

### October 4, 2025 - Legal Compliance
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  birth_year INTEGER,
  latest_terms_version TEXT,
  latest_privacy_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  agreement_type TEXT NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  method TEXT
);
```

### January 3, 2025 - Sharing System
```sql
CREATE TABLE public.shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id),
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES users(id),
  permission_level TEXT DEFAULT 'view',
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ
);
```

---

## 📊 Performance Improvements

### Image Optimization
- Next.js Image component with automatic optimization
- 40-60% faster page loads
- Lazy loading for off-screen images

### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting with App Router
- Reduced initial bundle size

### Query Caching
- TanStack Query with 30-minute stale time
- Optimistic updates for better UX
- Automatic background refetching

---

## 🚧 Incomplete Features (from V1)

### Not Yet Migrated
- Subscribe page (Stripe payment integration)
- Go Deeper UI components (GoDeeperAccordion, GoDeeperLite)
- Demo mode (complete guest experience)
- Historical context generation
- Guest Timeline/Book Views for sharing (20% remaining)

### Partially Complete
- **Sharing System (80%)**: Core functionality done, needs guest views
- **Email Notifications**: Resend integrated, needs share notification emails

---

## 🔐 Security Improvements

### January 30, 2025
- Removed 200+ console.log statements exposing tokens
- Fixed hardcoded secrets (SESSION_SECRET, OPENAI_API_KEY)
- Cleaned auth-middleware.ts
- Sanitized queryClient.ts
- Created security checker script

### September 30, 2025
- Admin scripts renamed with .dev extension
- Production guards added to all admin scripts
- Enhanced .gitignore patterns
- Token-based admin access control

---

## 💡 Lessons Learned

1. **Always check bucket configuration first** when Supabase rejects MIME types
2. **File/Blob objects lose MIME type** when wrapped with `new File([blob])`
3. **Timeline sorting requires special handling** for birth year vs decades
4. **Session race conditions** need retry logic after login
5. **Signed URLs with expiry** better than storing URLs in database
6. **Mobile text justification** causes huge gaps, use left-align
7. **Z-index stacking** requires careful planning for overlapping elements

---

## 📋 Feature Updates Archive

### October 7, 2025 - Memory Box & Book View Enhancements

**Memory Box Enhancements:**
- **Filter System**: 3x2 grid layout with 6 filter buttons (All, Favorites, Timeline, Book, No date, Private)
- **List View**: Compact horizontal rows with Timeline/Book/menu buttons in single row
- **Card Improvements**:
  - Added dropdown menu (⋯ button) with Edit, Favorite, Delete actions
  - Star icon (⭐) displays on favorited memories
  - Removed separate edit pencil icon in favor of dropdown menu
- **Toolbar Polish**: Search box and filter grid have matching widths on mobile for symmetry

**Book View Updates:**
- **Navigation**: Collapsed decade navigation by default (desktop & mobile)
  - Shows current chapter/TOC as pill button
  - Expands to show all navigation options when clicked
  - Click outside or select chapter to collapse
- **Mobile Book Styling**:
  - Slim brown border (0.75rem padding) with dark leather background
  - Wider content (10px side margins)
  - Photos at 98% width for maximum impact
  - Compact audio player with reduced spacing

### October 8, 2025 - PDF Export Feature

**PDF Export Implementation:**
- Export button with dropdown menu in book view header
- Two export formats:
  - **2-up (Home Print)**: Two 5.5×8.5" pages side-by-side on 11×8.5" landscape
  - **Trim (POD)**: Individual 5.5×8.5" pages for professional printing
- Server-side PDF generation using Puppeteer + @sparticuz/chromium
- Print-specific pages at `/book/print/2up` and `/book/print/trim`
- API routes: `/api/export/2up`, `/api/export/trim`, `/api/book-data`
- Uses service role key to bypass auth for print pages
- Created `/app/book/print/layout.tsx` to bypass root layout wrapper

**PDF Export Margin Fix (October 8, 2025):**
- Issue: Content stuck to top-left corner and bleeding onto extra pages
- Root cause: Root layout adding `md:pl-20 pb-20 md:pb-0` padding to all pages
- Solution:
  - Created minimal print layout to bypass wrapper padding
  - Added CSS overrides: `body > * { padding: 0 !important }`
  - Used `.book-spread` with `padding: 0.25in` and `box-sizing: border-box`
  - Set `.spread-content` to `width: 100%; height: 100%` to fill padded area
  - Result: Equal 0.25in margins on all sides without overflow

### October 2025 - Project Cleanup
- 37 obsolete files removed (test scripts, old page versions, one-time fix docs)
- Migrations and schema files preserved in `/migrations` and `/scripts`

---

## 🎨 Design System Details (October 2025)

Timeline uses Heritage Whisper design system with semantic `hw-*` classes:

**Component Classes:**
- `.hw-spine` - Timeline container with vertical spine and gutter spacing
- `.hw-decade` - Decade section wrapper
- `.hw-decade-band` - Sticky decade headers (87px offset for perfect alignment with app header)
- `.hw-grid` - Responsive grid (1 col mobile, 2 cols desktop)
- `.hw-card` - Story card with horizontal connectors to timeline spine
- `.hw-card-media` - 16:10 aspect ratio images
- `.hw-card-body` - Card content wrapper
- `.hw-card-title` - Story title
- `.hw-meta` - Metadata row with hairline dividers
- `.hw-card-provenance` - Hover details (creation/edit dates)
- `.hw-year` - Year badge (appears on hover/focus)
- `.hw-play` - Play button with heritage palette

**Design Tokens:**
- Primary accent: `#D36A3D` (clay/terracotta)
- Secondary accent: `#B89B5E` (soft gold)
- Focus ring: `#B89B5E`
- Card shadow: `0 6px 20px rgba(0,0,0,0.10)`
- Semantic spacing scale in `tokens.css`

**Implementation Details:**
- Horizontal connectors aligned to title baseline via `--title-offset` CSS custom property
- 180px offset for cards with images (16:10 aspect ratio), 22px for text-only
- Play button: stroke outline at rest, fills on hover
- Sticky decade bands with soft tinted background (88% page, 12% accent)
- Year badges show on card hover for temporal context
- Provenance details on hover (creation/edit dates)
- Mobile-optimized: 40px gutter, 14px spine position, 18px×2px connectors
- Desktop: 56px gutter, 20px spine position, 18px connectors (14px default, expands to 24px on hover)

---

*This is a historical reference document. For current documentation, see CLAUDE.md*
*Last updated: October 8, 2025*
