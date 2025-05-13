import { type CategorizedError, ErrorSeverity, ErrorSource, type ErrorSolution } from "./types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("solution-provider")

/**
 * Provides solutions for errors
 */
export class SolutionProvider {
  private solutions: ErrorSolution[] = []

  constructor() {
    this.initializeSolutions()
  }

  /**
   * Initializes the solution database
   */
  private initializeSolutions() {
    // Shopee API specific solutions
    this.solutions = [
      {
        errorPattern: /Invalid Authorization Header/i,
        solution:
          "O cabeçalho de autorização está em formato inválido. Verifique o formato exato exigido pela API da Shopee: 'SHA256 Credential=APP_ID,Timestamp=TIMESTAMP,Signature=SIGNATURE' sem espaços após as vírgulas.",
        documentationUrl: "https://open.shopee.com/documents?module=87&type=2&id=64&version=2",
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.AUTHENTICATION,
      },
      {
        errorPattern: /API retornou status 401/i,
        solution:
          "Autenticação falhou. Verifique se o APP_ID e APP_SECRET estão corretos e se o timestamp está sincronizado.",
        documentationUrl: "https://open.shopee.com/documents?module=87&type=2&id=64&version=2",
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.AUTHENTICATION,
      },
      {
        errorPattern: /API retornou status 403/i,
        solution:
          "Acesso proibido. Verifique se sua aplicação tem permissão para acessar este recurso ou se o token expirou.",
        documentationUrl: "https://open.shopee.com/documents?module=87&type=2&id=64&version=2",
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.AUTHENTICATION,
      },
      {
        errorPattern: /Timeout na requisição/i,
        solution:
          "A requisição excedeu o tempo limite. Verifique a conectividade de rede e considere aumentar o timeout ou implementar retentativas.",
        severity: ErrorSeverity.MEDIUM,
        source: ErrorSource.NETWORK,
      },
      {
        errorPattern: /Erro de rede|Network Error/i,
        solution:
          "Problema de conectividade de rede. Verifique sua conexão com a internet e se o endpoint da API está acessível.",
        severity: ErrorSeverity.MEDIUM,
        source: ErrorSource.NETWORK,
      },
      {
        errorPattern: /Produto não encontrado|Nenhum produto encontrado/i,
        solution:
          "O produto solicitado não foi encontrado. Verifique se o ID do produto está correto e se o produto ainda está disponível.",
        severity: ErrorSeverity.LOW,
        source: ErrorSource.API,
      },
      {
        errorPattern: /Configuração da API incompleta/i,
        solution:
          "Faltam variáveis de ambiente necessárias. Verifique se SHOPEE_APP_ID, SHOPEE_APP_SECRET e SHOPEE_AFFILIATE_API_URL estão definidos.",
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.AUTHENTICATION,
      },
      {
        errorPattern: /error \[10020\]/i,
        solution:
          "Erro 10020: Cabeçalho de autorização inválido. Verifique o formato exato do cabeçalho e certifique-se de que não há espaços extras.",
        documentationUrl: "https://open.shopee.com/documents?module=87&type=2&id=64&version=2",
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.AUTHENTICATION,
      },
      {
        errorPattern: /error \[10021\]/i,
        solution:
          "Erro 10021: Timestamp inválido. Verifique se o timestamp está em segundos (não milissegundos) e se está dentro do limite de tolerância (±600 segundos).",
        documentationUrl: "https://open.shopee.com/documents?module=87&type=2&id=64&version=2",
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.AUTHENTICATION,
      },
    ]
  }

  /**
   * Finds a solution for an error
   */
  findSolution(error: CategorizedError): string | null {
    // Check if we already have a suggested solution
    if (error.suggestedSolution) {
      return error.suggestedSolution
    }

    const errorMessage = `${error.message} ${error.code || ""}`.toLowerCase()

    // Find matching solution
    for (const solution of this.solutions) {
      if (typeof solution.errorPattern === "string") {
        if (errorMessage.includes(solution.errorPattern.toLowerCase())) {
          return this.formatSolution(solution)
        }
      } else if (solution.errorPattern instanceof RegExp) {
        if (solution.errorPattern.test(errorMessage)) {
          return this.formatSolution(solution)
        }
      }
    }

    // If no specific solution is found, provide a generic one based on error source
    return this.getGenericSolution(error)
  }

  /**
   * Formats a solution with documentation URL if available
   */
  private formatSolution(solution: ErrorSolution): string {
    if (solution.documentationUrl) {
      return `${solution.solution}\n\nDocumentação: ${solution.documentationUrl}`
    }
    return solution.solution
  }

  /**
   * Gets a generic solution based on error source
   */
  private getGenericSolution(error: CategorizedError): string | null {
    switch (error.source) {
      case ErrorSource.API:
        return "Erro na comunicação com a API. Verifique os parâmetros da requisição e a disponibilidade do serviço."
      case ErrorSource.NETWORK:
        return "Problema de conectividade de rede. Verifique sua conexão com a internet e se o serviço está acessível."
      case ErrorSource.AUTHENTICATION:
        return "Erro de autenticação. Verifique suas credenciais e permissões."
      case ErrorSource.VALIDATION:
        return "Erro de validação. Verifique se os dados fornecidos estão corretos e completos."
      case ErrorSource.DATABASE:
        return "Erro relacionado ao banco de dados ou cache. Verifique a conexão e a integridade dos dados."
      default:
        return null
    }
  }

  /**
   * Searches for solutions online (placeholder for future implementation)
   */
  async searchOnlineSolutions(error: CategorizedError): Promise<string | null> {
    // This would be implemented to search for solutions online
    // For now, just log that we would search online
    logger.info(`Searching online for solutions to: ${error.message}`)
    return null
  }

  /**
   * Adds a new solution to the database
   */
  addSolution(solution: ErrorSolution): void {
    this.solutions.push(solution)
  }
}
