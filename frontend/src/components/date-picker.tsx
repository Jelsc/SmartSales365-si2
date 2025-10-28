"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined | null): string {
  if (!date) {
    return ""
  }

  // Formato en español: DD de MMMM de YYYY
  return date.toLocaleDateString("es-ES", {
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
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  label?: string
  id?: string
  disabled?: boolean
  required?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  disableDate?: (date: Date) => boolean
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  label,
  id,
  disabled = false,
  required = false,
  className = "",
  minDate,
  maxDate,
  disableDate,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value || undefined)
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState(formatDate(value || undefined))

  // Sincronizar con el valor externo
  React.useEffect(() => {
    setDate(value || undefined)
    setInputValue(formatDate(value || undefined))
    setMonth(value || undefined)
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setInputValue(formatDate(selectedDate))
    setOpen(false)
    onChange?.(selectedDate || null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setInputValue(inputValue)
    
    // Intentar parsear la fecha en diferentes formatos
    let inputDate: Date | undefined
    
    // Formato DD/MM/YYYY
    const ddmmyyyy = inputValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy
      inputDate = new Date(parseInt(year || '0'), parseInt(month || '1') - 1, parseInt(day || '1'))
    }
    // Formato YYYY-MM-DD
    else if (inputValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      inputDate = new Date(inputValue)
    }
    // Formato estándar
    else {
      inputDate = new Date(inputValue)
    }
    
    if (isValidDate(inputDate)) {
      setDate(inputDate)
      setMonth(inputDate)
      onChange?.(inputDate)
    } else if (inputValue === '') {
      setDate(undefined)
      setMonth(undefined)
      onChange?.(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={inputValue || ""}
          placeholder={placeholder || "01 de enero de 2025"}
          className="bg-background pr-10"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          required={required}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Seleccionar fecha</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 [&_.rdp-nav]:!flex [&_.rdp-nav]:!justify-between [&_.rdp-nav]:!items-center [&_.rdp-nav]:!gap-2 [&_.rdp-nav]:!px-2 [&_.rdp-nav]:!py-1 [&_.rdp-button_previous]:!order-1 [&_.rdp-month_caption]:!order-2 [&_.rdp-button_next]:!order-3"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              fromYear={fromYear ?? 1900}
              toYear={toYear ?? (new Date().getFullYear() + 50)}
              {...(minDate && { fromDate: minDate })}
              {...(maxDate && { toDate: maxDate })}
              month={month || new Date()}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
              formatters={{
                formatMonthDropdown: (date) =>
                  date.toLocaleDateString("es-ES", { month: "short" }),
                formatYearDropdown: (date) =>
                  date.toLocaleDateString("es-ES", { year: "numeric" }),
                formatWeekdayName: (date) =>
                  date.toLocaleDateString("es-ES", { weekday: "short" }),
                formatCaption: (date) =>
                  date.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
              }}
              disabled={(d) => {
                const min = minDate ?? new Date("1900-01-01")
                const isBeforeMin = d < min
                const isAfterMax = maxDate ? d > maxDate : false
                const isCustomDisabled = disableDate ? disableDate(d) : false
                return isBeforeMin || isAfterMax || isCustomDisabled
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
