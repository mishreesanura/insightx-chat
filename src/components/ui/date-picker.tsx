"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  /** Text shown above the picker */
  prompt_text?: string
  /** Key name sent back when the user picks a date */
  parameter_name?: string
  /** "single" or "range" */
  mode?: "single" | "range"
  /** Called when the user selects a date (or range) */
  onSelect?: (parameterName: string, value: string) => void
}

export function DatePicker({
  prompt_text,
  parameter_name = "date",
  mode = "single",
  onSelect,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>()
  const [range, setRange] = React.useState<DateRange | undefined>()

  const handleSingleSelect = (day: Date | undefined) => {
    setDate(day)
    if (day && onSelect) {
      onSelect(parameter_name, format(day, "yyyy-MM-dd"))
    }
  }

  const handleRangeSelect = (r: DateRange | undefined) => {
    setRange(r)
    if (r?.from && r?.to && onSelect) {
      onSelect(
        parameter_name,
        `${format(r.from, "yyyy-MM-dd")}:${format(r.to, "yyyy-MM-dd")}`,
      )
    }
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
      {prompt_text && (
        <p className="text-sm text-foreground mb-3">{prompt_text}</p>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full max-w-xs justify-start text-left font-normal",
              !(mode === "range" ? range?.from : date) &&
                "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {mode === "range" ? (
              range?.from ? (
                range.to ? (
                  <>
                    {format(range.from, "LLL dd, y")} –{" "}
                    {format(range.to, "LLL dd, y")}
                  </>
                ) : (
                  format(range.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )
            ) : date ? (
              format(date, "PPP")
            ) : (
              "Pick a date"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {mode === "range" ? (
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              initialFocus
            />
          ) : (
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSingleSelect}
              initialFocus
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
