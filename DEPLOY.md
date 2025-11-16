# Deployment Guide - FitTrack Pro

## Quick Deploy to Vercel (Recommended - 2 minutes)

Vercel offers free hosting perfect for this app!

### Steps:

1. **Go to [vercel.com](https://vercel.com)**

2. **Sign up/Login** with your GitHub account

3. **Click "Add New Project"**

4. **Import your GitHub repository:**
   - Select `Sports-results-tracking` repository
   - Click "Import"

5. **Configure (auto-detected):**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Click "Deploy"**

7. **Wait 1-2 minutes** - Your app will be live!

8. **Get your URL** - Something like: `https://sports-results-tracking.vercel.app`

### After Deployment:

- Access from your phone by visiting the URL
- Every time you push to the branch, it auto-deploys
- Free SSL certificate (https)
- Free custom domain support
- Global CDN for fast loading

---

## Alternative: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

---

## Alternative: GitHub Pages

See `GITHUB_PAGES_DEPLOY.md` for instructions.

---

## Local Access (Development)

If you want to run locally on your computer:

1. Clone the repository to your machine
2. Run: `npm install`
3. Run: `npm run dev -- --host`
4. Access from phone on same WiFi using the network URL shown

---

**Recommended: Use Vercel for easiest deployment!**

Your app will be live at a public URL you can access from anywhere.
