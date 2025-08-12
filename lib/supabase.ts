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
  provider: string
  lat: number
  lng: number
  address?: string
  description?: string
  category?: string
  tags?: string
  dimensions?: string
  resolution?: string
  orientation: "landscape" | "portrait"
  loop_time?: number
  start_hour?: number
  end_hour?: number
  supported_media?: string
  impressions: number
  cost_per_play?: number
  hourly_rate?: number
  daily_rate?: number
  monthly_rate?: number
  image_url?: string
  status: "available" | "occupied" | "maintenance"
  showup: boolean
  created_at: string
  updated_at: string
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

// Function to create sample data if table is empty
export async function createSampleBillboards() {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" }
  }

  const sampleBillboards = [
    {
      name: "Forum Mall Digital Board",
      provider: "Digital Displays Inc",
      lat: 12.9279,
      lng: 77.6271,
      dimensions: "20x10 ft",
      daily_rate: 150.0,
      monthly_rate: 4000.0,
      hourly_rate: 25.0,
      category: "Shopping Mall",
      address: "Forum Mall, Hosur Road, Koramangala, Bengaluru",
      description: "High-traffic digital billboard at main entrance",
      orientation: "landscape" as const,
      impressions: 5000,
      cost_per_play: 0.50,
      status: "available" as const,
      showup: true,
      tags: "mall,shopping,high-traffic",
      resolution: "1920x1080",
      loop_time: 300,
      start_hour: 8,
      end_hour: 22,
      supported_media: "video,image",
    },
    {
      name: "Koramangala Social Facade",
      provider: "Urban Media Solutions",
      lat: 12.9351,
      lng: 77.6269,
      dimensions: "15x8 ft",
      daily_rate: 120.0,
      monthly_rate: 3200.0,
      hourly_rate: 20.0,
      category: "Restaurant",
      address: "Koramangala Social, 5th Block, Koramangala, Bengaluru",
      description: "Premium location with young demographic",
      orientation: "landscape" as const,
      impressions: 3500,
      cost_per_play: 0.40,
      status: "available" as const,
      showup: true,
      tags: "restaurant,social,young-crowd",
      resolution: "1080x720",
      loop_time: 180,
      start_hour: 10,
      end_hour: 24,
      supported_media: "video,image",
    },
    {
      name: "BDA Complex Board",
      provider: "Government Advertising Board",
      lat: 12.9368,
      lng: 77.6214,
      dimensions: "25x12 ft",
      daily_rate: 200.0,
      monthly_rate: 5500.0,
      hourly_rate: 35.0,
      category: "Government",
      address: "BDA Complex, Koramangala, Bengaluru",
      description: "Large format billboard with government visibility",
      orientation: "landscape" as const,
      impressions: 8000,
      cost_per_play: 0.75,
      status: "occupied" as const,
      showup: true,
      tags: "government,official,high-visibility",
      resolution: "2560x1440",
      loop_time: 600,
      start_hour: 6,
      end_hour: 20,
      supported_media: "image",
    },
    {
      name: "Jyoti Nivas Junction",
      provider: "Campus Media Networks",
      lat: 12.9298,
      lng: 77.6174,
      dimensions: "18x9 ft",
      daily_rate: 130.0,
      monthly_rate: 3500.0,
      hourly_rate: 22.0,
      category: "Educational",
      address: "Near Jyoti Nivas College, Koramangala, Bengaluru",
      description: "Student-focused advertising location",
      orientation: "landscape" as const,
      impressions: 4200,
      cost_per_play: 0.35,
      status: "available" as const,
      showup: true,
      tags: "college,students,education",
      resolution: "1920x1080",
      loop_time: 240,
      start_hour: 7,
      end_hour: 21,
      supported_media: "video,image",
    },
    {
      name: "Koramangala Metro Station",
      provider: "Transit Advertising Corp",
      lat: 12.9342,
      lng: 77.6378,
      dimensions: "22x11 ft",
      daily_rate: 180.0,
      monthly_rate: 4800.0,
      hourly_rate: 30.0,
      category: "Transportation",
      address: "Koramangala Metro Station, Bengaluru",
      description: "High footfall metro station location",
      orientation: "landscape" as const,
      impressions: 10000,
      cost_per_play: 0.60,
      status: "available" as const,
      showup: true,
      tags: "metro,transport,commuters",
      resolution: "2048x1024",
      loop_time: 400,
      start_hour: 5,
      end_hour: 23,
      supported_media: "video,image",
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
