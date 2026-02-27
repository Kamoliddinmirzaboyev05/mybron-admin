# Sports Pitch Management Admin Panel

A production-ready, mobile-first admin panel for managing football pitch bookings built with React, Tailwind CSS, and Supabase.

## 🚀 Features

### 📱 Mobile-First Design
- Responsive dark theme UI optimized for mobile devices
- Bottom navigation for easy access to all sections
- Touch-optimized interactions with bottom sheets and dropdowns

### 🎯 Core Functionality

#### 1. **Dashboard**
- Real-time statistics (Today's Revenue, Hours Booked)
- Upcoming bookings list
- Pending requests with Approve/Reject actions
- Floating Action Button for manual bookings
- Auto-updates via Supabase Realtime

#### 2. **Manual Booking Flow**
- Step-by-step booking process:
  - Select Pitch
  - Select Date (Today, Tomorrow, Day After Tomorrow)
  - Select Time Slot (1-hour slots with availability check)
  - Enter customer details
- Real-time availability checking to prevent double bookings

#### 3. **Bookings Management**
- Complete list of all bookings
- Filter by status: All, Pending, Confirmed, Rejected
- Detailed booking information with status badges

#### 4. **Pitch Settings**
- Manage pitch details (Name, Price, Address)
- Configure working hours
- Update pricing per hour

#### 5. **Profile & Settings**
- User profile management
- Dark/Light theme toggle
- Account settings
- Secure logout

### 🔐 Authentication
- Email/Password authentication via Supabase Auth
- Secure session management
- Protected routes

### ⚡ Real-time Updates
- Dashboard automatically updates when new bookings are created
- Uses Supabase Realtime subscriptions

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works fine)

### Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

### Step 2: Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once your project is ready, go to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

### Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Copy the entire contents of `schema.sql` from this project
3. Paste and run it in the SQL Editor

This will:
- Create the `pitches` and `bookings` tables
- Set up Row Level Security (RLS) policies
- Enable Realtime for the bookings table
- Insert sample pitch data

### Step 5: Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📱 Usage Guide

### First Time Setup

1. Navigate to `/register` to create an admin account
2. After registration, you'll be redirected to login
3. Login with your credentials

### Creating Bookings

**Manual Booking (Admin):**
1. Click the blue **+** button on the Dashboard
2. Select a pitch from the dropdown
3. Choose a date (Today/Tomorrow/Day After)
4. Select an available time slot
5. Enter customer name and phone number
6. Click "Band qilish" (Book)

### Managing Pending Requests

If you have a customer-facing booking system, pending requests will appear on the Dashboard. You can:
- **Approve** ✅ - Changes status to "confirmed"
- **Reject** ❌ - Changes status to "rejected"

### Managing Pitches

1. Go to the **Pitch** tab
2. Select a pitch from the dropdown
3. Edit details:
   - Pitch name
   - Hourly price
   - Address/location
   - Working hours
4. Click "Save Changes"

## 🗄️ Database Schema

### Pitches Table
```sql
- id: UUID (Primary Key)
- name: TEXT
- price: DECIMAL
- address: TEXT
- images: TEXT[] (array)
- working_hours_start: TIME
- working_hours_end: TIME
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Bookings Table
```sql
- id: UUID (Primary Key)
- pitch_id: UUID (Foreign Key → pitches)
- user_id: UUID (Foreign Key → auth.users, nullable)
- customer_name: TEXT
- customer_phone: TEXT
- start_time: TIMESTAMP
- end_time: TIMESTAMP
- status: TEXT (pending|confirmed|rejected|manual)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🎨 Tech Stack

- **Frontend:** React 18, TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Date Handling:** date-fns
- **Build Tool:** Vite

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for all operations
- Secure session management via Supabase Auth
- Environment variables for sensitive data

## 📝 Customization

### Changing the Language
The UI uses Uzbek (Latin) by default. To change to another language:
1. Search for text strings in components
2. Replace with your desired language

### Adding More Pitches
Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO pitches (name, price, address, working_hours_start, working_hours_end)
VALUES ('Pitch C', 70000, 'Your Address', '08:00:00', '23:00:00');
```

### Modifying Working Hours
Default working hours are 08:00 - 23:00. Change via:
1. Pitch Settings page in the UI, or
2. Directly in the database

## 🐛 Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env` file exists in the root directory
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart the dev server after adding environment variables

### Real-time updates not working
- Verify that Realtime is enabled in Supabase: Settings → Database → Enable Realtime
- Check that the SQL command `ALTER PUBLICATION supabase_realtime ADD TABLE bookings;` was run

### Can't create bookings
- Ensure the `pitches` table has at least one pitch
- Check browser console for errors
- Verify RLS policies are set up correctly

### Login/Registration not working
- Confirm Supabase Auth is enabled
- Check that environment variables are correct
- Look for errors in browser console and Supabase logs

## 📄 License

MIT License - feel free to use this project for your own pitch management needs!

## 🤝 Contributing

This is a prototype/demo project. Feel free to fork and customize for your specific requirements.

## 📧 Support

For issues related to:
- **Supabase:** Check [Supabase Documentation](https://supabase.com/docs)
- **React/Vite:** Check [Vite Documentation](https://vitejs.dev)
- **Tailwind CSS:** Check [Tailwind Documentation](https://tailwindcss.com)

---

Built with ❤️ for pitch management businesses
