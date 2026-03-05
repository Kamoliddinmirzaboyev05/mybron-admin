-- ============================================
-- PITCH SLOTS TABLE - Single Source of Truth
-- ============================================
-- This table stores all available time slots for each pitch
-- It acts as the single source of truth for availability

-- Create pitch_slots table
CREATE TABLE IF NOT EXISTS pitch_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate slots for same pitch, date, and time
  UNIQUE(pitch_id, slot_date, start_time, end_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pitch_slots_pitch_date 
ON pitch_slots(pitch_id, slot_date);

CREATE INDEX IF NOT EXISTS idx_pitch_slots_availability 
ON pitch_slots(pitch_id, slot_date, is_available);

-- ============================================
-- TRIGGER: Auto-sync slots with bookings
-- ============================================
-- When a booking is created/updated/deleted, update pitch_slots

-- Function to sync slots when booking changes
CREATE OR REPLACE FUNCTION trg_sync_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT or UPDATE to 'confirmed' or 'pending'
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND 
     (NEW.status IN ('confirmed', 'pending')) THEN
    
    -- Mark slot as unavailable
    UPDATE pitch_slots
    SET is_available = false,
        updated_at = NOW()
    WHERE pitch_id = NEW.pitch_id
      AND slot_date = NEW.booking_date
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time;
    
    -- If slot doesn't exist, create it
    INSERT INTO pitch_slots (pitch_id, slot_date, start_time, end_time, is_available)
    VALUES (NEW.pitch_id, NEW.booking_date, NEW.start_time, NEW.end_time, false)
    ON CONFLICT (pitch_id, slot_date, start_time, end_time) 
    DO UPDATE SET is_available = false, updated_at = NOW();
    
    RAISE NOTICE 'Slot marked as unavailable: % % - %', NEW.booking_date, NEW.start_time, NEW.end_time;
  END IF;
  
  -- Handle UPDATE to 'cancelled' or DELETE
  IF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') OR TG_OP = 'DELETE' THEN
    DECLARE
      old_pitch_id UUID;
      old_booking_date DATE;
      old_start_time TIME;
      old_end_time TIME;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        old_pitch_id := OLD.pitch_id;
        old_booking_date := OLD.booking_date;
        old_start_time := OLD.start_time;
        old_end_time := OLD.end_time;
      ELSE
        old_pitch_id := NEW.pitch_id;
        old_booking_date := NEW.booking_date;
        old_start_time := NEW.start_time;
        old_end_time := NEW.end_time;
      END IF;
      
      -- Check if any other active booking exists for this slot
      IF NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE pitch_id = old_pitch_id
          AND booking_date = old_booking_date
          AND start_time = old_start_time
          AND end_time = old_end_time
          AND status IN ('confirmed', 'pending')
          AND id != COALESCE(NEW.id, OLD.id)
      ) THEN
        -- No other booking, mark slot as available
        UPDATE pitch_slots
        SET is_available = true,
            updated_at = NOW()
        WHERE pitch_id = old_pitch_id
          AND slot_date = old_booking_date
          AND start_time = old_start_time
          AND end_time = old_end_time;
        
        RAISE NOTICE 'Slot marked as available: % % - %', old_booking_date, old_start_time, old_end_time;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_sync_slots ON bookings;
CREATE TRIGGER trigger_sync_slots
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_sync_slots();

-- ============================================
-- FUNCTION: Generate slots for a pitch
-- ============================================
-- This function generates all possible time slots for a pitch
-- based on its working hours

CREATE OR REPLACE FUNCTION generate_pitch_slots(
  p_pitch_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void AS $$
DECLARE
  current_date DATE;
  pitch_start_time TIME;
  pitch_end_time TIME;
  current_hour INTEGER;
  slot_start TIME;
  slot_end TIME;
BEGIN
  -- Get pitch working hours
  SELECT start_time, end_time INTO pitch_start_time, pitch_end_time
  FROM pitches
  WHERE id = p_pitch_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pitch not found: %', p_pitch_id;
  END IF;
  
  -- Loop through each date
  current_date := p_start_date;
  WHILE current_date <= p_end_date LOOP
    
    -- Loop through each hour
    current_hour := EXTRACT(HOUR FROM pitch_start_time);
    WHILE current_hour < EXTRACT(HOUR FROM pitch_end_time) LOOP
      
      slot_start := (current_hour || ':00:00')::TIME;
      slot_end := ((current_hour + 1) || ':00:00')::TIME;
      
      -- Insert slot if it doesn't exist
      INSERT INTO pitch_slots (pitch_id, slot_date, start_time, end_time, is_available)
      VALUES (p_pitch_id, current_date, slot_start, slot_end, true)
      ON CONFLICT (pitch_id, slot_date, start_time, end_time) DO NOTHING;
      
      current_hour := current_hour + 1;
    END LOOP;
    
    current_date := current_date + 1;
  END LOOP;
  
  RAISE NOTICE 'Generated slots for pitch % from % to %', p_pitch_id, p_start_date, p_end_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA SYNC
-- ============================================
-- Sync existing bookings to pitch_slots

DO $$
DECLARE
  booking_record RECORD;
BEGIN
  FOR booking_record IN 
    SELECT DISTINCT pitch_id, booking_date, start_time, end_time
    FROM bookings
    WHERE status IN ('confirmed', 'pending')
  LOOP
    INSERT INTO pitch_slots (pitch_id, slot_date, start_time, end_time, is_available)
    VALUES (
      booking_record.pitch_id,
      booking_record.booking_date,
      booking_record.start_time,
      booking_record.end_time,
      false
    )
    ON CONFLICT (pitch_id, slot_date, start_time, end_time) 
    DO UPDATE SET is_available = false, updated_at = NOW();
  END LOOP;
  
  RAISE NOTICE 'Synced existing bookings to pitch_slots';
END $$;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Generate slots for next 30 days
-- SELECT generate_pitch_slots(
--   'your-pitch-id-here',
--   CURRENT_DATE,
--   CURRENT_DATE + INTERVAL '30 days'
-- );

-- Example 2: Check available slots for a specific date
-- SELECT * FROM pitch_slots
-- WHERE pitch_id = 'your-pitch-id'
--   AND slot_date = '2026-03-05'
--   AND is_available = true
-- ORDER BY start_time;

-- Example 3: Get all unavailable slots
-- SELECT ps.*, b.full_name, b.phone
-- FROM pitch_slots ps
-- LEFT JOIN bookings b ON (
--   b.pitch_id = ps.pitch_id AND
--   b.booking_date = ps.slot_date AND
--   b.start_time = ps.start_time AND
--   b.end_time = ps.end_time AND
--   b.status IN ('confirmed', 'pending')
-- )
-- WHERE ps.is_available = false;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE pitch_slots IS 'Single source of truth for pitch availability. Each row represents a bookable time slot.';
COMMENT ON COLUMN pitch_slots.is_available IS 'true = slot is free, false = slot is booked';
COMMENT ON FUNCTION trg_sync_slots() IS 'Automatically syncs pitch_slots when bookings are created/updated/deleted';
COMMENT ON FUNCTION generate_pitch_slots(UUID, DATE, DATE) IS 'Generates all possible time slots for a pitch within a date range';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ pitch_slots table created successfully';
  RAISE NOTICE '✅ Trigger trg_sync_slots installed';
  RAISE NOTICE '✅ Helper function generate_pitch_slots created';
  RAISE NOTICE '📝 Run generate_pitch_slots() to create slots for your pitches';
END $$;
