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
  ChevronRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Billboard, type Booking, getBillboardBookings, createBooking, initializeBookings } from "@/lib/supabase"

interface BookingDialogProps {
  billboard: Billboard | null
  children?: React.ReactNode // Make children optional as it's not always passed when controlled externally
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function BookingDialog({ billboard, children, open, onOpenChange = () => {} }: BookingDialogProps) {
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
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [countryCode, setCountryCode] = useState("+91")
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingSystemAvailable, setBookingSystemAvailable] = useState(true)
  const [templateSlots, setTemplateSlots] = useState<number[]>([])

  // Apply blur effect to background elements when dialog is open
  useEffect(() => {
    const elementsToBlur = [
      "[data-map-container]",
      "[data-sidebar]",
      "[data-stats-container]",
      "[data-search-container]",
      "[data-zoom-controls]",
      "[data-back-button]",
      "[data-error-alert]",
      "main",
      ".leaflet-container",
      ".billboard-sidebar",
      ".map-stats",
    ]

    if (open) {
      // Apply blur effect using CSS filter
      elementsToBlur.forEach((selector) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.filter = "blur(4px)"
            element.style.transition = "filter 0.3s ease-in-out"
            element.style.pointerEvents = "none"
          }
        })
      })

      // Also apply blur to body for general background
      document.body.style.overflow = "hidden"

      // Create a backdrop blur overlay
      const backdrop = document.createElement("div")
      backdrop.id = "booking-dialog-backdrop"
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(2px);
        z-index: 9998;
        pointer-events: none;
        transition: all 0.3s ease-in-out;
      `
      document.body.appendChild(backdrop)
    } else {
      // Remove blur effect
      elementsToBlur.forEach((selector) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.filter = ""
            element.style.transition = ""
            element.style.pointerEvents = ""
          }
        })
      })

      document.body.style.overflow = ""

      // Remove backdrop
      const backdrop = document.getElementById("booking-dialog-backdrop")
      if (backdrop) {
        backdrop.remove()
      }
    }

    // Cleanup on unmount
    return () => {
      if (open) {
        elementsToBlur.forEach((selector) => {
          const elements = document.querySelectorAll(selector)
          elements.forEach((element) => {
            if (element instanceof HTMLElement) {
              element.style.filter = ""
              element.style.transition = ""
              element.style.pointerEvents = ""
            }
          })
        })
        document.body.style.overflow = ""

        const backdrop = document.getElementById("booking-dialog-backdrop")
        if (backdrop) {
          backdrop.remove()
        }
      }
    }
  }, [open])

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

  if (!billboard) {
    return null
  }

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
      if ("success" in result && result.success) {
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
    return (billboard.hourly_rate * totalSlots).toFixed(2)
  }

  // Calculate total impressions
  const calculateTotalImpressions = () => {
    const totalSlots = getTotalSelectedSlots()
    return Math.round((billboard.impressions / 24) * totalSlots)
  }

  const formatTimeSlot = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  const handleBookingSubmit = async () => {
    if (selectedDates.length === 0 || getTotalSelectedSlots() === 0) {
      setError("Please select at least one date and time slot.")
      return
    }
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      setFormErrors({
        name: !customerDetails.name ? "Full name is required" : "",
        email: !customerDetails.email ? "Email address is required" : "",
        phone: !customerDetails.phone ? "Phone number is required" : "",
      })
      return
    }

    // Final validation check before submission
    if (formErrors.name || formErrors.email || formErrors.phone) {
      return // Stop submission if there are errors
    }

    setLoading(true)
    setError(null)

    try {
      const bookings: Omit<Booking, "id" | "created_at" | "updated_at">[] = []

      for (const date of selectedDates) {
        const dateString = format(date, "yyyy-MM-dd")
        const dateSlots = dateTimeSlots[dateString]

        if (dateSlots && dateSlots.selectedSlots.length > 0) {
          // Group consecutive selected hours into single bookings
          const sortedHours = dateSlots.selectedSlots.sort((a, b) => a - b)
          let currentBookingStart = sortedHours[0]
          let currentBookingEnd = sortedHours[0] + 1

          for (let i = 1; i < sortedHours.length; i++) {
            if (sortedHours[i] === currentBookingEnd) {
              currentBookingEnd++
            } else {
              // Save previous booking
              bookings.push({
                billboard_id: billboard.id,
                booking_date: dateString,
                start_hour: currentBookingStart,
                end_hour: currentBookingEnd,
                customer_name: customerDetails.name,
                customer_email: customerDetails.email,
                customer_phone: customerDetails.phone,
                booking_status: "confirmed",
                total_amount: billboard.hourly_rate * (currentBookingEnd - currentBookingStart),
                notes: customerDetails.notes,
              })
              // Start new booking
              currentBookingStart = sortedHours[i]
              currentBookingEnd = sortedHours[i] + 1
            }
          }
          // Save the last booking
          bookings.push({
            billboard_id: billboard.id,
            booking_date: dateString,
            start_hour: currentBookingStart,
            end_hour: currentBookingEnd,
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone,
            booking_status: "confirmed",
            total_amount: billboard.hourly_rate * (currentBookingEnd - currentBookingStart),
            notes: customerDetails.notes,
          })
        }
      }

      // Execute all bookings
      for (const booking of bookings) {
        const result = await createBooking(booking)
        if (!result.success) {
          throw new Error(result.error || "Failed to create booking")
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
    onOpenChange(newOpen)
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
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">Select Date</h3>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 90)}
              className="rounded-md border w-full"
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
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">Available Time Slots (8 AM - 10 PM)</h3>

            {!selectedDate ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a date to view available time slots</p>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading availability...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedDate && handleSelectAllForDate(selectedDate)}
                      className="text-xs w-full sm:w-auto"
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
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent w-full sm:w-auto"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  {dateSlots && dateSlots.selectedSlots.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 mt-2 sm:mt-0">
                      {dateSlots.selectedSlots.length} selected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
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
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">Total Selected Slots:</span>
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              {getTotalSelectedSlots()}
            </Badge>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">Selected Dates:</span>
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              {selectedDates.length}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {getTotalSelectedSlots() > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAllSlots}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent w-full sm:w-auto"
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
                className="w-full sm:w-auto text-white-800 dark:text-black-300 border-white-300 dark:border-white-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Current Slots
              </Button>
              <Button
                size="sm"
                onClick={applyTemplateToSelectedDates}
                disabled={templateSlots.length === 0}
                className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
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
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">Select Dates</h3>
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
              className="rounded-md border w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Click dates to select/deselect. You can select multiple dates for your campaign.
            </p>
          </div>
        </div>

        {/* Selected Dates Display Column */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">Selected Dates ({selectedDates.length})</h3>
            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                          isCurrentView
                            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                        onClick={() => setCurrentViewDate(date)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-50">{format(date, "MMM dd, yyyy")}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{format(date, "EEEE")}</div>
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
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">Time Slots (8 AM - 10 PM)</h3>

            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select dates to view available time slots</p>
              </div>
            ) : !currentViewDate ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click on a selected date to view its time slots</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-50">{format(currentViewDate, "EEEE, MMM dd, yyyy")}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click time slots to select/deselect</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAllForDate(currentViewDate)}
                    className="text-xs w-full sm:w-auto"
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
                        <p className="text-gray-500 dark:text-gray-400">Loading availability...</p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
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
        className="overflow-y-auto z-[9999] w-[95vw] max-w-4xl h-auto max-h-[95vh] p-4 sm:p-6 bg-white dark:bg-gray-950"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
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
            <AlertDescription className="text-red-900 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {!bookingSystemAvailable ? (
          <div className="text-center py-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Booking System Unavailable</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                The booking system is currently not available. Please run the SQL script to set up the bookings table.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        ) : bookingStep === "campaign-type" ? (
          <div className="space-y-6 py-4 sm:py-8">
            <div className="text-center space-y-2 sm:space-y-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50">Choose Your Campaign Type</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Select the type of advertising campaign you'd like to run. This will determine the booking options
                available to you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Single-Day Campaign Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500"
                onClick={() => handleCampaignTypeSelect("single-day")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50">Single Day Campaign</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Perfect for one-time events, product launches, or short-term promotions.
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                        <li>Simple date and time selection</li>
                        <li>Quick booking process</li>
                        <li>Ideal for events and announcements</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Multi-Day Campaign Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
                onClick={() => handleCampaignTypeSelect("multi-day")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center shrink-0">
                      <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50">Multi-Day Campaign</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ideal for brand awareness, ongoing promotions, or seasonal campaigns.
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                        <li>Select multiple dates</li>
                        <li>Advanced time slot management</li>
                        <li>Template system for recurring patterns</li>
                        <li>Bulk operations and analytics</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : bookingStep === "calendar" ? (
          <div className="space-y-6">
            {/* Campaign Type Indicator */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 gap-3">
              <div className="flex items-center gap-3">
                {campaignType === "single-day" ? (
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                    <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {campaignType === "single-day" ? "Single Day Campaign" : "Multi-Day Campaign"}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
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
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 w-full sm:w-auto"
              >
                Change Type
              </Button>
            </div>

            {/* Render appropriate interface */}
            {campaignType === "single-day" ? renderSingleDayInterface() : renderMultiDayInterface()}

            {/* Booking Summary */}
            {getTotalSelectedSlots() > 0 && (
              <Card className="bg-white dark:bg-gray-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Billboard:</span>
                    <span className="font-medium">{billboard.name}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Campaign Type:</span>
                    <span className="capitalize">{campaignType?.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Selected Dates:</span>
                    <span>{selectedDates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Total Time Slots:</span>
                    <span>{getTotalSelectedSlots()} hours</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Rate per hour:</span>
                    <span>₹{billboard.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Total Impressions:</span>
                    <span>~{calculateTotalImpressions()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-300">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{calculateTotal()}</span>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Customer Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-800 dark:text-gray-300">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) => {
                        const name = e.target.value
                        if (/\d/.test(name)) {
                          setFormErrors((prev) => ({ ...prev, name: "Name should not contain numbers." }))
                        } else {
                          setFormErrors((prev) => ({ ...prev, name: "" }))
                        }
                        setCustomerDetails((prev) => ({ ...prev, name }))
                      }}
                      placeholder="Enter your full name"
                      required
                      aria-required="true"
                    />
                    {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-800 dark:text-gray-300">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => {
                        const email = e.target.value
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                        if (!emailRegex.test(email)) {
                          setFormErrors((prev) => ({ ...prev, email: "Invalid email address" }))
                        } else {
                          setFormErrors((prev) => ({ ...prev, email: "" }))
                        }
                        setCustomerDetails((prev) => ({ ...prev, email }))
                      }}
                      placeholder="Enter your email"
                      required
                      aria-required="true"
                    />
                    {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-800 dark:text-gray-300">Phone Number</Label>
                    <div className="flex items-center">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                      </select>
                      <Input
                        id="phone"
                        value={customerDetails.phone}
                        onChange={(e) => {
                          const phone = e.target.value.replace(/\D/g, "")
                          if (phone.length <= 10) {
                            setCustomerDetails((prev) => ({ ...prev, phone }))
                            if (phone.length > 0 && phone.length !== 10) {
                              setFormErrors((prev) => ({ ...prev, phone: "Phone number must be 10 digits" }))
                            } else {
                              setFormErrors((prev) => ({ ...prev, phone: "" }))
                            }
                          }
                        }}
                        placeholder="Enter your 10-digit phone number"
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-gray-800 dark:text-gray-300">Additional Notes</Label>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Booking Summary</h3>
                <Card className="bg-white dark:bg-gray-950">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Billboard:</span>
                      <span className="font-medium">{billboard.name}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Campaign Type:</span>
                      <span className="capitalize">{campaignType?.replace("-", " ")}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Dimensions:</span>
                      <span>{billboard.dimensions}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Selected Dates:</span>
                      <span>{selectedDates.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Total Time Slots:</span>
                      <span>{getTotalSelectedSlots()} hours</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Rate per hour:</span>
                      <span>₹{billboard.hourly_rate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                      <span>Total Impressions:</span>
                      <span>~{calculateTotalImpressions()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg text-gray-800 dark:text-gray-300">
                      <span>Total Amount:</span>
                      <span className="font-semibold">₹{calculateTotal()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setBookingStep("calendar")} className="w-full sm:w-auto">
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
                <p className="text-gray-600 dark:text-gray-400">
                  Your {campaignType?.replace("-", " ")} campaign for {billboard.name} has been successfully confirmed.
                </p>
              </div>
              <Card className="max-w-md mx-auto bg-white dark:bg-gray-950">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Campaign Type:</span>
                    <span className="capitalize">{campaignType?.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Dates:</span>
                    <span>{selectedDates.length} selected</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Total Slots:</span>
                    <span>{getTotalSelectedSlots()} hours</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800 dark:text-gray-300">
                    <span>Total:</span>
                    <span className="font-semibold">₹{calculateTotal()}</span>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={() => handleOpenChange(false)} className="w-full max-w-md">
                Close
              </Button>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
