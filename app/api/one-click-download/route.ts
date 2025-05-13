import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"

const logger = createLogger("API:OneClickDownload")

export async function GET(req: NextRequest) {
  try {
    logger.info("One-click download request received")

    // Get a random product from cache
    const products = await getCachedProducts()

    if (!products || !Array.isArray(products) || products.length === 0) {
      logger.error("No products found in cache")
      return NextResponse.json(
        {
          success: false,
          message: "No products found in cache",
        },
        { status: 404 },
      )
    }

    // Select a random product
    const randomIndex = Math.floor(Math.random() * products.length)
    const product = products[randomIndex]

    logger.info(`Selected random product: ${product.itemId}`)

    // Generate HTML for download page
    const downloadPage = await generateDownloadPage(product, req.nextUrl.origin)

    // Return the HTML page
    return new NextResponse(downloadPage, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    logger.error("Error in one-click download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate download page",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function generateDownloadPage(product: any, apiBaseUrl: string) {
  // Gerar descrição e cards usando o serviço centralizado
  let description = createFallbackDescription(product)

  try {
    // Tentar gerar descrição com API
    const descResponse = await fetch(`${apiBaseUrl}/api/generate-description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product }),
    })

    if (descResponse.ok) {
      const descData = await descResponse.json()
      if (descData.success) {
        description = descData.description
      }
    }
  } catch (error) {
    logger.warn("Failed to generate description, using fallback", { error })
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download de Cards - ${product.productName}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Download Automático de Cards</h1>
      <p class="text-gray-600 mb-6">Os cards para o produto abaixo serão gerados e baixados automaticamente.</p>
      
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <div class="w-full md:w-1/3">
          <img src="${product.imageUrl}" alt="${product.productName}" class="w-full h-auto rounded-lg shadow">
        </div>
        
        <div class="w-full md:w-2/3">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">${product.productName}</h2>
          <p class="text-gray-500 mb-2">ID: ${product.itemId}</p>
          
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl font-bold text-red-600">R$ ${Number(product.price).toFixed(2)}</span>
            ${product.calculatedOriginalPrice ? `<span class="text-sm text-gray-500 line-through">R$ ${Number(product.calculatedOriginalPrice).toFixed(2)}</span>` : ""}
          </div>
          
          <div class="flex items-center gap-4 mb-4">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span class="ml-1 text-gray-700">${product.ratingStar || "4.5"}</span>
            </div>
            
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              <span class="ml-1 text-gray-700">${product.sales}+ vendidos</span>
            </div>
            
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
              </svg>
              <span class="ml-1 text-gray-700">${product.shopName || "Loja Oficial"}</span>
            </div>
          </div>
          
          <div class="bg-gray-100 p-3 rounded-md mb-4">
            <h3 class="font-medium text-gray-700 mb-1">Descrição:</h3>
            <p class="text-gray-600 whitespace-pre-line">${description}</p>
          </div>
          
          <a href="${product.offerLink || "#"}" target="_blank" class="text-blue-600 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            Ver produto na Shopee
          </a>
        </div>
      </div>
      
      <div class="border-t border-gray-200 pt-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Opções de Download</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button id="downloadModern" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Estilo Moderno
          </button>
          
          <button id="downloadAlternative" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Estilo Alternativo
          </button>
          
          <button id="downloadAll" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Baixar Tudo (ZIP)
          </button>
        </div>
        
        <div id="status" class="mt-6 hidden">
          <div class="flex items-center mb-2">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div id="progress" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
            </div>
            <span id="progressText" class="ml-2 text-sm font-medium text-gray-700">0%</span>
          </div>
          <p id="statusText" class="text-sm text-gray-600">Preparando download...</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Pré-visualização</h2>
      <p class="text-gray-600 mb-6">Os cards serão gerados usando a API Canvas e a descrição otimizada pela API Gemini.</p>
      
      <div id="previewContainer" class="flex justify-center items-center p-8 bg-gray-200 rounded-lg">
        <div class="text-center">
          <svg class="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Gerando pré-visualização...</p>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Dados do produto
    const product = ${JSON.stringify(product)};
    const description = ${JSON.stringify(description)};
    
    // Função para mostrar o status de progresso
    function updateStatus(percent, text) {
      document.getElementById('status').classList.remove('hidden');
      document.getElementById('progress').style.width = percent + '%';
      document.getElementById('progressText').textContent = percent + '%';
      document.getElementById('statusText').textContent = text;
    }
    
    // Função para gerar cards usando Canvas API
    async function generateCards() {
      updateStatus(10, 'Iniciando geração de cards...');
      
      try {
        // Implementação simplificada da geração de cards com Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        
        // Fundo preto
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Carregar imagem do produto
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = product.imageUrl;
        });
        
        // Desenhar imagem
        const imgHeight = canvas.height * 0.5;
        ctx.drawImage(img, 0, 0, canvas.width, imgHeight);
        
        // Adicionar gradiente
        const gradient = ctx.createLinearGradient(0, imgHeight - 100, 0, imgHeight);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, imgHeight - 100, canvas.width, 100);
        
        // Texto do produto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(product.productName.substring(0, 30) + (product.productName.length > 30 ? '...' : ''), 40, imgHeight + 80);
        
        // Preço
        ctx.fillStyle = '#FF4D4F';
        ctx.font = 'bold 72px Arial';
        ctx.fillText('R$ ' + Number(product.price).toFixed(2), 40, imgHeight + 180);
        
        // Avaliação e vendas
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '36px Arial';
        ctx.fillText('⭐ ' + (product.ratingStar || '4.5') + ' • ' + product.sales + '+ vendas', 40, imgHeight + 250);
        
        // Descrição
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '32px Arial';
        const descLines = description.split('\\n');
        let y = imgHeight + 350;
        for (let i = 0; i < Math.min(descLines.length, 5); i++) {
          ctx.fillText(descLines[i].substring(0, 40) + (descLines[i].length > 40 ? '...' : ''), 40, y);
          y += 40;
        }
        
        // Botão CTA
        ctx.fillStyle = '#FF4D4F';
        ctx.fillRect(40, canvas.height - 150, canvas.width - 80, 80);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('COMPRE AGORA • LINK NA BIO', canvas.width / 2, canvas.height - 100);
        
        // Converter para blob
        updateStatus(70, 'Convertendo imagem...');
        
        const modernBlob = await new Promise(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/png');
        });
        
        // Gerar versão alternativa (com fundo diferente)
        ctx.fillStyle = '#0D0D2B'; // Fundo azul escuro
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, imgHeight);
        
        // Converter segunda versão para blob
        const alternativeBlob = await new Promise(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/png');
        });
        
        updateStatus(90, 'Cards gerados com sucesso!');
        
        // Mostrar pré-visualização
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = '';
        
        const previewImg = document.createElement('img');
        previewImg.src = URL.createObjectURL(modernBlob);
        previewImg.className = 'max-h-[500px] rounded-lg shadow-lg';
        previewContainer.appendChild(previewImg);
        
        return {
          modernBlob,
          alternativeBlob
        };
      } catch (error) {
        console.error('Erro ao gerar cards:', error);
        updateStatus(0, 'Erro ao gerar cards: ' + error.message);
        throw error;
      }
    }
    
    // Função para baixar o template moderno
    document.getElementById('downloadModern').addEventListener('click', async function() {
      try {
        updateStatus(10, 'Gerando card moderno...');
        
        const { modernBlob } = await generateCards();
        
        updateStatus(90, 'Preparando download...');
        
        // Baixar a imagem
        saveAs(modernBlob, 'product_${product.itemId}_modern.png');
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar template moderno:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    });
    
    // Função para baixar o template alternativo
    document.getElementById('downloadAlternative').addEventListener('click', async function() {
      try {
        updateStatus(10, 'Gerando card alternativo...');
        
        const { alternativeBlob } = await generateCards();
        
        updateStatus(90, 'Preparando download...');
        
        // Baixar a imagem
        saveAs(alternativeBlob, 'product_${product.itemId}_alternative.png');
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar template alternativo:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    });
    
    // Função para baixar todos os templates como ZIP
    document.getElementById('downloadAll').addEventListener('click', async function() {
      try {
        updateStatus(10, 'Gerando cards...');
        
        const { modernBlob, alternativeBlob } = await generateCards();
        updateStatus(50, 'Cards gerados com sucesso!');
        
        // Criar arquivo de texto com informações do produto
        const textContent = \`
Product: ${product.productName}
ID: ${product.itemId}
Price: R$ ${Number(product.price).toFixed(2)}
Shop: ${product.shopName || "Unknown"}
Sales: ${product.sales}
Rating: ${product.ratingStar || "N/A"}

Description:
${description}

Link: ${product.offerLink || "N/A"}
        \`.trim();
        
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        
        updateStatus(70, 'Criando arquivo ZIP...');
        
        // Criar ZIP
        const zip = new JSZip();
        zip.file('product_${product.itemId}_modern.png', modernBlob);
        zip.file('product_${product.itemId}_alternative.png', alternativeBlob);
        zip.file('product_${product.itemId}_info.txt', textBlob);
        
        // Gerar o arquivo ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        updateStatus(90, 'Preparando download...');
        
        // Baixar o ZIP
        saveAs(zipBlob, 'product_${product.itemId}_package.zip');
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar todos os templates:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    });
    
    // Iniciar geração de cards para pré-visualização
    generateCards().catch(error => {
      console.error('Erro na pré-visualização:', error);
      document.getElementById('previewContainer').innerHTML = '<div class="text-center text-red-600"><p>Erro ao gerar pré-visualização: ' + error.message + '</p></div>';
    });
    
    // Iniciar download automático após 2 segundos
    setTimeout(function() {
      document.getElementById('downloadAll').click();
    }, 2000);
  </script>
</body>
</html>`
}
