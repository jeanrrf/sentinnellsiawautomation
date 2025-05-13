"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { handleError, ErrorType, createAppError } from "@/lib/error-handling"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Processar o erro usando nosso sistema centralizado
    const appError = createAppError(ErrorType.UNEXPECTED, error.message, {
      originalError: error,
      details: errorInfo,
    })

    handleError(appError)

    // Chamar o callback onError se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar fallback personalizado ou o padrão
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Algo deu errado</h2>
          <p className="text-red-700 mb-4">Ocorreu um erro inesperado ao renderizar este componente.</p>
          <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
