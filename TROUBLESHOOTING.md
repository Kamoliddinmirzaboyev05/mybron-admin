# 🔧 Troubleshooting Guide

Common issues and their solutions for the Sports Pitch Management Admin Panel.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Authentication Issues](#authentication-issues)
3. [Database Issues](#database-issues)
4. [Real-time Issues](#real-time-issues)
5. [UI Issues](#ui-issues)
6. [Deployment Issues](#deployment-issues)

---

## Setup Issues

### ❌ "Missing Supabase environment variables" in console

**Problem:** App shows error about missing environment variables.

**Solutions:**

1. **Create `.env` file** in the root directory (next to `package.json`):
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Restart dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **Verify variable names** are exactly:
   - `VITE_SUPABASE_URL` (not REACT_APP or NEXT_PUBLIC)
   - `VITE_SUPABASE_ANON_KEY`

4. **Check for typos** in the `.env` file (no quotes needed)

---

### ❌ npm install fails

**Problem:** Error during `npm install`

**Solutions:**

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use Node 18 or higher**:
   ```bash
   node --version  # Should be 18.x or higher
   ```

3. **Try with different package manager**:
   ```bash
   # Using pnpm
   pnpm install
   
   # Using yarn
   yarn install
   ```

---

## Authentication Issues

### ❌ "Invalid login credentials" error

**Problem:** Can't log in even with correct credentials.

**Solutions:**

1. **Email not confirmed**: In Supabase Dashboard:
   - Go to Authentication → Users
   - Find your user
   - Click the three dots → Confirm email

2. **Check Supabase Auth is enabled**:
   - Go to Authentication → Settings
   - Ensure Email Auth is enabled

3. **Password requirements**:
   - Minimum 6 characters
   - Check for extra spaces in email/password

---

### ❌ Registration doesn't work / No confirmation email

**Problem:** Can't register new users or not receiving confirmation email.

**Solutions:**

1. **Email confirmation not set up** (Expected for development):
   - This is normal - Supabase free tier doesn't send emails by default
   - Manual workaround: Go to Supabase Dashboard → Authentication → Users
   - Find the user and manually click "Confirm email"

2. **Auto-confirm users** (Development only):
   ```sql
   -- Run this in Supabase SQL Editor for testing only
   UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
   ```

3. **Configure email provider** (For production):
   - Go to Authentication → Email Templates
   - Set up SMTP settings or use Supabase's email service

---

### ❌ User immediately logged out after login

**Problem:** After successful login, immediately redirected to login page.

**Solutions:**

1. **Check browser cookies** are enabled
2. **Clear browser cache** and try again
3. **Verify Supabase JWT settings**:
   - Go to Settings → API
   - Check JWT expiry time (default 3600 seconds is fine)

---

## Database Issues

### ❌ "relation pitches does not exist" error

**Problem:** Database tables not created.

**Solution:**

1. **Run the schema file**:
   - Open Supabase → SQL Editor
   - Copy entire `schema.sql` contents
   - Paste and click "Run"

2. **Verify tables exist**:
   - Go to Database → Tables
   - You should see `pitches` and `bookings`

---

### ❌ "new row violates row-level security policy" error

**Problem:** Can't insert/update data even when logged in.

**Solutions:**

1. **Verify RLS policies are set**:
   ```sql
   -- Run in Supabase SQL Editor to check
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('pitches', 'bookings');
   ```

2. **Re-run the RLS policies section** from `schema.sql`

3. **Temporarily disable RLS** (for debugging only):
   ```sql
   ALTER TABLE pitches DISABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
   ```
   
   **⚠️ Warning:** Re-enable RLS before going to production!

---

### ❌ No sample pitches showing

**Problem:** Pitch list is empty.

**Solutions:**

1. **Insert sample data**:
   ```sql
   INSERT INTO pitches (name, price, address, working_hours_start, working_hours_end)
   VALUES 
     ('Pitch A', 50000, 'Tashkent, Yunusabad district', '08:00:00', '23:00:00'),
     ('Pitch B', 60000, 'Tashkent, Chilonzor district', '08:00:00', '23:00:00');
   ```

2. **Check if data exists**:
   ```sql
   SELECT * FROM pitches;
   ```

3. **Verify you're logged in** (only authenticated users can see data)

---

### ❌ "foreign key violation" when creating booking

**Problem:** Can't create bookings.

**Solutions:**

1. **Ensure pitch exists**:
   ```sql
   SELECT id, name FROM pitches;
   ```

2. **Use correct pitch_id** (must be a valid UUID from pitches table)

3. **Check the pitch wasn't deleted**

---

## Real-time Issues

### ❌ Dashboard doesn't auto-update when new booking created

**Problem:** Real-time subscriptions not working.

**Solutions:**

1. **Enable Realtime in Supabase**:
   - Go to Database → Replication
   - Find `bookings` table
   - Toggle to **ON**

2. **Verify the publication**:
   ```sql
   -- Check if bookings is in the publication
   SELECT * FROM pg_publication_tables WHERE tablename = 'bookings';
   ```

3. **Add bookings to publication** (if missing):
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
   ```

4. **Check browser console** for WebSocket errors

5. **Refresh the page** and check Network tab for WebSocket connection

---

### ❌ "subscription is not active" error

**Problem:** Real-time channel not subscribing.

**Solutions:**

1. **Check Supabase project status** (not paused)
2. **Verify network connection**
3. **Re-subscribe** by refreshing the page
4. **Check Supabase limits** (free tier has connection limits)

---

## UI Issues

### ❌ White screen / App not loading

**Problem:** Blank page after build.

**Solutions:**

1. **Check browser console** for errors (F12 → Console)

2. **Common errors and fixes**:
   - "Failed to fetch": Check Supabase URL is correct
   - "Module not found": Run `npm install`
   - "Unexpected token": Clear browser cache

3. **Try in incognito mode** to rule out browser extensions

4. **Rebuild the app**:
   ```bash
   rm -rf dist
   npm run build
   npm run preview
   ```

---

### ❌ Bottom navigation not showing

**Problem:** Navigation bar missing.

**Solutions:**

1. **Check you're on the main app** (not login/register page)
2. **Verify you're logged in**
3. **Check CSS is loading** (F12 → Network → filter for CSS)
4. **Try different browser**

---

### ❌ Time slots not showing in booking modal

**Problem:** Empty time slot sheet.

**Solutions:**

1. **Check pitch has working hours set**:
   ```sql
   SELECT name, working_hours_start, working_hours_end FROM pitches;
   ```

2. **Verify working hours are valid** (start < end)

3. **Check browser console** for errors

4. **Try a different date** (today might be fully booked)

---

### ❌ Dark mode not applied

**Problem:** App showing light theme.

**Solutions:**

1. **Check `index.css`** contains:
   ```css
   html {
     @apply dark;
   }
   ```

2. **Clear browser cache** (Ctrl+Shift+Delete)

3. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)

---

## Deployment Issues

### ❌ Build fails in Vercel/Netlify

**Problem:** Deployment build fails.

**Solutions:**

1. **Environment variables not set**:
   - Go to project settings on Vercel/Netlify
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Redeploy

2. **Check build logs** for specific error

3. **Test build locally first**:
   ```bash
   npm run build
   ```

4. **Node version mismatch**:
   - Create `.nvmrc` file with: `18`
   - Or set in Vercel/Netlify settings

---

### ❌ Deployed app shows "Not Found" on refresh

**Problem:** 404 error when refreshing on routes like `/register`.

**Solutions:**

**For Vercel:**
Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**For Netlify:**
Create `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### ❌ Environment variables not working in production

**Problem:** "Missing Supabase environment variables" in deployed app.

**Solutions:**

1. **Verify variables are set in hosting platform** (not just locally)

2. **Variable names must start with `VITE_`**:
   - ✅ `VITE_SUPABASE_URL`
   - ❌ `SUPABASE_URL`
   - ❌ `REACT_APP_SUPABASE_URL`

3. **Redeploy after adding variables**:
   - Some platforms need a new deployment to pick up env vars

4. **Check build logs** show the variables (values will be hidden)

---

## Performance Issues

### ❌ App is slow / laggy

**Problem:** Poor performance.

**Solutions:**

1. **Check Supabase plan limits** (free tier has restrictions)

2. **Optimize queries**:
   - Don't fetch all bookings if you only need today's
   - Use `.select('specific, fields')` instead of `.select('*')`

3. **Add pagination** for large datasets

4. **Check browser console** for errors

5. **Monitor Supabase dashboard** for slow queries

---

### ❌ Too many Supabase requests

**Problem:** Hitting rate limits.

**Solutions:**

1. **Implement caching** for pitch data (changes infrequently)

2. **Debounce real-time subscriptions**

3. **Batch requests** when possible

4. **Consider upgrading** Supabase plan if needed

---

## Data Issues

### ❌ Booking shows wrong time zone

**Problem:** Times are off by several hours.

**Solutions:**

1. **Supabase stores times in UTC** - this is correct

2. **Convert to local time in display**:
   ```typescript
   import { format } from 'date-fns';
   
   // This automatically converts to browser's timezone
   format(new Date(booking.start_time), 'HH:mm')
   ```

3. **When creating bookings**, ensure you're sending UTC:
   ```typescript
   const startTime = new Date(selectedDate);
   startTime.toISOString(); // This is UTC
   ```

---

### ❌ Can't delete bookings

**Problem:** Delete operation fails.

**Solutions:**

1. **Check RLS policy allows DELETE**:
   ```sql
   -- Should exist
   SELECT * FROM pg_policies 
   WHERE tablename = 'bookings' AND cmd = 'DELETE';
   ```

2. **Verify you're authenticated**

3. **Check if booking is referenced** elsewhere (shouldn't be in this schema)

---

## Still Having Issues?

### Getting Help

1. **Check browser console** (F12 → Console tab) for error messages
2. **Check Supabase logs** (Dashboard → Logs)
3. **Enable verbose logging**:
   ```typescript
   // In supabase.ts
   export const supabase = createClient(url, key, {
     auth: {
       debug: true
     }
   });
   ```

4. **Create a minimal reproduction** of the issue

5. **Search existing issues**:
   - [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
   - [Vite Issues](https://github.com/vitejs/vite/issues)

---

## Quick Checklist for Common Problems

Before reporting an issue, verify:

- [ ] `.env` file exists with correct variable names
- [ ] Dev server was restarted after creating `.env`
- [ ] `schema.sql` was run in Supabase SQL Editor
- [ ] Realtime is enabled for `bookings` table
- [ ] RLS policies are active on both tables
- [ ] At least one pitch exists in database
- [ ] User email is confirmed in Supabase
- [ ] Browser console shows no errors
- [ ] Using supported browser (Chrome, Firefox, Safari, Edge)
- [ ] Node.js version 18 or higher

---

If you've gone through this guide and still have issues, check the main `README.md` or refer to the official documentation for:
- [Supabase](https://supabase.com/docs)
- [Vite](https://vitejs.dev)
- [React](https://react.dev)
