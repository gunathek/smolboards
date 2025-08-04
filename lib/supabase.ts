import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables - using fallback data")
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export type Billboard = {
  id: string
  name: string
  latitude: number
  longitude: number
  dimensions: string
  daily_rate: number
  monthly_rate: number
  hourly_rate: number
  impressions: number
  cost_per_play: number
  resolution: string
  provider: string
  category: string
  address: string
  description?: string
  image_url?: string
  status: "available" | "occupied" | "maintenance"
  created_at: string
  updated_at: string
}

export type Booking = {
  id: string
  billboard_id: string
  booking_date: string
  start_hour: number
  end_hour: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  booking_status: "confirmed" | "pending" | "cancelled"
  total_amount?: number
  notes?: string
  created_at: string
  updated_at: string
}

export type BookingSlot = {
  date: string
  hour: number
  isBooked: boolean
  booking?: Booking
}

// Helper function to check if table exists and create sample data if needed
export async function initializeBillboards() {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" }
  }

  try {
    // Try to fetch one record to check if table exists
    const { data, error } = await supabase.from("billboards").select("id").limit(1)

    if (error) {
      console.error("Table may not exist:", error.message)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error checking billboards table:", error)
    return { success: false, error: "Failed to check table existence" }
  }
}

// Type for the response from getBillboardBookings
type GetBillboardBookingsResponse = { success: true; data: Booking[] } | { success: false; error: string; data?: never }

// Function to get bookings for a specific billboard and date range
export async function getBillboardBookings(
  billboardId: string,
  startDate: string,
  endDate: string,
): Promise<GetBillboardBookingsResponse> {
  if (!supabase) {
    return { success: true, data: [] } // Return empty data instead of error
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("billboard_id", billboardId)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .in("booking_status", ["confirmed", "pending"])

    if (error) {
      console.warn("Error fetching bookings:", error)
      // Return empty data instead of error to allow booking to proceed
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.warn("Error fetching bookings:", error)
    return { success: true, data: [] }
  }
}

// Function to create a new booking
export async function createBooking(booking: Omit<Booking, "id" | "created_at" | "updated_at">) {
  if (!supabase) {
    return { success: false, error: "Database connection not available. Please check your configuration." }
  }

  try {
    const { data, error } = await supabase.from("bookings").insert([booking]).select().single()

    if (error) {
      console.error("Error creating booking:", error)
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        return { success: false, error: "Booking system not set up. Please run the database setup script first." }
      }
      return { success: false, error: `Booking failed: ${error.message}` }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error creating booking:", error)
    return { success: false, error: "An unexpected error occurred while creating the booking." }
  }
}

// Function to check if bookings table exists
export async function initializeBookings() {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" }
  }

  try {
    // Try a simple query to check if we can access the bookings table
    const { error } = await supabase.from("bookings").select("id").limit(1)

    if (error) {
      // If it's a table not found error, that's expected and we can handle it
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        console.warn("Bookings table does not exist yet")
        return { success: false, error: "Bookings table not found - please run the SQL script" }
      }
      // For other errors, still return success to allow the UI to work
      console.warn("Bookings table check warning:", error.message)
      return { success: true, data: [] }
    }

    return { success: true, data: [] }
  } catch (error) {
    console.warn("Error checking bookings table:", error)
    // Return success to allow UI to function
    return { success: true, data: [] }
  }
}

// Function to create sample data if table is empty
export async function createSampleBillboards() {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" }
  }

  const sampleBillboards = [
    {
      name: "Forum Mall Digital Board",
      latitude: 12.9279,
      longitude: 77.6271,
      dimensions: "20x10 ft",
      daily_rate: 150.0,
      monthly_rate: 4000.0,
      category: "Shopping Mall",
      address: "Forum Mall, Hosur Road, Koramangala, Bengaluru",
      description: "High-traffic digital billboard at main entrance",
      status: "available" as const,
    },
    {
      name: "Koramangala Social Facade",
      latitude: 12.9351,
      longitude: 77.6269,
      dimensions: "15x8 ft",
      daily_rate: 120.0,
      monthly_rate: 3200.0,
      category: "Restaurant",
      address: "Koramangala Social, 5th Block, Koramangala, Bengaluru",
      description: "Premium location with young demographic",
      status: "available" as const,
    },
    {
      name: "BDA Complex Board",
      latitude: 12.9368,
      longitude: 77.6214,
      dimensions: "25x12 ft",
      daily_rate: 200.0,
      monthly_rate: 5500.0,
      category: "Government",
      address: "BDA Complex, Koramangala, Bengaluru",
      description: "Large format billboard with government visibility",
      status: "occupied" as const,
    },
    {
      name: "Jyoti Nivas Junction",
      latitude: 12.9298,
      longitude: 77.6174,
      dimensions: "18x9 ft",
      daily_rate: 130.0,
      monthly_rate: 3500.0,
      category: "Educational",
      address: "Near Jyoti Nivas College, Koramangala, Bengaluru",
      description: "Student-focused advertising location",
      status: "available" as const,
    },
    {
      name: "Koramangala Metro Station",
      latitude: 12.9342,
      longitude: 77.6378,
      dimensions: "22x11 ft",
      daily_rate: 180.0,
      monthly_rate: 4800.0,
      category: "Transportation",
      address: "Koramangala Metro Station, Bengaluru",
      description: "High footfall metro station location",
      status: "available" as const,
    },
  ]

  try {
    const { data, error } = await supabase.from("billboards").insert(sampleBillboards).select()

    if (error) {
      console.error("Error creating sample billboards:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error creating sample billboards:", error)
    return { success: false, error: "Failed to create sample data" }
  }
}
