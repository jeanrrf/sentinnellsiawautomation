import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { generateUniqueId } from "@/lib/accessibility-utils"

export interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  className?: string
  error?: string
  hint?: string
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, className, error, hint, ...props }, ref) => {
    const inputId = props.id || generateUniqueId("input")

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  },
)

AccessibleInput.displayName = "AccessibleInput"

export { AccessibleInput }
