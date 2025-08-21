"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface DatePickerProps {
  label: string
  placeholder: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
}

export function DatePicker({ label, placeholder, value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(value)
  const [inputValue, setInputValue] = React.useState(formatDate(value))

  React.useEffect(() => {
    setInputValue(formatDate(value))
    setMonth(value)
  }, [value])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className={`flex gap-3 flex-row items-center ${className}`}>
      <Label htmlFor="date" className="px-1 text-gray-300">
        {label}
      </Label>
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={inputValue}
          placeholder={placeholder}
          className="bg-gray-800 border-gray-600 text-white pr-10 cursor-pointer"
          readOnly
          onClick={() => setOpen(true)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0 bg-gray-800 border-gray-600"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                onChange?.(date)
                setInputValue(formatDate(date))
                setOpen(false)
              }}
              disabled={(date) => date < today}
              className="bg-gray-800 text-white"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
