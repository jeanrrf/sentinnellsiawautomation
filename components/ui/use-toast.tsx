"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"

import { Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@/components/ui/toast"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

// Armazenamento global simples para funções de toast
let globalToast: ((props: ToastProps) => string) | null = null
let globalDismiss: ((id?: string) => void) | null = null

// Definir duração padrão para 3 segundos (3000ms)
const DEFAULT_TOAST_DURATION = 3000

type ToastContextType = {
  toast: (props: ToastProps) => string
  dismiss: (id?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = props.id || Math.random().toString(36).substring(2, 9)

    // Aplicar duração padrão se não for especificada
    const toastWithDuration = {
      ...props,
      duration: props.duration || DEFAULT_TOAST_DURATION,
      id,
    }

    setToasts((prevToasts) => {
      // Verificar se já existe um toast com este ID
      const exists = prevToasts.some((toast) => toast.id === id)

      // Se já existe, atualizar em vez de adicionar
      if (exists) {
        return prevToasts.map((toast) => (toast.id === id ? toastWithDuration : toast))
      }

      // Caso contrário, adicionar novo toast
      return [...prevToasts, toastWithDuration]
    })

    return id
  }, [])

  const dismiss = React.useCallback((id?: string) => {
    if (id) {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    } else {
      setToasts([])
    }
  }, [])

  // Garante que todos os toasts sejam removidos após sua duração
  React.useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.id && toast.duration && !toast.important) {
        const timer = setTimeout(() => {
          dismiss(toast.id)
        }, toast.duration)

        return () => clearTimeout(timer)
      }
    })
  }, [toasts, dismiss])

  // Atualizar as variáveis globais
  React.useEffect(() => {
    globalToast = toast
    globalDismiss = dismiss

    return () => {
      globalToast = null
      globalDismiss = null
    }
  }, [toast, dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport>
        {toasts.map((toast) => (
          <Toast key={toast.id} id={toast.id} variant={toast.variant} onClose={() => dismiss(toast.id)} {...toast}>
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
            {toast.action && toast.action}
          </Toast>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}

// Função toast simples para uso fora de componentes React
function toastFunction(props: ToastProps): string {
  if (!globalToast) {
    console.warn("Toast function called before ToastProvider was initialized")
    return ""
  }
  // Aplicar duração padrão se não for especificada
  return globalToast({
    ...props,
    duration: props.duration || DEFAULT_TOAST_DURATION,
  })
}

// Função dismiss simples
function dismissFunction(id?: string): void {
  if (!globalDismiss) {
    console.warn("Dismiss function called before ToastProvider was initialized")
    return
  }
  globalDismiss(id)
}

// Funções auxiliares
function successFunction(props: Omit<ToastProps, "variant">): string {
  return toastFunction({ ...props, variant: "success" })
}

function errorFunction(props: Omit<ToastProps, "variant">): string {
  return toastFunction({ ...props, variant: "destructive" })
}

function warningFunction(props: Omit<ToastProps, "variant">): string {
  return toastFunction({ ...props, variant: "warning" })
}

function infoFunction(props: Omit<ToastProps, "variant">): string {
  return toastFunction({ ...props, variant: "info" })
}

// Exportar funções individuais em vez de usar Object.assign
export const toast = toastFunction
export const dismiss = dismissFunction
export const success = successFunction
export const error = errorFunction
export const warning = warningFunction
export const info = infoFunction

export type { ToastProps, ToastActionElement }
export { ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport }
