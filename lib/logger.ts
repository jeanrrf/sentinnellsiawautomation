/**
 * Enhanced logging utility for the application
 * Provides structured, informative logs with severity levels, timestamps, and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  levelName: string
  message: string
  module: string
  code?: string
  details?: any
  context?: Record<string, any>
}

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === "development"
const minLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
}

// Level-specific styling
const levelStyles = {
  [LogLevel.DEBUG]: { color: colors.cyan, label: "DEBUG" },
  [LogLevel.INFO]: { color: colors.green, label: "INFO" },
  [LogLevel.WARNING]: { color: colors.yellow, label: "WARNING" },
  [LogLevel.ERROR]: { color: colors.red, label: "ERROR" },
  [LogLevel.CRITICAL]: { color: colors.bgRed + colors.white, label: "CRITICAL" },
}

/**
 * Format a log entry for console output with colors
 */
function formatConsoleLog(entry: LogEntry): string {
  const { timestamp, levelName, message, module, code, details } = entry
  const style = levelStyles[entry.level]

  let formattedMessage = `${colors.dim}[${timestamp}]${colors.reset} ${style.color}${levelName}${colors.reset} ${colors.bright}[${module}]${colors.reset}: ${message}`

  if (code) {
    formattedMessage += ` ${colors.magenta}(${code})${colors.reset}`
  }

  return formattedMessage
}

/**
 * Create a log entry with the current timestamp and specified parameters
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  module: string,
  options?: {
    code?: string
    details?: any
    context?: Record<string, any>
  },
): LogEntry {
  const now = new Date()
  const timestamp = now.toISOString()

  return {
    timestamp,
    level,
    levelName: levelStyles[level].label,
    message,
    module,
    code: options?.code,
    details: options?.details,
    context: options?.context,
  }
}

/**
 * Log a message if its level is at or above the minimum level
 */
function log(
  level: LogLevel,
  message: string,
  module: string,
  options?: {
    code?: string
    details?: any
    context?: Record<string, any>
  },
): void {
  // Skip logging if below minimum level
  if (level < minLevel) return

  const entry = createLogEntry(level, message, module, options)

  // Format for console
  const formattedMessage = formatConsoleLog(entry)

  // Log to console with appropriate method
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage)
      if (options?.details) console.debug(options.details)
      break
    case LogLevel.INFO:
      console.info(formattedMessage)
      if (options?.details) console.info(options.details)
      break
    case LogLevel.WARNING:
      console.warn(formattedMessage)
      if (options?.details) console.warn(options.details)
      break
    case LogLevel.ERROR:
    case LogLevel.CRITICAL:
      console.error(formattedMessage)
      if (options?.details) console.error(options.details)
      break
  }

  // In a production environment, you might want to send logs to a service
  if (level >= LogLevel.ERROR) {
    // Example: sendToLogService(entry);
  }
}

/**
 * Logger interface with methods for each log level
 */
export interface Logger {
  debug: (message: string, options?: { code?: string; details?: any; context?: Record<string, any> }) => void
  info: (message: string, options?: { code?: string; details?: any; context?: Record<string, any> }) => void
  warning: (message: string, options?: { code?: string; details?: any; context?: Record<string, any> }) => void
  error: (message: string, options?: { code?: string; details?: any; context?: Record<string, any> }) => void
  critical: (message: string, options?: { code?: string; details?: any; context?: Record<string, any> }) => void
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
  return {
    debug: (message, options) => log(LogLevel.DEBUG, message, module, options),
    info: (message, options) => log(LogLevel.INFO, message, module, options),
    warning: (message, options) => log(LogLevel.WARNING, message, module, options),
    error: (message, options) => log(LogLevel.ERROR, message, module, options),
    critical: (message, options) => log(LogLevel.CRITICAL, message, module, options),
  }
}

/**
 * Error codes organized by category
 */
export const ErrorCodes = {
  // API related errors
  API: {
    REQUEST_FAILED: "API-001",
    RESPONSE_INVALID: "API-002",
    TIMEOUT: "API-003",
    RATE_LIMITED: "API-004",
    UNAUTHORIZED: "API-005",
    FORBIDDEN: "API-006",
    NOT_FOUND: "API-007",
    SERVER_ERROR: "API-008",
  },

  // Authentication related errors
  AUTH: {
    LOGIN_FAILED: "AUTH-001",
    TOKEN_EXPIRED: "AUTH-002",
    INVALID_CREDENTIALS: "AUTH-003",
    SESSION_EXPIRED: "AUTH-004",
    PERMISSION_DENIED: "AUTH-005",
  },

  // Data validation errors
  VALIDATION: {
    REQUIRED_FIELD: "VAL-001",
    INVALID_FORMAT: "VAL-002",
    OUT_OF_RANGE: "VAL-003",
    DUPLICATE_ENTRY: "VAL-004",
    CONSTRAINT_VIOLATION: "VAL-005",
  },

  // Storage related errors
  STORAGE: {
    READ_FAILED: "STORE-001",
    WRITE_FAILED: "STORE-002",
    DELETE_FAILED: "STORE-003",
    QUOTA_EXCEEDED: "STORE-004",
    BLOB_UPLOAD_FAILED: "STORE-005",
    BLOB_DOWNLOAD_FAILED: "STORE-006",
  },

  // Redis/Cache related errors
  CACHE: {
    CONNECTION_FAILED: "CACHE-001",
    SET_FAILED: "CACHE-002",
    GET_FAILED: "CACHE-003",
    EXPIRED: "CACHE-004",
    INVALID_DATA: "CACHE-005",
  },

  // Video processing errors
  VIDEO: {
    GENERATION_FAILED: "VID-001",
    CONVERSION_FAILED: "VID-002",
    INVALID_FORMAT: "VID-003",
    ENCODING_FAILED: "VID-004",
    RENDERING_FAILED: "VID-005",
  },

  // UI related errors
  UI: {
    COMPONENT_FAILED: "UI-001",
    RENDER_ERROR: "UI-002",
    STATE_INCONSISTENT: "UI-003",
    EVENT_HANDLER_ERROR: "UI-004",
  },

  // System errors
  SYSTEM: {
    INITIALIZATION_FAILED: "SYS-001",
    RESOURCE_EXHAUSTED: "SYS-002",
    UNEXPECTED_ERROR: "SYS-003",
    DEPENDENCY_MISSING: "SYS-004",
    ENVIRONMENT_ERROR: "SYS-005",
  },
}

/**
 * User-friendly error messages for common error codes
 */
export const ErrorMessages = {
  [ErrorCodes.API.REQUEST_FAILED]: "Falha ao enviar requisição para o servidor",
  [ErrorCodes.API.RESPONSE_INVALID]: "Resposta inválida recebida do servidor",
  [ErrorCodes.API.TIMEOUT]: "Tempo limite excedido ao aguardar resposta do servidor",
  [ErrorCodes.API.RATE_LIMITED]: "Limite de requisições excedido, tente novamente mais tarde",
  [ErrorCodes.API.UNAUTHORIZED]: "Autenticação necessária para acessar este recurso",
  [ErrorCodes.API.FORBIDDEN]: "Você não tem permissão para acessar este recurso",
  [ErrorCodes.API.NOT_FOUND]: "O recurso solicitado não foi encontrado",
  [ErrorCodes.API.SERVER_ERROR]: "Erro interno no servidor",

  [ErrorCodes.AUTH.LOGIN_FAILED]: "Falha ao realizar login, verifique suas credenciais",
  [ErrorCodes.AUTH.TOKEN_EXPIRED]: "Sua sessão expirou, faça login novamente",
  [ErrorCodes.AUTH.INVALID_CREDENTIALS]: "Credenciais inválidas fornecidas",
  [ErrorCodes.AUTH.SESSION_EXPIRED]: "Sua sessão expirou, faça login novamente",
  [ErrorCodes.AUTH.PERMISSION_DENIED]: "Você não tem permissão para realizar esta ação",

  [ErrorCodes.VALIDATION.REQUIRED_FIELD]: "Campo obrigatório não preenchido",
  [ErrorCodes.VALIDATION.INVALID_FORMAT]: "Formato inválido para o campo",
  [ErrorCodes.VALIDATION.OUT_OF_RANGE]: "Valor fora do intervalo permitido",
  [ErrorCodes.VALIDATION.DUPLICATE_ENTRY]: "Entrada duplicada detectada",
  [ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION]: "Violação de restrição nos dados fornecidos",

  [ErrorCodes.STORAGE.READ_FAILED]: "Falha ao ler dados do armazenamento",
  [ErrorCodes.STORAGE.WRITE_FAILED]: "Falha ao escrever dados no armazenamento",
  [ErrorCodes.STORAGE.DELETE_FAILED]: "Falha ao excluir dados do armazenamento",
  [ErrorCodes.STORAGE.QUOTA_EXCEEDED]: "Cota de armazenamento excedida",
  [ErrorCodes.STORAGE.BLOB_UPLOAD_FAILED]: "Falha ao fazer upload do arquivo",
  [ErrorCodes.STORAGE.BLOB_DOWNLOAD_FAILED]: "Falha ao baixar o arquivo",

  [ErrorCodes.CACHE.CONNECTION_FAILED]: "Falha ao conectar ao serviço de cache",
  [ErrorCodes.CACHE.SET_FAILED]: "Falha ao armazenar dados no cache",
  [ErrorCodes.CACHE.GET_FAILED]: "Falha ao recuperar dados do cache",
  [ErrorCodes.CACHE.EXPIRED]: "Dados em cache expiraram",
  [ErrorCodes.CACHE.INVALID_DATA]: "Dados inválidos encontrados no cache",

  [ErrorCodes.VIDEO.GENERATION_FAILED]: "Falha ao gerar vídeo",
  [ErrorCodes.VIDEO.CONVERSION_FAILED]: "Falha ao converter vídeo",
  [ErrorCodes.VIDEO.INVALID_FORMAT]: "Formato de vídeo inválido",
  [ErrorCodes.VIDEO.ENCODING_FAILED]: "Falha na codificação do vídeo",
  [ErrorCodes.VIDEO.RENDERING_FAILED]: "Falha na renderização do vídeo",

  [ErrorCodes.UI.COMPONENT_FAILED]: "Falha em componente da interface",
  [ErrorCodes.UI.RENDER_ERROR]: "Erro ao renderizar interface",
  [ErrorCodes.UI.STATE_INCONSISTENT]: "Estado inconsistente na interface",
  [ErrorCodes.UI.EVENT_HANDLER_ERROR]: "Erro ao processar evento da interface",

  [ErrorCodes.SYSTEM.INITIALIZATION_FAILED]: "Falha na inicialização do sistema",
  [ErrorCodes.SYSTEM.RESOURCE_EXHAUSTED]: "Recursos do sistema esgotados",
  [ErrorCodes.SYSTEM.UNEXPECTED_ERROR]: "Erro inesperado ocorreu",
  [ErrorCodes.SYSTEM.DEPENDENCY_MISSING]: "Dependência necessária não encontrada",
  [ErrorCodes.SYSTEM.ENVIRONMENT_ERROR]: "Erro no ambiente de execução",
}

/**
 * Get a user-friendly error message for a given error code
 */
export function getUserFriendlyErrorMessage(code: string, fallback?: string): string {
  return ErrorMessages[code] || fallback || "Ocorreu um erro inesperado"
}

// Default logger for quick access
export const logger = createLogger("App")

// Export default
export default {
  createLogger,
  logger,
  LogLevel,
  ErrorCodes,
  getUserFriendlyErrorMessage,
}
