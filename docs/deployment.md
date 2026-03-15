# ResuMinds Platinum Deployment Guide 🚀

This guide provides the complete blueprint for deploying ResuMinds as a production-ready, zero-cost portfolio showcase.

## 🏗️ 1. Infrastructure Overview
- **Frontend**: [Vercel](https://vercel.com) (Hobby tier)
- **Backend API**: [Render](https://render.com) (Free Web Service)
- **Database**: [MongoDB Atlas](https://mongodb.com/atlas) (M0 Free Tier)
- **AI Engine**: [Groq Cloud](https://console.groq.com) (Free Tier)

---

## 🌩️ 2. Backend Deployment (Render)
1. **New Web Service**: Connect your GitHub repository.
2. **Commands**:
   - Build Command: `npm install && npm --prefix server install`
   - Start Command: `npm --prefix server run start`
3. **Environment Variables**:
   ```ini
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://... (Your Atlas Connection String)
   JWT_SECRET=super_secret_production_key
   AI_PROVIDER=groq
   AI_API_KEY=gsk_... (Your Groq Key)
   AI_MODEL=llama-3.3-70b-versatile
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```

---

## 🎨 3. Frontend Deployment (Vercel)
1. **New Project**: Import your repository.
2. **Project Settings**: Vercel will auto-detect Vite.
3. **Environment Variables**:
   ```ini
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
4. **Deploy**: Hit the deploy button.

---

## 🔐 4. Enabling Social Logins (Google & GitHub)
The buttons are now high-visibility but require backend integration. To make them truly "work fine":

### GitHub Auth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a "New OAuth App".
3. **Homepage URL**: `https://your-app-name.vercel.app`
4. **Callback URL**: `https://your-backend-url.onrender.com/api/auth/github/callback`

### Google Auth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project and configure the "OAuth Consent Screen".
3. Create "OAuth 2.0 Client IDs".
4. **Authorized Redirect URIs**: `https://your-backend-url.onrender.com/api/auth/google/callback`

---

## ✅ 5. Final Checklist
- [ ] Ensure `CORS_ORIGIN` matches your Vercel URL exactly.
- [ ] Check `VITE_API_URL` has no trailing slash.
- [ ] Verify Groq API limits (Free tier is generous for 1-on-1 usage).
- [ ] **Hard Hardening**: Set `NODE_ENV=production` to disable detailed error stacks.
