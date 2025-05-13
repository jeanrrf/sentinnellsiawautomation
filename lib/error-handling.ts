import { toast } from "@/components/ui/use-toast"

// Tipos de erro específicos para diferentes situações
export enum ErrorType {
  // Erros de API
  API_REQUEST = "api_request",
  API_RESPONSE = "api_response",

  // Erros de autenticação
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",

  // Erros de validação
  VALIDATION = "validation",

  // Erros de processamento
  VIDEO_GENERATION = "video_generation",
  VIDEO_PROCESSING = "video_processing",

  // Erros de armazenamento
  STORAGE = "storage",
  CACHE = "cache",

  // Erros de rede
  NETWORK = "network",

  // Erros de integração
  SHOPEE_API = "shopee_api",
  BLOB_STORAGE = "blob_storage",

  // Outros
  UNEXPECTED = "unexpected",
  USER_INPUT = "user_input",
}

// Interface para erros estruturados
export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  timestamp: string
  context?: Record<string, any>
  originalError?: Error
}

// Função para criar um erro estruturado
export function createAppError(
  type: ErrorType,
  message: string,
  options?: {
    code?: string
    details?: any
    context?: Record<string, any>
    originalError?: Error
  },
): AppError {
  return {
    type,
    message,
    code: options?.code,
    details: options?.details,
    timestamp: new Date().toISOString(),
    context: options?.context,
    originalError: options?.originalError,
  }
}

// Função para registrar erros (pode ser expandida para enviar para um serviço de monitoramento)
export function logError(error: AppError): void {
  console.error(`[ERROR][${error.type}]${error.code ? `[${error.code}]` : ""}: ${error.message}`, {
    details: error.details,
    context: error.context,
    timestamp: error.timestamp,
    originalError: error.originalError,
  })

  // Aqui você poderia adicionar integração com serviços como Sentry, LogRocket, etc.
}

// Função para exibir erros ao usuário
export function displayError(error: AppError): void {
  // Mensagens amigáveis para o usuário baseadas no tipo de erro
  const userFriendlyMessages: Record<ErrorType, string> = {
    [ErrorType.API_REQUEST]: "Não foi possível enviar a solicitação ao servidor.",
    [ErrorType.API_RESPONSE]: "Ocorreu um erro ao processar a resposta do servidor.",
    [ErrorType.AUTHENTICATION]: "Erro de autenticação. Por favor, faça login novamente.",
    [ErrorType.AUTHORIZATION]: "Você não tem permissão para realizar esta ação.",
    [ErrorType.VALIDATION]: "Os dados fornecidos são inválidos.",
    [ErrorType.VIDEO_GENERATION]: "Não foi possível gerar o vídeo.",
    [ErrorType.VIDEO_PROCESSING]: "Ocorreu um erro durante o processamento do vídeo.",
    [ErrorType.STORAGE]: "Erro ao acessar o armazenamento.",
    [ErrorType.CACHE]: "Erro ao acessar o cache.",
    [ErrorType.NETWORK]: "Erro de conexão. Verifique sua internet.",
    [ErrorType.SHOPEE_API]: "Erro na comunicação com a API da Shopee.",
    [ErrorType.BLOB_STORAGE]: "Erro no armazenamento de arquivos.",
    [ErrorType.UNEXPECTED]: "Ocorreu um erro inesperado.",
    [ErrorType.USER_INPUT]: "Verifique os dados informados.",
  }

  // Exibir toast com mensagem amigável
  toast({
    variant: "destructive",
    title: "Erro",
    description: userFriendlyMessages[error.type] || error.message,
    duration: 5000,
  })
}

// Função para lidar com erros (registra e exibe)
export function handleError(error: Error | AppError | unknown, context?: Record<string, any>): AppError {
  let appError: AppError

  // Converter para AppError se ainda não for
  if ((error as AppError).type) {
    appError = error as AppError
  } else if (error instanceof Error) {
    appError = createAppError(ErrorType.UNEXPECTED, error.message, {
      originalError: error,
      context,
      details: {
        stack: error.stack,
      },
    })
  } else {
    appError = createAppError(ErrorType.UNEXPECTED, "Ocorreu um erro inesperado", {
      details: error,
      context,
    })
  }

  // Registrar o erro
  logError(appError)

  // Exibir o erro para o usuário
  displayError(appError)

  return appError
}

// Função para lidar com erros de API
export async function handleApiResponse<T>(response: Response, context?: Record<string, any>): Promise<T> {
  if (!response.ok) {
    let errorData: any

    try {
      errorData = await response.json()
    } catch (e) {
      errorData = { message: response.statusText }
    }

    const appError = createAppError(ErrorType.API_RESPONSE, errorData.message || "Erro na resposta da API", {
      code: response.status.toString(),
      details: errorData,
      context,
    })

    throw appError
  }

  return (await response.json()) as T
}

// Função para envolver chamadas de API com tratamento de erros
export async function apiRequest<T>(url: string, options?: RequestInit, context?: Record<string, any>): Promise<T> {
  try {
    const response = await fetch(url, options)
    return await handleApiResponse<T>(response, context)
  } catch (error) {
    if ((error as AppError).type) {
      throw error
    }

    const appError = createAppError(
      ErrorType.API_REQUEST,
      error instanceof Error ? error.message : "Erro na requisição",
      {
        originalError: error instanceof Error ? error : undefined,
        context,
      },
    )

    throw appError
  }
}
