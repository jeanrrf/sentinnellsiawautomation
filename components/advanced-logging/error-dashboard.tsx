"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Search,
  FileText,
  Code,
  ExternalLink,
} from "lucide-react"
import { ErrorSeverity, ErrorSource } from "@/lib/advanced-logging/types"

interface ErrorData {
  error: {
    message: string
    code?: string
    severity: ErrorSeverity
    source: ErrorSource
    timestamp: string
    stackTrace?: string
    context?: Record<string, any>
    suggestedSolution?: string
    moduleName: string
    fileName?: string
    lineNumber?: number
    columnNumber?: number
    functionName?: string
  }
  count: number
  firstOccurrence: string
  lastOccurrence: string
  latestContext?: Record<string, any>
}

export function ErrorDashboard() {
  const [errors, setErrors] = useState<ErrorData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedError, setSelectedError] = useState<ErrorData | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchErrors()
  }, [])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/advanced-logging/errors")
      if (response.ok) {
        const data = await response.json()
        setErrors(data.errors || [])
      } else {
        console.error("Failed to fetch errors")
      }
    } catch (error) {
      console.error("Error fetching errors:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearErrors = async () => {
    try {
      const response = await fetch("/api/advanced-logging/clear-errors", {
        method: "POST",
      })
      if (response.ok) {
        setErrors([])
        setSelectedError(null)
      }
    } catch (error) {
      console.error("Error clearing errors:", error)
    }
  }

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case ErrorSeverity.MEDIUM:
        return <Info className="h-4 w-4 text-yellow-500" />
      case ErrorSeverity.LOW:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200"
      case ErrorSeverity.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200"
      case ErrorSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case ErrorSeverity.LOW:
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSourceColor = (source: ErrorSource) => {
    switch (source) {
      case ErrorSource.API:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case ErrorSource.NETWORK:
        return "bg-purple-100 text-purple-800 border-purple-200"
      case ErrorSource.AUTHENTICATION:
        return "bg-red-100 text-red-800 border-red-200"
      case ErrorSource.VALIDATION:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case ErrorSource.DATABASE:
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredErrors = errors.filter((error) => {
    if (activeTab === "all") return true
    return error.error.source === activeTab
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Painel de Diagnóstico de Erros</h2>
        <div className="flex space-x-2">
          <Button onClick={fetchErrors} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={clearErrors} variant="outline" size="sm">
            Limpar Erros
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value={ErrorSource.API}>API</TabsTrigger>
          <TabsTrigger value={ErrorSource.NETWORK}>Rede</TabsTrigger>
          <TabsTrigger value={ErrorSource.AUTHENTICATION}>Autenticação</TabsTrigger>
          <TabsTrigger value={ErrorSource.VALIDATION}>Validação</TabsTrigger>
          <TabsTrigger value={ErrorSource.DATABASE}>Banco de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum erro encontrado</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {filteredErrors.map((errorData, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedError === errorData ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedError(errorData)}
                  >
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(errorData.error.severity)}
                          <CardTitle className="text-sm font-medium">{errorData.error.message}</CardTitle>
                        </div>
                        <Badge variant="outline">{errorData.count}x</Badge>
                      </div>
                      <CardDescription className="text-xs">{formatDate(errorData.lastOccurrence)}</CardDescription>
                    </CardHeader>
                    <CardFooter className="py-2 flex justify-between">
                      <Badge variant="outline" className={getSourceColor(errorData.error.source)}>
                        {errorData.error.source}
                      </Badge>
                      {errorData.error.code && <Badge variant="outline">{errorData.error.code}</Badge>}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div>
                {selectedError ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(selectedError.error.severity)}
                        <CardTitle>{selectedError.error.message}</CardTitle>
                      </div>
                      <CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className={getSeverityColor(selectedError.error.severity)}>
                            {selectedError.error.severity}
                          </Badge>
                          <Badge variant="outline" className={getSourceColor(selectedError.error.source)}>
                            {selectedError.error.source}
                          </Badge>
                          {selectedError.error.code && <Badge variant="outline">{selectedError.error.code}</Badge>}
                          <Badge variant="outline">{selectedError.error.moduleName}</Badge>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium flex items-center mb-1">
                          <FileText className="h-4 w-4 mr-1" /> Detalhes
                        </h4>
                        <div className="text-sm">
                          <p>
                            <strong>Primeira ocorrência:</strong> {formatDate(selectedError.firstOccurrence)}
                          </p>
                          <p>
                            <strong>Última ocorrência:</strong> {formatDate(selectedError.lastOccurrence)}
                          </p>
                          <p>
                            <strong>Contagem:</strong> {selectedError.count}
                          </p>
                          {selectedError.error.fileName && (
                            <p>
                              <strong>Localização:</strong> {selectedError.error.fileName}
                              {selectedError.error.lineNumber && `:${selectedError.error.lineNumber}`}
                              {selectedError.error.functionName && ` em ${selectedError.error.functionName}()`}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedError.error.suggestedSolution && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Solução Sugerida</AlertTitle>
                          <AlertDescription>
                            {selectedError.error.suggestedSolution.split("\n").map((line, i) => (
                              <p key={i}>
                                {line.includes("Documentação:") ? (
                                  <>
                                    Documentação:{" "}
                                    <a
                                      href={line.split("Documentação: ")[1]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline flex items-center"
                                    >
                                      Ver documentação <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </>
                                ) : (
                                  line
                                )}
                              </p>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedError.error.stackTrace && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center mb-1">
                            <Code className="h-4 w-4 mr-1" /> Stack Trace
                          </h4>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {selectedError.error.stackTrace}
                          </pre>
                        </div>
                      )}

                      {selectedError.latestContext && Object.keys(selectedError.latestContext).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center mb-1">
                            <Search className="h-4 w-4 mr-1" /> Contexto
                          </h4>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(selectedError.latestContext, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Selecione um erro para ver detalhes
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
