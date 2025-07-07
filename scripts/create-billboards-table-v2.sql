-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if exists (for clean recreation)
DROP TABLE IF EXISTS public.billboards;

-- Create billboards table
CREATE TABLE public.billboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  dimensions VARCHAR(50) NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  monthly_rate DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_billboards_location ON public.billboards (latitude, longitude);
CREATE INDEX idx_billboards_category ON public.billboards (category);
CREATE INDEX idx_billboards_status ON public.billboards (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to billboards" ON public.billboards
  FOR SELECT USING (true);

-- Create policy to allow insert/update for authenticated users (optional)
CREATE POLICY "Allow insert for authenticated users" ON public.billboards
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.billboards
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert sample billboard data for Koramangala area
INSERT INTO public.billboards (name, latitude, longitude, dimensions, daily_rate, monthly_rate, category, address, description, status) VALUES
('Forum Mall Digital Board', 12.9279, 77.6271, '20x10 ft', 150.00, 4000.00, 'Shopping Mall', 'Forum Mall, Hosur Road, Koramangala, Bengaluru', 'High-traffic digital billboard at main entrance', 'available'),
('Koramangala Social Facade', 12.9351, 77.6269, '15x8 ft', 120.00, 3200.00, 'Restaurant', 'Koramangala Social, 5th Block, Koramangala, Bengaluru', 'Premium location with young demographic', 'available'),
('BDA Complex Board', 12.9368, 77.6214, '25x12 ft', 200.00, 5500.00, 'Government', 'BDA Complex, Koramangala, Bengaluru', 'Large format billboard with government visibility', 'occupied'),
('Jyoti Nivas Junction', 12.9298, 77.6174, '18x9 ft', 130.00, 3500.00, 'Educational', 'Near Jyoti Nivas College, Koramangala, Bengaluru', 'Student-focused advertising location', 'available'),
('Koramangala Metro Station', 12.9342, 77.6378, '22x11 ft', 180.00, 4800.00, 'Transportation', 'Koramangala Metro Station, Bengaluru', 'High footfall metro station location', 'available'),
('Intermediate Ring Road', 12.9385, 77.6295, '30x15 ft', 250.00, 6800.00, 'Highway', 'Intermediate Ring Road, Koramangala, Bengaluru', 'Major traffic route with excellent visibility', 'maintenance'),
('Koramangala Club', 12.9325, 77.6198, '16x8 ft', 110.00, 2900.00, 'Recreation', 'Koramangala Club, 4th Block, Bengaluru', 'Upscale neighborhood location', 'available'),
('Hosur Road Junction', 12.9245, 77.6312, '28x14 ft', 220.00, 6000.00, 'Highway', 'Hosur Road Junction, Koramangala, Bengaluru', 'Major intersection with heavy traffic', 'occupied'),
('Sony World Signal', 12.9356, 77.6245, '20x10 ft', 160.00, 4200.00, 'Electronics', 'Sony World Signal, Koramangala, Bengaluru', 'Tech-savvy audience location', 'available'),
('Koramangala Industrial Layout', 12.9289, 77.6156, '24x12 ft', 140.00, 3800.00, 'Industrial', 'Industrial Layout, Koramangala, Bengaluru', 'B2B focused advertising space', 'available'),
('Wipro Corporate Office', 12.9405, 77.6289, '35x18 ft', 300.00, 8000.00, 'Corporate', 'Wipro Corporate Office, Koramangala, Bengaluru', 'Premium corporate location with high visibility', 'available'),
('Koramangala Bus Stand', 12.9334, 77.6187, '20x12 ft', 175.00, 4700.00, 'Transportation', 'Koramangala Bus Stand, Bengaluru', 'Public transport hub with diverse audience', 'available'),
('Raheja Arcade', 12.9367, 77.6278, '18x10 ft', 145.00, 3900.00, 'Shopping Complex', 'Raheja Arcade, Koramangala, Bengaluru', 'Shopping complex with premium brands', 'occupied'),
('Koramangala Police Station', 12.9312, 77.6203, '15x8 ft', 100.00, 2700.00, 'Government', 'Koramangala Police Station, Bengaluru', 'Government facility location', 'available'),
('Lifestyle Store Junction', 12.9358, 77.6251, '22x11 ft', 190.00, 5100.00, 'Retail', 'Near Lifestyle Store, Koramangala, Bengaluru', 'Fashion retail area with young shoppers', 'maintenance');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_billboards_updated_at 
    BEFORE UPDATE ON public.billboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
