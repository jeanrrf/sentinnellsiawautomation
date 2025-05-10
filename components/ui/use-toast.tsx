"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"

import { Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@/components/ui/toast"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

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

    setToasts((prevToasts) => {
      // Verificar se já existe um toast com este ID
      const exists = prevToasts.some((toast) => toast.id === id)

      // Se já existe, atualizar em vez de adicionar
      if (exists) {
        return prevToasts.map((toast) => (toast.id === id ? { ...toast, ...props, id } : toast))
      }

      // Caso contrário, adicionar novo toast
      return [...prevToasts, { ...props, id }]
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

// Função toast para uso fora de componentes React
let toastFn: (props: ToastProps) => string = () => {
  console.warn("Toast function called before it was initialized")
  return ""
}

let dismissFn: (id?: string) => void = () => {
  console.warn("Dismiss function called before it was initialized")
}

// Atualizar as funções globais quando o ToastProvider for montado
if (typeof window !== "undefined") {
  // Sobrescrever useToast para capturar as funções
  const originalUseToast = useToast

  Object.defineProperty(module.exports, "useToast", {
    get: () => {
      return function useToastWrapper() {
        const context = originalUseToast()
        toastFn = context.toast
        dismissFn = context.dismiss
        return context
      }
    },
  })
}

// Função toast para uso fora de componentes React
export const toast = Object.assign((props: ToastProps) => toastFn(props), {
  dismiss: (id?: string) => dismissFn(id),
  success: (props: Omit<ToastProps, "variant">) => toastFn({ ...props, variant: "success" }),
  error: (props: Omit<ToastProps, "variant">) => toastFn({ ...props, variant: "destructive" }),
  warning: (props: Omit<ToastProps, "variant">) => toastFn({ ...props, variant: "warning" }),
  info: (props: Omit<ToastProps, "variant">) => toastFn({ ...props, variant: "info" }),
})

export type { ToastProps, ToastActionElement }
export { ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport }
