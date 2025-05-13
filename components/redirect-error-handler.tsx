"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface RedirectErrorHandlerProps {
  fallbackPath: string
  children: React.ReactNode
}

export function RedirectErrorHandler({ fallbackPath, children }: RedirectErrorHandlerProps) {
  const router = useRouter()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Verificar se há um loop de redirecionamento
    const redirectCount = Number.parseInt(sessionStorage.getItem("redirectCount") || "0")

    if (redirectCount > 3) {
      // Resetar contador e mostrar fallback
      sessionStorage.setItem("redirectCount", "0")
      setHasError(true)
      return
    }

    // Incrementar contador de redirecionamentos
    sessionStorage.setItem("redirectCount", (redirectCount + 1).toString())

    // Resetar contador após 5 segundos (tempo suficiente para um redirecionamento normal)
    const timer = setTimeout(() => {
      sessionStorage.setItem("redirectCount", "0")
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (hasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Erro de Redirecionamento</h1>
        <p className="mb-4">Detectamos um possível loop de redirecionamento.</p>
        <button
          onClick={() => {
            sessionStorage.setItem("redirectCount", "0")
            router.push(fallbackPath)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Ir para {fallbackPath}
        </button>
      </div>
    )
  }

  return <>{children}</>
}
