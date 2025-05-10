"use client"

import type React from "react"

// Adapted from https://ui.shadcn.com/docs/components/toast
import { useState, createContext, useContext } from "react"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast"

type ToastContextType = {
  toast: (props: ToastProps) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Função toast global para uso fora de componentes React
let toastFn: (props: ToastProps) => void = () => {
  console.warn("Toast function called before it was initialized")
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const handleToast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
  }

  // Atualizar a referência global à função toast
  toastFn = handleToast

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: handleToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id!)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Exportar a função toast diretamente como uma exportação nomeada
export const toast = (props: ToastProps) => {
  toastFn(props)
}

// Re-exportar os componentes do toast para facilitar o uso
export { ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport }
