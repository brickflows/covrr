# Deployment Guide - Cartoon Trite (COVRR)

## ✅ Current Status

- **Code:** Pushed to GitHub (https://github.com/brickflows/covrr)
- **Build:** Successful ✓
- **Backend:** Railway (https://mindful-presence-production-3bfc.up.railway.app)
- **Database:** Convex (formal-chihuahua-916.convex.cloud)
- **Auth:** Clerk

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Fastest)

1. Install Vercel CLI (if not installed):
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from your project directory:
```bash
cd "C:\Users\Admin\Downloads\miro-clone-main\miro-clone-main"
vercel
```

4. Follow prompts:
   - Link to existing project or create new
   - Set up production deployment

5. Set environment variables:
```bash
vercel env add CONVEX_DEPLOYMENT
vercel env add NEXT_PUBLIC_CONVEX_URL
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_DEFAULT_ORGANIZATION_ID
vercel env add NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
vercel env add LIVEBLOCKS_SECRET_KEY
vercel env add NEXT_PUBLIC_RAILWAY_BACKEND_URL
```

6. Deploy to production:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new

2. Import Git Repository:
   - Select: `brickflows/covrr`
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (default)

3. Configure Environment Variables:
   Add these from your `.env.local`:

   ```
   NEXT_TELEMETRY_DISABLED=1
   CONVEX_DEPLOYMENT=dev:formal-chihuahua-916
   NEXT_PUBLIC_CONVEX_URL=https://formal-chihuahua-916.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhwZXJ0LWxvYnN0ZXItOTAuY2xlcmsuYWNjb3VudHMuZGV2JA
   CLERK_SECRET_KEY=sk_test_sfEsaEslBiV6rCMMfb7D1U67Ij1Z1Z7aVStdHYL4pE
   CLERK_DEFAULT_ORGANIZATION_ID=org_33ABZtqPtJHIHntHQSsStkIF5L8
   NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_WhXxVUqHNmaUD9DZI_n7Ge_cmYM8g28viBhmnU1_FznpX6pbl1XObcW_H5D-THVk
   LIVEBLOCKS_SECRET_KEY=sk_dev_zJEQn77GiFV9tmuFMC0NXbh3PgAdlL6jVYU8o-vkPDm3iujs2hHipGHWdEDXF8Og
   NEXT_PUBLIC_RAILWAY_BACKEND_URL=https://mindful-presence-production-3bfc.up.railway.app
   ```

4. Click **Deploy**

5. Wait for build (2-3 minutes)

6. Your app will be live at: `https://your-project.vercel.app`

## 🔧 Post-Deployment Setup

### 1. Update Clerk URLs

Go to Clerk Dashboard (https://dashboard.clerk.com):
- Add your Vercel domain to allowed origins
- Add to Authorized Redirect URLs:
  ```
  https://your-domain.vercel.app/*
  ```

### 2. Update Convex Deployment (Optional - for Production)

If you want a production Convex deployment:

```bash
# Create production deployment
npx convex deploy --prod

# Update Vercel env vars with new production URLs
```

### 3. Update Liveblocks (Optional)

If using production Liveblocks keys:
- Go to https://liveblocks.io/dashboard
- Create production keys
- Update Vercel environment variables

### 4. Test Railway Backend Connection

Make sure Railway backend can communicate with your Vercel frontend:
- Railway backend already deployed
- Webhook endpoint: `/api/webhooks/save-images`
- Ensure CORS is configured on Railway

## 📋 Deployment Checklist

- [x] Code committed and pushed to GitHub
- [x] Build passes locally
- [ ] Deploy to Vercel
- [ ] Add environment variables to Vercel
- [ ] Update Clerk allowed domains
- [ ] Test MidJourney image generation
- [ ] Test text styling feature
- [ ] Test collaborative editing (Liveblocks)

## 🔍 Troubleshooting

### Build Fails
- Check environment variables are set
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Auth Issues
- Verify Clerk keys are correct
- Check Clerk allowed domains include Vercel URL
- Clear cookies and try again

### Convex Connection Issues
- Verify `NEXT_PUBLIC_CONVEX_URL` is accessible
- Check Convex deployment status
- Ensure `CONVEX_DEPLOYMENT` matches your setup

### Image Generation Not Working
- Check Railway backend is running
- Verify `NEXT_PUBLIC_RAILWAY_BACKEND_URL` is correct
- Check Railway logs for errors
- Ensure webhook endpoint is accessible

## 🎉 Features to Test After Deployment

1. **Image Generation**
   - Create Message layer
   - Add prompt
   - Click Send
   - Wait for 4 generated images

2. **Text Styling**
   - Hover over generated image
   - Click "Add Text" button
   - Right panel opens
   - Add text widgets
   - Style with fonts, colors, rotation
   - Download styled image

3. **Collaboration**
   - Open board in two tabs
   - Verify real-time updates
   - Test cursors, selections

4. **Canvas Tools**
   - Create shapes, notes, text
   - Draw with pen
   - Create connections
   - Zoom in/out

## 📱 Custom Domain (Optional)

To add a custom domain:
1. Go to Vercel project settings
2. Navigate to Domains
3. Add your domain
4. Update DNS records as instructed
5. Update Clerk allowed domains

## 🔐 Production Security Checklist

- [ ] Rotate Clerk keys to production
- [ ] Use Convex production deployment
- [ ] Use Liveblocks production keys
- [ ] Set up proper CORS on Railway
- [ ] Enable Vercel authentication (optional)
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure error tracking (Sentry, etc.)

## 📊 Monitoring

After deployment, monitor:
- **Vercel Dashboard**: Build times, function logs, analytics
- **Convex Dashboard**: Database queries, function calls
- **Railway Dashboard**: Backend API calls, webhooks
- **Clerk Dashboard**: User activity, auth events

## 🚨 Emergency Rollback

If something breaks:
```bash
# Rollback to previous deployment in Vercel dashboard
# Or redeploy previous commit:
git revert HEAD
git push origin main
```

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs
- **Liveblocks Docs**: https://liveblocks.io/docs

---

**Current Deployment**: Ready to deploy! ✅
**Estimated Time**: 5-10 minutes for complete setup
