# Deployment Guide

This guide provides step-by-step instructions for deploying RoomX to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [1. GitHub Repository Setup](#1-github-repository-setup)
- [2. Supabase Project Creation](#2-supabase-project-creation)
- [3. Run Database Migrations](#3-run-database-migrations)
- [4. Configure Storage Buckets](#4-configure-storage-buckets)
- [5. Railway Deployment (Backend)](#5-railway-deployment-backend)
- [6. Vercel Deployment (Frontend)](#6-vercel-deployment-frontend)
- [7. Environment Variables](#7-environment-variables)
- [8. CORS Configuration](#8-cors-configuration)
- [9. Custom Domain Setup](#9-custom-domain-setup)
- [10. Verification Steps](#10-verification-steps)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (free tier available)
- [ ] Railway account ($5 free credit monthly)
- [ ] Supabase account (free tier available)
- [ ] Node.js 20+ installed locally
- [ ] pnpm 9+ installed locally

---

## 1. GitHub Repository Setup

### Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Enter repository name: `roomx`
3. Choose visibility (public or private)
4. **Do not** initialize with README (we have our own)
5. Click "Create repository"

### Push Code

```bash
# Clone your new repository
git clone https://github.com/your-username/roomx.git
cd roomx

# Add remote (if not already configured)
git remote add origin https://github.com/your-username/roomx.git

# Push to GitHub
git push -u origin main
```

---

## 2. Supabase Project Creation

### Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Organization**: Create new or select existing
   - **Project name**: `roomx-production`
   - **Database password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be provisioned (2-3 minutes)

### Get API Keys

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL` (e.g., `https://xyzcompany.supabase.co`)
   - `anon public` key
   - `service_role` key (keep secret!)

### Get Database Connection

1. Go to **Settings** → **Database**
2. Copy the **Connection string** → **URI**
3. Replace `[YOUR-PASSWORD]` with your database password

---

## 3. Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database migrations
supabase db push
```

### Option B: Manual SQL Execution

1. Go to Supabase Dashboard → **SQL Editor**
2. Create a new query
3. Paste the contents of `packages/shared/migrations/001_initial.sql`
4. Click "Run"
5. Repeat for any additional migration files

### Verify Tables

Go to **Table Editor** and verify these tables exist:

- [ ] `users`
- [ ] `rooms`
- [ ] `room_participants`
- [ ] `messages`
- [ ] `shared_documents`

---

## 4. Configure Storage Buckets

### Create Buckets

1. Go to Supabase Dashboard → **Storage**
2. Create the following buckets:

| Bucket Name | Public | File Size Limit |
|-------------|--------|-----------------|
| `avatars` | Yes | 2MB |
| `room-files` | No | 10MB |
| `screenshots` | No | 5MB |

### Configure Policies

For each bucket, add the following policies:

#### Avatars Bucket

```sql
-- Allow public read
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own avatars
CREATE POLICY "Update Own Avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Room Files Bucket

```sql
-- Allow room members to read
CREATE POLICY "Room Members Read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'room-files'
    AND EXISTS (
      SELECT 1 FROM room_participants
      WHERE user_id = auth.uid()
      AND room_id::text = (storage.foldername(name))[1]
    )
  );

-- Allow authenticated uploads to room folders
CREATE POLICY "Room Members Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'room-files'
    AND auth.role() = 'authenticated'
  );
```

#### Screenshots Bucket

```sql
-- Allow room members to read
CREATE POLICY "Room Members Read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'screenshots'
    AND EXISTS (
      SELECT 1 FROM room_participants
      WHERE user_id = auth.uid()
      AND room_id::text = (storage.foldername(name))[1]
    )
  );

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'screenshots'
    AND auth.role() = 'authenticated'
  );
```

---

## 5. Railway Deployment (Backend)

### Create Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select the `roomx` repository
6. Railway will detect the Dockerfile in `apps/server/`

### Configure Service

1. Click on the service
2. Go to **Settings**
3. Under "Build", set:
   - **Dockerfile Path**: `apps/server/Dockerfile`
4. Under "Deploy", set:
   - **Start Command**: `node dist/index.js`

### Set Environment Variables

Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `JWT_SECRET` | Generate a secure random string |
| `FRONTEND_URL` | Your Vercel deployment URL |
| `ALLOWED_ORIGINS` | Your Vercel deployment URL |

### Generate JWT Secret

```bash
# Run in terminal
openssl rand -base64 32
```

### Deploy

1. Click "Deploy" or push to main branch
2. Railway will build and deploy automatically
3. Note the deployment URL (e.g., `roomx-production.up.railway.app`)

---

## 6. Vercel Deployment (Frontend)

### Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import the `roomx` repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm --filter @roomx/web build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && pnpm install`

### Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_URL` | Your Railway backend URL |
| `VITE_WS_URL` | Your Railway backend URL |

### Deploy

1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Note the deployment URL (e.g., `roomx.vercel.app`)

---

## 7. Environment Variables

### Complete Reference

#### Frontend (Vercel)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_WS_URL` | Backend WebSocket URL | Yes |

#### Backend (Railway)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | Yes |

---

## 8. CORS Configuration

### Backend CORS Setup

Update your Railway environment variables:

```
ALLOWED_ORIGINS=https://roomx.vercel.app,https://roomx-your-team.vercel.app
FRONTEND_URL=https://roomx.vercel.app
```

### Supabase CORS Setup

1. Go to Supabase Dashboard → **Settings** → **API**
2. Under "Additional Config", add your frontend URL to:
   - **URI Allow List**: `https://roomx.vercel.app`

---

## 9. Custom Domain Setup

### Vercel (Frontend)

1. Go to Vercel project → **Settings** → **Domains**
2. Enter your custom domain (e.g., `roomx.app`)
3. Add DNS records as instructed:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL certificate to be provisioned

### Railway (Backend)

1. Go to Railway project → **Settings** → **Networking**
2. Click "Custom Domain"
3. Enter your API domain (e.g., `api.roomx.app`)
4. Add DNS records as instructed:
   ```
   Type: CNAME
   Name: api
   Value: your-service.up.railway.app
   ```

### Update Environment Variables

After setting up custom domains, update:

- **Vercel**: `VITE_API_URL=https://api.roomx.app`
- **Railway**: `FRONTEND_URL=https://roomx.app`

---

## 10. Verification Steps

### Backend Health Check

```bash
# Test API endpoint
curl https://your-backend.up.railway.app/api/health

# Expected response:
{"status": "ok", "timestamp": "2025-01-01T00:00:00.000Z"}
```

### Frontend Check

1. Open your Vercel URL in browser
2. Verify the landing page loads
3. Test registration/login flow
4. Create a test room
5. Verify real-time features work

### WebSocket Check

1. Open browser DevTools → Network → WS
2. Connect to a room
3. Verify WebSocket connection is established
4. Send a test message
5. Verify message appears in real-time

### Database Check

1. Go to Supabase Dashboard → Table Editor
2. Verify new users appear in `users` table
3. Verify rooms appear in `rooms` table
4. Verify participants in `room_participants` table

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Verify `ALLOWED_ORIGINS` matches frontend URL |
| WebSocket connection failed | Check `SUPABASE_URL` and authentication |
| Build fails on Railway | Check Dockerfile path and build logs |
| Environment variables not loading | Verify variable names (VITE_ prefix for frontend) |

### Check Logs

**Railway:**
1. Go to service → **Deployments**
2. Click latest deployment
3. View **Build Logs** and **Deploy Logs**

**Vercel:**
1. Go to project → **Deployments**
2. Click latest deployment
3. View **Function Logs**

---

## Next Steps

After successful deployment:

- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure analytics (Plausible, PostHog)
- [ ] Set up automated backups
- [ ] Configure CDN for assets
- [ ] Set up CI/CD branch previews
- [ ] Add custom error pages
- [ ] Configure email templates in Supabase
