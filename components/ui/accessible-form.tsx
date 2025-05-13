import type React from "react"
import { forwardRef, type FormHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { generateUniqueId } from "@/lib/accessibility-utils"

export interface AccessibleFormProps extends FormHTMLAttributes<HTMLFormElement> {
  className?: string
  ariaLabel?: string
  children: React.ReactNode
}

const AccessibleForm = forwardRef<HTMLFormElement, AccessibleFormProps>(
  ({ className, ariaLabel, children, ...props }, ref) => {
    const formId = props.id || generateUniqueId("form")

    return (
      <form ref={ref} id={formId} className={cn(className)} aria-label={ariaLabel || "Formulário"} {...props}>
        {children}
      </form>
    )
  },
)

AccessibleForm.displayName = "AccessibleForm"

export { AccessibleForm }
