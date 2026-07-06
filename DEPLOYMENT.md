# Frontend Deployment Guide

## Quick Setup

### 1. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then update `VITE_API_URL` based on your environment:

**For Local Development:**
```env
VITE_API_URL=http://localhost:8000/api
```

**For Production (Render Backend):**
```env
VITE_API_URL=https://cits-backend-s12z.onrender.com/api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

---

## Deployment to Vercel

### Option 1: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub: `https://github.com/jade641/CITS_frontend`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://cits-backend-s12z.onrender.com/api
   ```
6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

When prompted, add environment variable:
```
VITE_API_URL=https://cits-backend-s12z.onrender.com/api
```

---

## Deployment to Netlify

### Option 1: Via Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub: `https://github.com/jade641/CITS_frontend`
4. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://cits-backend-s12z.onrender.com/api
   ```
6. Click "Deploy site"

### Option 2: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## After Deployment

### 1. Get Your Frontend URL
After deployment, you'll get a URL like:
- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`

### 2. Update Backend Configuration

Go to [Render Dashboard](https://dashboard.render.com/) → `cits-backend` service → Environment

Add/Update these variables:
```bash
FRONTEND_URL=https://your-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app
```

**Important:** For `SANCTUM_STATEFUL_DOMAINS`, use domain only (without `https://`)

### 3. Redeploy Backend
After updating environment variables, Render will automatically redeploy the backend.

### 4. Test Login
1. Open your frontend URL
2. Try to login with existing credentials
3. Check browser console (F12) for any errors

---

## Troubleshooting

### CORS Error
**Problem:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
1. Verify `FRONTEND_URL` is set correctly in Render
2. Make sure there's no trailing slash in URL
3. Check backend logs in Render dashboard

### CSRF Token Mismatch
**Problem:** `419 CSRF token mismatch`

**Solution:**
1. Clear browser cookies
2. Verify `SANCTUM_STATEFUL_DOMAINS` in Render
3. Make sure domain doesn't include `https://`

### API Not Found (404)
**Problem:** API endpoints return 404

**Solution:**
1. Check `VITE_API_URL` in your deployment platform
2. Verify backend is running: `https://cits-backend-s12z.onrender.com/api/health`
3. Rebuild and redeploy frontend

### Session Not Persisting
**Problem:** User gets logged out immediately

**Solution:**
1. Check if cookies are being sent (Browser DevTools → Network → Cookies)
2. Verify backend session settings in Render:
   - `SESSION_SECURE_COOKIE=true`
   - `SESSION_SAME_SITE=none`
3. Make sure `withCredentials: true` is set in API client (already configured in `src/services/http.ts`)

---

## Environment Variables Reference

| Variable | Local Development | Production |
|----------|------------------|------------|
| `VITE_API_URL` | `http://localhost:8000/api` | `https://cits-backend-s12z.onrender.com/api` |

---

## Build and Test Locally

To test production build locally:

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Backend Deployment Instructions](../DEPLOYMENT_INSTRUCTIONS.md)

---

## Support

If you encounter issues:
1. Check browser console for errors (F12 → Console)
2. Check network requests (F12 → Network)
3. Verify environment variables in deployment platform
4. Check backend logs in Render dashboard
