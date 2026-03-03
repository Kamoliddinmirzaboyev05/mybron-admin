# Booking Actions Implementation - Confirm & Cancel

## Overview

Admin Dashboard ga bronlarni tasdiqlash va bekor qilish funksiyalari qo'shildi.

## Features

### 1. Pending Bookings Actions

**Kutilayotgan so'rovlar** section da har bir bron uchun:
- ✅ **Tasdiqlash** (Yashil tugma) - Status ni 'confirmed' ga o'zgartiradi
- ✅ **Rad etish** (Qizil tugma) - Status ni 'rejected' ga o'zgartiradi

### 2. Confirmed Bookings Actions

**Yaqinlashib kelayotgan bronlar** section da har bir bron uchun:
- ✅ **Bekor qilish** (Qizil tugma) - Status ni 'cancelled' ga o'zgartiradi
- ✅ Confirmation dialog - "Bronni bekor qilmoqchimisiz?"

### 3. Real-time Updates

- ✅ Realtime subscription orqali avtomatik yangilanish
- ✅ Status o'zgarganda statistika avtomatik yangilanadi
- ✅ User app ham real-time da yangilanadi

### 4. Stats Refresh

- ✅ Bron tasdiqlanganda "Bugungi daromad" yangilanadi
- ✅ "Band qilingan soatlar" avtomatik yangilanadi
- ✅ Bekor qilinganda statistika kamayadi

## Implementation

### 1. handleApprove Function

```typescript
const handleApprove = async (bookingId: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (error) throw error;
    
    // Refresh bookings to update stats and list
    await fetchBookings();
  } catch (error) {
    console.error('Error approving booking:', error);
    alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring');
  }
};
```

**Flow:**
1. Update status to 'confirmed'
2. Refresh bookings list
3. Stats automatically recalculate
4. UI updates

### 2. handleReject Function

```typescript
const handleReject = async (bookingId: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);

    if (error) throw error;
    
    // Refresh bookings to update stats and list
    await fetchBookings();
  } catch (error) {
    console.error('Error rejecting booking:', error);
    alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring');
  }
};
```

**Flow:**
1. Update status to 'rejected'
2. Refresh bookings list
3. Booking moves to rejected filter
4. Stats don't include rejected bookings

### 3. handleCancel Function

```typescript
const handleCancel = async (bookingId: string) => {
  // Confirm before canceling
  if (!confirm('Bronni bekor qilmoqchimisiz?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;
    
    // Refresh bookings to update stats and list
    await fetchBookings();
  } catch (error) {
    console.error('Error canceling booking:', error);
    alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring');
  }
};
```

**Flow:**
1. Show confirmation dialog
2. If confirmed, update status to 'cancelled'
3. Refresh bookings list
4. Stats automatically update (cancelled bookings excluded)

## UI Components

### Pending Bookings Card

```typescript
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
  {/* Header */}
  <div className="flex items-start justify-between mb-3">
    <div>
      <p className="text-white font-medium mb-1">{booking.full_name}</p>
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <Phone className="w-3.5 h-3.5" />
        <span>{booking.phone}</span>
      </div>
    </div>
    <span className="bg-yellow-950 text-yellow-400 text-xs px-2 py-1 rounded">
      Pending
    </span>
  </div>
  
  {/* Details */}
  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
    <div className="flex items-center gap-1.5">
      <MapPin className="w-3.5 h-3.5" />
      <span>{booking.pitches?.name}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5" />
      <span>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</span>
    </div>
  </div>

  {/* Actions */}
  <div className="flex gap-2">
    <button
      onClick={() => handleApprove(booking.id)}
      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
    >
      <Check className="w-4 h-4" />
      Tasdiqlash
    </button>
    <button
      onClick={() => handleReject(booking.id)}
      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
    >
      <X className="w-4 h-4" />
      Rad etish
    </button>
  </div>
</div>
```

### Confirmed Bookings Card

```typescript
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
  {/* Header */}
  <div className="flex items-start justify-between mb-2">
    <div>
      <p className="text-white font-medium mb-1">{booking.full_name}</p>
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <Phone className="w-3.5 h-3.5" />
        <span>{booking.phone}</span>
      </div>
    </div>
    <span className="bg-green-950 text-green-400 text-xs px-2 py-1 rounded">
      Tasdiqlangan
    </span>
  </div>
  
  {/* Details */}
  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
    <div className="flex items-center gap-1.5">
      <MapPin className="w-3.5 h-3.5" />
      <span>{booking.pitches?.name}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5" />
      <span>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</span>
    </div>
  </div>

  {/* Cancel Button */}
  <button
    onClick={() => handleCancel(booking.id)}
    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
  >
    <X className="w-4 h-4" />
    Bekor qilish
  </button>
</div>
```

## Database Schema

### Status Values

```sql
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'rejected', 'manual', 'cancelled'));
```

**Status Types:**
- `pending` - Kutilmoqda (user tomonidan yaratilgan)
- `confirmed` - Tasdiqlangan (admin tomonidan tasdiqlangan)
- `manual` - Qo'lda (admin tomonidan yaratilgan)
- `rejected` - Rad etilgan (admin tomonidan rad etilgan)
- `cancelled` - Bekor qilingan (admin tomonidan bekor qilingan)

## Real-time Updates

### Subscription Setup

```typescript
const subscribeToBookings = () => {
  const channel = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      () => {
        console.log('Booking changed, refreshing data...');
        fetchBookings();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

**Events:**
- `INSERT` - Yangi bron yaratilganda
- `UPDATE` - Status o'zgarganda
- `DELETE` - Bron o'chirilganda

### Stats Recalculation

```typescript
const fetchBookings = async () => {
  // ... fetch bookings
  
  // Calculate statistics
  const todayBookings = (data || []).filter(
    (b) => b.status === 'confirmed' || b.status === 'manual'
  );
  
  // Revenue
  const revenue = todayBookings.reduce((sum, booking) => {
    return sum + (booking.total_price || 0);
  }, 0);
  
  // Hours
  const hours = todayBookings.reduce((sum, booking) => {
    const duration = calculateBookingDuration(booking.start_time, booking.end_time);
    return sum + duration;
  }, 0);
  
  setTodayRevenue(revenue);
  setHoursBookedToday(hours);
};
```

**Note:** Faqat 'confirmed' va 'manual' statusdagi bronlar statistikaga kiritiladi.

## User Experience

### Admin Flow

1. **Pending Request Keladi:**
   - Admin dashboard da "Kutilayotgan so'rovlar" section da ko'rinadi
   - Yellow badge bilan belgilanadi

2. **Admin Tasdiqlaydi:**
   - "Tasdiqlash" tugmasini bosadi
   - Status 'confirmed' ga o'zgaradi
   - Bron "Yaqinlashib kelayotgan bronlar" ga ko'chadi
   - Statistika avtomatik yangilanadi

3. **Admin Bekor Qiladi:**
   - "Bekor qilish" tugmasini bosadi
   - Confirmation dialog ko'rinadi
   - Tasdiqlangandan keyin status 'cancelled' ga o'zgaradi
   - Bron ro'yxatdan yo'qoladi
   - Statistika avtomatik yangilanadi

### User Flow (Real-time)

1. **User Bron Yaratadi:**
   - Status: 'pending'
   - User app da "Kutilmoqda" ko'rinadi

2. **Admin Tasdiqlaydi:**
   - Status: 'confirmed'
   - User app real-time da yangilanadi
   - "Bron tasdiqlandi" ko'rinadi

3. **Admin Bekor Qiladi:**
   - Status: 'cancelled'
   - User app real-time da yangilanadi
   - "Bron bekor qilindi" ko'rinadi

## Error Handling

### Network Errors

```typescript
try {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);

  if (error) throw error;
  
  await fetchBookings();
} catch (error) {
  console.error('Error approving booking:', error);
  alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring');
}
```

### Confirmation Dialog

```typescript
if (!confirm('Bronni bekor qilmoqchimisiz?')) {
  return; // User cancelled
}
```

## Testing

### 1. Approve Test

```
1. Create a pending booking
2. Click "Tasdiqlash"
3. Check: Status changes to 'confirmed'
4. Check: Booking moves to upcoming section
5. Check: Stats update
```

### 2. Reject Test

```
1. Create a pending booking
2. Click "Rad etish"
3. Check: Status changes to 'rejected'
4. Check: Booking disappears from pending
5. Check: Stats don't include it
```

### 3. Cancel Test

```
1. Create a confirmed booking
2. Click "Bekor qilish"
3. Check: Confirmation dialog appears
4. Click "OK"
5. Check: Status changes to 'cancelled'
6. Check: Booking disappears
7. Check: Stats update
```

### 4. Real-time Test

```
1. Open admin dashboard in one tab
2. Open user app in another tab
3. Approve a booking in admin
4. Check: User app updates instantly
5. Check: "Bron tasdiqlandi" appears
```

## Summary

### Features
- ✅ Tasdiqlash (Approve)
- ✅ Rad etish (Reject)
- ✅ Bekor qilish (Cancel)
- ✅ Real-time updates
- ✅ Stats refresh
- ✅ Error handling
- ✅ Confirmation dialogs

### Files Changed
1. `src/app/components/DashboardPage.tsx` - Actions va UI
2. `add-cancelled-status.sql` - Database schema
3. `BOOKING_ACTIONS_IMPLEMENTATION.md` - Ushbu hujjat

### Database Migration

```bash
# Supabase SQL Editor da:
psql -f add-cancelled-status.sql
```

Endi admin bronlarni to'liq boshqarishi mumkin! 🎉
