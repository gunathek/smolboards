"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, DollarSign, ChevronRight, ChevronDown } from "lucide-react"

interface CampaignSummarizerProps {
  startDate?: Date
  endDate?: Date
  hasEndDate: boolean
  scheduleMetrics: {
    dailyAverage: number
    weeklyActive: number
    totalHours?: number // Made totalHours optional to handle cases where it shouldn't be shown
  }
  budgetAmount: string
  budgetType: "hourly" | "daily"
  paceType: "auto" | "hourly" | "daily"
  paceAmount: string
  currentStep?: number
  activeSection?: "dates" | "schedule" | "budget"
  isAllDay?: boolean // Added isAllDay prop to handle all-day schedule logic
}

interface SectionState {
  dates: boolean
  schedule: boolean
  budget: boolean
}

export function CampaignSummarizer({
  startDate,
  endDate,
  hasEndDate,
  scheduleMetrics,
  budgetAmount,
  budgetType,
  paceType,
  paceAmount,
  currentStep = 3,
  activeSection,
  isAllDay = false, // Added isAllDay prop with default value
}: CampaignSummarizerProps) {
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    dates: true,
    schedule: false,
    budget: false,
  })

  useEffect(() => {
    if (activeSection) {
      setExpandedSections({
        dates: activeSection === "dates",
        schedule: activeSection === "schedule",
        budget: activeSection === "budget",
      })
    }
  }, [activeSection])

  const hasValidBudget = () => {
    const amount = Number.parseFloat(budgetAmount)
    return budgetAmount.trim() !== "" && !isNaN(amount) && amount > 0
  }

  const toggleSection = (section: keyof SectionState) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="sticky top-6 h-fit bg-gray-900/98 backdrop-blur-md border border-gray-700/80 rounded-xl shadow-2xl z-50 m-6 overflow-hidden">
      <div className="bg-gray-800/60 px-5 py-4 border-b border-gray-700/60">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ON THIS PAGE</h3>
      </div>

      <div className="bg-gray-800/20">
        {/* Set Dates Section */}
        <div className="border-b border-gray-700/50">
          <button
            onClick={() => toggleSection("dates")}
            className="w-full p-5 flex items-center gap-4 hover:bg-gray-700/15 transition-all duration-200"
          >
            <div className="w-7 h-7 bg-green-600/90 rounded-lg flex items-center justify-center shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-white flex-1 text-left text-sm">Set Dates</span>
            {expandedSections.dates ? (
              <ChevronDown className="w-4 h-4 text-green-400 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-green-400 transition-transform duration-200" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              expandedSections.dates ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-5">
              <div className="flex items-center justify-between bg-gray-700/25 rounded-xl p-4 border border-gray-700/30">
                <div className="text-center">
                  <div className="text-base font-semibold text-green-400">
                    {startDate
                      ? startDate.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })
                      : "Not set"}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">START DATE</div>
                </div>

                <div className="text-green-500/70">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>

                <div className="text-center">
                  <div className="text-base font-semibold text-green-400">
                    {hasEndDate && endDate
                      ? endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                      : "ongoing"}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">END DATE</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Set Schedule Section */}
        <div className="border-b border-gray-700/50">
          <button
            onClick={() => toggleSection("schedule")}
            className="w-full p-5 flex items-center gap-4 hover:bg-gray-700/15 transition-all duration-200"
          >
            <div className="w-7 h-7 bg-green-600/90 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-white flex-1 text-left text-sm">Set Schedule</span>
            {expandedSections.schedule ? (
              <ChevronDown className="w-4 h-4 text-green-400 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-green-400 transition-transform duration-200" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              expandedSections.schedule ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-5">
              <div className={`grid gap-3 ${scheduleMetrics.totalHours !== undefined ? "grid-cols-3" : "grid-cols-2"}`}>
                <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                  <div className="text-base font-semibold text-white">{scheduleMetrics.dailyAverage}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide leading-tight mt-1">
                    DAILY HOURS
                    <br />
                    (AVG)
                  </div>
                </div>

                <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                  <div className="text-base font-semibold text-white">{scheduleMetrics.weeklyActive}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide leading-tight mt-1">
                    WEEKLY ACTIVE
                    <br />
                    HOURS
                  </div>
                </div>

                {scheduleMetrics.totalHours !== undefined && (
                  <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                    <div className="text-base font-semibold text-white">~{scheduleMetrics.totalHours}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide leading-tight mt-1">TOTAL HOURS</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Set Budget Section */}
        <div className={`${hasValidBudget() ? "border-b border-gray-700/50" : ""}`}>
          <button
            onClick={() => toggleSection("budget")}
            className="w-full p-5 flex items-center gap-4 hover:bg-gray-700/15 transition-all duration-200"
          >
            <div className="w-7 h-7 bg-green-600/90 rounded-lg flex items-center justify-center shadow-sm">
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-white flex-1 text-left text-sm">Set Budget</span>
            {expandedSections.budget ? (
              <ChevronDown className="w-4 h-4 text-green-400 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-green-400 transition-transform duration-200" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              expandedSections.budget ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-5">
              {hasEndDate ? (
                // When end date is selected - show pace and total budget
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                    <div className="text-base font-semibold text-white">
                      {paceType === "auto"
                        ? "Auto"
                        : paceAmount
                          ? `₹${paceAmount} / ${paceType === "hourly" ? "hr" : "day"}`
                          : `${paceType === "hourly" ? "Hourly" : "Daily"}`}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">SPEND PACING</div>
                  </div>

                  <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                    <div className="text-base font-semibold text-white">
                      {budgetAmount ? `₹${budgetAmount}` : "Not set"}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">SPEND LIMIT</div>
                  </div>
                </div>
              ) : (
                // When no end date - show budget type and amount
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                    <div className="text-base font-semibold text-white">
                      {budgetAmount ? `₹${budgetAmount}` : "Not set"}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                      {budgetType.toUpperCase()} BUDGET
                    </div>
                  </div>

                  <div className="bg-gray-700/25 rounded-xl p-3 text-center border border-gray-700/30">
                    <div className="text-base font-semibold text-white">
                      {budgetAmount ? `₹${budgetAmount} / ${budgetType === "hourly" ? "hr" : "day"}` : "Not set"}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">SPEND RATE</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasValidBudget() && (
          <div className="p-5">
            <h4 className="text-base font-semibold text-white mb-4">Projected Outcomes</h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Estimated Plays</span>
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-500/60 flex items-center justify-center">
                    <span className="text-xs text-gray-500">?</span>
                  </div>
                </div>
                <span className="text-gray-400 font-medium text-sm">~90 plays</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Estimated Audience</span>
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-500/60 flex items-center justify-center">
                    <span className="text-xs text-gray-500">?</span>
                  </div>
                </div>
                <span className="text-gray-400 font-medium text-sm">149 - 229 reach</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Total Screentime</span>
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-500/60 flex items-center justify-center">
                    <span className="text-xs text-gray-500">?</span>
                  </div>
                </div>
                <span className="text-gray-400 font-medium text-sm">11.7 mins.</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Estimated Spend</span>
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-500/60 flex items-center justify-center">
                    <span className="text-xs text-gray-500">?</span>
                  </div>
                </div>
                <span className="text-green-400 font-medium text-sm">₹7.00</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
