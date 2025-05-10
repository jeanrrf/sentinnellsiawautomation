"use client"

import { useEffect, useState, useCallback } from "react"
import { Toast as ToastComponent, ToastAction } from "@/components/ui/toast"
import { toastStore } from "@/lib/toast-store"
import type { ToastProps, ToastPosition, ToastInstance, ToastOptions } from "@/types/toast"

// Mapeamento de posições para classes CSS
const POSITION_CLASSES: Record<ToastPosition, string> = {
  "top-left": "fixed top-0 left-0 p-4 flex flex-col gap-2 items-start max-h-screen overflow-hidden",
  "top-center":
    "fixed top-0 left-1/2 -translate-x-1/2 p-4 flex flex-col gap-2 items-center max-h-screen overflow-hidden",
  "top-right": "fixed top-0 right-0 p-4 flex flex-col gap-2 items-end max-h-screen overflow-hidden",
  "bottom-left": "fixed bottom-0 left-0 p-4 flex flex-col-reverse gap-2 items-start max-h-screen overflow-hidden",
  "bottom-center":
    "fixed bottom-0 left-1/2 -translate-x-1/2 p-4 flex flex-col-reverse gap-2 items-center max-h-screen overflow-hidden",
  "bottom-right": "fixed bottom-0 right-0 p-4 flex flex-col-reverse gap-2 items-end max-h-screen overflow-hidden",
}

// Componente que renderiza todos os toasts
export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastInstance[]>([])
  const [options, setOptions] = useState<ToastOptions>(toastStore.options)

  // Atualiza o estado quando o store muda
  useEffect(() => {
    const handleAdd = () => setToasts([...toastStore.toasts])
    const handleRemove = () => setToasts([...toastStore.toasts])
    const handleUpdate = () => setToasts([...toastStore.toasts])
    const handleDismissAll = () => setToasts([])
    const handleOptions = (newOptions: ToastOptions) => setOptions(newOptions)

    // Inscreve-se nos eventos do store
    const unsubscribeAdd = toastStore.subscribe("add", handleAdd)
    const unsubscribeRemove = toastStore.subscribe("remove", handleRemove)
    const unsubscribeUpdate = toastStore.subscribe("update", handleUpdate)
    const unsubscribeDismissAll = toastStore.subscribe("dismissAll", handleDismissAll)
    const unsubscribeOptions = toastStore.subscribe("setOptions", handleOptions)

    // Inicializa o estado com os toasts existentes
    setToasts([...toastStore.toasts])

    // Limpa as inscrições quando o componente é desmontado
    return () => {
      unsubscribeAdd()
      unsubscribeRemove()
      unsubscribeUpdate()
      unsubscribeDismissAll()
      unsubscribeOptions()
    }
  }, [])

  // Agrupa os toasts por posição
  const toastsByPosition = toasts.reduce<Record<ToastPosition, ToastInstance[]>>(
    (acc, toast) => {
      const position = toast.position || options.position || "bottom-right"
      if (!acc[position]) {
        acc[position] = []
      }
      acc[position].push(toast)
      return acc
    },
    {} as Record<ToastPosition, ToastInstance[]>,
  )

  // Manipuladores de eventos para pausar/retomar toasts
  const handleMouseEnter = useCallback(
    (id: string) => {
      if (options.pauseOnHover) {
        toastStore.dispatch("pause", id)
      }
    },
    [options.pauseOnHover],
  )

  const handleMouseLeave = useCallback(
    (id: string) => {
      if (options.pauseOnHover) {
        toastStore.dispatch("resume", id)
      }
    },
    [options.pauseOnHover],
  )

  // Efeito para pausar toasts quando a janela perde o foco
  useEffect(() => {
    if (!options.pauseOnWindowBlur) return

    const handleBlur = () => {
      toasts.forEach((toast) => {
        if (!toast.paused && toast.timeoutId) {
          toastStore.dispatch("pause", toast.id)
        }
      })
    }

    const handleFocus = () => {
      toasts.forEach((toast) => {
        if (toast.paused) {
          toastStore.dispatch("resume", toast.id)
        }
      })
    }

    window.addEventListener("blur", handleBlur)
    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("focus", handleFocus)
    }
  }, [toasts, options.pauseOnWindowBlur])

  // Renderiza os toasts agrupados por posição
  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={POSITION_CLASSES[position as ToastPosition]}
          aria-live="polite"
          role="region"
          aria-label="Notificações"
        >
          {positionToasts.map((toast) => (
            <div
              key={toast.id}
              onMouseEnter={() => handleMouseEnter(toast.id)}
              onMouseLeave={() => handleMouseLeave(toast.id)}
              className={`transform transition-all duration-300 ${
                toast.visible
                  ? "translate-x-0 opacity-100"
                  : position.includes("right")
                    ? "translate-x-full opacity-0"
                    : position.includes("left")
                      ? "-translate-x-full opacity-0"
                      : "opacity-0"
              }`}
            >
              <ToastComponent
                id={toast.id}
                variant={toast.variant}
                title={toast.title}
                description={toast.description}
                onClose={() => toastStore.dispatch("dismiss", toast.id)}
              >
                {toast.action}
              </ToastComponent>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

// Hook para usar o toast em componentes React
export function useToast() {
  const showToast = useCallback((props: ToastProps) => {
    return toastStore.dispatch("add", props)
  }, [])

  const dismissToast = useCallback((id: string) => {
    toastStore.dispatch("dismiss", id)
  }, [])

  const dismissAllToasts = useCallback(() => {
    toastStore.dispatch("dismissAll")
  }, [])

  const updateToast = useCallback((id: string, props: Partial<ToastProps>) => {
    toastStore.dispatch("update", id, props)
  }, [])

  const setToastOptions = useCallback((options: Partial<ToastOptions>) => {
    toastStore.dispatch("setOptions", options)
  }, [])

  return {
    toast: showToast,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
    update: updateToast,
    setOptions: setToastOptions,
  }
}

// Função para usar o toast fora de componentes React
export const toast = (props: ToastProps) => {
  return toastStore.dispatch("add", props)
}

// Funções auxiliares para diferentes tipos de toast
toast.success = (props: Omit<ToastProps, "variant">) => {
  return toast({ ...props, variant: "success" })
}

toast.error = (props: Omit<ToastProps, "variant">) => {
  return toast({ ...props, variant: "destructive" })
}

toast.warning = (props: Omit<ToastProps, "variant">) => {
  return toast({ ...props, variant: "warning" })
}

toast.info = (props: Omit<ToastProps, "variant">) => {
  return toast({ ...props, variant: "info" })
}

toast.dismiss = (id?: string) => {
  if (id) {
    toastStore.dispatch("dismiss", id)
  } else {
    toastStore.dispatch("dismissAll")
  }
}

toast.update = (id: string, props: Partial<ToastProps>) => {
  toastStore.dispatch("update", id, props)
}

// Configuração global do toast
toast.setOptions = (options: Partial<ToastOptions>) => {
  toastStore.dispatch("setOptions", options)
}

// Componente de ação para o toast
export { ToastAction }
