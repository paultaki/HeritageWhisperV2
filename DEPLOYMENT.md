# 🚀 HeritageWhisperV2 - Deployment Instructions

This guide will help you deploy HeritageWhisperV2 to production as a **completely new and separate project** from your existing HeritageWhisper.com site.

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] GitHub account (github.com/paultaki)
- [ ] Vercel account
- [ ] All environment variable values from `.env.local`
- [ ] A new domain name for this deployment (separate from your existing site)

---

## Step 1: Create GitHub Repository 📁

Since GitHub CLI authentication isn't working, let's create the repository manually:

1. **Go to GitHub.com** and log in to your account
2. **Click the "+" icon** in the top-right corner
3. **Select "New repository"**
4. **Fill in the details:**
   - Repository name: `HeritageWhisperV2`
   - Description: `AI-powered storytelling platform for seniors - Next.js 15 migration`
   - Visibility: Public (or Private if you prefer)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. **Click "Create repository"**

## Step 2: Push Code to GitHub 🔄

After creating the empty repository on GitHub, run these commands in your terminal:

```bash
# Navigate to your project directory
cd /Users/paul/Documents/DevProjects/HeritageWhisperV2

# Add the GitHub repository as remote origin
git remote add origin https://github.com/paultaki/HeritageWhisperV2.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

If you get an authentication prompt:
- Username: `paultaki`
- Password: Use a GitHub Personal Access Token (not your password)
  - To create one: GitHub Settings → Developer settings → Personal access tokens

## Step 3: Deploy to Vercel 🔺

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and log in
2. **Click "New Project"**
3. **Import Git Repository:**
   - Connect your GitHub account if not already connected
   - Find and select `HeritageWhisperV2`
   - Click "Import"

4. **Configure Project:**
   - **Project Name**: `heritage-whisper-v2` (or your preferred name)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: Leave as is (`.`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. **Add Environment Variables:**
   Click "Add" and add each of these (copy values from your `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   DATABASE_URL
   OPENAI_API_KEY
   SESSION_SECRET
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY (optional)
   STRIPE_SECRET_KEY (optional)
   ```

6. **Click "Deploy"**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: heritage-whisper-v2
# - Directory: ./
# - Override settings: N

# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add OPENAI_API_KEY production
vercel env add SESSION_SECRET production
# (Add each variable when prompted)

# Deploy to production
vercel --prod
```

## Step 4: Configure Custom Domain 🌐

After successful deployment:

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Domains"
   - Click "Add"
   - Enter your new domain (e.g., `heritagewhisperv2.com`)

2. **Update DNS Records:**
   - Add the DNS records shown by Vercel to your domain provider
   - Usually an A record and/or CNAME record
   - Wait for DNS propagation (5-30 minutes)

## Step 5: Verify Deployment ✅

### Test these critical paths:

1. **Homepage**: `https://your-domain.com`
2. **Authentication**:
   - Register: `https://your-domain.com/auth/register`
   - Login: `https://your-domain.com/auth/login`
3. **Core Features**:
   - Timeline: `https://your-domain.com/timeline`
   - Recording: `https://your-domain.com/recording`
   - Book View: `https://your-domain.com/book`

### Check for:
- [ ] Pages load without errors
- [ ] Authentication works (login/register)
- [ ] Can access authenticated pages
- [ ] Mobile responsive design works
- [ ] Navigation appears correctly

---

## 🔧 Troubleshooting

### Build Errors
- Check all environment variables are set correctly
- Verify Node.js version compatibility (18+)
- Check Vercel build logs for specific errors

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure callback URLs are configured in Supabase

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check connection string includes `?sslmode=require`
- Ensure database is accessible from Vercel

### Storage Issues
- Verify Supabase storage bucket exists
- Check bucket permissions are set correctly
- Ensure service role key has proper permissions

---

## 📊 Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Authentication flow works
- [ ] Can create and save stories
- [ ] Photos upload successfully
- [ ] AI transcription works
- [ ] Mobile layout displays correctly
- [ ] Custom domain is working
- [ ] SSL certificate is active

---

## 🎉 Success!

Once deployed, your HeritageWhisperV2 will be:
- **Completely separate** from your existing HeritageWhisper.com
- **Running on a new domain** of your choice
- **Independent deployment** that won't affect your production site
- **Ready for testing** with all features functional

## 📝 Important Notes

1. **This is a NEW repository** - completely separate from your existing production code
2. **Different domain** - Deploy to a new domain for testing
3. **Independent deployment** - Changes here won't affect HeritageWhisper.com
4. **All features included** - The migration is 100% complete

## 🆘 Need Help?

If you encounter any issues:
1. Check the build logs in Vercel dashboard
2. Verify all environment variables are set
3. Review the error messages carefully
4. The application is tested and working locally on port 3002

---

**Remember**: This deployment is completely independent of your existing HeritageWhisper.com site. You can safely test and experiment without affecting your production application.

---

*Deployment guide created: October 1, 2025*
*Migration completed by: Claude (Anthropic)*