"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { X, ArrowLeft, ArrowRight, ChevronDown, Calendar, DollarSign, Clock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const steps = [
  { id: 1, name: "Name Campaign", description: "Give your campaign a memorable name" },
  { id: 2, name: "Select Boards", description: "Pick your billboard locations" },
  { id: 3, name: "Schedule & Budget", description: "Set timing and budget" },
  { id: 4, name: "Upload Creatives", description: "Add your creative assets" },
  { id: 5, name: "Review Summary", description: "Review and launch campaign" },
]

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
    if (stepId === 1 || (stepId === 2 && campaignName.trim())) {
      if (stepId === 2) {
        router.push(`/map?campaign=true&step=2&name=${encodeURIComponent(campaignName)}`)
      } else {
        setCurrentStep(stepId)
      }
    }
  }

  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
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
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {currentStep === 1 && (
            <div className="text-center space-y-6">
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
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">Schedule & Budget</h2>
                <p className="text-gray-400 text-lg">Set your campaign timing and budget allocation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Schedule Card */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Calendar className="h-5 w-5" />
                      Campaign Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="start-date" className="text-gray-300">
                        Start Date
                      </Label>
                      <Input id="start-date" type="date" className="bg-gray-800 border-gray-600 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-gray-300">
                        End Date
                      </Label>
                      <Input id="end-date" type="date" className="bg-gray-800 border-gray-600 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="time-slots" className="text-gray-300">
                        Time Slots
                      </Label>
                      <Select>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select time slots" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all-day">All Day (6 AM - 11 PM)</SelectItem>
                          <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
                          <SelectItem value="evening">Evening (6 PM - 11 PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget Card */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <DollarSign className="h-5 w-5" />
                      Budget Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="total-budget" className="text-gray-300">
                        Total Budget
                      </Label>
                      <Input
                        id="total-budget"
                        type="number"
                        placeholder="Enter total budget"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget-type" className="text-gray-300">
                        Budget Type
                      </Label>
                      <Select>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select budget type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="daily">Daily Budget</SelectItem>
                          <SelectItem value="total">Total Campaign Budget</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Estimated Reach</span>
                      </div>
                      <p className="text-2xl font-bold text-white">~50,000</p>
                      <p className="text-sm text-gray-400">impressions per day</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected Boards Summary */}
              {selectedBoards.length > 0 && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Selected Boards ({selectedBoards.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      You have selected {selectedBoards.length} billboard{selectedBoards.length !== 1 ? "s" : ""} for
                      this campaign.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-4">Upload Creatives</h2>
                <p className="text-gray-400 text-lg">Add your creative assets for the campaign.</p>
              </div>

              <div className="p-8 border border-gray-700 rounded-lg">
                <p className="text-gray-500">Creative upload interface coming soon...</p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-4">Review Summary</h2>
                <p className="text-gray-400 text-lg">Review your campaign details before launching.</p>
              </div>

              <div className="p-8 border border-gray-700 rounded-lg">
                <p className="text-gray-500">Campaign summary coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Navigation */}
      <footer className="flex items-center justify-between p-6 border-t border-gray-800">
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
          disabled={currentStep === steps.length || (currentStep === 1 && !campaignName.trim())}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {currentStep === steps.length ? "Launch Campaign" : "Save & Continue"}
          <ArrowRight className="w-4 w-4" />
        </Button>
      </footer>

      {/* Bottom Progress Bar */}
      <div className="px-6 pb-4">
        <Progress value={progress} className="w-full h-2" />
      </div>
    </div>
  )
}
