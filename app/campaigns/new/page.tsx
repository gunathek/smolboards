"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, ArrowRight, Check, Info, ArrowLeft, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

type CampaignStep = {
  id: number
  title: string
  description: string
  completed: boolean
  current: boolean
}

type CampaignData = {
  name: string
  selectionMethod: "hand-select" | "bulk-select" | null
}

const CAMPAIGN_STEPS: CampaignStep[] = [
  { id: 1, title: "Name Campaign", description: "Give your campaign a name", completed: false, current: true },
  {
    id: 2,
    title: "Selection Method",
    description: "Choose how to select billboards",
    completed: false,
    current: false,
  },
  { id: 3, title: "Select Boards", description: "Choose your billboards", completed: false, current: false },
  { id: 4, title: "Schedule & Budget", description: "Set timing and budget", completed: false, current: false },
  { id: 5, title: "Upload Creatives", description: "Add your ad content", completed: false, current: false },
  { id: 6, title: "Review Summary", description: "Final review and launch", completed: false, current: false },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [steps, setSteps] = useState(CAMPAIGN_STEPS)
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    selectionMethod: null,
  })

  const currentStepData = steps.find((step) => step.id === currentStep)
  const measurableStepsCount = CAMPAIGN_STEPS.length - 1
  const completedMeasurableSteps = Math.min(currentStep - 1, measurableStepsCount)
  const progress = (completedMeasurableSteps / measurableStepsCount) * 100

  const updateStepStatus = (stepId: number, completed: boolean, current: boolean) => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        completed: step.id < stepId ? true : step.id === stepId ? completed : false,
        current: step.id === stepId ? current : false,
      })),
    )
  }

  const canProceedToStep = (stepId: number) => {
    // Can always go to step 1
    if (stepId === 1) return true

    // To proceed to stepId, all steps from 1 to (stepId - 1) must be completed.
    for (let i = 1; i < stepId; i++) {
      if (!isStepComplete(i)) {
        return false
      }
    }
    return true
  }

  const handleStepChange = (stepId: number) => {
    if (canProceedToStep(stepId)) {
      setCurrentStep(stepId)
      updateStepStatus(stepId, false, true)
    }
  }

  const handleNext = () => {
    let canProceed = false

    if (currentStep === 1 && campaignData.name.trim()) {
      canProceed = true
      updateStepStatus(1, true, false)
    } else if (currentStep === 2 && campaignData.selectionMethod) {
      canProceed = true
      updateStepStatus(2, true, false)
    }

    if (canProceed && currentStep < steps.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      updateStepStatus(nextStep, false, true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      updateStepStatus(prevStep, false, true)
    }
  }

  const handleBack = () => {
    router.push("/home")
  }

  const isStepComplete = (stepId: number) => {
    if (stepId === 1) return campaignData.name.trim() !== ""
    if (stepId === 2) return campaignData.selectionMethod !== null
    return false
  }

  const canProceedFromCurrentStep = isStepComplete(currentStep)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={handleBack} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Create New Campaign</h1>
                <p className="text-sm text-gray-400">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>

            {/* Step Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800">
                  {currentStepData?.title}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-gray-900 border-gray-700">
                {steps.map((step) => (
                  <DropdownMenuItem
                    key={step.id}
                    onClick={() => handleStepChange(step.id)}
                    disabled={!canProceedToStep(step.id)}
                    className="flex items-center gap-3 p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : step.current
                            ? "bg-white text-black"
                            : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {step.completed ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs text-gray-400">{step.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold mb-4">Give it a name.</h2>
                  <p className="text-gray-400 text-lg">
                    Choose a memorable name for your campaign that helps you identify it later.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    value={campaignData.name}
                    onChange={(e) => setCampaignData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter campaign name..."
                    className="text-2xl h-16 bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500">
                    Campaign names should be descriptive and unique within your account.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold mb-4">{"How'd you like to pick your boards?"}</h2>
                  <p className="text-gray-400 text-lg">
                    Choose the method that best fits your campaign strategy and requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hand-select Option */}
                  <Card
                    className={`p-6 cursor-pointer transition-all duration-200 ${
                      campaignData.selectionMethod === "hand-select"
                        ? "bg-gray-900 border-green-500 border-2"
                        : "bg-gray-900 border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setCampaignData((prev) => ({ ...prev, selectionMethod: "hand-select" }))}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Hand-select Boards</h3>
                        {campaignData.selectionMethod === "hand-select" && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400">
                        Best for being super selective about which boards you want to target.
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          See all available boards on a map
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          Filter boards to find the one(s) you want
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          See each board in detail
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          Upload custom data overlays to map
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 bg-gray-600 rounded-full" />
                          Slow for address targeting/geofencing
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Bulk-select Option */}
                  <Card
                    className={`p-6 cursor-pointer transition-all duration-200 relative ${
                      campaignData.selectionMethod === "bulk-select"
                        ? "bg-gray-900 border-green-500 border-2"
                        : "bg-gray-900 border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setCampaignData((prev) => ({ ...prev, selectionMethod: "bulk-select" }))}
                  >
                    <Badge className="absolute top-4 right-4 bg-green-500 text-black">Advanced</Badge>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between pr-20">
                        <h3 className="text-xl font-semibold">Bulk-select Boards</h3>
                        {campaignData.selectionMethod === "bulk-select" && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400">
                        Give me a bunch of locations and set a targeting radius. Best for when you have addresses you
                        need to target.
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          Upload CSV of addresses
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          Geofence/target multiple locations easily
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Check className="h-4 w-4" />
                          Quick for address-targeted campaigns
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 bg-gray-600 rounded-full" />
                          No granular board selection
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 bg-gray-600 rounded-full" />
                          No map data overlays
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gray-900 border-gray-700 sticky top-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Campaign Progress</h3>
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            step.completed
                              ? "bg-green-500 text-white"
                              : step.current
                                ? "bg-white text-black"
                                : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {step.completed ? <Check className="h-3 w-3" /> : step.id}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm ${step.current ? "text-white" : "text-gray-400"}`}>{step.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {currentStep === 1 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Naming Tips
                    </h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Use descriptive names</li>
                      <li>• Include location or target audience</li>
                      <li>• Keep it under 50 characters</li>
                      <li>• Avoid special characters</li>
                    </ul>
                  </div>
                )}

                {currentStep === 2 && campaignData.selectionMethod === "hand-select" && (
                  <div>
                    <h4 className="font-medium mb-2">Hand-select Method</h4>
                    <p className="text-sm text-gray-400">
                      In the next step, {"you'll"} be able to pick the boards {"you're"} after by hand selecting them on
                      a map. Yay.
                    </p>
                  </div>
                )}

                {currentStep === 2 && campaignData.selectionMethod === "bulk-select" && (
                  <div>
                    <h4 className="font-medium mb-2">Bulk-select Method</h4>
                    <p className="text-sm text-gray-400">
                      {"You'll"} be able to upload a CSV file with addresses and set targeting radius for efficient bulk
                      selection.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-black z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 1}
                className="bg-gray-900 border-gray-700 hover:bg-gray-800 disabled:opacity-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Step {currentStep} of {steps.length}
              </span>
              <Button
                onClick={handleNext}
                disabled={!canProceedFromCurrentStep}
                className="bg-green-500 hover:bg-green-600 text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === steps.length ? "Launch Campaign" : "Save & Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
