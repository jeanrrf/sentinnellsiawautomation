import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { getCachedProduct } from "@/lib/redis"

// Verificar se estamos no ambiente Vercel
const isVercel = process.env.VERCEL === "1"

// Configurar cliente Redis
let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    const searchParams = new URL(request.url).searchParams
    const format = searchParams.get("format") || "html" // Formato padrão é HTML

    // Buscar o vídeo do Redis
    const videoData = await getCachedProduct(productId)

    if (!videoData || !videoData.htmlTemplate) {
      return NextResponse.json({ success: false, message: "Vídeo não encontrado no cache" }, { status: 404 })
    }

    // Se o formato solicitado for HTML, retornar o HTML
    if (format === "html") {
      // Adicionar scripts para facilitar a conversão para vídeo
      const enhancedHtml = addVideoConversionScripts(
        videoData.htmlTemplate,
        videoData.productName || "produto",
        videoData,
      )

      return new NextResponse(enhancedHtml, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="shopee_product_${productId}.html"`,
        },
      })
    }
    // Se o formato solicitado for "video-data", retornar os dados para conversão no cliente
    else if (format === "video-data") {
      const videoInfo = {
        html: videoData.htmlTemplate,
        productName: videoData.productName,
        productId: videoData.productId,
        duration: videoData.duration || 5,
        width: 1080,
        height: 1920,
      }

      return NextResponse.json(videoInfo)
    }
    // Caso contrário, retornar um erro informando que o formato não é suportado
    else {
      return NextResponse.json(
        {
          success: false,
          message: "Formato não suportado. Use 'html' ou 'video-data'.",
          supportedFormats: ["html", "video-data"],
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Erro ao processar download do vídeo:", error)
    return NextResponse.json({ success: false, message: "Erro ao processar download do vídeo" }, { status: 500 })
  }
}

// Função para adicionar scripts que facilitam a conversão para vídeo
function addVideoConversionScripts(html: string, productName: string, videoData: any): string {
  // Verificar se o HTML já tem a tag </body>
  if (!html.includes("</body>")) {
    html += "<body></body>"
  }

  // Script para ajudar na conversão para vídeo
  const conversionScript = `
  <script>
    // Adicionar instruções para o usuário
    window.addEventListener('DOMContentLoaded', function() {
      const instructionsDiv = document.createElement('div');
      instructionsDiv.style.position = 'fixed';
      instructionsDiv.style.bottom = '10px';
      instructionsDiv.style.left = '10px';
      instructionsDiv.style.right = '10px';
      instructionsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      instructionsDiv.style.color = 'white';
      instructionsDiv.style.padding = '10px';
      instructionsDiv.style.borderRadius = '5px';
      instructionsDiv.style.zIndex = '9999';
      instructionsDiv.style.fontSize = '14px';
      instructionsDiv.style.textAlign = 'center';
      
      instructionsDiv.innerHTML = \`
        <h3 style="margin: 0 0 5px 0;">Instruções para Converter em Vídeo</h3>
        <p style="margin: 0 0 5px 0;">1. Use uma ferramenta de captura de tela para gravar esta página como vídeo</p>
        <p style="margin: 0 0 5px 0;">2. Recomendamos: OBS Studio, Camtasia ou ScreenToGif</p>
        <p style="margin: 0 0 5px 0;">3. Grave por \${videoData.duration || 5} segundos e salve como MP4</p>
        <button id="hideInstructions" style="background: #ff0055; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Esconder Instruções</button>
      \`;
      
      document.body.appendChild(instructionsDiv);
      
      document.getElementById('hideInstructions').addEventListener('click', function() {
        instructionsDiv.style.display = 'none';
      });
    });
  </script>
  `

  // Inserir o script antes do </body>
  return html.replace("</body>", conversionScript + "</body>")
}
