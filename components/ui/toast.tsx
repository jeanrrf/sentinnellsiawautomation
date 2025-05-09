"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  onClose?: () => void
  className?: string
}

/**
 * Componente Toast - Exibe notificações temporárias
 *
 * Suporta diferentes estilos através da prop className
 * Pode ser personalizado com cores tipo semáforo:
 * - Verde para sucesso
 * - Amarelo para avisos
 * - Vermelho para erros
 */
export function Toast({ id, title, description, variant = "default", onClose, className }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-opacity duration-300",
        variant === "destructive" && "bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-50",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <div className="flex-1 w-0 p-4">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</div>}
      </div>
      <div className="flex">
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => {
              onClose?.()
            }, 300)
          }}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </button>
      </div>
    </div>
  )
}
