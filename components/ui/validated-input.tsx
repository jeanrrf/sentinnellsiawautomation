"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useValidation } from "@/components/validation-provider"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label?: string
  rules?: string[]
  showValidationStatus?: boolean
  description?: string
}

export function ValidatedInput({
  id,
  label,
  rules = ["requiredField"],
  showValidationStatus = true,
  description,
  className,
  onChange,
  onBlur,
  ...props
}: ValidatedInputProps) {
  const { validateField, fieldErrors } = useValidation()
  const [value, setValue] = useState(props.defaultValue || props.value || "")
  const [touched, setTouched] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | "warning" | "info" | "pending">(
    "pending",
  )

  const error = fieldErrors[id]
  const hasError = !!error && error.severity === "error"
  const hasWarning = !!error && error.severity === "warning"
  const hasInfo = !!error && error.severity === "info"

  useEffect(() => {
    if (touched) {
      const isValid = validateField(id, value, rules)
      setValidationStatus(isValid ? "valid" : hasWarning ? "warning" : hasInfo ? "info" : "invalid")
    }
  }, [value, touched, id, rules, validateField, hasWarning, hasInfo])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onChange?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    validateField(id, value, rules)
    onBlur?.(e)
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between">
          <Label htmlFor={id}>{label}</Label>
          {showValidationStatus && touched && (
            <span className="text-xs">
              {validationStatus === "valid" && <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />}
              {validationStatus === "invalid" && <AlertCircle className="inline h-4 w-4 text-red-500 mr-1" />}
              {validationStatus === "warning" && <AlertTriangle className="inline h-4 w-4 text-yellow-500 mr-1" />}
              {validationStatus === "info" && <Info className="inline h-4 w-4 text-blue-500 mr-1" />}
            </span>
          )}
        </div>
      )}
      <Input
        id={id}
        className={cn(
          hasError && "border-red-500 focus-visible:ring-red-500",
          hasWarning && "border-yellow-500 focus-visible:ring-yellow-500",
          hasInfo && "border-blue-500 focus-visible:ring-blue-500",
          className,
        )}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
      {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && (
        <p
          className={cn(
            "text-sm",
            error.severity === "error" && "text-red-500",
            error.severity === "warning" && "text-yellow-500",
            error.severity === "info" && "text-blue-500",
          )}
        >
          {error.message}
        </p>
      )}
    </div>
  )
}
