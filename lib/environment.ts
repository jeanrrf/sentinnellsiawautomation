// Utilitário para verificar variáveis de ambiente necessárias
export function checkRequiredEnvVars() {
  const requiredVars = [
    "SHOPEE_APP_ID",
    "SHOPEE_APP_SECRET",
    "SHOPEE_REDIRECT_URL",
    "SHOPEE_AFFILIATE_API_URL",
    "TOKEN_ENCRYPTION_KEY",
  ]

  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn(`⚠️ Variáveis de ambiente ausentes: ${missingVars.join(", ")}`)
    return false
  }

  return true
}

// Verificar variáveis opcionais com fallbacks
export function getEnvWithFallback(name: string, fallback = ""): string {
  const value = process.env[name]
  if (!value) {
    console.warn(`⚠️ Variável de ambiente ${name} não encontrada, usando fallback.`)
    return fallback
  }
  return value
}
