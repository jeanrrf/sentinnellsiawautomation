import type React from "react"
import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  icon?: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ label, icon, className, children, title, variant = "default", size = "default", ...props }, ref) => {
    // Garantir que o botão tenha um título acessível
    const buttonTitle = title || label || (typeof children === "string" ? children : "Botão")

    // Conteúdo do botão
    const buttonContent = (
      <>
        {icon && <span className="mr-2">{icon}</span>}
        {children || label}
      </>
    )

    return (
      <Button
        ref={ref}
        className={cn(className)}
        title={buttonTitle}
        aria-label={buttonTitle}
        variant={variant}
        size={size}
        {...props}
      >
        {buttonContent}
      </Button>
    )
  },
)

AccessibleButton.displayName = "AccessibleButton"

export { AccessibleButton }
