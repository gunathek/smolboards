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
  ChevronRight,
  User,
  Mail,
  Phone,
  MessageSquare,
  CreditCard,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Sparkles,
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

// Progress indicator component
const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              index + 1 <= currentStep
                ? "bg-green-600 text-white shadow-lg"
                : index + 1 === currentStep + 1
                ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {index + 1 <= currentStep ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                index + 1 < currentStep ? "bg-green-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Step header component
const StepHeader = ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) => {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{subtitle}</p>
    </div>
  )
}

// Enhanced campaign type card
const CampaignTypeCard = ({ 
  type, 
  title, 
  description, 
  features, 
  icon: Icon, 
  isSelected, 
  onSelect,
  gradient 
}: {
  type: CampaignType
  title: string
  description: string
  features: string[]
  icon: any
  isSelected: boolean
  onSelect: (type: CampaignType) => void
  gradient: string
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
        isSelected 
          ? "ring-2 ring-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50" 
          : "hover:shadow-lg border-gray-200"
      }`}
      onClick={() => onSelect(type)}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
              <RadioGroupItem value={type} id={type} className="mt-1" />
            </div>
            <p className="text-gray-600 text-sm mb-4">{description}</p>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

  // Get current step number for progress indicator
  const getCurrentStepNumber = () => {
    switch (bookingStep) {
      case "campaign-type": return 1
      case "calendar": return 2
      case "details": return 3
      case "confirmation": return 4
      default: return 1
    }
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Select Your Date
            </h4>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 90)}
              className="rounded-lg border-0 bg-white shadow-sm"
            />
            {selectedDate && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 text-blue-900">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Selected Date:</span>
                </div>
                <div className="mt-1 text-sm text-blue-800 font-medium">
                  {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              Available Time Slots
            </h4>

            {!selectedDate ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a date first</p>
                <p className="text-sm">Choose your preferred date to view available time slots</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading availability...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedDate && handleSelectAllForDate(selectedDate)}
                      className="text-xs bg-white hover:bg-purple-50 border-purple-200"
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
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border-red-200"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {dateSlots && dateSlots.selectedSlots.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                      {dateSlots.selectedSlots.length} selected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto bg-white rounded-lg p-4 border border-purple-100">
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
                          ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                          : dateSlots.selectedSlots.includes(slot.hour)
                            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md transform scale-105"
                            : "hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm"
                      }`}
                    >
                      {formatTimeSlot(slot.hour)}
                    </Button>
                  ))}
                </div>
              </div>
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
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{getTotalSelectedSlots()}</div>
              <div className="text-sm text-blue-600">Total Slots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">{selectedDates.length}</div>
              <div className="text-sm text-purple-600">Selected Dates</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTotalSelectedSlots() > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAllSlots}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-white"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
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
                  className="bg-white hover:bg-blue-50 border-blue-200"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Slots
                </Button>
                <Button 
                  size="sm" 
                  onClick={applyTemplateToSelectedDates} 
                  disabled={templateSlots.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Apply to All ({templateSlots.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarDays className="h-5 w-5 text-green-600 mr-2" />
              Select Multiple Dates
            </h4>
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
              className="rounded-lg border-0 bg-white shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-3 bg-white p-2 rounded border border-green-100">
              💡 Click dates to select/deselect multiple dates for your campaign
            </p>
          </div>
        </div>

        {/* Selected Dates Display Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-orange-600 mr-2" />
              Selected Dates ({selectedDates.length})
            </h4>
            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">No dates selected</p>
                <p className="text-xs text-gray-400 mt-1">Choose dates from the calendar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
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
                            ? "ring-2 ring-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md" 
                            : "hover:bg-orange-50 bg-white"
                        }`}
                        onClick={() => setCurrentViewDate(date)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900">
                                {format(date, "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-gray-500">{format(date, "EEEE")}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                  {selectedCount} slots
                                </Badge>
                              )}
                              {isCurrentView && (
                                <Badge className="text-xs bg-orange-500 text-white">
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
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              Time Slots
            </h4>

            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Select dates first</p>
                <p className="text-xs text-gray-400 mt-1">Choose dates to view time slots</p>
              </div>
            ) : !currentViewDate ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Click on a date</p>
                <p className="text-xs text-gray-400 mt-1">Select a date to view its time slots</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{format(currentViewDate, "EEEE, MMM dd")}</h5>
                      <p className="text-xs text-gray-500">Click slots to select/deselect</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectAllForDate(currentViewDate)}
                      className="text-xs bg-white hover:bg-purple-50 border-purple-200"
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
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-gray-500 text-sm">Loading...</p>
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
                            className={`text-xs transition-all duration-200 ${
                              slot.isBooked
                                ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                : dateSlots.selectedSlots.includes(slot.hour)
                                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md"
                                  : "hover:bg-purple-50 hover:border-purple-300"
                            }`}
                          >
                            {formatTimeSlot(slot.hour)}
                          </Button>
                        ))}
                      </div>
                    )
                  })()}
                </div>
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
        className="overflow-y-auto z-[9999] w-auto max-w-none h-auto max-h-none bg-gradient-to-br from-gray-50 to-white"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader className="border-b border-gray-200 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Book {billboard.name}
          </DialogTitle>
        </DialogHeader>
        <div id="booking-dialog-description" className="sr-only">
          Book billboard slots by selecting campaign type, dates and time slots, then providing customer details
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {!bookingSystemAvailable ? (
          <div className="text-center py-12 space-y-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking System Unavailable</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                The booking system is currently not available. Please run the SQL script to set up the bookings table.
              </p>
            </div>
            <Button onClick={() => setOpen(false)} variant="outline" className="bg-white">
              Close
            </Button>
          </div>
        ) : bookingStep === "campaign-type" ? (
          <div className="space-y-8 py-6">
            <ProgressIndicator currentStep={getCurrentStepNumber()} totalSteps={4} />
            
            <StepHeader 
              title="Choose Your Campaign Type"
              subtitle="Select the type of advertising campaign that best fits your marketing goals"
              icon={Zap}
            />

            <div className="max-w-4xl mx-auto">
              <RadioGroup
                value={campaignType || ""}
                onValueChange={(value) => handleCampaignTypeSelect(value as CampaignType)}
                className="space-y-6"
              >
                <CampaignTypeCard
                  type="single-day"
                  title="Single Day Campaign"
                  description="Perfect for one-time events, product launches, or short-term promotions"
                  features={[
                    "Simple date and time selection",
                    "Quick booking process",
                    "Ideal for events and announcements",
                    "Cost-effective for short campaigns"
                  ]}
                  icon={Zap}
                  isSelected={campaignType === "single-day"}
                  onSelect={handleCampaignTypeSelect}
                  gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                />

                <CampaignTypeCard
                  type="multi-day"
                  title="Multi-Day Campaign"
                  description="Ideal for brand awareness, ongoing promotions, or seasonal campaigns"
                  features={[
                    "Select multiple dates",
                    "Advanced time slot management",
                    "Template system for recurring patterns",
                    "Bulk operations and analytics"
                  ]}
                  icon={CalendarDays}
                  isSelected={campaignType === "multi-day"}
                  onSelect={handleCampaignTypeSelect}
                  gradient="bg-gradient-to-br from-blue-500 to-purple-600"
                />
              </RadioGroup>

              {campaignType && (
                <div className="mt-8 text-center">
                  <Button 
                    onClick={() => handleCampaignTypeSelect(campaignType)} 
                    size="lg" 
                    className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                  >
                    Continue with {campaignType === "single-day" ? "Single Day" : "Multi-Day"} Campaign
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : bookingStep === "calendar" ? (
          <div className="space-y-8 py-6">
            <ProgressIndicator currentStep={getCurrentStepNumber()} totalSteps={4} />
            
            {/* Campaign Type Indicator */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                {campaignType === "single-day" ? (
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-white" />
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
                className="text-gray-600 hover:text-gray-800 border-gray-300 bg-white"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Change Type
              </Button>
            </div>

            {/* Render appropriate interface */}
            {campaignType === "single-day" ? renderSingleDayInterface() : renderMultiDayInterface()}

            {/* Enhanced Booking Summary */}
            {getTotalSelectedSlots() > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-green-900">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billboard:</span>
                      <span className="font-medium text-gray-900">{billboard.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campaign Type:</span>
                      <span className="capitalize font-medium text-gray-900">{campaignType?.replace("-", " ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected Dates:</span>
                      <span className="font-medium text-gray-900">{selectedDates.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Time Slots:</span>
                      <span className="font-medium text-gray-900">{getTotalSelectedSlots()} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per hour:</span>
                      <span className="font-medium text-gray-900">${(billboard.daily_rate / 24).toFixed(2)}</span>
                    </div>
                  </div>
                  <Separator className="bg-green-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">${calculateTotal()}</span>
                  </div>
                  <Button 
                    onClick={() => setBookingStep("details")} 
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    size="lg"
                  >
                    Continue to Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : bookingStep === "details" ? (
          <div className="space-y-8 py-6">
            <ProgressIndicator currentStep={getCurrentStepNumber()} totalSteps={4} />
            
            <StepHeader 
              title="Customer Details"
              subtitle="Please provide your contact information to complete the booking"
              icon={User}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-blue-900">
                      <User className="h-5 w-5 mr-2" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={customerDetails.name}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                        required
                        className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                        className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                        className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Additional Notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={customerDetails.notes}
                        onChange={(e) => setCustomerDetails((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any special requirements or notes..."
                        rows={3}
                        className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-green-900">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Booking Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Billboard:
                        </span>
                        <span className="font-medium text-gray-900">{billboard.name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-gray-600">Campaign Type:</span>
                        <span className="capitalize font-medium text-gray-900">{campaignType?.replace("-", " ")}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-gray-600">Dimensions:</span>
                        <span className="font-medium text-gray-900">{billboard.dimensions}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-gray-600">Selected Dates:</span>
                        <span className="font-medium text-gray-900">{selectedDates.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-gray-600">Total Time Slots:</span>
                        <span className="font-medium text-gray-900">{getTotalSelectedSlots()} hours</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-gray-600">Rate per hour:</span>
                        <span className="font-medium text-gray-900">${(billboard.daily_rate / 24).toFixed(2)}</span>
                      </div>
                    </div>
                    <Separator className="bg-green-200" />
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg border-2 border-green-300">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">${calculateTotal()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex gap-4 justify-center max-w-md mx-auto">
              <Button 
                variant="outline" 
                onClick={() => setBookingStep("calendar")}
                className="flex-1 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calendar
              </Button>
              <Button
                onClick={handleBookingSubmit}
                disabled={!customerDetails.name || !customerDetails.email || loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          bookingStep === "confirmation" &&
          bookingSuccess && (
            <div className="text-center space-y-8 py-12">
              <ProgressIndicator currentStep={getCurrentStepNumber()} totalSteps={4} />
              
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-green-600 mb-3">Booking Confirmed! 🎉</h3>
                <p className="text-gray-600 max-w-md mx-auto text-lg">
                  Your {campaignType?.replace("-", " ")} campaign for {billboard.name} has been successfully confirmed.
                </p>
              </div>
              <Card className="max-w-md mx-auto bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Campaign Type:</span>
                    <span className="capitalize font-medium">{campaignType?.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dates:</span>
                    <span className="font-medium">{selectedDates.length} selected</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Slots:</span>
                    <span className="font-medium">{getTotalSelectedSlots()} hours</span>
                  </div>
                  <Separator className="bg-green-200" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">${calculateTotal()}</span>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  A confirmation email has been sent to {customerDetails.email}
                </p>
                <Button 
                  onClick={() => setOpen(false)} 
                  className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                  size="lg"
                >
                  Close
                </Button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}