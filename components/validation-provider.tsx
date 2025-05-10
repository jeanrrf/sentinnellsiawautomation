"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import {
  type ValidationResult,
  type ValidationError,
  type ValidationRule,
  defaultValidationRules,
} from "@/lib/validation"

type ValidationContextType = {
  validationRules: Record<string, ValidationRule>
  updateValidationRule: (ruleId: string, updates: Partial<ValidationRule>) => void
  validationResults: Record<string, ValidationResult>
  setValidationResult: (sectionId: string, result: ValidationResult) => void
  fieldErrors: Record<string, ValidationError>
  setFieldError: (fieldId: string, error: ValidationError | null) => void
  clearFieldError: (fieldId: string) => void
  clearAllErrors: () => void
  validateField: (fieldId: string, value: any, ruleIds: string[]) => boolean
  isValidating: boolean
  setIsValidating: (validating: boolean) => void
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined)

export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const [validationRules, setValidationRules] = useState<Record<string, ValidationRule>>(defaultValidationRules)
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError>>({})
  const [isValidating, setIsValidating] = useState(false)

  const updateValidationRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    setValidationRules((prev) => {
      if (!prev[ruleId]) return prev
      return {
        ...prev,
        [ruleId]: {
          ...prev[ruleId],
          ...updates,
        },
      }
    })
  }

  const setValidationResult = (sectionId: string, result: ValidationResult) => {
    setValidationResults((prev) => ({
      ...prev,
      [sectionId]: result,
    }))
  }

  const setFieldError = (fieldId: string, error: ValidationError | null) => {
    setFieldErrors((prev) => {
      if (error === null) {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      }
      return {
        ...prev,
        [fieldId]: error,
      }
    })
  }

  const clearFieldError = (fieldId: string) => {
    setFieldError(fieldId, null)
  }

  const clearAllErrors = () => {
    setFieldErrors({})
    setValidationResults({})
  }

  const validateField = (fieldId: string, value: any, ruleIds: string[]) => {
    let isValid = true

    // Clear existing errors for this field
    clearFieldError(fieldId)

    // Apply each rule
    for (const ruleId of ruleIds) {
      const rule = validationRules[ruleId]
      if (!rule || !rule.enabled) continue

      try {
        const result = rule.schema.safeParse(value)
        if (!result.success) {
          const error = {
            field: fieldId,
            message: result.error.errors[0]?.message || "Valor inválido",
            severity: rule.severity,
            ruleId: rule.id,
          }
          setFieldError(fieldId, error)
          if (error.severity === "error") {
            isValid = false
            break
          }
        }
      } catch (err) {
        console.error(`Error validating field ${fieldId} with rule ${ruleId}:`, err)
      }
    }

    return isValid
  }

  return (
    <ValidationContext.Provider
      value={{
        validationRules,
        updateValidationRule,
        validationResults,
        setValidationResult,
        fieldErrors,
        setFieldError,
        clearFieldError,
        clearAllErrors,
        validateField,
        isValidating,
        setIsValidating,
      }}
    >
      {children}
    </ValidationContext.Provider>
  )
}

export function useValidation() {
  const context = useContext(ValidationContext)
  if (context === undefined) {
    throw new Error("useValidation must be used within a ValidationProvider")
  }
  return context
}
