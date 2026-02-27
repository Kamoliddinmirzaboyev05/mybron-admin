# 🚀 Quick Start Guide

Get your Sports Pitch Management Admin Panel up and running in 5 minutes!

## Step-by-Step Setup

### 1️⃣ Install Dependencies (30 seconds)

```bash
npm install
```

### 2️⃣ Create Supabase Project (2 minutes)

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Project name: `pitch-management`
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
4. Wait for project to initialize (~2 minutes)

### 3️⃣ Get Supabase Credentials (30 seconds)

1. In your Supabase project, click **Settings** (⚙️ icon in sidebar)
2. Click **API**
3. Copy:
   - **Project URL**
   - **anon/public key**

### 4️⃣ Configure Environment (30 seconds)

1. Create `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 3.

### 5️⃣ Set Up Database (1 minute)

1. In Supabase, go to **SQL Editor** (🗃️ icon in sidebar)
2. Click **New Query**
3. Open the `schema.sql` file from this project
4. Copy ALL the contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see "Success. No rows returned"

### 6️⃣ Enable Realtime (30 seconds)

In Supabase:
1. Go to **Database** → **Replication**
2. Find the `bookings` table
3. Toggle it **ON**

### 7️⃣ Run the App! (10 seconds)

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## ✅ First Steps in the App

1. **Register**: Go to http://localhost:5173/register
   - Enter your name, email, and password
   - Click "Ro'yxatdan o'tish"

2. **Login**: You'll be redirected to login
   - Enter your credentials
   - Click "Kirish"

3. **Explore**:
   - Dashboard shows today's stats
   - Click the **+** button to create a manual booking
   - Navigate using the bottom tabs

## 🎉 You're Done!

Your admin panel is now ready to manage pitch bookings!

## 🆘 Having Issues?

### Environment Variables Not Working?
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Restart the dev server after creating `.env`
- Check for typos in variable names

### Database Setup Failed?
- Make sure you copied the ENTIRE `schema.sql` file
- Check for any error messages in red
- Try running each section separately

### Can't See Sample Pitches?
Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO pitches (name, price, address, working_hours_start, working_hours_end)
VALUES 
  ('Pitch A', 50000, 'Tashkent, Yunusabad district', '08:00:00', '23:00:00'),
  ('Pitch B', 60000, 'Tashkent, Chilonzor district', '08:00:00', '23:00:00');
```

---

Need more help? Check the full `README.md` file!
