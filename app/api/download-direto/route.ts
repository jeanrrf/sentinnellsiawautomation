import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DownloadDireto")

export async function GET(request: Request) {
  try {
    logger.info("Download direto iniciado")

    // Criar um arquivo de texto simples
    const conteudo = `Arquivo de teste DIRETO gerado em ${new Date().toLocaleString("pt-BR")}
    
Este é um arquivo de teste para verificar se o download direto está funcionando corretamente.
Se você está vendo este arquivo, o download direto está funcionando!
    
Informações do sistema:
- Ambiente: ${process.env.NODE_ENV || "desconhecido"}
- Vercel: ${process.env.VERCEL === "1" ? "Sim" : "Não"}
- Data/Hora: ${new Date().toLocaleString("pt-BR")}
`

    // Criar HTML com link de download automático
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Download Automático</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            background-color: #f9f9f9;
        }
        h1 {
            color: #333;
        }
        .success {
            color: green;
            font-weight: bold;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
        }
        .info {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>Download Automático</h1>
    
    <div class="container">
        <p>Seu download deve começar automaticamente em alguns segundos.</p>
        <p class="success">Se o download não iniciar, clique no botão abaixo:</p>
        
        <a href="data:text/plain;charset=utf-8,${encodeURIComponent(conteudo)}" 
           download="teste-download-direto-${Date.now()}.txt" 
           class="button" 
           id="download-link">
           Baixar Arquivo
        </a>
    </div>
    
    <div class="info">
        <p><strong>Dicas se o download não funcionar:</strong></p>
        <ul>
            <li>Verifique se o bloqueador de pop-ups está desativado</li>
            <li>Tente usar outro navegador</li>
            <li>Verifique as configurações de download do seu navegador</li>
        </ul>
    </div>

    <script>
        // Iniciar download automaticamente após 1 segundo
        window.onload = function() {
            setTimeout(function() {
                document.getElementById('download-link').click();
            }, 1000);
        }
    </script>
</body>
</html>
`

    // Retornar a página HTML
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Adicionar cabeçalhos para evitar cache
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    logger.error("Erro no download direto:", error)

    // Retornar erro como HTML para melhor visualização
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Erro no Download</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .error-container {
            border: 1px solid #f44336;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            background-color: #ffebee;
        }
        h1 {
            color: #d32f2f;
        }
        .error-message {
            color: #d32f2f;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Erro no Download</h1>
    
    <div class="error-container">
        <p>Ocorreu um erro ao processar seu download:</p>
        <p class="error-message">${error.message || "Erro desconhecido"}</p>
    </div>
</body>
</html>
`

    return new Response(errorHtml, {
      status: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  }
}
