import type { ReactNode } from "react"

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

export type ToastProps = {
  id?: string
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  variant?: ToastVariant
  duration?: number
  onClose?: () => void
  important?: boolean // Toasts importantes não são removidos automaticamente
}

export type ToastActionProps = {
  altText: string
  onClick: () => void
  children: ReactNode
}

export type ToastOptions = {
  position?: ToastPosition
  maxToasts?: number
  pauseOnHover?: boolean
  pauseOnWindowBlur?: boolean
  swipeDirection?: "left" | "right" | "up" | "down"
  swipeThreshold?: number
}

export type ToastInstance = ToastProps & {
  id: string
  createdAt: number
  visible: boolean
  paused: boolean
  position: ToastPosition
  timeoutId?: NodeJS.Timeout
  progress: number
}

export type ToastEventMap = {
  add: (toast: ToastProps) => void
  remove: (id: string) => void
  update: (id: string, toast: Partial<ToastProps>) => void
  dismiss: (id: string) => void
  dismissAll: () => void
  pause: (id: string) => void
  resume: (id: string) => void
  setOptions: (options: Partial<ToastOptions>) => void
}

export type ToastEventHandler<K extends keyof ToastEventMap> = (callback: ToastEventMap[K]) => () => void

export type ToastEventDispatcher<K extends keyof ToastEventMap> = (...args: Parameters<ToastEventMap[K]>) => void

export type ToastStore = {
  toasts: ToastInstance[]
  options: ToastOptions
  subscribe: <K extends keyof ToastEventMap>(event: K, callback: ToastEventMap[K]) => () => void
  dispatch: <K extends keyof ToastEventMap>(event: K, ...args: Parameters<ToastEventMap[K]>) => void
}
