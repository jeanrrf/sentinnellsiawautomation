import type { ToastInstance, ToastOptions, ToastProps, ToastStore, ToastEventMap } from "@/types/toast"

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
  position: "bottom-right",
  maxToasts: 5,
  pauseOnHover: true,
  pauseOnWindowBlur: true,
  swipeDirection: "right",
  swipeThreshold: 50,
}

// Cria um ID único para cada toast
const createId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

// Cria o store para gerenciar os toasts
export const createToastStore = (): ToastStore => {
  let toasts: ToastInstance[] = []
  let options: ToastOptions = { ...DEFAULT_TOAST_OPTIONS }
  const listeners = new Map<keyof ToastEventMap, Set<Function>>()

  // Adiciona um listener para um evento
  const subscribe = <K extends keyof ToastEventMap>(event: K, callback: ToastEventMap[K]) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(callback)

    // Retorna uma função para remover o listener
    return () => {
      const eventListeners = listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          listeners.delete(event)
        }
      }
    }
  }

  // Dispara um evento para todos os listeners
  const dispatch = <K extends keyof ToastEventMap>(event: K, ...args: Parameters<ToastEventMap[K]>) => {
    const eventListeners = listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        listener(...args)
      })
    }
  }

  // Adiciona um novo toast
  const addToast = (toast: ToastProps) => {
    const id = toast.id || createId()
    const duration = toast.duration || 5000
    const position = options.position || "bottom-right"

    // Remove toasts antigos se exceder o limite
    if (toasts.length >= (options.maxToasts || 5)) {
      const oldestNonImportantToast = [...toasts]
        .filter((t) => !t.important)
        .sort((a, b) => a.createdAt - b.createdAt)[0]

      if (oldestNonImportantToast) {
        removeToast(oldestNonImportantToast.id)
      }
    }

    // Cria a instância do toast
    const instance: ToastInstance = {
      ...toast,
      id,
      createdAt: Date.now(),
      visible: true,
      paused: false,
      position,
      progress: 0,
    }

    // Adiciona o timeout para remover o toast automaticamente
    if (duration > 0 && !toast.important) {
      instance.timeoutId = setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    toasts = [...toasts, instance]
    dispatch("add", toast)
    return id
  }

  // Remove um toast pelo ID
  const removeToast = (id: string) => {
    const toast = toasts.find((t) => t.id === id)
    if (toast) {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId)
      }

      // Marca o toast como invisível para animação de saída
      toasts = toasts.map((t) => (t.id === id ? { ...t, visible: false } : t))

      // Remove o toast após a animação
      setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id)
        dispatch("remove", id)
      }, 300)
    }
  }

  // Atualiza um toast existente
  const updateToast = (id: string, updatedToast: Partial<ToastProps>) => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, ...updatedToast } : t))
    dispatch("update", id, updatedToast)
  }

  // Pausa um toast (para quando o mouse está sobre ele)
  const pauseToast = (id: string) => {
    const toast = toasts.find((t) => t.id === id)
    if (toast && toast.timeoutId && !toast.paused) {
      clearTimeout(toast.timeoutId)
      toasts = toasts.map((t) => (t.id === id ? { ...t, paused: true } : t))
      dispatch("pause", id)
    }
  }

  // Retoma um toast pausado
  const resumeToast = (id: string) => {
    const toast = toasts.find((t) => t.id === id)
    if (toast && toast.paused) {
      const remainingTime = toast.duration || 5000
      toast.timeoutId = setTimeout(() => {
        removeToast(id)
      }, remainingTime)

      toasts = toasts.map((t) => (t.id === id ? { ...t, paused: false } : t))
      dispatch("resume", id)
    }
  }

  // Remove todos os toasts
  const dismissAll = () => {
    toasts.forEach((toast) => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId)
      }
    })

    // Marca todos os toasts como invisíveis para animação
    toasts = toasts.map((t) => ({ ...t, visible: false }))

    // Remove todos os toasts após a animação
    setTimeout(() => {
      toasts = []
      dispatch("dismissAll")
    }, 300)
  }

  // Atualiza as opções do toast
  const setOptions = (newOptions: Partial<ToastOptions>) => {
    options = { ...options, ...newOptions }
    dispatch("setOptions", options)
  }

  // Configura os handlers para os eventos
  subscribe("add", addToast)
  subscribe("remove", removeToast)
  subscribe("update", updateToast)
  subscribe("dismiss", removeToast)
  subscribe("dismissAll", dismissAll)
  subscribe("pause", pauseToast)
  subscribe("resume", resumeToast)
  subscribe("setOptions", setOptions)

  return {
    get toasts() {
      return toasts
    },
    get options() {
      return options
    },
    subscribe,
    dispatch,
  }
}

// Cria uma instância global do store
export const toastStore = createToastStore()
