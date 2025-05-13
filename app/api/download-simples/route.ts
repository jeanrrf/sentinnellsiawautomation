import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DownloadSimples")

export async function GET(request: Request) {
  try {
    logger.info("Download simples iniciado")

    // Criar um arquivo de texto simples
    const conteudo = `Arquivo de teste gerado em ${new Date().toLocaleString("pt-BR")}
    
Este é um arquivo de teste para verificar se o download está funcionando corretamente.
Se você está vendo este arquivo, o download básico está funcionando!
    
Informações do sistema:
- Ambiente: ${process.env.NODE_ENV || "desconhecido"}
- Vercel: ${process.env.VERCEL === "1" ? "Sim" : "Não"}
- Data/Hora: ${new Date().toLocaleString("pt-BR")}
`

    // Criar resposta com o arquivo
    const response = new Response(conteudo, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="teste-download-${Date.now()}.txt"`,
        // Adicionar cabeçalhos para evitar cache
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    return response
  } catch (error) {
    logger.error("Erro no download simples:", error)

    // Retornar erro como texto para facilitar visualização
    return new Response(`Erro no download: ${error.message || "Erro desconhecido"}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  }
}
