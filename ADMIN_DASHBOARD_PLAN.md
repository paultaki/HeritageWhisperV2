# Heritage Whisper Admin Dashboard - Comprehensive Plan

**Date:** October 17, 2025
**Status:** Proposed Design
**Purpose:** Data-driven insights for product growth, customer service, and business intelligence

---

## 🎯 Dashboard Objectives

1. **Monitor Growth**: Track user acquisition, activation, and retention
2. **Measure Engagement**: Understand how users interact with storytelling features
3. **Optimize Conversion**: Identify drop-off points and improve Story 3+ paywall conversion
4. **Support Operations**: Provide customer service team with user context
5. **Track AI Costs**: Monitor and control AI spend across GPT-5 and AssemblyAI
6. **Family Engagement**: Measure family sharing adoption and activity

---

## 📊 Dashboard Structure

### 1. **Executive Overview Dashboard** (Home)
High-level metrics for business health and growth

### 2. **User Engagement Dashboard**
Deep-dive into user behavior and content creation

### 3. **Top 10 Power Users Leaderboard**
Celebrate and understand your most engaged users

### 4. **Conversion Funnel & Drop-offs**
Identify where users get stuck or leave

### 5. **AI Cost & Usage Dashboard**
Monitor AI spend and optimize for profitability

### 6. **Family Sharing Dashboard**
Track family invites, acceptance rates, and activity

### 7. **Customer Service Tools**
Quick user lookup and account management

---

## 1️⃣ Executive Overview Dashboard

### **Key Metrics (Top Row - Big Numbers)**

| Metric | Description | SQL Query |
|--------|-------------|-----------|
| **Total Users** | All registered accounts | `SELECT COUNT(*) FROM users` |
| **Active Users (7d)** | Users who logged in last 7 days | `SELECT COUNT(DISTINCT user_id) FROM stories WHERE created_at >= NOW() - INTERVAL '7 days'` |
| **Active Users (30d)** | Users who logged in last 30 days | `SELECT COUNT(DISTINCT user_id) FROM stories WHERE created_at >= NOW() - INTERVAL '30 days'` |
| **Paid Users** | Users with active subscriptions | `SELECT COUNT(*) FROM users WHERE is_paid = true` |

### **Growth Trends (Charts)**

#### New User Registrations
- **Chart Type:** Line graph (last 30 days, 90 days, all-time)
- **Y-Axis:** Number of new users
- **X-Axis:** Date
- **Actionable Insight:** Identify marketing campaign impact, seasonal trends

```sql
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as new_users
FROM users
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY signup_date;
```

#### Story Creation Velocity
- **Chart Type:** Line graph with dual Y-axis
- **Y-Axis 1:** Total stories created (cumulative)
- **Y-Axis 2:** Stories per day (rate)
- **Actionable Insight:** See if content creation is accelerating or slowing

```sql
SELECT
  DATE(created_at) as story_date,
  COUNT(*) as stories_created,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_stories
FROM stories
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY story_date;
```

### **User Lifecycle Summary**

| Lifecycle Stage | Count | % of Total | Avg Days Since Signup |
|----------------|-------|-----------|----------------------|
| **New** (0 stories) | X | X% | X days |
| **Activated** (1-2 stories) | X | X% | X days |
| **Engaged** (3-9 stories) | X | X% | X days |
| **Power User** (10-29 stories) | X | X% | X days |
| **Super User** (30+ stories) | X | X% | X days |
| **Churned** (No activity 30+ days) | X | X% | X days |

```sql
SELECT
  CASE
    WHEN story_count = 0 THEN 'New (0 stories)'
    WHEN story_count BETWEEN 1 AND 2 THEN 'Activated (1-2 stories)'
    WHEN story_count BETWEEN 3 AND 9 THEN 'Engaged (3-9 stories)'
    WHEN story_count BETWEEN 10 AND 29 THEN 'Power User (10-29 stories)'
    WHEN story_count >= 30 THEN 'Super User (30+ stories)'
  END as lifecycle_stage,
  COUNT(*) as user_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage,
  ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400), 1) as avg_days_since_signup
FROM users
GROUP BY lifecycle_stage
ORDER BY MIN(story_count);
```

### **Revenue Metrics**

| Metric | Value | Change (7d) |
|--------|-------|-------------|
| **MRR** (Monthly Recurring Revenue) | $X | +X% |
| **ARR** (Annual Recurring Revenue) | $X | +X% |
| **ARPU** (Avg Revenue Per User) | $X/mo | +X% |
| **Conversion Rate** (Free → Paid) | X% | +X% |
| **Churn Rate** (Monthly) | X% | -X% |

---

## 2️⃣ User Engagement Dashboard

### **Overall Engagement Metrics**

| Metric | Total | Per User Average | Median |
|--------|-------|------------------|--------|
| **Total Stories** | X | X.X | X |
| **Stories with Audio** | X | X.X | X |
| **Stories with Photos** | X (X%) | X.X | X |
| **Stories with Lessons** | X (X%) | X.X | X |
| **Avg Story Length** | X words | X words | X words |
| **Avg Recording Duration** | X:XX | X:XX | X:XX |
| **Stories in Book** | X (X%) | X.X | X |
| **Stories in Timeline** | X (X%) | X.X | X |
| **Favorited Stories** | X (X%) | X.X | X |

```sql
SELECT
  COUNT(*) as total_stories,
  ROUND(AVG(story_count_per_user), 2) as avg_per_user,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY story_count_per_user) as median_per_user,
  SUM(CASE WHEN audio_url IS NOT NULL THEN 1 ELSE 0 END) as stories_with_audio,
  SUM(CASE WHEN photos IS NOT NULL AND jsonb_array_length(photos) > 0 THEN 1 ELSE 0 END) as stories_with_photos,
  SUM(CASE WHEN lesson_learned IS NOT NULL THEN 1 ELSE 0 END) as stories_with_lessons,
  ROUND(AVG(LENGTH(transcription)), 0) as avg_story_length_chars,
  ROUND(AVG(duration_seconds), 0) as avg_duration_seconds,
  SUM(CASE WHEN include_in_book = true THEN 1 ELSE 0 END) as included_in_book,
  SUM(CASE WHEN include_in_timeline = true THEN 1 ELSE 0 END) as included_in_timeline,
  SUM(CASE WHEN is_favorite = true THEN 1 ELSE 0 END) as favorited
FROM stories
CROSS JOIN (
  SELECT AVG(story_count) as story_count_per_user FROM users WHERE story_count > 0
) user_stats;
```

### **Content Type Breakdown (Pie Chart)**

- Stories with audio only
- Stories with photos only
- Stories with both audio + photos
- Stories with neither (typed)

### **Story Creation by Time of Day (Heat Map)**

- **X-Axis:** Hour of day (0-23)
- **Y-Axis:** Day of week (Mon-Sun)
- **Color:** Number of stories created
- **Actionable Insight:** When are users most active? Optimize prompt delivery times.

```sql
SELECT
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  TO_CHAR(created_at, 'Day') as day_of_week,
  COUNT(*) as stories_created
FROM stories
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY hour_of_day, day_of_week
ORDER BY hour_of_day, day_of_week;
```

### **Feature Adoption Rates**

| Feature | Users Who've Used | Adoption Rate | Avg Usage per User |
|---------|-------------------|---------------|--------------------|
| **Audio Recording** | X | X% | X.X recordings |
| **Photo Upload** | X | X% | X.X photos |
| **Multi-Photo Stories** | X | X% | X.X photos/story |
| **Lesson Learned** | X | X% | X.X lessons |
| **Favorites** | X | X% | X.X favorites |
| **PDF Export** | X | X% | X.X exports |
| **Data Export** | X | X% | X.X exports |

```sql
SELECT
  COUNT(DISTINCT CASE WHEN EXISTS(SELECT 1 FROM stories s WHERE s.user_id = u.id AND s.audio_url IS NOT NULL) THEN u.id END) as audio_users,
  COUNT(DISTINCT CASE WHEN EXISTS(SELECT 1 FROM stories s WHERE s.user_id = u.id AND s.photos IS NOT NULL) THEN u.id END) as photo_users,
  COUNT(DISTINCT CASE WHEN u.pdf_exports_count > 0 THEN u.id END) as pdf_export_users,
  COUNT(DISTINCT CASE WHEN u.data_exports_count > 0 THEN u.id END) as data_export_users,
  COUNT(*) as total_users
FROM users u
WHERE u.story_count > 0;
```

---

## 3️⃣ Top 10 Power Users Leaderboard 🏆

**Purpose:** Identify and celebrate your most engaged users, understand what drives success

### **Leaderboard Table**

| Rank | User | Email | Stories | Days Active | Avg Stories/Week | Last Active | Paid | Family Members |
|------|------|-------|---------|-------------|------------------|-------------|------|----------------|
| 🥇 1 | John D. | john@... | 127 | 89 | 9.8 | 2h ago | ✅ | 4 |
| 🥈 2 | Mary S. | mary@... | 98 | 67 | 10.2 | 1d ago | ✅ | 3 |
| 🥉 3 | Bob K. | bob@... | 84 | 52 | 11.3 | 3h ago | ✅ | 2 |
| 4 | ... | ... | ... | ... | ... | ... | ... | ... |

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY u.story_count DESC) as rank,
  u.name,
  u.email,
  u.story_count,
  EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 as days_since_signup,
  ROUND(u.story_count::numeric / NULLIF(EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 604800, 0), 2) as avg_stories_per_week,
  (SELECT MAX(created_at) FROM stories WHERE user_id = u.id) as last_story_created,
  u.is_paid,
  (SELECT COUNT(*) FROM family_members WHERE user_id = u.id AND status = 'active') as family_count
FROM users u
WHERE u.story_count > 0
ORDER BY u.story_count DESC
LIMIT 10;
```

### **Power User Characteristics (Insights)**

| Characteristic | Top 10 Avg | All Users Avg | Difference |
|---------------|------------|---------------|------------|
| Stories Created | X | X | +X% |
| Days Active | X | X | +X% |
| Stories with Audio | X% | X% | +X% |
| Stories with Photos | X% | X% | +X% |
| Family Members | X | X | +X |
| PDF Exports | X | X | +X% |

**Actionable Insight:** What do power users do differently? Use this to optimize onboarding.

---

## 4️⃣ Conversion Funnel & Drop-off Analysis

**Purpose:** Identify where users get stuck or leave, optimize conversion

### **Registration Funnel**

```
Visitors → Email Verification → First Login → First Story → Story 3 (Paywall) → Paid User
   ?    →        X%          →      X%     →     X%     →        X%        →     X%
```

| Stage | Users | Conversion Rate | Drop-off Rate | Avg Time to Next Stage |
|-------|-------|-----------------|---------------|------------------------|
| **Registered** | 1,000 | - | - | - |
| **Email Verified** | 850 | 85% | 15% | 2.3 hours |
| **First Login** | 720 | 85% | 15% | 1.1 hours |
| **First Story** | 480 | 67% | 33% ⚠️ | 4.7 days |
| **Story 3 (Paywall)** | 180 | 38% | 62% ⚠️ | 12.3 days |
| **Paid User** | 54 | 30% | 70% ⚠️ | 3.2 days |

**⚠️ Red Flags:**
- **33% drop-off** between first login and first story → Need better onboarding
- **62% drop-off** between Story 2 and Story 3 → Paywall friction
- **70% don't convert** after hitting paywall → Pricing or value prop issue

```sql
WITH funnel AS (
  SELECT
    COUNT(*) FILTER (WHERE story_count >= 0) as registered,
    COUNT(*) FILTER (WHERE story_count >= 1) as first_story,
    COUNT(*) FILTER (WHERE story_count >= 3) as past_paywall,
    COUNT(*) FILTER (WHERE is_paid = true) as paid_users
  FROM users
)
SELECT
  'Registered' as stage, registered as count, 100.0 as conversion_rate, 0.0 as drop_off_rate FROM funnel
UNION ALL
  SELECT 'First Story', first_story, ROUND(100.0 * first_story / registered, 2), ROUND(100.0 * (1 - first_story::numeric / registered), 2) FROM funnel
UNION ALL
  SELECT 'Past Paywall (Story 3+)', past_paywall, ROUND(100.0 * past_paywall / first_story, 2), ROUND(100.0 * (1 - past_paywall::numeric / first_story), 2) FROM funnel
UNION ALL
  SELECT 'Paid User', paid_users, ROUND(100.0 * paid_users / past_paywall, 2), ROUND(100.0 * (1 - paid_users::numeric / past_paywall), 2) FROM funnel;
```

### **Time to Key Milestones**

| Milestone | Median Time | 75th Percentile | 90th Percentile |
|-----------|-------------|-----------------|-----------------|
| Email verified → First login | X hours | X hours | X hours |
| First login → First story | X days | X days | X days |
| First story → Story 3 | X days | X days | X days |
| Story 3 → Paid | X days | X days | X days |

### **Churn Analysis**

**Inactive Users (No activity in 30+ days)**

| Cohort | Total Users | Churned | Churn Rate | Stories Created Before Churn |
|--------|-------------|---------|------------|------------------------------|
| 0 stories | X | X | X% | 0 |
| 1-2 stories | X | X | X% | 1.X |
| 3-9 stories | X | X | X% | X.X |
| 10+ stories | X | X | X% | X.X |

**Actionable Insight:** If users churn after 1-2 stories, focus on Story 3 conversion tactics.

---

## 5️⃣ AI Cost & Performance Dashboard

**Purpose:** Monitor AI spend, track performance metrics (latency, TTFT), optimize for profitability and speed

### **AI Performance Overview (Last 24 Hours)**

| Metric | AssemblyAI | GPT-4o-mini | GPT-5 | Whisper |
|--------|------------|-------------|-------|---------|
| **Avg Latency** | Xms | Xms | Xms | Xms |
| **Avg TTFT** | - | Xms | Xms | - |
| **P95 Latency** | Xms | Xms | Xms | Xms |
| **Error Rate** | X% | X% | X% | X% |
| **Timeout Rate** | X% | X% | X% | X% |
| **Requests** | X | X | X | X |

**TTFT = Time to First Token** (how fast the AI starts responding)
**P95 = 95th percentile** (slowest 5% of requests)

```sql
-- Requires ai_usage_logs table (see Data Requirements section)
SELECT
  ai_service,
  ROUND(AVG(latency_ms), 0) as avg_latency_ms,
  ROUND(AVG(ttft_ms), 0) as avg_ttft_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) as p95_latency_ms,
  COUNT(*) as total_requests,
  ROUND(100.0 * COUNT(CASE WHEN error = true THEN 1 END) / COUNT(*), 2) as error_rate,
  ROUND(100.0 * COUNT(CASE WHEN timeout = true THEN 1 END) / COUNT(*), 2) as timeout_rate
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ai_service
ORDER BY total_requests DESC;
```

**Actionable Insights:**
- **High latency?** Consider switching models or providers
- **High TTFT?** Users perceive slow response, optimize prompts
- **High error rate?** API issues, check rate limits or quota
- **High timeout rate?** Increase timeout thresholds or reduce request size

### **Latency Trends (Last 7 Days)**

**Chart Type:** Multi-line graph
- **X-Axis:** Time (hourly buckets)
- **Y-Axis:** Latency (ms)
- **Lines:** One per AI service (AssemblyAI, GPT-4o-mini, GPT-5, Whisper)

```sql
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  ai_service,
  ROUND(AVG(latency_ms), 0) as avg_latency,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) as p95_latency
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), ai_service
ORDER BY hour, ai_service;
```

### **Operation Type Breakdown (Performance)**

| Operation | Avg Latency | TTFT | P95 Latency | Requests | Model |
|-----------|-------------|------|-------------|----------|-------|
| **Transcription (AssemblyAI)** | X.Xs | - | X.Xs | X | - |
| **Transcription (Whisper fallback)** | X.Xs | - | X.Xs | X | whisper-1 |
| **Formatting** | X.Xs | Xms | X.Xs | X | gpt-4o-mini |
| **Lesson Generation** | X.Xs | Xms | X.Xs | X | gpt-4o-mini |
| **Tier 1 Prompts** | X.Xs | Xms | X.Xs | X | gpt-4o-mini |
| **Tier 3 Analysis (low effort)** | X.Xs | Xms | X.Xs | X | gpt-5 |
| **Tier 3 Analysis (high effort)** | X.Xs | Xms | X.Xs | X | gpt-5 |
| **Echo Prompts** | X.Xs | Xms | X.Xs | X | gpt-4o-mini |

**Actionable Insight:** Which operations are slowest? Optimize those first.

### **Overall AI Costs (Last 30 Days)**

| AI Service | Requests | Total Cost | Avg Cost per Request | % of Total |
|------------|----------|------------|---------------------|------------|
| **AssemblyAI (Transcription)** | X | $X.XX | $0.0025/min | X% |
| **OpenAI GPT-4o-mini** | X | $X.XX | $0.000X | X% |
| **OpenAI GPT-5 (Tier 3)** | X | $X.XX | $0.0X | X% |
| **OpenAI Whisper (Fallback)** | X | $X.XX | $0.006/min | X% |
| **TOTAL** | X | **$X.XX** | - | 100% |

```sql
-- Note: This requires logging AI costs. See implementation section.
SELECT
  ai_service,
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost,
  ROUND(100.0 * SUM(cost_usd) / SUM(SUM(cost_usd)) OVER (), 2) as percentage
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY ai_service
ORDER BY total_cost DESC;
```

### **Cost per User Cohort**

| User Segment | Users | Total AI Cost | Avg Cost per User | Revenue per User | Profit Margin |
|--------------|-------|---------------|-------------------|------------------|---------------|
| **Free (0-2 stories)** | X | $X.XX | $0.XX | $0 | -$0.XX ⚠️ |
| **Free (3-9 stories)** | X | $X.XX | $0.XX | $0 | -$0.XX ⚠️ |
| **Paid (10+ stories)** | X | $X.XX | $X.XX | $9.99 | +$X.XX ✅ |

**Actionable Insight:** Are free users costing too much? Adjust AI limits or paywall placement.

### **AI Opt-out Adoption**

| Metric | Value | % of Total |
|--------|-------|-----------|
| **AI Enabled** | X | X% |
| **AI Disabled** | X | X% |
| **Stories Created (AI Disabled)** | X | X% |

```sql
SELECT
  COUNT(CASE WHEN ai_processing_enabled = true THEN 1 END) as ai_enabled,
  COUNT(CASE WHEN ai_processing_enabled = false THEN 1 END) as ai_disabled,
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM stories s JOIN users u ON s.user_id = u.id WHERE u.ai_processing_enabled = false) as stories_no_ai
FROM users;
```

### **Prompt Generation Success Rate**

| Tier | Prompts Generated | Prompts Shown | Prompts Used | Use Rate | Skip Rate |
|------|-------------------|---------------|--------------|----------|-----------|
| **Tier 1 (Templates)** | X | X | X | X% | X% |
| **Tier 3 (Milestones)** | X | X | X | X% | X% |
| **Echo (Follow-ups)** | X | X | X | X% | X% |

```sql
SELECT
  tier,
  COUNT(*) as generated,
  SUM(shown_count) as shown,
  COUNT(CASE WHEN outcome = 'used' THEN 1 END) as used,
  ROUND(100.0 * COUNT(CASE WHEN outcome = 'used' THEN 1 END) / NULLIF(SUM(shown_count), 0), 2) as use_rate,
  ROUND(100.0 * COUNT(CASE WHEN outcome = 'skipped' THEN 1 END) / NULLIF(SUM(shown_count), 0), 2) as skip_rate
FROM prompt_history
GROUP BY tier
ORDER BY tier;
```

---

## 6️⃣ Family Sharing Dashboard

**Purpose:** Track family sharing adoption, engagement, and viral growth

### **Family Sharing Overview**

| Metric | Count | % of Users |
|--------|-------|-----------|
| **Users with Family Members** | X | X% |
| **Total Family Members Invited** | X | - |
| **Active Family Members** | X | X% |
| **Pending Invites** | X | X% |
| **Declined Invites** | X | X% |

```sql
SELECT
  COUNT(DISTINCT user_id) as users_with_family,
  COUNT(*) as total_invites,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined
FROM family_members;
```

### **Family Invite Conversion Funnel**

```
Invite Sent → Email Opened (?) → Invite Accepted → First Login → First Activity
   100%     →       ?%        →       X%        →     X%      →      X%
```

### **Family Activity Breakdown**

| Activity Type | Count | % of Total |
|--------------|-------|-----------|
| **Story Viewed** | X | X% |
| **Comment Added** | X | X% |
| **Story Favorited** | X | X% |
| **Story Shared** | X | X% |

```sql
SELECT
  activity_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM family_activity
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY activity_type
ORDER BY count DESC;
```

### **Most Active Families (Leaderboard)**

| Rank | User | Family Members | Total Activities | Last Activity |
|------|------|----------------|------------------|---------------|
| 1 | John D. | 4 | 127 | 2h ago |
| 2 | Mary S. | 3 | 98 | 1d ago |
| 3 | Bob K. | 2 | 84 | 3h ago |

---

## 7️⃣ Customer Service Tools

**Purpose:** Quickly lookup user accounts, view their story history, and resolve issues

### **User Search**

- **Search by:** Email, Name, User ID
- **Results show:**
  - User profile (name, email, signup date, birth year)
  - Story count, paid status, subscription details
  - Last login, last story created
  - AI processing enabled/disabled
  - Family members count
  - PDF/data export history

### **Quick Actions**

- View user's timeline
- View user's stories (read-only)
- View AI prompt history
- View family sharing status
- Export user data (GDPR)
- Reset user password (send email)
- Refund subscription
- Delete account (with confirmation)

### **User Activity Timeline**

Show chronological log of all user actions:
- Account created
- Email verified
- First login
- Story created (with title)
- Prompt shown/skipped
- Family member invited
- PDF exported
- Subscription started/cancelled

---

## 📈 Additional Metrics & Insights

### **Cohort Analysis**

Track user retention by signup week/month:

| Signup Week | Week 1 | Week 2 | Week 3 | Week 4 | Week 8 | Week 12 |
|-------------|--------|--------|--------|--------|--------|---------|
| Oct 1-7 | 100% | 67% | 54% | 48% | 38% | 32% |
| Oct 8-14 | 100% | 71% | 58% | 51% | 41% | - |
| Oct 15-21 | 100% | 69% | 56% | - | - | - |

### **Geographic Distribution**

If you track IP addresses or timezones:
- Map showing user concentration by region/country
- Story creation times by timezone
- Language preferences (if multi-language)

### **Device & Platform**

Track user agent data:
- Mobile vs Desktop usage
- iOS vs Android
- Browser breakdown (Chrome, Safari, Firefox, etc.)
- App vs Web (if you have a mobile app)

### **Story Quality Metrics**

- Avg story length (words)
- Stories with lessons learned
- Stories with photos (%)
- Stories with audio (%)
- Avg photos per story
- Avg recording duration

### **A/B Test Results**

If running experiments:
- Variant A vs B conversion rates
- Statistical significance
- Winner declared

---

## 🛠️ Implementation Priority

### **Phase 1: Core Metrics (Week 1)**
✅ **Must Have** - Build these first

1. Executive Overview (total users, stories, active users)
2. User Engagement basics (stories per user, feature adoption)
3. Top 10 Power Users leaderboard
4. Basic customer service search

**Effort:** ~8-12 hours
**Value:** High - Immediate insights into business health

### **Phase 2: Funnel Analysis (Week 2)**
⚠️ **Should Have** - Build next

1. Conversion funnel with drop-off rates
2. Time to milestone analysis
3. Churn analysis by cohort
4. Cohort retention table

**Effort:** ~10-15 hours
**Value:** High - Identify growth bottlenecks

### **Phase 3: AI & Family (Week 3)**
💡 **Nice to Have** - Build when time allows

1. AI cost dashboard
2. Family sharing metrics
3. Prompt success rates
4. Geographic distribution

**Effort:** ~8-10 hours
**Value:** Medium - Optimize costs and virality

### **Phase 4: Advanced Tools (Week 4+)**
🚀 **Future Enhancement**

1. Real-time activity feed
2. A/B test results dashboard
3. Predictive churn models
4. Customer service timeline view
5. Automated alerts (e.g., "AI spend over budget")

**Effort:** ~15-20 hours
**Value:** Medium - Nice operational improvements

---

## 🗄️ Data Requirements

### **Existing Tables (Already Available)**

✅ `users` - User accounts and metadata
✅ `stories` - All story content
✅ `active_prompts` - Current prompts
✅ `prompt_history` - Prompt outcomes
✅ `family_members` - Family invites
✅ `family_activity` - Family engagement
✅ `user_agreements` - Terms acceptance

### **New Tables Needed**

❌ **Login Tracking** - Track user sessions
```sql
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT, -- 'chrome', 'safari', 'firefox'
  login_method TEXT, -- 'email', 'oauth'
  session_duration_seconds INTEGER
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_at ON login_history(login_at);
```

❌ **AI Usage Logs** - Track AI costs AND performance per request
```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),

  -- Request metadata
  ai_service TEXT NOT NULL, -- 'assemblyai', 'gpt-4o-mini', 'gpt-5', 'whisper'
  operation_type TEXT NOT NULL, -- 'transcription', 'formatting', 'lesson_generation', 'tier1', 'tier3', 'echo'
  model_version TEXT, -- 'gpt-5', 'gpt-4o-mini', 'whisper-1', 'universal'

  -- Performance metrics
  latency_ms INTEGER NOT NULL, -- Total round-trip time
  ttft_ms INTEGER, -- Time to first token (GPT models only)

  -- Cost tracking
  cost_usd NUMERIC(10, 6) NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_reasoning INTEGER, -- GPT-5 only
  tokens_total INTEGER,

  -- Quality/error tracking
  error BOOLEAN DEFAULT false,
  error_message TEXT,
  timeout BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  tier INTEGER, -- 1, 3, etc. (for prompt operations)
  reasoning_effort TEXT, -- 'low', 'medium', 'high' (GPT-5 only)
  milestone INTEGER, -- Story count at time of operation

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_usage_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_service ON ai_usage_logs(ai_service);
CREATE INDEX idx_ai_usage_operation ON ai_usage_logs(operation_type);
CREATE INDEX idx_ai_usage_model ON ai_usage_logs(model_version);

-- Index for performance queries
CREATE INDEX idx_ai_usage_perf ON ai_usage_logs(created_at, ai_service, latency_ms);
```

**Integration Notes:**
- Your telemetry already logs `ttftMs`, `latencyMs`, `costUsd`, `tokensUsed` - just need to persist to DB
- Add logging call after each AI operation in:
  - `/app/api/transcribe-assemblyai/route.ts`
  - `/app/api/transcribe/route.ts`
  - `/lib/tier3Analysis.ts`
  - `/lib/echoPrompts.ts`
  - `/lib/whisperGeneration.ts`

**Example logging code:**
```typescript
// After AI call completes
await supabase.from('ai_usage_logs').insert({
  user_id: user.id,
  ai_service: 'gpt-5',
  operation_type: 'tier3',
  model_version: 'gpt-5',
  latency_ms: telemetry.latencyMs,
  ttft_ms: telemetry.ttftMs,
  cost_usd: telemetry.costUsd,
  tokens_input: telemetry.tokensUsed.input,
  tokens_output: telemetry.tokensUsed.output,
  tokens_reasoning: telemetry.tokensUsed.reasoning,
  tokens_total: telemetry.tokensUsed.total,
  reasoning_effort: telemetry.effort,
  tier: 3,
  milestone: userStoryCount
});
```

❌ **Page View Tracking** - Track user navigation (optional)
```sql
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  page_path TEXT NOT NULL, -- '/timeline', '/book', '/prompts'
  referrer TEXT,
  session_id UUID,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);
```

---

## 🎨 UI/UX Design Recommendations

### **Dashboard Layout**

```
┌────────────────────────────────────────────────────────────┐
│  HERITAGE WHISPER ADMIN                    [User: Paul]    │
├────────────────────────────────────────────────────────────┤
│  📊 Overview  │  👥 Engagement  │  🏆 Top 10  │  💰 AI Cost │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  1,234   │  │   567    │  │   89%    │  │  $123    │  │
│  │  Users   │  │  Active  │  │  Story 3 │  │  AI Cost │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  📈 Growth Trend (Last 30 Days)                        ││
│  │  [Line chart showing daily signups]                    ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  👤 User Lifecycle Breakdown                           ││
│  │  [Bar chart: New, Activated, Engaged, Power, Super]   ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### **Key Design Principles**

1. **5-Second Rule**: Most important metrics visible within 5 seconds of landing
2. **Progressive Disclosure**: Overview → Details → Deep-dive (3 levels max)
3. **Color Coding**: Green (good), Red (bad), Amber (warning), Gray (neutral)
4. **Consistent Icons**: Same icon for same metric across all dashboards
5. **Mobile-Friendly**: Responsive design for on-the-go monitoring
6. **Export Options**: CSV/PDF export for every table/chart
7. **Date Range Picker**: Global filter (7d, 30d, 90d, All-time, Custom)

### **Color Palette**

- **Primary:** Heritage Brown (#8B4513)
- **Success:** Green (#10B981)
- **Warning:** Amber (#F59E0B)
- **Danger:** Red (#EF4444)
- **Info:** Blue (#3B82F6)
- **Neutral:** Gray (#6B7280)

---

## 🔒 Security & Access Control

### **Admin Roles**

| Role | Permissions |
|------|------------|
| **Super Admin** | Full access to all dashboards and customer service tools |
| **Analytics Viewer** | Read-only access to dashboards (no customer data) |
| **Customer Support** | User search + customer service tools only |
| **Developer** | API usage logs + AI cost dashboard only |

### **Audit Logging**

Log all admin actions:
- Who accessed which dashboard (timestamp)
- Who searched for which user (timestamp)
- Who performed which action (delete account, refund, etc.)

### **Data Privacy**

- **PII Masking**: Email addresses partially masked (j***@email.com) unless explicitly revealed
- **GDPR Compliance**: Clear "Export User Data" and "Delete Account" buttons
- **Access Logs**: Track who accessed sensitive user data

---

## 📊 Sample Dashboard Queries

### **Daily Active Users (DAU) - Last 30 Days**

```sql
SELECT
  DATE(created_at) as activity_date,
  COUNT(DISTINCT user_id) as dau
FROM stories
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY activity_date;
```

### **Monthly Active Users (MAU)**

```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(DISTINCT user_id) as mau
FROM stories
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### **Story 3 Conversion Rate (Paywall)**

```sql
SELECT
  COUNT(CASE WHEN story_count >= 1 THEN 1 END) as users_with_1_story,
  COUNT(CASE WHEN story_count >= 3 THEN 1 END) as users_past_paywall,
  ROUND(100.0 * COUNT(CASE WHEN story_count >= 3 THEN 1 END) /
    NULLIF(COUNT(CASE WHEN story_count >= 1 THEN 1 END), 0), 2) as conversion_rate
FROM users;
```

### **Average Time Between Stories**

```sql
WITH story_intervals AS (
  SELECT
    user_id,
    created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as interval
  FROM stories
)
SELECT
  AVG(EXTRACT(EPOCH FROM interval) / 86400) as avg_days_between_stories,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM interval) / 86400) as median_days
FROM story_intervals
WHERE interval IS NOT NULL;
```

### **Prompt Quality Score by Tier**

```sql
SELECT
  tier,
  AVG(prompt_score) as avg_quality_score,
  COUNT(*) as total_prompts,
  COUNT(CASE WHEN prompt_score >= 70 THEN 1 END) as high_quality_prompts,
  ROUND(100.0 * COUNT(CASE WHEN prompt_score >= 70 THEN 1 END) / COUNT(*), 2) as high_quality_rate
FROM prompt_history
WHERE prompt_score IS NOT NULL
GROUP BY tier
ORDER BY tier;
```

---

## ✅ Success Criteria

**How will you know the dashboard is successful?**

1. **Time Savings**: Admins can answer "How many active users?" in <10 seconds
2. **Data-Driven Decisions**: 80% of product decisions reference dashboard metrics
3. **Proactive Alerts**: Catch issues before users complain (e.g., AI cost spike)
4. **Customer Service**: Support team resolves 50% more tickets with user context
5. **Growth Tracking**: Weekly review of funnel metrics → actionable experiments

---

## 🚀 Next Steps

1. **Review & Approve** this plan
2. **Phase 1 Build**: Executive Overview + Top 10 Leaderboard (1 week)
3. **Phase 2 Build**: Conversion Funnel (1 week)
4. **Phase 3 Build**: AI Cost + Family Sharing (1 week)
5. **Iterate**: Add new metrics based on actual usage

---

**Questions? Feedback?**
This is a living document. Update as needs evolve.

---

*Last updated: October 17, 2025*
