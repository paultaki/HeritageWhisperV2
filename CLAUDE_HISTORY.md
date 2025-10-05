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

*This is a historical reference document. For current documentation, see CLAUDE.md*
*Last updated: October 5, 2025*
