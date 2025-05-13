import { z } from "zod"

// Validation rule types
export type ValidationRule = {
  id: string
  name: string
  description: string
  schema: z.ZodType<any>
  severity: "error" | "warning" | "info"
  enabled: boolean
}

// Validation result types
export type ValidationResult = {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  infos: ValidationError[]
}

export type ValidationError = {
  field: string
  message: string
  severity: "error" | "warning" | "info"
  ruleId: string
}

// Default validation rules
export const defaultValidationRules: Record<string, ValidationRule> = {
  requiredField: {
    id: "requiredField",
    name: "Campo obrigatório",
    description: "Verifica se os campos obrigatórios estão preenchidos",
    schema: z.string().min(1, "Este campo é obrigatório"),
    severity: "error",
    enabled: true,
  },
  emailFormat: {
    id: "emailFormat",
    name: "Formato de e-mail",
    description: "Verifica se o e-mail está em um formato válido",
    schema: z.string().email("Formato de e-mail inválido"),
    severity: "error",
    enabled: true,
  },
  urlFormat: {
    id: "urlFormat",
    name: "Formato de URL",
    description: "Verifica se a URL está em um formato válido",
    schema: z.string().url("Formato de URL inválido"),
    severity: "error",
    enabled: true,
  },
  minLength: {
    id: "minLength",
    name: "Comprimento mínimo",
    description: "Verifica se o texto tem o comprimento mínimo necessário",
    schema: z.string().min(3, "Deve ter pelo menos 3 caracteres"),
    severity: "error",
    enabled: true,
  },
  maxLength: {
    id: "maxLength",
    name: "Comprimento máximo",
    description: "Verifica se o texto não excede o comprimento máximo permitido",
    schema: z.string().max(100, "Não pode exceder 100 caracteres"),
    severity: "warning",
    enabled: true,
  },
  numericValue: {
    id: "numericValue",
    name: "Valor numérico",
    description: "Verifica se o valor é numérico",
    schema: z.coerce.number().finite("Deve ser um número válido"),
    severity: "error",
    enabled: true,
  },
  positiveNumber: {
    id: "positiveNumber",
    name: "Número positivo",
    description: "Verifica se o número é positivo",
    schema: z.coerce.number().positive("Deve ser um número positivo"),
    severity: "error",
    enabled: true,
  },
  integerValue: {
    id: "integerValue",
    name: "Valor inteiro",
    description: "Verifica se o valor é um número inteiro",
    schema: z.coerce.number().int("Deve ser um número inteiro"),
    severity: "error",
    enabled: true,
  },
  dateFormat: {
    id: "dateFormat",
    name: "Formato de data",
    description: "Verifica se a data está em um formato válido",
    schema: z.coerce.date({
      errorMap: () => ({ message: "Formato de data inválido" }),
    }),
    severity: "error",
    enabled: true,
  },
}

// Validation schemas for different settings sections
export const validationSchemas = {
  general: z.object({
    siteName: z.string().min(1, "Nome do site é obrigatório"),
    siteDescription: z.string().max(200, "Descrição não pode exceder 200 caracteres"),
    contactEmail: z.string().email("E-mail de contato inválido"),
  }),
  api: z.object({
    apiKey: z.string().min(1, "Chave de API é obrigatória"),
    apiUrl: z.string().url("URL da API inválida"),
    timeout: z.coerce.number().positive("Timeout deve ser positivo"),
    retryAttempts: z.coerce.number().int().min(0, "Tentativas de retry deve ser não-negativo"),
  }),
  shopee: z.object({
    shopeeAppId: z.string().min(1, "App ID da Shopee é obrigatório"),
    shopeeAppSecret: z.string().min(1, "App Secret da Shopee é obrigatório"),
    shopeeRedirectUrl: z.string().url("URL de redirecionamento inválida"),
  }),
  video: z.object({
    defaultDuration: z.coerce.number().positive("Duração padrão deve ser positiva"),
    maxDuration: z.coerce.number().positive("Duração máxima deve ser positiva"),
    defaultFormat: z.enum(["mp4", "webm"], {
      errorMap: () => ({ message: "Formato deve ser mp4 ou webm" }),
    }),
    quality: z.enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Qualidade deve ser baixa, média ou alta" }),
    }),
  }),
  cache: z.object({
    cacheEnabled: z.boolean(),
    cacheTTL: z.coerce.number().positive("TTL do cache deve ser positivo"),
    maxCacheSize: z.coerce.number().positive("Tamanho máximo do cache deve ser positivo"),
  }),
}

// Validate a single value against a rule
export function validateValue(value: any, rule: ValidationRule): ValidationError | null {
  if (!rule.enabled) return null

  const result = rule.schema.safeParse(value)
  if (result.success) return null

  return {
    field: "field",
    message: result.error.errors[0]?.message || "Valor inválido",
    severity: rule.severity,
    ruleId: rule.id,
  }
}

// Validate an object against a schema
export function validateObject(data: Record<string, any>, schema: z.ZodType<any>): ValidationResult {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      infos: [],
    }
  }

  const formattedErrors = result.error.errors.map((error) => {
    const field = error.path.join(".")
    return {
      field,
      message: error.message,
      severity: "error" as const,
      ruleId: "schema",
    }
  })

  return {
    valid: false,
    errors: formattedErrors.filter((e) => e.severity === "error"),
    warnings: formattedErrors.filter((e) => e.severity === "warning"),
    infos: formattedErrors.filter((e) => e.severity === "info"),
  }
}

// Get validation status icon
export function getValidationStatusIcon(status: "valid" | "invalid" | "warning" | "info" | "pending"): string {
  switch (status) {
    case "valid":
      return "✓"
    case "invalid":
      return "✗"
    case "warning":
      return "⚠"
    case "info":
      return "ℹ"
    case "pending":
      return "⋯"
    default:
      return ""
  }
}

// Get validation status color
export function getValidationStatusColor(status: "valid" | "invalid" | "warning" | "info" | "pending"): string {
  switch (status) {
    case "valid":
      return "text-green-500"
    case "invalid":
      return "text-red-500"
    case "warning":
      return "text-yellow-500"
    case "info":
      return "text-blue-500"
    case "pending":
      return "text-gray-500"
    default:
      return ""
  }
}
