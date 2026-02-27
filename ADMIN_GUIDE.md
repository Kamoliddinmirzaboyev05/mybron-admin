# 👤 Admin User Guide

Quick reference guide for using the Sports Pitch Management Admin Panel.

## 🚪 Getting Started

### First Time Login

1. **Register Your Account**
   - Open the app (it will redirect to `/register`)
   - Enter your name
   - Enter your email address
   - Create a password (minimum 6 characters)
   - Click "Ro'yxatdan o'tish" (Register)

2. **Login**
   - Enter your email
   - Enter your password
   - Click "Kirish" (Login)

3. **You're In!**
   - You'll see the Dashboard
   - Bottom navigation shows 4 tabs

---

## 📱 Navigation

The app has 4 main sections accessible via the bottom navigation bar:

### 📊 Dashboard (Home)
- View today's statistics
- See pending booking requests
- Check upcoming bookings
- Create manual bookings

### 📅 Bookings
- See all bookings (past, present, future)
- Filter by status
- View detailed booking information

### ⚽ Pitch
- Manage pitch settings
- Update pricing
- Change working hours
- Edit address

### 👤 Profile
- View your account info
- Change settings
- Logout

---

## 📋 Daily Tasks

### Morning Routine

1. **Check Dashboard**
   - Review today's revenue
   - See how many hours are booked
   - Note any pending requests

2. **Review Pending Requests**
   - Look for new booking requests
   - Approve valid bookings (green button)
   - Reject invalid ones (red button)

3. **Check Schedule**
   - Review upcoming bookings for the day
   - Note customer names and times

### During the Day

**When a customer calls or walks in:**

1. Click the blue **+** button on Dashboard
2. Select the pitch they want
3. Choose the date (today/tomorrow/day after)
4. Select an available time slot
5. Enter customer name and phone number
6. Click "Band qilish" (Book)

**That's it! Booking is confirmed instantly.**

### End of Day

1. Review "Bookings" page
2. Check if all customers showed up
3. Note tomorrow's schedule

---

## 🎯 Common Tasks

### ✅ Create a Manual Booking

**Scenario:** Customer calls to book a pitch.

**Steps:**
1. Tap the **+** button (bottom-right on Dashboard)
2. **Select Pitch** from dropdown
   - Shows pitch name and price
3. **Select Date**
   - Choose: Today, Tomorrow, or Day After Tomorrow
4. **Select Time**
   - Bottom sheet opens with time slots
   - Available slots are bright, booked slots are dim
   - Tap an available slot
5. **Enter Details**
   - Customer name (e.g., "Jasur Aliyev")
   - Phone number (e.g., "+998 90 123 45 67")
6. **Book**
   - Tap blue "Band qilish" button
   - Returns to Dashboard
   - Booking appears in "Upcoming Bookings"

---

### ✅ Approve a Pending Request

**Scenario:** Customer booked online, waiting for approval.

**Steps:**
1. Go to **Dashboard**
2. Scroll to "Kutilayotgan so'rovlar" (Pending Requests)
3. Review booking details:
   - Customer name
   - Phone number
   - Pitch name
   - Time
4. **Approve:**
   - Tap green "Tasdiqlash" button
   - Booking moves to "Upcoming Bookings"
5. **Or Reject:**
   - Tap red "Rad etish" button
   - Booking is rejected

---

### ✅ Update Pitch Price

**Scenario:** You want to increase the price for Pitch A.

**Steps:**
1. Go to **Pitch** tab (bottom navigation)
2. Select "Pitch A" from dropdown
3. Change the price field (e.g., 50000 → 60000)
4. Tap "O'zgarishlarni saqlash" (Save Changes)
5. Done! New price applies to future bookings

---

### ✅ Change Working Hours

**Scenario:** You want to close earlier on weekdays.

**Steps:**
1. Go to **Pitch** tab
2. Select the pitch
3. Change "Tugashi" (End time) from 23:00 to 22:00
4. Tap "Save Changes"
5. Time slots will now only show until 22:00

---

### ✅ View All Bookings

**Steps:**
1. Go to **Bookings** tab (bottom navigation)
2. See all bookings in a list
3. **Filter by status:**
   - Tap "Hammasi" (All) to see everything
   - Tap "Kutilmoqda" (Pending) to see requests
   - Tap "Tasdiqlangan" (Confirmed) to see approved
   - Tap "Rad etilgan" (Rejected) to see declined

---

### ✅ Logout

**Steps:**
1. Go to **Profile** tab
2. Scroll down
3. Tap red "Tizimdan chiqish" (Logout) button
4. Confirm logout
5. You're signed out

---

## 💡 Tips & Tricks

### Preventing Double Bookings

The system automatically:
- ✅ Checks existing bookings
- ✅ Disables time slots that overlap
- ✅ Only shows available slots

**You can't accidentally double-book!**

### Real-time Updates

Dashboard updates automatically when:
- ✅ New booking is created
- ✅ Booking is approved/rejected
- ✅ Revenue changes
- ✅ Hours booked changes

**No need to refresh the page!**

### Quick Booking

For regular customers:
1. Remember their usual time
2. Use the same process (FAB → Select → Book)
3. Takes less than 30 seconds

### Handling Conflicts

If a customer wants a booked slot:
1. Check the time slot sheet (it will be dimmed)
2. Suggest nearby available times
3. Or call the existing customer to reschedule

---

## 📊 Understanding the Dashboard

### Today's Revenue
- **Shows:** Total money from confirmed bookings today
- **Includes:** Both manual and approved bookings
- **Updates:** Real-time as bookings are added

### Hours Booked Today
- **Shows:** Number of booking slots filled
- **Count:** Each 1-hour slot counts as 1
- **Updates:** Real-time

### Pending Requests
- **Shows:** Bookings waiting for your approval
- **Actions:** Approve (green) or Reject (red)
- **Disappears:** Once you take action

### Upcoming Bookings
- **Shows:** All confirmed bookings for today
- **Sorted:** By start time (earliest first)
- **Info:** Customer name, phone, pitch, time

---

## 🔔 Booking Statuses

### 🟡 Pending (Kutilmoqda)
- Customer requested
- Waiting for admin approval
- **Action needed:** Approve or reject

### 🟢 Confirmed (Tasdiqlangan)
- Admin approved an online booking
- Customer is coming
- **Action:** No action needed

### 🔵 Manual (Qo'lda)
- Admin created the booking
- Phone/walk-in customer
- **Action:** No action needed

### 🔴 Rejected (Rad etilgan)
- Admin declined the request
- Booking cancelled
- **Action:** None (archived)

---

## ⚠️ Important Notes

### Time Slots
- Slots are **1 hour** each
- Based on pitch working hours
- If pitch works 08:00-23:00, slots are:
  - 08:00-09:00
  - 09:00-10:00
  - 10:00-11:00
  - ... and so on

### Customer Info
- **Required:** Name and phone number
- **Keep accurate** for contact purposes
- **No validation** on phone format (enter as you prefer)

### Pricing
- Price shown is **per hour**
- Each booking is **1 hour** by default
- Total = Price × Hours

### Date Selection
- **Today:** Current day
- **Tomorrow:** Next day
- **Day After Tomorrow:** Shows actual date (e.g., "28 February")
- Can't book more than 2 days in advance (by design)

---

## 🆘 What If...

### Can't see any time slots?

**Possible reasons:**
1. All slots are booked
2. Working hours not configured
3. Wrong date selected

**Solution:**
- Try a different date
- Check Pitch settings for working hours

### Booking disappeared after approval?

**Not a problem!**
- It moved from "Pending" to "Upcoming"
- Check the "Upcoming Bookings" section
- Also visible in "Bookings" tab

### Made a mistake in customer details?

**Current solution:**
- No edit feature yet
- Delete the booking and create new one (future feature)

### Customer didn't show up?

**Current solution:**
- Note it in your records
- Booking remains confirmed (for accounting)
- Future feature: Mark as "no-show"

---

## 📞 Customer Service

When a customer calls:

### For New Booking
1. "Let me check availability for you"
2. Open app → FAB → Select pitch & date
3. Check available time slots
4. "We have slots at [times]"
5. Book their preferred time
6. "You're booked for [pitch] at [time]"
7. "Your booking confirmation is [booking ID]" (future)

### For Checking Existing Booking
1. Go to **Bookings** tab
2. Scroll or use search (future feature)
3. Confirm their time and pitch
4. "Yes, you're confirmed for [details]"

---

## 🎓 Best Practices

### DO ✅
- Check dashboard every morning
- Respond to pending requests quickly
- Keep pitch information updated
- Use clear customer names
- Include phone numbers for contact

### DON'T ❌
- Leave pending requests unattended
- Forget to confirm phone bookings
- Change working hours without notice
- Forget to logout on shared devices

---

## 🔐 Security Tips

1. **Strong Password**
   - Use at least 8 characters
   - Mix letters, numbers, symbols
   - Don't share with anyone

2. **Logout**
   - Always logout on shared computers
   - Use Profile → Logout button

3. **Keep Private**
   - Don't share your login credentials
   - This is your business data

---

## 📱 Mobile Tips

### Best on Mobile
- Hold phone in portrait mode
- Use thumb to tap bottom navigation
- Swipe up/down to scroll
- Tap time slots directly

### Landscape Mode
- Works fine too
- More screen space
- Bottom nav stays at bottom

---

## 📈 Growing Your Business

As bookings increase:

### Track Trends
- Check revenue daily
- Note peak hours
- Identify popular pitches

### Optimize Pricing
- Raise prices for peak times (manually)
- Offer discounts for off-peak (manually)

### Customer Data
- Keep track of repeat customers
- Build a customer database (future feature)

---

## 🎉 Success Metrics

You're doing great if:
- ✅ All pending requests handled within 1 hour
- ✅ No double bookings
- ✅ Pitch information always up to date
- ✅ Customers receive quick confirmation

---

**Need Help?** Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide!

**Happy Managing!** ⚽🎉
