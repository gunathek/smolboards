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
  Check,
  ArrowLeft,
  ArrowRight,
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

  // Progress indicator component
  const ProgressIndicator = () => {
    const steps = [
      { key: "campaign-type", label: "Campaign Type", icon: Zap },
      { key: "calendar", label: "Date & Time", icon: Calendar },
      { key: "details", label: "Details", icon: Clock },
      { key: "confirmation", label: "Confirmation", icon: Check },
    ]

    const currentStepIndex = steps.findIndex(step => step.key === bookingStep)

    return (
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="flex items-center space-x-2 md:space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isUpcoming = index > currentStepIndex

            return (
              <div key={step.key} className="flex items-center">
                <div className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500'
                  }
                `}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25" />
                  )}
                </div>
                <div className="ml-2 hidden md:block">
                  <div className={`text-sm font-medium ${
                    isCompleted || isCurrent 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 md:w-12 h-0.5 mx-2 md:mx-4 transition-colors duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render single-day interface
  const renderSingleDayInterface = () => {
    const selectedDate = selectedDates[0]
    const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
    const dateSlots = dateString ? dateTimeSlots[dateString] : null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Date</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Choose your campaign date</p>
              </div>
            </div>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 90)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            {selectedDate && (
              <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Selected Date:</span>
                </div>
                <div className="mt-1 text-sm text-blue-800 dark:text-blue-200 font-medium">
                  {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Time Slots</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">8 AM - 10 PM</p>
              </div>
            </div>

            {!selectedDate ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a date first</p>
                <p className="text-sm">Choose a date to view available time slots</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading availability...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedDate && handleSelectAllForDate(selectedDate)}
                      className="text-xs border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/50"
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
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  {dateSlots && dateSlots.selectedSlots.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {dateSlots.selectedSlots.length} selected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
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
                      className={`text-xs transition-all duration-200 ${
                        slot.isBooked
                          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
                          : dateSlots.selectedSlots.includes(slot.hour)
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
                            : "hover:bg-purple-50 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-700"
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
    <div className="space-y-8">
      {/* Global Counter and Template Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{getTotalSelectedSlots()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Slots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedDates.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Selected Dates</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getTotalSelectedSlots() > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAllSlots}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-700"
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
                  className="border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Current Slots
                </Button>
                <Button 
                  size="sm" 
                  onClick={applyTemplateToSelectedDates} 
                  disabled={templateSlots.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Apply to All Dates ({templateSlots.length} slots)
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Dates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Choose multiple dates</p>
              </div>
            </div>
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
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Click dates to select/deselect. You can select multiple dates for your campaign.
            </p>
          </div>
        </div>

        {/* Selected Dates Display Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-6 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Dates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">({selectedDates.length})</p>
              </div>
            </div>
            {selectedDates.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No dates selected</p>
                <p className="text-sm">Select dates from the calendar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isCurrentView 
                            ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/25" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                        onClick={() => setCurrentViewDate(date)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                {format(date, "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(date, "EEEE")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  {selectedCount} slots
                                </Badge>
                              )}
                              {isCurrentView && (
                                <Badge variant="default" className="text-xs bg-green-600 text-white">
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
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Slots</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">8 AM - 10 PM</p>
              </div>
            </div>

            {selectedDates.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select dates first</p>
                <p className="text-sm">Choose dates to view available time slots</p>
              </div>
            ) : !currentViewDate ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Click on a selected date</p>
                <p className="text-sm">View its time slots</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {format(currentViewDate, "EEEE, MMM dd, yyyy")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click time slots to select/deselect
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectAllForDate(currentViewDate)}
                      className="text-xs border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/50"
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
                </div>

                {(() => {
                  const dateString = format(currentViewDate, "yyyy-MM-dd")
                  const dateSlots = dateTimeSlots[dateString]

                  if (loading && !dateSlots) {
                    return (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">Loading availability...</p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
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
                          className={`text-xs transition-all duration-200 ${
                            slot.isBooked
                              ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
                              : dateSlots.selectedSlots.includes(slot.hour)
                                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
                                : "hover:bg-purple-50 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-700"
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
        className="overflow-y-auto z-[9999] w-auto max-w-none h-auto max-h-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader className="border-b border-gray-200 dark:border-gray-800 pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Book {billboard.name}
          </DialogTitle>
        </DialogHeader>
        <div id="booking-dialog-description" className="sr-only">
          Book billboard slots by selecting campaign type, dates and time slots, then providing customer details
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {!bookingSystemAvailable ? (
          <div className="text-center py-16 space-y-6">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Booking System Unavailable</h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                The booking system is currently not available. Please run the SQL script to set up the bookings table.
              </p>
            </div>
            <Button onClick={() => setOpen(false)} variant="outline" className="border-gray-300 dark:border-gray-600">
              Close
            </Button>
          </div>
        ) : (
          <>
            <ProgressIndicator />
            
            {bookingStep === "campaign-type" ? (
              <div className="space-y-8 py-8">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Choose Your Campaign Type</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                    Select the type of advertising campaign you'd like to run. This will determine the booking options
                    available to you.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <RadioGroup
                    value={campaignType || ""}
                    onValueChange={(value) => handleCampaignTypeSelect(value as CampaignType)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 has-[:checked]:border-green-500 has-[:checked]:bg-green-50 dark:has-[:checked]:bg-green-900/20 has-[:checked]:shadow-lg has-[:checked]:shadow-green-500/25">
                      <CardContent className="p-8">
                        <div className="flex items-start space-x-4">
                          <RadioGroupItem value="single-day" id="single-day" className="mt-1" />
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                                <Zap className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <Label
                                  htmlFor="single-day"
                                  className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer"
                                >
                                  Single Day Campaign
                                </Label>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  Perfect for one-time events, product launches, or short-term promotions
                                </p>
                              </div>
                            </div>
                            <div className="pl-20">
                              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  Simple date and time selection
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  Quick booking process
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  Ideal for events and announcements
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20 has-[:checked]:shadow-lg has-[:checked]:shadow-blue-500/25">
                      <CardContent className="p-8">
                        <div className="flex items-start space-x-4">
                          <RadioGroupItem value="multi-day" id="multi-day" className="mt-1" />
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <CalendarDays className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <Label htmlFor="multi-day" className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer">
                                  Multi-Day Campaign
                                </Label>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  Ideal for brand awareness, ongoing promotions, or seasonal campaigns
                                </p>
                              </div>
                            </div>
                            <div className="pl-20">
                              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-blue-500" />
                                  Select multiple dates
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-blue-500" />
                                  Advanced time slot management
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-blue-500" />
                                  Template system for recurring patterns
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-blue-500" />
                                  Bulk operations and analytics
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </RadioGroup>

                  {campaignType && (
                    <div className="mt-8 text-center">
                      <Button 
                        onClick={() => handleCampaignTypeSelect(campaignType)} 
                        size="lg" 
                        className="px-12 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                      >
                        Continue with {campaignType === "single-day" ? "Single Day" : "Multi-Day"} Campaign
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : bookingStep === "calendar" ? (
              <div className="space-y-8">
                {/* Campaign Type Indicator */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {campaignType === "single-day" ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <CalendarDays className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {campaignType === "single-day" ? "Single Day Campaign" : "Multi-Day Campaign"}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
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
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border-gray-300 dark:border-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Change Type
                    </Button>
                  </div>
                </div>

                {/* Render appropriate interface */}
                {campaignType === "single-day" ? renderSingleDayInterface() : renderMultiDayInterface()}

                {/* Booking Summary */}
                {getTotalSelectedSlots() > 0 && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl text-green-800 dark:text-green-200 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Booking Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="text-gray-500 dark:text-gray-400 text-xs">Billboard</div>
                          <div className="font-medium text-gray-900 dark:text-white">{billboard.name}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="text-gray-500 dark:text-gray-400 text-xs">Campaign Type</div>
                          <div className="font-medium text-gray-900 dark:text-white capitalize">{campaignType?.replace("-", " ")}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="text-gray-500 dark:text-gray-400 text-xs">Selected Dates</div>
                          <div className="font-medium text-gray-900 dark:text-white">{selectedDates.length}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="text-gray-500 dark:text-gray-400 text-xs">Total Time Slots</div>
                          <div className="font-medium text-gray-900 dark:text-white">{getTotalSelectedSlots()} hours</div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Rate per hour</div>
                            <div className="text-gray-900 dark:text-white">${(billboard.daily_rate / 24).toFixed(2)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Total Amount</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">${calculateTotal()}</div>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setBookingStep("details")} 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                        size="lg"
                      >
                        Continue to Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : bookingStep === "details" ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        Customer Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name *</Label>
                          <Input
                            id="name"
                            value={customerDetails.name}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                            required
                            className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email"
                            required
                            className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone Number</Label>
                          <Input
                            id="phone"
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                            className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            value={customerDetails.notes}
                            onChange={(e) => setCustomerDetails((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any special requirements or notes..."
                            rows={3}
                            className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-6 rounded-xl border border-green-200 dark:border-green-800">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        Booking Summary
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Billboard:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{billboard.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Campaign Type:</span>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{campaignType?.replace("-", " ")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{billboard.dimensions}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Selected Dates:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{selectedDates.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Time Slots:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{getTotalSelectedSlots()} hours</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Rate per hour:</span>
                            <span className="font-medium text-gray-900 dark:text-white">${(billboard.daily_rate / 24).toFixed(2)}</span>
                          </div>
                          <Separator className="bg-gray-200 dark:bg-gray-700" />
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">${calculateTotal()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setBookingStep("calendar")}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Calendar
                  </Button>
                  <Button
                    onClick={handleBookingSubmit}
                    disabled={!customerDetails.name || !customerDetails.email || loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm Booking
                        <Check className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              bookingStep === "confirmation" &&
              bookingSuccess && (
                <div className="text-center space-y-8 py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/25">
                    <Check className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">🎉 Booking Confirmed!</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                      Your {campaignType?.replace("-", " ")} campaign for {billboard.name} has been successfully confirmed.
                    </p>
                  </div>
                  <Card className="max-w-md mx-auto bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Campaign Type:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{campaignType?.replace("-", " ")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Dates:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedDates.length} selected</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Total Slots:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{getTotalSelectedSlots()} hours</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Total:</span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">${calculateTotal()}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      📧 A confirmation email has been sent to {customerDetails.email}
                    </p>
                    <Button 
                      onClick={() => setOpen(false)} 
                      className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25"
                      size="lg"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}