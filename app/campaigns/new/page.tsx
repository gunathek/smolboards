"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { X, ArrowLeft, ArrowRight, ChevronDown, HelpCircle, Wand2, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DatePicker } from "@/components/date-picker"
import { CampaignSummarizer } from "@/components/campaign-summarizer"

const steps = [
  { id: 1, name: "Name Campaign", description: "Give your campaign a memorable name" },
  { id: 2, name: "Select Boards", description: "Pick your billboard locations" },
  { id: 3, name: "Schedule & Budget", description: "Set timing and budget" },
  { id: 4, name: "Upload Creatives", description: "Add your creative assets" },
  { id: 5, name: "Review Summary", description: "Review and launch campaign" },
]

const timeSlots = [
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
]

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function WeeklyScheduleGrid({
  selectedSlots,
  onSlotsChange,
}: {
  selectedSlots: Set<string>
  onSlotsChange: (slots: Set<string>) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number; time: number } | null>(null)

  const getSlotKey = (dayIndex: number, timeIndex: number) => `${dayIndex}-${timeIndex}`

  const handleMouseDown = (dayIndex: number, timeIndex: number) => {
    setIsDragging(true)
    setDragStart({ day: dayIndex, time: timeIndex })

    const slotKey = getSlotKey(dayIndex, timeIndex)
    const newSlots = new Set(selectedSlots)

    if (selectedSlots.has(slotKey)) {
      newSlots.delete(slotKey)
    } else {
      newSlots.add(slotKey)
    }

    onSlotsChange(newSlots)
  }

  const handleMouseEnter = (dayIndex: number, timeIndex: number) => {
    if (isDragging && dragStart) {
      const newSlots = new Set<string>()

      const minDay = Math.min(dragStart.day, dayIndex)
      const maxDay = Math.max(dragStart.day, dayIndex)
      const minTime = Math.min(dragStart.time, timeIndex)
      const maxTime = Math.max(dragStart.time, timeIndex)

      // Keep existing selections that aren't in the drag area
      selectedSlots.forEach((slot) => {
        const [day, time] = slot.split("-").map(Number)
        if (day < minDay || day > maxDay || time < minTime || time > maxTime) {
          newSlots.add(slot)
        }
      })

      // Add the drag selection
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          newSlots.add(getSlotKey(d, t))
        }
      }

      onSlotsChange(newSlots)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  return (
    <div
      className="bg-gray-800/50 rounded-lg p-6 select-none border border-gray-700"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="grid grid-cols-8 gap-0 border border-gray-600 rounded-lg overflow-hidden">
        {/* Header row with days */}
        <div className="bg-gray-700/50 p-3 text-center font-medium text-gray-300 border-r border-gray-600"></div>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="bg-gray-700/50 p-3 text-center font-medium text-gray-300 border-r border-gray-600 last:border-r-0"
          >
            {day}
          </div>
        ))}

        {/* Time slots */}
        {timeSlots.map((time, timeIndex) => (
          <div key={time} className="contents">
            <div className="bg-gray-700/50 p-3 text-sm text-gray-400 border-r border-t border-gray-600 text-right">
              {time}
            </div>
            {daysOfWeek.map((_, dayIndex) => {
              const slotKey = getSlotKey(dayIndex, timeIndex)
              const isSelected = selectedSlots.has(slotKey)

              return (
                <div
                  key={`${dayIndex}-${timeIndex}`}
                  className={`p-3 border-r border-t border-gray-600 last:border-r-0 cursor-pointer transition-colors ${
                    isSelected ? "bg-green-600/30 border-green-500" : "bg-gray-800/30 hover:bg-gray-700/50"
                  }`}
                  onMouseDown={() => handleMouseDown(dayIndex, timeIndex)}
                  onMouseEnter={() => handleMouseEnter(dayIndex, timeIndex)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NewCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentStep, setCurrentStep] = useState(() => {
    const step = searchParams.get("step")
    return step ? Number.parseInt(step) : 1
  })

  const [campaignName, setCampaignName] = useState(() => {
    const name = searchParams.get("name")
    return name ? decodeURIComponent(name) : ""
  })

  const [selectedBoards, setSelectedBoards] = useState<string[]>(() => {
    const boards = searchParams.get("boards")
    return boards ? boards.split(",") : []
  })

  const [startDate, setStartDate] = useState<Date | undefined>(new Date("2025-08-20"))
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [hasEndDate, setHasEndDate] = useState(false)

  const [isAllDay, setIsAllDay] = useState(true)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set())

  const [budgetType, setBudgetType] = useState<"hourly" | "daily">("hourly")
  const [budgetAmount, setBudgetAmount] = useState("")
  const [budgetError, setBudgetError] = useState("")
  const [paceType, setPaceType] = useState<"auto" | "hourly" | "daily">("auto")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [paceAmount, setPaceAmount] = useState("")

  const [activeSection, setActiveSection] = useState<"dates" | "schedule" | "budget">("dates")
  const [uploadsExpanded, setUploadsExpanded] = useState(false)

  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ id: string; name: string; type: string; url: string; size: number }>
  >([])
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-section")
          if (sectionId === "dates" || sectionId === "schedule" || sectionId === "budget") {
            setActiveSection(sectionId)
          }
        }
      })
    }, observerOptions)

    // Observe sections when step 3 is active
    if (currentStep === 3) {
      const sections = document.querySelectorAll("[data-section]")
      sections.forEach((section) => observer.observe(section))
    }

    return () => observer.disconnect()
  }, [currentStep])

  const calculateBudgetScore = (amount: number): { score: number; label: string; color: string } => {
    if (amount === 0) return { score: 0, label: "INVALID", color: "text-red-400" }
    if (amount < 50) return { score: 20, label: "RESTRICTIVE", color: "text-yellow-400" }
    if (amount < 200) return { score: 40, label: "OKAY", color: "text-blue-400" }
    if (amount < 500) return { score: 60, label: "GOOD", color: "text-green-400" }
    if (amount < 1000) return { score: 80, label: "EXCELLENT", color: "text-green-500" }
    return { score: 100, label: "EXCESSIVE", color: "text-orange-400" }
  }

  const getScoreAmount = (): number => {
    if (hasEndDate && (paceType === "hourly" || paceType === "daily")) {
      return Number.parseFloat(paceAmount) || 0
    }
    return Number.parseFloat(budgetAmount) || 0
  }

  // Place this near other helpers (e.g., after getScoreAmount)
  const formatWeeklySummary = (isAllDay: boolean, selectedTimeSlots: Set<string>) => {
    // Expecting selectedTimeSlots entries like "Mon|03:00-06:00" or "Thu|15:00-18:00"
    // If WeeklyScheduleGrid uses a different delimiter, we still defensively parse by splitting on non-alphas first.
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
    if (isAllDay) {
      return days.map((d) => ({ day: d, label: "All day", variant: "all" as const }))
    }

    // Group ranges by day
    const byDay = new Map<string, string[]>()
    selectedTimeSlots.forEach((slot) => {
      // Attempt to parse "Day|HH:MM-HH:MM" first
      let day = ""
      let range = ""
      if (slot.includes("|")) {
        const [d, r] = slot.split("|")
        day = d
        range = r
      } else {
        // Fallback: extract day prefix and last 11 chars like "03:00-06:00"
        const match = slot.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat).*(\d{2}:\d{2}-\d{2}:\d{2})$/)
        if (match) {
          day = match[1]
          range = match[2]
        }
      }
      if (!day || !range) return
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(range)
    })

    return days.map((d) => {
      const ranges = byDay.get(d) || []
      return {
        day: d,
        label: ranges.length ? ranges.join(", ") : "NONE",
        variant: ranges.length ? "range" : "none",
      }
    })
  }

  const handleBudgetChange = (value: string) => {
    setBudgetAmount(value)
    const numValue = Number.parseFloat(value)

    if (value && (isNaN(numValue) || numValue <= 0)) {
      setBudgetError("You can't pace to ₹0. Use the suggested pace button, or set this above ₹0")
    } else {
      setBudgetError("")
    }
  }

  const handleSuggestPace = () => {
    const suggestedAmount = budgetType === "hourly" ? "150" : "2500"
    setBudgetAmount(suggestedAmount)
    setBudgetError("")
  }

  const currentStepData = steps.find((step) => step.id === currentStep)
  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep === 1 && campaignName.trim()) {
      // Navigate to map page for board selection
      router.push(`/map?campaign=true&step=2&name=${encodeURIComponent(campaignName)}`)
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    router.push("/campaigns")
  }

  const handleStepSelect = (stepId: number) => {
    // Only allow navigation to completed steps or the next step
    if (stepId === 1 || (stepId === 2 && campaignName.trim()) || stepId < currentStep) {
      if (stepId === 2) {
        router.push(`/map?campaign=true&step=2&name=${encodeURIComponent(campaignName)}`)
      } else {
        setCurrentStep(stepId)
      }
    }
  }

  const isBudgetValid = () => {
    if (currentStep !== 3) return true // Only validate budget on step 3

    const budgetNum = Number.parseFloat(budgetAmount)
    const isBudgetAmountValid = budgetAmount.trim() !== "" && !isNaN(budgetNum) && budgetNum > 0

    // If there's an end date and advanced pacing is enabled, also validate pace amount
    if (hasEndDate && (paceType === "hourly" || paceType === "daily")) {
      const paceNum = Number.parseFloat(paceAmount)
      const isPaceAmountValid = paceAmount.trim() !== "" && !isNaN(paceNum) && paceNum > 0
      return isBudgetAmountValid && isPaceAmountValid
    }

    return isBudgetAmountValid && !budgetError
  }

  const calculateScheduleMetrics = () => {
    if (isAllDay) {
      const dailyAverage = 14
      const weeklyActive = 98 // 14 hours * 7 days

      // Calculate total hours based on date range
      let totalHours = weeklyActive
      if (hasEndDate && startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
        totalHours = dailyAverage * diffDays
      }

      return {
        dailyAverage,
        weeklyActive,
        totalHours: hasEndDate ? totalHours : undefined, // Don't show total if no end date
      }
    }

    if (selectedTimeSlots.size === 0) {
      return {
        dailyAverage: 0,
        weeklyActive: 0,
        totalHours: 0,
      }
    }

    // Count hours per day
    const hoursPerDay: { [key: number]: number } = {}
    selectedTimeSlots.forEach((slot) => {
      const [dayIndex] = slot.split("-").map(Number)
      hoursPerDay[dayIndex] = (hoursPerDay[dayIndex] || 0) + 1
    })

    const daysWithSelections = Object.keys(hoursPerDay).length
    const weeklyActive = selectedTimeSlots.size
    const dailyAverage = daysWithSelections > 0 ? weeklyActive / daysWithSelections : 0

    // Calculate total hours based on date range
    let totalHours = weeklyActive
    if (hasEndDate && startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const weeks = Math.ceil(diffDays / 7)
      totalHours = weeklyActive * weeks
    }

    return {
      dailyAverage: Math.round(dailyAverage * 10) / 10,
      weeklyActive,
      totalHours,
    }
  }

  const scheduleMetrics = calculateScheduleMetrics()

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files)
      .slice(0, 5)
      .map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size,
      }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const [formData, setFormData] = useState({
    campaignName: campaignName,
    startDate: startDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    endDate: endDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    selectedBoards: selectedBoards,
    budget: budgetAmount,
  })

  useEffect(() => {
    setFormData({
      campaignName: campaignName,
      startDate: startDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      endDate: endDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      selectedBoards: selectedBoards,
      budget: budgetAmount,
    })
  }, [campaignName, startDate, endDate, selectedBoards, budgetAmount])

  const [generateProposal, setGenerateProposal] = useState(false)

  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800 relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Create New Campaign</h1>
            <p className="text-sm text-gray-400">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white">
                {currentStepData?.name}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-gray-800 border-gray-700">
              {steps.map((step) => {
                const isAccessible = step.id === 1 || (step.id === 2 && campaignName.trim()) || step.id < currentStep
                return (
                  <DropdownMenuItem
                    key={step.id}
                    onClick={() => handleStepSelect(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-3 p-3 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                      step.id === currentStep ? "bg-gray-700" : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        step.id === currentStep
                          ? "bg-blue-600 text-white"
                          : step.id < currentStep
                            ? "bg-green-600 text-white"
                            : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {step.id}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-xs text-gray-400">{step.description}</div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex overflow-hidden">
        {currentStep === 1 && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-4">Give it a name.</h2>
                <p className="text-gray-400 text-lg">
                  Choose a memorable name for your campaign that helps you identify it later.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Enter campaign name..."
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-lg py-4 px-6"
                  autoFocus
                />
                <p className="text-sm text-gray-500">
                  Campaign names should be descriptive and unique within your account.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
            <div className="flex relative min-h-full">
              {/* Left content without its own scroll container */}
              <div className="flex-1">
                <div className="p-6">
                  <div className="max-w-4xl">
                    <div className="space-y-8 mx-11 my-0 mr-0 ml-8">
                      <div>
                        <h2 className="text-4xl font-bold mb-4 px-0">When will it run?</h2>
                        <p className="text-gray-400 text-lg mb-2">
                          <span className="font-medium">Please note:</span> Days begin at 12:00 AM and end at 11:59 PM
                          in your local timezone: (UTC+5.5)
                        </p>
                      </div>

                      <div data-section="dates" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Start Date Box */}
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                          <DatePicker
                            label="START DATE:"
                            placeholder="August 20, 2025"
                            value={startDate}
                            onChange={setStartDate}
                          />
                        </div>

                        {/* End Date Box */}
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-medium">Optional - Set a finish date</span>
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                              </div>
                              <Switch
                                checked={hasEndDate}
                                onCheckedChange={setHasEndDate}
                                className="data-[state=checked]:bg-green-600"
                              />
                            </div>

                            {hasEndDate && (
                              <DatePicker
                                label="FINISH DATE:"
                                placeholder="Select end date"
                                value={endDate}
                                onChange={setEndDate}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-700 my-8"></div>

                      <div data-section="schedule" className="space-y-6">
                        <div>
                          <h3 className="text-4xl font-bold mb-2">Schedule</h3>
                          <p className="text-gray-400 text-lg">Set time of the day or day of the week</p>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className={`text-lg font-medium ${isAllDay ? "text-white" : "text-gray-400"}`}>
                                All day
                              </span>
                              <Switch
                                checked={!isAllDay}
                                onCheckedChange={(checked) => setIsAllDay(!checked)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <span className={`text-lg font-medium ${!isAllDay ? "text-white" : "text-gray-400"}`}>
                                Specific time
                              </span>
                            </div>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {!isAllDay && (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                className="text-red-400 border-red-400 hover:bg-red-400/10 bg-transparent"
                                onClick={() => setSelectedTimeSlots(new Set())}
                              >
                                CLEAR CALENDAR
                              </Button>
                            </div>
                            <WeeklyScheduleGrid
                              selectedSlots={selectedTimeSlots}
                              onSlotsChange={setSelectedTimeSlots}
                            />
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-700 my-8"></div>

                      <div data-section="budget" className="space-y-6">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-4xl font-bold">
                              {hasEndDate && startDate && endDate ? (
                                <>
                                  Your total budget
                                  <br />
                                  <span className="text-2xl text-gray-400">
                                    ({startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} -{" "}
                                    {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })})
                                  </span>
                                </>
                              ) : (
                                "Set the budget."
                              )}
                            </h3>
                            <HelpCircle className="w-5 h-5 text-gray-400" />
                          </div>
                          {!hasEndDate && (
                            <p className="text-gray-400 text-lg">
                              Since this is an ongoing campaign (no end date), you'll need set an hourly or daily spend
                              rate. You can optionally also set a spend limit as well.
                            </p>
                          )}
                        </div>

                        {hasEndDate ? (
                          <div className="space-y-6">
                            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                                <div className="lg:col-span-3 space-y-6">
                                  <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">
                                      ₹
                                    </div>
                                    <Input
                                      placeholder="Type here..."
                                      value={budgetAmount}
                                      onChange={(e) => handleBudgetChange(e.target.value)}
                                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 text-xl py-6 pl-12 pr-20 rounded-xl"
                                    />
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium text-gray-400">
                                      INR
                                    </div>
                                  </div>

                                  {budgetError && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                      <div className="w-1 h-4 bg-red-400 rounded"></div>
                                      {budgetError}
                                    </div>
                                  )}

                                  <Button
                                    onClick={handleSuggestPace}
                                    className="flex items-center gap-2 bg-transparent border border-green-600 text-green-400 hover:bg-green-600/10 rounded-xl px-6 py-3"
                                  >
                                    <Wand2 className="w-4 h-4" />
                                    SUGGEST SPEND LIMIT
                                  </Button>
                                </div>

                                <div className="lg:col-span-2 flex justify-center lg:justify-end">
                                  <div className="bg-gray-900/90 rounded-2xl p-8 w-full max-w-[280px] border border-gray-700/50 backdrop-blur-sm">
                                    <div className="text-center space-y-6">
                                      {(() => {
                                        const amount = getScoreAmount()
                                        const { score, label, color } = calculateBudgetScore(amount)

                                        // Convert score to percentage for progress bar
                                        const progressPercentage = score

                                        // Define colors for different states
                                        const getProgressColor = (label: string) => {
                                          switch (label) {
                                            case "INVALID":
                                              return "#ef4444" // red-500
                                            case "RESTRICTIVE":
                                              return "#f59e0b" // amber-500
                                            case "OKAY":
                                              return "#3b82f6" // blue-500
                                            case "GOOD":
                                              return "#10b981" // emerald-500
                                            case "EXCELLENT":
                                              return "#22c55e" // green-500
                                            case "EXCESSIVE":
                                              return "#22c55e" // green-500
                                            default:
                                              return "#6b7280" // gray-500
                                          }
                                        }

                                        const progressColor = getProgressColor(label)

                                        // Calculate the path for the progress arc
                                        const radius = 50
                                        const strokeWidth = 8
                                        const centerX = 70
                                        const centerY = 70
                                        const circumference = Math.PI * radius // Half circle circumference
                                        const strokeDasharray = circumference
                                        const strokeDashoffset =
                                          circumference - (progressPercentage / 100) * circumference

                                        return (
                                          <>
                                            <div className="relative w-36 h-20 mx-auto">
                                              <svg className="w-36 h-36" viewBox="0 0 140 140">
                                                {/* Background track */}
                                                <path
                                                  d={`M 20 70 A 50 50 0 0 1 120 70`}
                                                  stroke="#374151"
                                                  strokeWidth={strokeWidth}
                                                  fill="none"
                                                  strokeLinecap="round"
                                                  opacity="0.3"
                                                />
                                                {/* Progress arc */}
                                                <path
                                                  d={`M 20 70 A 50 50 0 0 1 120 70`}
                                                  stroke={progressColor}
                                                  strokeWidth={strokeWidth}
                                                  fill="none"
                                                  strokeLinecap="round"
                                                  strokeDasharray={strokeDasharray}
                                                  strokeDashoffset={strokeDashoffset}
                                                  style={{
                                                    transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    filter: `drop-shadow(0 0 12px ${progressColor}40)`,
                                                  }}
                                                />
                                              </svg>
                                            </div>
                                            <div className="space-y-3">
                                              <div
                                                className="text-2xl font-bold tracking-wider"
                                                style={{ color: progressColor }}
                                              >
                                                {label}
                                              </div>
                                              <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
                                                BUDGET SCORE
                                              </div>
                                            </div>
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                              <button
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className="flex items-center gap-3 w-full text-left"
                              >
                                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">A</span>
                                </div>
                                <span className="text-lg font-medium text-green-400">Advanced: Spend Pacing</span>
                                <ChevronDown
                                  className={`w-4 h-4 text-green-400 ml-auto transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
                                />
                              </button>

                              {isAdvancedOpen && (
                                <div className="mt-6 space-y-6">
                                  <div className="border-t border-gray-700 pt-6">
                                    <div>
                                      <h4 className="text-lg font-medium mb-2">Set your spend rate (pace).</h4>
                                      <p className="text-gray-400 text-sm">
                                        Control spend rate by the hour or by the day. Or, just leave it on automatic.
                                      </p>
                                    </div>

                                    <div className="mt-4 flex items-center bg-gray-700/50 rounded-lg p-1 w-fit">
                                      <button
                                        onClick={() => setPaceType("auto")}
                                        className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                                          paceType === "auto"
                                            ? "bg-green-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                      >
                                        AUTO
                                      </button>
                                      {/* Vertical line separator */}
                                      <div className="w-px h-6 bg-gray-600 mx-2"></div>
                                      <button
                                        onClick={() => setPaceType("hourly")}
                                        className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                                          paceType === "hourly"
                                            ? "bg-green-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                      >
                                        HOURLY PACE
                                      </button>
                                      {/* Vertical line separator */}
                                      <div className="w-px h-6 bg-gray-600 mx-2"></div>
                                      <button
                                        onClick={() => setPaceType("daily")}
                                        className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                                          paceType === "daily"
                                            ? "bg-green-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                      >
                                        DAILY PACE
                                      </button>
                                      <HelpCircle className="w-4 h-4 text-gray-400 ml-2" />
                                    </div>

                                    {(paceType === "hourly" || paceType === "daily") && (
                                      <div className="mt-4">
                                        <div className="relative max-w-md">
                                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-bold text-gray-400">
                                            ₹
                                          </div>
                                          <Input
                                            placeholder={`Enter ${paceType} amount...`}
                                            value={paceAmount}
                                            onChange={(e) => setPaceAmount(e.target.value)}
                                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 text-lg py-4 pl-12 pr-16"
                                          />
                                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-400">
                                            INR
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center bg-gray-700/50 rounded-xl p-1 border border-gray-600/50">
                                <button
                                  onClick={() => setBudgetType("hourly")}
                                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    budgetType === "hourly"
                                      ? "bg-green-600 text-white shadow-lg"
                                      : "text-gray-400 hover:text-white hover:bg-gray-600/30"
                                  }`}
                                >
                                  HOURLY BUDGET
                                </button>
                                <span className="px-4 text-gray-500 font-medium text-sm">- OR -</span>
                                <button
                                  onClick={() => setBudgetType("daily")}
                                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    budgetType === "daily"
                                      ? "bg-green-600 text-white shadow-lg"
                                      : "text-gray-400 hover:text-white hover:bg-gray-600/30"
                                  }`}
                                >
                                  DAILY BUDGET
                                </button>
                              </div>
                              <HelpCircle className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                              <div className="lg:col-span-3 space-y-6">
                                <div className="relative">
                                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">
                                    ₹
                                  </div>
                                  <Input
                                    placeholder="6"
                                    value={budgetAmount}
                                    onChange={(e) => handleBudgetChange(e.target.value)}
                                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 text-xl py-6 pl-12 pr-20 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  />
                                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium text-gray-400">
                                    INR
                                  </div>
                                </div>

                                {budgetError && (
                                  <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <div className="w-1 h-4 bg-red-400 rounded"></div>
                                    {budgetError}
                                  </div>
                                )}

                                <Button
                                  onClick={handleSuggestPace}
                                  className="flex items-center gap-2 bg-transparent border border-green-600 text-green-400 hover:bg-green-600/10 rounded-xl px-6 py-3 transition-all duration-200"
                                >
                                  <Wand2 className="w-4 h-4" />
                                  SUGGEST {budgetType.toUpperCase()} PACE
                                </Button>
                              </div>

                              <div className="lg:col-span-2 flex justify-center lg:justify-end">
                                <div className="bg-gray-900/90 rounded-2xl p-8 w-full max-w-[280px] border border-gray-700/50 backdrop-blur-sm">
                                  <div className="text-center space-y-6">
                                    {(() => {
                                      const amount = Number.parseFloat(budgetAmount) || 0
                                      const { score, label, color } = calculateBudgetScore(amount)

                                      // Convert score to percentage for progress bar
                                      const progressPercentage = score

                                      // Define colors for different states
                                      const getProgressColor = (label: string) => {
                                        switch (label) {
                                          case "INVALID":
                                            return "#ef4444" // red-500
                                          case "RESTRICTIVE":
                                            return "#f59e0b" // amber-500
                                          case "OKAY":
                                            return "#3b82f6" // blue-500
                                          case "GOOD":
                                            return "#10b981" // emerald-500
                                          case "EXCELLENT":
                                            return "#22c55e" // green-500
                                          case "EXCESSIVE":
                                            return "#22c55e" // green-500
                                          default:
                                            return "#6b7280" // gray-500
                                        }
                                      }

                                      const progressColor = getProgressColor(label)

                                      // Calculate the path for the progress arc
                                      const radius = 50
                                      const strokeWidth = 8
                                      const centerX = 70
                                      const centerY = 70
                                      const circumference = Math.PI * radius // Half circle circumference
                                      const strokeDasharray = circumference
                                      const strokeDashoffset =
                                        circumference - (progressPercentage / 100) * circumference

                                      return (
                                        <>
                                          <div className="relative w-36 h-20 mx-auto">
                                            <svg className="w-36 h-36" viewBox="0 0 140 140">
                                              {/* Background track */}
                                              <path
                                                d={`M 20 70 A 50 50 0 0 1 120 70`}
                                                stroke="#374151"
                                                strokeWidth={strokeWidth}
                                                fill="none"
                                                strokeLinecap="round"
                                                opacity="0.3"
                                              />
                                              {/* Progress arc */}
                                              <path
                                                d={`M 20 70 A 50 50 0 0 1 120 70`}
                                                stroke={progressColor}
                                                strokeWidth={strokeWidth}
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeDasharray={strokeDasharray}
                                                strokeDashoffset={strokeDashoffset}
                                                style={{
                                                  transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
                                                  filter: `drop-shadow(0 0 12px ${progressColor}40)`,
                                                }}
                                              />
                                            </svg>
                                          </div>
                                          <div className="space-y-3">
                                            <div
                                              className="text-2xl font-bold tracking-wider"
                                              style={{ color: progressColor }}
                                            >
                                              {label}
                                            </div>
                                            <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
                                              BUDGET SCORE
                                            </div>
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add more content to demonstrate scrolling */}
                      <div className="space-y-6 pt-8"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-[368px] shrink-0 relative">
                <CampaignSummarizer
                  startDate={startDate}
                  endDate={endDate}
                  hasEndDate={hasEndDate}
                  scheduleMetrics={scheduleMetrics}
                  budgetAmount={budgetAmount}
                  budgetType={budgetType}
                  paceType={paceType}
                  paceAmount={paceAmount}
                  currentStep={currentStep}
                  activeSection={activeSection}
                  isAllDay={isAllDay}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-7xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Header, Description, and Your Uploads */}
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold mb-4">
                      Upload <span className="text-green-400">pretty</span> artworks.
                    </h2>
                    <p className="text-gray-400 text-lg">
                      <span className="text-blue-400">You can do this later.</span> You'll be able to add artworks later
                      on, but if you've got some prepared already - upload them here.
                    </p>
                  </div>

                  {/* Your Uploads - Always Expanded */}
                  <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="w-full p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-white">Your Uploads</span>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <div className="p-4 border-t border-gray-700">
                      {uploadedFiles.length > 0 ? (
                        <div className="space-y-3">
                          {uploadedFiles.map((file) => (
                            <div key={file.id} className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                {file.type.startsWith("image/") ? (
                                  <img
                                    src={file.url || "/placeholder.svg"}
                                    alt={file.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <svg
                                    className="w-6 h-6 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-white text-sm">{file.name}</h4>
                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button
                                onClick={() => setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-700/50 rounded-lg p-6 text-center">
                          <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-medium text-white mb-1">Ghostly feels. No artworks here.</h3>
                          <p className="text-sm text-gray-400">
                            Upload some artworks using the bulk uploader, or by clicking the plus button on the
                            individual resolutions you see.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Upload Options Only */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Add from Gallery */}
                    <button
                      onClick={() => setShowGalleryModal(true)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-700/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Add from</h3>
                          <h3 className="font-medium text-white">Gallery</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">Select multiple previously-uploaded artworks.</p>
                    </button>

                    {/* Bulk Uploader */}
                    <div
                      className={`bg-gray-800/50 border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ${
                        isDragOver ? "border-green-500 bg-green-500/10" : "border-gray-600 hover:border-gray-500"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      />
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center mx-auto mb-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <h3 className="font-medium text-white mb-1">Bulk Uploader.</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Upload up to 5 files by clicking (or dragging) here.
                        </p>
                        <p className="text-xs text-gray-500">Max. File Size: 7 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {showGalleryModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Pick some artworks.</h2>
                    <button
                      onClick={() => setShowGalleryModal(false)}
                      className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 flex">
                    {/* Left Section - Gallery */}
                    <div className="flex-1 p-6 border-r border-gray-700">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-white mb-2">Artworks in your gallery.</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          FYI - only showing artworks that match the required spec.
                        </p>

                        {/* Search Bar */}
                        <div className="relative">
                          <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <input
                            type="text"
                            placeholder="Find a file by name...if you want."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>

                      {/* Gallery Content */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="bg-white rounded-lg p-8 text-center max-w-sm">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">Ghostly feels.</h4>
                          <p className="text-gray-900">
                            There's <strong>no artwork</strong> here.
                          </p>
                        </div>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-center gap-4 mt-6">
                        <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-400">PAGE 1 OF 0</span>
                        <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Right Section - Required Specs */}
                    <div className="w-80 p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-white mb-2">Required specs.</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Pick some artworks from your gallery that match these specs below.
                        </p>

                        {/* Filter Buttons */}
                        <div className="flex gap-2 mb-6">
                          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium">
                            SHOW ALL
                          </button>
                          <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">
                            MISSING ONLY
                          </button>
                        </div>
                      </div>

                      {/* Spec Cards */}
                      <div className="space-y-4">
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">1080 x 1920 Portrait.</span>
                            <div className="w-4 h-4 border-2 border-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">6 - 30 seconds</p>
                          <div className="flex gap-1 mt-2">
                            <span className="px-2 py-1 bg-gray-700 text-xs text-white rounded">STATIC</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-white rounded">VIDEO</span>
                            <span className="px-2 py-1 bg-yellow-500 text-xs text-black rounded">NO AUDIO</span>
                          </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">1080 x 1920 Portrait.</span>
                            <div className="w-4 h-4 border-2 border-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">6 seconds</p>
                          <div className="flex gap-1 mt-2">
                            <span className="px-2 py-1 bg-gray-700 text-xs text-white rounded">STATIC</span>
                            <span className="px-2 py-1 bg-gray-700 text-xs text-white rounded">VIDEO</span>
                            <span className="px-2 py-1 bg-yellow-500 text-xs text-black rounded">NO AUDIO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between p-6 border-t border-gray-700">
                    <button
                      onClick={() => setShowGalleryModal(false)}
                      className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      CLOSE
                    </button>
                    <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      ADD TO CAMPAIGN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="mb-12">
                  <h1 className="text-4xl font-bold text-white mb-2">The Summary.</h1>
                </div>

                {/* Generate Proposal Toggle */}

                <div className="border-t border-gray-700/50"></div>

                {/* Campaign Name */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Campaign Name</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-white">{formData.campaignName || "Untitled Campaign"}</div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
                    >
                      EDIT NAME
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-700/50"></div>

                {/* Campaign Ownership & Credits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Credits</h2>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">CREDITS AVAILABLE</div>
                    <div className="text-xl text-white mb-2">
                      $0.00 <span className="text-sm text-gray-400">USD</span>
                    </div>
                    <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                      TOP UP
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-700/50"></div>

                {/* Dates & Schedule */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Dates & Schedule</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">START DATE</div>
                        <div className="text-xl text-white mb-2">{formData.startDate || "20 Aug 25"}</div>
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
                        >
                          CHANGE
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">END DATE</div>
                        <div className="text-xl text-white">{formData.endDate || "Not Set"}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">{hasEndDate ? "Fixed" : "On-going"}</div>
                        <div className="text-sm text-gray-400">
                          {hasEndDate
                            ? "Runs between your start and end dates."
                            : "Will run continuously from your start date, or until you stop it."}
                        </div>
                      </div>
                    </div>

                    {/* Weekly Schedule */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2">
                        {formatWeeklySummary(isAllDay, selectedTimeSlots).map(({ day, label, variant }) => (
                          <div key={day} className="text-center">
                            <div className="text-sm text-gray-400 mb-2">{day}</div>
                            <div
                              className={[
                                "px-3 py-2 rounded-full text-xs font-medium",
                                variant === "all"
                                  ? "bg-green-600 text-white"
                                  : variant === "range"
                                    ? "bg-gray-700 text-white"
                                    : "bg-yellow-500 text-gray-900",
                              ].join(" ")}
                            >
                              {label === "All day"
                                ? "All day"
                                : label === "NONE"
                                  ? "NONE"
                                  : // convert 24h "HH:MM-HH:MM" to "hAM - hPM"
                                    label
                                      .split(", ")
                                      .map((r) => {
                                        const [a, b] = r.split("-")
                                        const to12h = (t: string) => {
                                          const [H, M] = t.split(":").map(Number)
                                          const S = H >= 12 ? "PM" : "AM"
                                          const h = H % 12 === 0 ? 12 : H % 12
                                          return `${h}${M ? ":" + String(M).padStart(2, "0") : ""}${S}`
                                        }
                                        return `${to12h(a)} - ${to12h(b)}`
                                      })
                                      .join(", ")}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        CHANGE
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/50"></div>

                {/* Budget & Spend Limits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Budget & Spend Limits</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">TOTAL BUDGET</div>
                        <div className="text-xl text-white mb-2">{formData.budget || "Not set"}</div>
                        <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                          CHANGE
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">BID CAPPING</div>
                        <div className="text-xl text-white mb-2">Automatic</div>
                        <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                          CHANGE
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">SPEND PACING</div>
                      <div className="text-xl text-white mb-2">Hourly ($34.00/hr)</div>
                      <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                        CHANGE
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/50"></div>

                {/* Boards in this Campaign */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Boards in this Campaign</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">BOARDS SELECTED</div>
                      <div className="text-4xl font-bold text-white mb-2">{formData.selectedBoards?.length || 2}</div>
                      <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                        CHANGE
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">SUGGESTED BUDGET</div>
                      <div className="text-2xl font-bold text-white mb-1">
                        $0.64 <span className="text-sm text-gray-400">$/hr</span>
                      </div>
                      <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                        REVIEW
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/50"></div>

                {/* Artworks Required */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Artworks Required</h2>
                  </div>
                  <div className="space-y-4">
                    {/* Warning */}
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <div className="font-semibold text-yellow-500 mb-1">
                            You haven't submitted enough artworks.
                          </div>
                          <div className="text-sm text-yellow-200">
                            Your ads cover only <span className="font-semibold">0%</span> of the resolutions in your
                            selected boards (and regions). I recommend uploading more artworks so that you can increase
                            this coverage to 80% or more.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">UNIQUE RESOLUTIONS</div>
                        <div className="text-4xl font-bold text-white">1</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">ARTWORKS SUPPLIED</div>
                        <div className="text-4xl font-bold text-white mb-2">{uploadedFiles.length}</div>
                        <button className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium">
                          CHANGE
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/50"></div>

                {/* Projected Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Projected Results</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-white mb-1">~120</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          AD PLAYS | PER DAY
                          <HelpCircle className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-white mb-1">140 - 216</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          TOTAL AUDIENCE | PER DAY
                          <HelpCircle className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-white mb-1">
                          24.0 <span className="text-lg">mins.</span>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          SCREEN TIME | PER DAY
                          <HelpCircle className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-green-400 mb-1">$7.63</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          EXPECTED SPEND | PER DAY
                          <HelpCircle className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Ongoing campaign - Daily figures shown here.</span>
                      <HelpCircle className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer with Navigation */}
      <footer className="flex items-center justify-between p-6 border-t border-gray-800 relative z-10">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="text-sm text-gray-400">
          Step {currentStep} of {steps.length}
        </div>

        <Button
          onClick={() => {
            if (currentStep === steps.length) {
              router.push("/campaigns")
            } else {
              handleNext()
            }
          }}
          disabled={
            // keep validations for steps 1 and 3, but never disable on the last step
            (currentStep === 1 && !campaignName.trim()) || (currentStep === 3 && !isBudgetValid())
          }
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Save & Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </footer>

      {/* Bottom Progress Bar */}
      <div className="px-6 pb-4 relative z-10">
        <Progress value={progress} className="w-full h-2" />
      </div>
    </div>
  )
}
