import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DownloadHTML")

export async function GET(request: Request) {
  try {
    logger.info("Download HTML iniciado")

    // Criar conteúdo do arquivo
    const timestamp = new Date().toLocaleString("pt-BR")
    const fileName = `teste-download-${Date.now()}.txt`

    const fileContent = `Arquivo de teste gerado em ${timestamp}
    
Este é um arquivo de teste para verificar se o download está funcionando corretamente.
Se você está vendo este arquivo, o download via HTML está funcionando!
    
Informações do sistema:
- Ambiente: ${process.env.NODE_ENV || "desconhecido"}
- Vercel: ${process.env.VERCEL === "1" ? "Sim" : "Não"}
- Data/Hora: ${timestamp}
`

    // Criar HTML com iframe para download
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Download via HTML</title>
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
            cursor: pointer;
        }
        .info {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
        #download-area {
            margin-top: 20px;
            padding: 15px;
            border: 1px dashed #ccc;
            background-color: #f5f5f5;
        }
        textarea {
            width: 100%;
            height: 150px;
            margin-top: 10px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>Download via HTML</h1>
    
    <div class="container">
        <p>Seu download deve começar automaticamente em alguns segundos.</p>
        <p class="success">Se o download não iniciar, use uma das opções abaixo:</p>
        
        <button onclick="downloadFile()" class="button">
            Baixar Arquivo
        </button>
        
        <button onclick="copyToClipboard()" class="button" style="background-color: #2196F3; margin-left: 10px;">
            Copiar Conteúdo
        </button>
    </div>
    
    <div id="download-area">
        <p><strong>Conteúdo do arquivo:</strong></p>
        <textarea id="file-content" readonly>${fileContent}</textarea>
    </div>
    
    <div class="info">
        <p><strong>Dicas se o download não funcionar:</strong></p>
        <ul>
            <li>Use o botão "Copiar Conteúdo" e salve manualmente em um arquivo de texto</li>
            <li>Verifique se o bloqueador de pop-ups está desativado</li>
            <li>Tente usar outro navegador</li>
        </ul>
    </div>

    <script>
        // Função para download via Blob
        function downloadFile() {
            const content = document.getElementById('file-content').value;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = "${fileName}";
            document.body.appendChild(a);
            a.click();
            
            // Limpar
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
        
        // Função para copiar para área de transferência
        function copyToClipboard() {
            const content = document.getElementById('file-content');
            content.select();
            document.execCommand('copy');
            
            alert('Conteúdo copiado para a área de transferência!');
        }
        
        // Iniciar download automaticamente após 1 segundo
        window.onload = function() {
            setTimeout(downloadFile, 1000);
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
    logger.error("Erro no download HTML:", error)

    // Retornar erro como HTML
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
