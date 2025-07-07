-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.bookings CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookings table for hourly billboard reservations
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  billboard_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour INTEGER NOT NULL CHECK (end_hour >= 1 AND end_hour <= 24),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  booking_status VARCHAR(20) DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'pending', 'cancelled')),
  total_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_hour_range CHECK (end_hour > start_hour),
  CONSTRAINT fk_billboard FOREIGN KEY (billboard_id) REFERENCES public.billboards(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_billboard_date ON public.bookings (billboard_id, booking_date);
CREATE INDEX idx_bookings_date_range ON public.bookings (booking_date, start_hour, end_hour);
CREATE INDEX idx_bookings_status ON public.bookings (booking_status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Allow insert for all users" ON public.bookings;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to bookings" ON public.bookings
  FOR SELECT USING (true);

-- Create policy to allow insert for all users (for demo purposes)
CREATE POLICY "Allow insert for all users" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_bookings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookings_updated_at_column();

-- Insert sample booking data (only if billboards exist)
DO $$
DECLARE
    billboard_record RECORD;
    sample_date DATE;
    start_time INTEGER;
    end_time INTEGER;
BEGIN
    -- Check if billboards table exists and has data
    IF EXISTS (SELECT 1 FROM public.billboards LIMIT 1) THEN
        -- Insert sample bookings for existing billboards
        FOR billboard_record IN 
            SELECT id, daily_rate FROM public.billboards 
            WHERE status = 'available' 
            LIMIT 5
        LOOP
            -- Create 2-3 random bookings per billboard
            FOR i IN 1..3 LOOP
                sample_date := CURRENT_DATE + (random() * 30)::integer;
                start_time := (random() * 16)::integer + 6; -- 6 AM to 10 PM
                end_time := start_time + (random() * 4)::integer + 1; -- 1-4 hours duration
                
                -- Ensure end_time doesn't exceed 23 (11 PM)
                IF end_time > 23 THEN
                    end_time := 23;
                END IF;
                
                INSERT INTO public.bookings (
                    billboard_id, 
                    booking_date, 
                    start_hour, 
                    end_hour, 
                    customer_name, 
                    customer_email, 
                    customer_phone,
                    booking_status, 
                    total_amount,
                    notes
                ) VALUES (
                    billboard_record.id,
                    sample_date,
                    start_time,
                    end_time,
                    'Sample Customer ' || i,
                    'customer' || i || '@example.com',
                    '+91-' || (9000000000 + (random() * 999999999)::bigint)::text,
                    CASE WHEN random() > 0.8 THEN 'pending' ELSE 'confirmed' END,
                    billboard_record.daily_rate * (end_time - start_time) / 24,
                    CASE WHEN random() > 0.7 THEN 'Sample booking for testing' ELSE NULL END
                );
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Sample booking data inserted successfully';
    ELSE
        RAISE NOTICE 'No billboards found. Please create billboards first.';
    END IF;
END $$;

-- Verify table creation
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;
