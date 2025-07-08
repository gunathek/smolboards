"use client"

import { useEffect } from "react"
import { useState } from "react"
import type React from "react"
import { format, addDays, isSameDay } from "date-fns"
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckSquare,
  Square,
  Copy,
  Trash2,
  Zap,
  CalendarDays,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

interface DateTimeSlots {
  [dateString: string]: {
    selectedSlots: number[]
    availableSlots: TimeSlot[]
  }
}

type CampaignType = "single-day" | "multi-day"

export function BookingDialog({ billboard, children }: BookingDialogProps) {
  const [open, setOpen] = useState(false)
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentViewDate, setCurrentViewDate] = useState<Date>()
  const [dateTimeSlots, setDateTimeSlots] = useState<DateTimeSlots>({})
  const [loading, setLoading] = useState(false)
  const [bookingStep, setBookingStep] = useState<"campaign-type" | "calendar" | "details" | "confirmation">(
    "campaign-type",
  )
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingSystemAvailable, setBookingSystemAvailable] = useState(true)
  const [templateSlots, setTemplateSlots] = useState<number[]>([])

  // Check if booking system is available
  useEffect(() => {
    const checkBookingSystem = async () => {
      if (!open) return

      try {
        const result = await initializeBookings()
        if (!result.success) {
          console.warn("Booking system check failed:", result.error)
          setBookingSystemAvailable(true)
        } else {
          setBookingSystemAvailable(true)
        }
      } catch (error) {
        console.warn("Booking system check error:", error)
        setBookingSystemAvailable(true)
      }
    }

    checkBookingSystem()
  }, [open])

  // Generate time slots for a day (8 AM to 10 PM)
  const generateTimeSlots = (bookings: Booking[] = []): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 8; hour <= 22; hour++) {
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

  // Fetch bookings when a new date is selected
  const fetchBookingsForDate = async (date: Date) => {
    setLoading(true)
    setError(null)
    const dateString = format(date, "yyyy-MM-dd")

    try {
      const result = await getBillboardBookings(billboard.id, dateString, dateString)
      if ('success' in result && result.success) {
        const slots = generateTimeSlots(result.data)
        setDateTimeSlots((prev) => ({
          ...prev,
          [dateString]: {
            selectedSlots: prev[dateString]?.selectedSlots || [],
            availableSlots: slots,
          },
        }))
      } else {
        console.warn("Failed to fetch bookings:", result.error)
        const slots = generateTimeSlots([])
        setDateTimeSlots((prev) => ({
          ...prev,
          [dateString]: {
            selectedSlots: prev[dateString]?.selectedSlots || [],
            availableSlots: slots,
          },
        }))
      }
    } catch (error) {
      console.warn("Error fetching bookings:", error)
      const slots = generateTimeSlots([])
      setDateTimeSlots((prev) => ({
        ...prev,
        [dateString]: {
          selectedSlots: prev[dateString]?.selectedSlots || [],
          availableSlots: slots,
        },
      }))
    }

    setLoading(false)
  }

  // Handle campaign type selection
  const handleCampaignTypeSelect = (type: CampaignType) => {
    setCampaignType(type)
    setBookingStep("calendar")
  }

  // Handle date selection (different behavior for single vs multi-day)
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    if (campaignType === "single-day") {
      // Single day mode - clear previous selections and set new date
      const dateString = format(date, "yyyy-MM-dd")

      // Clear all existing date slots to prevent carryover
      setDateTimeSlots({})
      setSelectedDates([date])
      setCurrentViewDate(date)

      // Fetch bookings for the new date
      fetchBookingsForDate(date)
    } else {
      // Multi-day mode - allow multiple dates
      setSelectedDates((prev) => {
        const isAlreadySelected = prev.some((d) => isSameDay(d, date))
        if (isAlreadySelected) {
          // Remove date and its slots
          const newDates = prev.filter((d) => !isSameDay(d, date))
          const dateString = format(date, "yyyy-MM-dd")
          setDateTimeSlots((prev) => {
            const newSlots = { ...prev }
            delete newSlots[dateString]
            return newSlots
          })
          return newDates
        } else {
          // Add date
          const newDates = [...prev, date]
          fetchBookingsForDate(date)
          return newDates
        }
      })
      setCurrentViewDate(date)
    }
  }

  // Handle time slot toggle for specific date
  const handleTimeSlotToggle = (date: Date, hour: number) => {
    const dateString = format(date, "yyyy-MM-dd")
    const dateSlots = dateTimeSlots[dateString]

    if (!dateSlots) return

    const slot = dateSlots.availableSlots.find((s) => s.hour === hour)
    if (slot?.isBooked) return

    setDateTimeSlots((prev) => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        selectedSlots: prev[dateString].selectedSlots.includes(hour)
          ? prev[dateString].selectedSlots.filter((h) => h !== hour)
          : [...prev[dateString].selectedSlots, hour].sort((a, b) => a - b),
      },
    }))
  }

  // Select all available slots for a date
  const handleSelectAllForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    const dateSlots = dateTimeSlots[dateString]

    if (!dateSlots) return

    const availableHours = dateSlots.availableSlots.filter((slot) => !slot.isBooked).map((slot) => slot.hour)

    const allSelected = availableHours.every((hour) => dateSlots.selectedSlots.includes(hour))

    setDateTimeSlots((prev) => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        selectedSlots: allSelected ? [] : availableHours,
      },
    }))
  }

  // Clear all slots across all dates
  const handleClearAllSlots = () => {
    setDateTimeSlots((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((dateString) => {
        updated[dateString] = {
          ...updated[dateString],
          selectedSlots: [],
        }
      })
      return updated
    })
    setTemplateSlots([])
  }

  // Apply template slots to multiple dates
  const applyTemplateToSelectedDates = () => {
    if (templateSlots.length === 0) return

    setDateTimeSlots((prev) => {
      const updated = { ...prev }
      selectedDates.forEach((date) => {
        const dateString = format(date, "yyyy-MM-dd")
        if (updated[dateString]) {
          // Only apply slots that are available (not booked)
          const availableTemplateSlots = templateSlots.filter((hour) => {
            const slot = updated[dateString].availableSlots.find((s) => s.hour === hour)
            return slot && !slot.isBooked
          })

          updated[dateString] = {
            ...updated[dateString],
            selectedSlots: availableTemplateSlots,
          }
        }
      })
      return updated
    })

    setTemplateSlots([])
  }

  // Calculate total selected slots across all dates
  const getTotalSelectedSlots = () => {
    return Object.values(dateTimeSlots).reduce((total, dateSlot) => total + dateSlot.selectedSlots.length, 0)
  }

  // Calculate total cost
  const calculateTotal = () => {
    const totalSlots = getTotalSelectedSlots()
    const hourlyRate = billboard.daily_rate / 24
    return (hourlyRate * totalSlots).toFixed(2)
  }

  const formatTimeSlot = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  const handleBookingSubmit = async () => {
    if (selectedDates.length === 0 || getTotalSelectedSlots() === 0) return

    setLoading(true)
    setError(null)

    try {
      const bookings = []

      for (const date of selectedDates) {
        const dateString = format(date, "yyyy-MM-dd")
        const dateSlots = dateTimeSlots[dateString]

        if (dateSlots && dateSlots.selectedSlots.length > 0) {
          const booking: Omit<Booking, "id" | "created_at" | "updated_at"> = {
            billboard_id: billboard.id,
            booking_date: dateString,
            start_hour: Math.min(...dateSlots.selectedSlots),
            end_hour: Math.max(...dateSlots.selectedSlots) + 1,
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone,
            booking_status: "confirmed",
            total_amount: Number.parseFloat(calculateTotal()) / selectedDates.length,
            notes: customerDetails.notes,
          }

          const result = await createBooking(booking)
          if (!result.success) {
            throw new Error(result.error || "Failed to create booking")
          }
          bookings.push(result.data)
        }
      }

      setBookingSuccess(true)
      setBookingStep("confirmation")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    }

    setLoading(false)
  }

  const resetDialog = () => {
    setCampaignType(null)
    setSelectedDates([])
    setCurrentViewDate(undefined)
    setDateTimeSlots({})
    setTemplateSlots([])
    setBookingStep("campaign-type")
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

  // Render single-day interface
  const renderSingleDayInterface = () => {
    const selectedDate = selectedDates[0]
    const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
    const dateSlots = dateString ? dateTimeSlots[dateString] : null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Date</h3>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 90)}
              className="rounded-md border"
            />
            {selectedDate && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Selected Date:</span>
                </div>
                <div className="mt-1 text-sm text-blue-800">{format(selectedDate, "EEEE, MMMM dd, yyyy")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Available Time Slots (8 AM - 10 PM)</h3>

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
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedDate && handleSelectAllForDate(selectedDate)}
                      className="text-xs"
                    >
                      {dateSlots?.availableSlots
                        .filter((s) => !s.isBooked)
                        .every((s) => dateSlots.selectedSlots.includes(s.hour)) ? (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                    {dateSlots && dateSlots.selectedSlots.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearAllSlots}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  {dateSlots && dateSlots.selectedSlots.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {dateSlots.selectedSlots.length} selected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {dateSlots?.availableSlots.map((slot) => (
                    <Button
                      key={slot.hour}
                      variant={
                        dateSlots.selectedSlots.includes(slot.hour)
                          ? "default"
                          : slot.isBooked
                            ? "secondary"
                            : "outline"
                      }
                      size="sm"
                      disabled={slot.isBooked}
                      onClick={() => selectedDate && handleTimeSlotToggle(selectedDate, slot.hour)}
                      className={`text-xs ${
                        slot.isBooked
                          ? "opacity-50 cursor-not-allowed"
                          : dateSlots.selectedSlots.includes(slot.hour)
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                      }`}
                    >
                      {formatTimeSlot(slot.hour)}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render multi-day interface with improved date display
  const renderMultiDayInterface = () => (
    <div className="space-y-6">
      {/* Global Counter and Template Controls */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold text-blue-900">Total Selected Slots:</span>
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              {getTotalSelectedSlots()}
            </Badge>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-blue-900">Selected Dates:</span>
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              {selectedDates.length}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTotalSelectedSlots() > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAllSlots}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All Slots
            </Button>
          )}
          {selectedDates.length > 1 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTemplateSlots(
                    currentViewDate ? dateTimeSlots[format(currentViewDate, "yyyy-MM-dd")]?.selectedSlots || [] : [],
                  )
                }
                disabled={
                  !currentViewDate || !dateTimeSlots[format(currentViewDate, "yyyy-MM-dd")]?.selectedSlots.length
                }
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Current Slots
              </Button>
              <Button size="sm" onClick={applyTemplateToSelectedDates} disabled={templateSlots.length === 0}>
                Apply to All Dates ({templateSlots.length} slots)
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Dates</h3>
            <CalendarComponent
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => {
                if (Array.isArray(dates)) {
                  // Handle bulk selection
                  dates.forEach((date) => {
                    if (!selectedDates.some((d) => isSameDay(d, date))) {
                      fetchBookingsForDate(date)
                    }
                  })
                  setSelectedDates(dates)
                  if (dates.length > 0) {
                    setCurrentViewDate(dates[dates.length - 1])
                  }
                }
              }}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 90)}
              className="rounded-md border"
            />
            <p className="text-xs text-gray-500 mt-2">
              Click dates to select/deselect. You can select multiple dates for your campaign.
            </p>
          </div>
        </div>

        {/* Selected Dates Display Column */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Selected Dates ({selectedDates.length})</h3>
            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No dates selected</p>
                <p className="text-xs text-gray-400 mt-1">Select dates from the calendar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date) => {
                    const dateString = format(date, "yyyy-MM-dd")
                    const dateSlots = dateTimeSlots[dateString]
                    const selectedCount = dateSlots?.selectedSlots.length || 0
                    const isCurrentView = currentViewDate && isSameDay(date, currentViewDate)

                    return (
                      <Card
                        key={dateString}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isCurrentView ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentViewDate(date)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900">{format(date, "MMM dd, yyyy")}</div>
                              <div className="text-xs text-gray-500">{format(date, "EEEE")}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  {selectedCount} slots
                                </Badge>
                              )}
                              {isCurrentView && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  Viewing
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Time Slots (8 AM - 10 PM)</h3>

            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select dates to view available time slots</p>
              </div>
            ) : !currentViewDate ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click on a selected date to view its time slots</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{format(currentViewDate, "EEEE, MMM dd, yyyy")}</h4>
                    <p className="text-xs text-gray-500">Click time slots to select/deselect</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAllForDate(currentViewDate)}
                    className="text-xs"
                  >
                    {(() => {
                      const dateString = format(currentViewDate, "yyyy-MM-dd")
                      const dateSlots = dateTimeSlots[dateString]
                      return dateSlots?.availableSlots
                        .filter((s) => !s.isBooked)
                        .every((s) => dateSlots.selectedSlots.includes(s.hour)) ? (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Select All
                        </>
                      )
                    })()}
                  </Button>
                </div>

                {(() => {
                  const dateString = format(currentViewDate, "yyyy-MM-dd")
                  const dateSlots = dateTimeSlots[dateString]

                  if (loading && !dateSlots) {
                    return (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Loading availability...</p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {dateSlots?.availableSlots.map((slot) => (
                        <Button
                          key={slot.hour}
                          variant={
                            dateSlots.selectedSlots.includes(slot.hour)
                              ? "default"
                              : slot.isBooked
                                ? "secondary"
                                : "outline"
                          }
                          size="sm"
                          disabled={slot.isBooked}
                          onClick={() => handleTimeSlotToggle(currentViewDate, slot.hour)}
                          className={`text-xs ${
                            slot.isBooked
                              ? "opacity-50 cursor-not-allowed"
                              : dateSlots.selectedSlots.includes(slot.hour)
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                          }`}
                        >
                          {formatTimeSlot(slot.hour)}
                        </Button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="overflow-y-auto z-[9999] w-auto max-w-none h-auto max-h-none"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book {billboard.name}
          </DialogTitle>
        </DialogHeader>
        <div id="booking-dialog-description" className="sr-only">
          Book billboard slots by selecting campaign type, dates and time slots, then providing customer details
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
        ) : bookingStep === "campaign-type" ? (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold text-gray-900">Choose Your Campaign Type</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the type of advertising campaign you'd like to run. This will determine the booking options
                available to you.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <RadioGroup
                value={campaignType || ""}
                onValueChange={(value) => handleCampaignTypeSelect(value as CampaignType)}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-300 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <RadioGroupItem value="single-day" id="single-day" className="mt-1" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <Zap className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <Label
                                htmlFor="single-day"
                                className="text-lg font-semibold text-gray-900 cursor-pointer"
                              >
                                Single Day Campaign
                              </Label>
                              <p className="text-sm text-gray-600">
                                Perfect for one-time events, product launches, or short-term promotions
                              </p>
                            </div>
                          </div>
                          <div className="pl-15">
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Simple date and time selection</li>
                              <li>• Quick booking process</li>
                              <li>• Ideal for events and announcements</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <RadioGroupItem value="multi-day" id="multi-day" className="mt-1" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <CalendarDays className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <Label htmlFor="multi-day" className="text-lg font-semibold text-gray-900 cursor-pointer">
                                Multi-Day Campaign
                              </Label>
                              <p className="text-sm text-gray-600">
                                Ideal for brand awareness, ongoing promotions, or seasonal campaigns
                              </p>
                            </div>
                          </div>
                          <div className="pl-15">
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Select multiple dates</li>
                              <li>• Advanced time slot management</li>
                              <li>• Template system for recurring patterns</li>
                              <li>• Bulk operations and analytics</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>

              {campaignType && (
                <div className="mt-6 text-center">
                  <Button onClick={() => handleCampaignTypeSelect(campaignType)} size="lg" className="px-8">
                    Continue with {campaignType === "single-day" ? "Single Day" : "Multi-Day"} Campaign
                    <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : bookingStep === "calendar" ? (
          <div className="space-y-6">
            {/* Campaign Type Indicator */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
              <div className="flex items-center gap-3">
                {campaignType === "single-day" ? (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-900">
                    {campaignType === "single-day" ? "Single Day Campaign" : "Multi-Day Campaign"}
                  </span>
                  <p className="text-xs text-gray-600">
                    {campaignType === "single-day"
                      ? "Select one date and choose your time slots"
                      : "Select multiple dates and manage time slots for each"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCampaignType(null)
                  setBookingStep("campaign-type")
                  setSelectedDates([])
                  setDateTimeSlots({})
                }}
                className="text-gray-600 hover:text-gray-800 border-gray-300"
              >
                Change Type
              </Button>
            </div>

            {/* Render appropriate interface */}
            {campaignType === "single-day" ? renderSingleDayInterface() : renderMultiDayInterface()}

            {/* Booking Summary */}
            {getTotalSelectedSlots() > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Billboard:</span>
                    <span className="font-medium">{billboard.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Campaign Type:</span>
                    <span className="capitalize">{campaignType?.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Selected Dates:</span>
                    <span>{selectedDates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Time Slots:</span>
                    <span>{getTotalSelectedSlots()} hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate per hour:</span>
                    <span>${(billboard.daily_rate / 24).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">${calculateTotal()}</span>
                  </div>
                  <Button onClick={() => setBookingStep("details")} className="w-full mt-4">
                    Continue to Details
                  </Button>
                </CardContent>
              </Card>
            )}
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
                      <span>Campaign Type:</span>
                      <span className="capitalize">{campaignType?.replace("-", " ")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dimensions:</span>
                      <span>{billboard.dimensions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Selected Dates:</span>
                      <span>{selectedDates.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Time Slots:</span>
                      <span>{getTotalSelectedSlots()} hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rate per hour:</span>
                      <span>${(billboard.daily_rate / 24).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span className="font-semibold">${calculateTotal()}</span>
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
                <p className="text-gray-600">
                  Your {campaignType?.replace("-", " ")} campaign for {billboard.name} has been successfully confirmed.
                </p>
              </div>
              <Card className="max-w-md mx-auto">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Campaign Type:</span>
                    <span className="capitalize">{campaignType?.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dates:</span>
                    <span>{selectedDates.length} selected</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Slots:</span>
                    <span>{getTotalSelectedSlots()} hours</span>
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
