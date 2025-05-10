"use client"
import { useValidation } from "@/components/validation-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationSummaryProps {
  title?: string
  description?: string
  showSuccess?: boolean
  className?: string
}

export function ValidationSummary({
  title = "Validação",
  description = "Resumo dos resultados da validação",
  showSuccess = true,
  className,
}: ValidationSummaryProps) {
  const { fieldErrors, validationResults } = useValidation()

  const errors = Object.values(fieldErrors).filter((error) => error.severity === "error")
  const warnings = Object.values(fieldErrors).filter((error) => error.severity === "warning")
  const infos = Object.values(fieldErrors).filter((error) => error.severity === "info")

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const hasInfos = infos.length > 0
  const isValid = !hasErrors

  if (!hasErrors && !hasWarnings && !hasInfos && !showSuccess) {
    return null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isValid && showSuccess && !hasWarnings && !hasInfos ? (
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Todos os campos estão válidos</span>
          </div>
        ) : (
          <div className="space-y-4">
            {hasErrors && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center text-red-500">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Erros ({errors.length})
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={`error-${index}`} className="text-sm text-red-500">
                      <span className="font-medium">{error.field}:</span> {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasWarnings && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center text-yellow-500">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Avisos ({warnings.length})
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={`warning-${index}`} className="text-sm text-yellow-500">
                      <span className="font-medium">{warning.field}:</span> {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasInfos && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center text-blue-500">
                  <Info className="h-4 w-4 mr-2" />
                  Informações ({infos.length})
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {infos.map((info, index) => (
                    <li key={`info-${index}`} className="text-sm text-blue-500">
                      <span className="font-medium">{info.field}:</span> {info.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
