"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { X, ArrowLeft, ArrowRight, ChevronDown, HelpCircle, Wand2 } from "lucide-react"
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
                                  <div className="bg-gray-900/80 rounded-2xl p-8 w-full max-w-[240px] border border-gray-700/50 backdrop-blur-sm">
                                    <div className="text-center space-y-6">
                                      {(() => {
                                        const amount = getScoreAmount()
                                        const { score, label, color } = calculateBudgetScore(amount)

                                        // Calculate position for the arc segment (0-180 degrees for semi-circle)
                                        const angle = (score / 100) * 180 - 90 // Convert to SVG rotation (-90 to +90)
                                        const radius = 45
                                        const centerX = 60
                                        const centerY = 60

                                        // Calculate arc segment endpoints
                                        const startAngle = angle - 15 // 30-degree arc segment
                                        const endAngle = angle + 15

                                        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
                                        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
                                        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
                                        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

                                        return (
                                          <>
                                            <div className="relative w-32 h-16 mx-auto">
                                              <svg className="w-32 h-32" viewBox="0 0 120 120">
                                                {/* Background track - subtle gray arc */}
                                                <path
                                                  d={`M 15 60 A 45 45 0 0 1 105 60`}
                                                  stroke="currentColor"
                                                  strokeWidth="3"
                                                  fill="none"
                                                  className="text-gray-800/40"
                                                />
                                                {/* Active arc segment */}
                                                <path
                                                  d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
                                                  stroke="currentColor"
                                                  strokeWidth="6"
                                                  fill="none"
                                                  className={color.replace("text-", "text-")}
                                                  strokeLinecap="round"
                                                  style={{
                                                    transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    filter: "drop-shadow(0 0 8px currentColor)",
                                                  }}
                                                />
                                              </svg>
                                            </div>
                                            <div className="space-y-3">
                                              <div className={`text-xl font-bold ${color} tracking-wider`}>{label}</div>
                                              <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">
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
                                <div className="bg-gray-900/80 rounded-2xl p-8 w-full max-w-[240px] border border-gray-700/50 backdrop-blur-sm">
                                  <div className="text-center space-y-6">
                                    {(() => {
                                      const amount = Number.parseFloat(budgetAmount) || 0
                                      const { score, label, color } = calculateBudgetScore(amount)

                                      // Calculate position for the arc segment (0-180 degrees for semi-circle)
                                      const angle = (score / 100) * 180 - 90 // Convert to SVG rotation (-90 to +90)
                                      const radius = 45
                                      const centerX = 60
                                      const centerY = 60

                                      // Calculate arc segment endpoints
                                      const startAngle = angle - 15 // 30-degree arc segment
                                      const endAngle = angle + 15

                                      const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
                                      const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
                                      const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
                                      const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

                                      return (
                                        <>
                                          <div className="relative w-32 h-16 mx-auto">
                                            <svg className="w-32 h-32" viewBox="0 0 120 120">
                                              {/* Background track - subtle gray arc */}
                                              <path
                                                d={`M 15 60 A 45 45 0 0 1 105 60`}
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                fill="none"
                                                className="text-gray-800/40"
                                              />
                                              {/* Active arc segment */}
                                              <path
                                                d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
                                                stroke="currentColor"
                                                strokeWidth="6"
                                                fill="none"
                                                className={color.replace("text-", "text-")}
                                                strokeLinecap="round"
                                                style={{
                                                  transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                                                }}
                                              />
                                            </svg>
                                          </div>
                                          <div className="space-y-3">
                                            <div className={`text-xl font-bold ${color} tracking-wider`}>{label}</div>
                                            <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">
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
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-4">Upload Creatives</h2>
                <p className="text-gray-400 text-lg">Add your creative assets for the campaign.</p>
              </div>

              <div className="p-8 border border-gray-700 rounded-lg">
                <p className="text-gray-500">Creative upload interface coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-4">Review Summary</h2>
                <p className="text-gray-400 text-lg">Review your campaign details before launching.</p>
              </div>

              <div className="p-8 border border-gray-700 rounded-lg">
                <p className="text-gray-500">Campaign summary coming soon...</p>
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
          onClick={handleNext}
          disabled={
            currentStep === steps.length ||
            (currentStep === 1 && !campaignName.trim()) ||
            (currentStep === 3 && !isBudgetValid())
          }
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {currentStep === steps.length ? "Launch Campaign" : "Save & Continue"}
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
