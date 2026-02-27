# 🚀 Deployment Guide

This guide will help you deploy your Sports Pitch Management Admin Panel to production.

## Recommended Platforms

### Option 1: Vercel (Recommended - Easiest)

Vercel offers the easiest deployment for React apps with great performance and free SSL.

#### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Add Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Apply to all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2 minutes)
   - Your app is live! 🎉

5. **Auto-deployments**
   - Every push to `main` branch automatically deploys
   - Preview URLs for pull requests

---

### Option 2: Netlify

Similar to Vercel, great for static sites.

#### Steps:

1. **Push to GitHub** (same as Vercel)

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repo

3. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Add Environment Variables**
   - In Site settings → Environment variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Deploy**
   - Click "Deploy site"

---

### Option 3: AWS Amplify

Good if you're already using AWS.

#### Steps:

1. **Push to GitHub** (same as above)

2. **Create Amplify App**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repo

3. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Environment Variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

5. **Deploy**

---

## Production Checklist

Before deploying to production, ensure:

### ✅ Security

- [ ] Environment variables are set in hosting platform (NOT in code)
- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] Supabase Row Level Security (RLS) is enabled
- [ ] Only authenticated users can access data
- [ ] Email confirmation is enabled in Supabase Auth settings (optional)

### ✅ Supabase Configuration

- [ ] Database schema is deployed (`schema.sql` has been run)
- [ ] Realtime is enabled for `bookings` table
- [ ] RLS policies are active on all tables
- [ ] At least one pitch exists in the database

### ✅ Performance

- [ ] Build runs successfully: `npm run build`
- [ ] No console errors in production build
- [ ] Images are optimized
- [ ] Unused dependencies removed

### ✅ Functionality

- [ ] Registration works
- [ ] Login works
- [ ] Manual booking creates records
- [ ] Real-time updates work
- [ ] All 4 navigation tabs work
- [ ] Pitch settings save correctly

---

## Custom Domain Setup

### Vercel

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as shown
5. SSL is automatic!

### Netlify

1. Go to Domain settings
2. Add custom domain
3. Update DNS or use Netlify DNS
4. SSL is automatic!

---

## Environment-Specific Configurations

### Development
```env
VITE_SUPABASE_URL=your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-key
```

### Production
```env
VITE_SUPABASE_URL=your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
```

**Tip:** Use separate Supabase projects for dev and production!

---

## Monitoring & Maintenance

### Supabase Dashboard

Monitor your app through Supabase Dashboard:
- **Database**: View and manage data
- **Auth**: See active users
- **Logs**: Debug errors
- **API**: Monitor usage and performance

### Application Logs

- **Vercel**: Check "Deployments" → "Functions" logs
- **Netlify**: Check "Deploys" → Logs
- **Browser Console**: Check for frontend errors

---

## Updating Your App

1. Make changes locally
2. Test thoroughly: `npm run dev`
3. Build and test: `npm run build && npm run preview`
4. Commit changes: `git commit -am "Description of changes"`
5. Push: `git push`
6. Automatic deployment triggers!

---

## Backup Strategy

### Database Backups

Supabase automatically backs up your database. To manually export:

1. Go to Supabase Dashboard → Database
2. Click "Backups"
3. Download backup or set up automatic backups

### Code Backups

- Your code is backed up in GitHub
- Consider creating release tags: `git tag -a v1.0.0 -m "Version 1.0.0"`

---

## Troubleshooting Deployment Issues

### Build Fails

**Error: "Module not found"**
- Solution: Run `npm install` and commit `package-lock.json`

**Error: "Environment variable not found"**
- Solution: Add env vars in hosting platform settings, not in code

### App Deployed but Not Working

**White Screen**
- Check browser console for errors
- Verify environment variables are set correctly
- Check that Supabase URL doesn't have trailing slash

**Authentication Not Working**
- Verify Supabase environment variables
- Check Supabase Auth is enabled
- Add your deployment URL to Supabase "Site URL" in Auth settings

**Real-time Not Working**
- Enable Realtime in Supabase Database Replication
- Check that `bookings` table is toggled ON

---

## Scaling Considerations

When your app grows:

1. **Upgrade Supabase Plan**: Free tier has limits on connections and storage
2. **Add Caching**: Consider implementing Redis for frequently accessed data
3. **CDN**: Host images on a CDN (Cloudflare, AWS CloudFront)
4. **Database Optimization**: Add indexes for frequently queried columns
5. **Monitoring**: Use Sentry or LogRocket for error tracking

---

## Support

If you encounter deployment issues:

1. Check platform-specific documentation:
   - [Vercel Docs](https://vercel.com/docs)
   - [Netlify Docs](https://docs.netlify.com)
   - [Supabase Docs](https://supabase.com/docs)

2. Common resources:
   - [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
   - [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/)

---

**🎉 Congratulations!** Your pitch management admin panel is now live and helping you manage bookings efficiently!
