import { createLogger } from "./logger"

const logger = createLogger("search-store")

// Armazenamento em memória para os resultados da última busca
// Isso será reiniciado quando o servidor for reiniciado
let lastSearchResults: any[] = []

export function saveLastSearchResults(products: any[]): void {
  try {
    lastSearchResults = [...products]
    logger.info(`${products.length} produtos salvos como última pesquisa`)
  } catch (error) {
    logger.error("Erro ao salvar resultados da última pesquisa:", { details: error })
  }
}

export function getLastSearchResults(): any[] {
  try {
    return [...lastSearchResults]
  } catch (error) {
    logger.error("Erro ao obter resultados da última pesquisa:", { details: error })
    return []
  }
}
