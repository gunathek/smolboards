"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { Calendar, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type Billboard, type Booking, getBillboardBookings, createBooking, initializeBookings } from "@/lib/supabase"

interface BookingDialogProps {
  billboard: Billboard
  children: React.ReactNode
}

interface TimeSlot {
  hour: number
  isBooked: boolean
  booking?: Booking
}

export function BookingDialog({ billboard, children }: BookingDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingStep, setBookingStep] = useState<"calendar" | "details" | "confirmation">("calendar")
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingSystemAvailable, setBookingSystemAvailable] = useState(true)

  // Check if booking system is available
  useEffect(() => {
    const checkBookingSystem = async () => {
      if (!open) return

      try {
        const result = await initializeBookings()
        if (!result.success) {
          console.warn("Booking system check failed:", result.error)
          // Don't disable the system immediately, let users try
          setBookingSystemAvailable(true)
        } else {
          setBookingSystemAvailable(true)
        }
      } catch (error) {
        console.warn("Booking system check error:", error)
        setBookingSystemAvailable(true) // Allow users to try anyway
      }
    }

    checkBookingSystem()
  }, [open])

  // Generate time slots for a day (6 AM to 11 PM)
  const generateTimeSlots = (bookings: Booking[] = []): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 6; hour <= 23; hour++) {
      const booking = bookings.find(
        (b) => hour >= b.start_hour && hour < b.end_hour && b.booking_status === "confirmed",
      )
      slots.push({
        hour,
        isBooked: !!booking,
        booking,
      })
    }
    return slots
  }

  // Fetch bookings when date is selected
  useEffect(() => {
    if (selectedDate && open && bookingSystemAvailable) {
      fetchBookingsForDate(selectedDate)
    }
  }, [selectedDate, open, bookingSystemAvailable])

  const fetchBookingsForDate = async (date: Date) => {
    setLoading(true)
    setError(null)

    try {
      const dateString = format(date, "yyyy-MM-dd")
      const result = await getBillboardBookings(billboard.id, dateString, dateString)

      // getBillboardBookings always returns success: true with data array
      // or success: false only if supabase is not available
      const slots = generateTimeSlots(result.data || [])
      setTimeSlots(slots)
      
    } catch (error) {
      console.warn("Error fetching bookings:", error)
      // Show all slots as available
      const slots = generateTimeSlots([])
      setTimeSlots(slots)
    }

    setLoading(false)
  }

  const handleTimeSlotToggle = (hour: number) => {
    const slot = timeSlots.find((s) => s.hour === hour)
    if (slot?.isBooked) return

    setSelectedTimeSlots((prev) => {
      if (prev.includes(hour)) {
        return prev.filter((h) => h !== hour)
      } else {
        return [...prev, hour].sort((a, b) => a - b)
      }
    })
  }

  const formatTimeSlot = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  const calculateTotal = () => {
    const hourlyRate = billboard.daily_rate / 24
    return (hourlyRate * selectedTimeSlots.length).toFixed(2)
  }

  const handleBookingSubmit = async () => {
    if (!selectedDate || selectedTimeSlots.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const booking: Omit<Booking, "id" | "created_at" | "updated_at"> = {
        billboard_id: billboard.id,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        start_hour: Math.min(...selectedTimeSlots),
        end_hour: Math.max(...selectedTimeSlots) + 1,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        booking_status: "confirmed",
        total_amount: Number.parseFloat(calculateTotal()),
        notes: customerDetails.notes,
      }

      const result = await createBooking(booking)

      if (result.success) {
        setBookingSuccess(true)
        setBookingStep("confirmation")
      } else {
        setError(result.error || "Failed to create booking")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    }

    setLoading(false)
  }

  const resetDialog = () => {
    setSelectedDate(undefined)
    setSelectedTimeSlots([])
    setTimeSlots([])
    setBookingStep("calendar")
    setCustomerDetails({ name: "", email: "", phone: "", notes: "" })
    setError(null)
    setBookingSuccess(false)
    setBookingSystemAvailable(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto z-[9999]"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book {billboard.name}
          </DialogTitle>
        </DialogHeader>
        <div id="booking-dialog-description" className="sr-only">
          Book billboard slots by selecting date and time, then providing customer details
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {!bookingSystemAvailable ? (
          <div className="text-center py-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Booking System Unavailable</h3>
              <p className="text-gray-600 mt-2">
                The booking system is currently not available. Please run the SQL script to set up the bookings table.
              </p>
            </div>
            <Button onClick={() => setOpen(false)} variant="outline">
              Close
            </Button>
          </div>
        ) : bookingStep === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Date</h3>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 90)}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Available Time Slots
                  {selectedDate && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      for {format(selectedDate, "MMM dd, yyyy")}
                    </span>
                  )}
                </h3>

                {!selectedDate ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a date to view available time slots</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading availability...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.hour}
                        variant={
                          selectedTimeSlots.includes(slot.hour) ? "default" : slot.isBooked ? "secondary" : "outline"
                        }
                        size="sm"
                        disabled={slot.isBooked}
                        onClick={() => handleTimeSlotToggle(slot.hour)}
                        className={`text-xs ${
                          slot.isBooked
                            ? "opacity-50 cursor-not-allowed"
                            : selectedTimeSlots.includes(slot.hour)
                              ? "bg-green-600 hover:bg-green-700"
                              : ""
                        }`}
                      >
                        {formatTimeSlot(slot.hour)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedTimeSlots.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Billboard:</span>
                      <span className="font-medium">{billboard.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Date:</span>
                      <span>{selectedDate && format(selectedDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time Slots:</span>
                      <span>
                        {formatTimeSlot(Math.min(...selectedTimeSlots))} -{" "}
                        {formatTimeSlot(Math.max(...selectedTimeSlots) + 1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>{selectedTimeSlots.length} hours</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${calculateTotal()}</span>
                    </div>
                    <Button onClick={() => setBookingStep("details")} className="w-full mt-4">
                      Continue to Details
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : bookingStep === "details" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={customerDetails.notes}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special requirements or notes..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Billboard:</span>
                      <span className="font-medium">{billboard.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dimensions:</span>
                      <span>{billboard.dimensions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Date:</span>
                      <span>{selectedDate && format(selectedDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time:</span>
                      <span>
                        {formatTimeSlot(Math.min(...selectedTimeSlots))} -{" "}
                        {formatTimeSlot(Math.max(...selectedTimeSlots) + 1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>{selectedTimeSlots.length} hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rate per hour:</span>
                      <span>${(billboard.daily_rate / 24).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-green-600">${calculateTotal()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setBookingStep("calendar")}>
                Back to Calendar
              </Button>
              <Button
                onClick={handleBookingSubmit}
                disabled={!customerDetails.name || !customerDetails.email || loading}
                className="flex-1"
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        ) : (
          bookingStep === "confirmation" &&
          bookingSuccess && (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-600">Your booking for {billboard.name} has been successfully confirmed.</p>
              </div>
              <Card className="max-w-md mx-auto">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Date:</span>
                    <span>{selectedDate && format(selectedDate, "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time:</span>
                    <span>
                      {formatTimeSlot(Math.min(...selectedTimeSlots))} -{" "}
                      {formatTimeSlot(Math.max(...selectedTimeSlots) + 1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-semibold">${calculateTotal()}</span>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={() => setOpen(false)} className="w-full max-w-md">
                Close
              </Button>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
