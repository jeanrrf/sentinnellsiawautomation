import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"

const logger = createLogger("API:EnhancedAutoDownload")

// Lista de todos os templates disponíveis
const AVAILABLE_TEMPLATES = ["modern", "minimal", "bold", "elegant", "vibrant"]

export async function GET(req: NextRequest) {
  try {
    logger.info("Enhanced auto-download request received")
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")

    // Obter produtos do cache
    const products = await getCachedProducts()
    let selectedProduct

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

    // Se um ID específico foi fornecido, buscar esse produto
    if (productId) {
      selectedProduct = products.find((p) => p.itemId === productId)
      if (!selectedProduct) {
        logger.warn(`Product with ID ${productId} not found, selecting random product`)
      }
    }

    // Se não encontrou o produto específico ou nenhum ID foi fornecido, selecionar aleatoriamente
    if (!selectedProduct) {
      const randomIndex = Math.floor(Math.random() * products.length)
      selectedProduct = products[randomIndex]
    }

    logger.info(`Selected product: ${selectedProduct.itemId} - ${selectedProduct.productName}`)

    // Gerar descrição
    let description = ""
    try {
      const descResponse = await fetch(`${req.nextUrl.origin}/api/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: selectedProduct }),
      })

      if (descResponse.ok) {
        const descData = await descResponse.json()
        if (descData.success) {
          description = descData.description
        } else {
          throw new Error(descData.error || "Failed to generate description")
        }
      } else {
        throw new Error(`API returned ${descResponse.status}`)
      }
    } catch (error) {
      logger.warn("Failed to generate description, using fallback", { error })
      description = createFallbackDescription(selectedProduct)
    }

    // Gerar HTML para download page com todos os templates
    const downloadPage = generateEnhancedDownloadPage(selectedProduct, description, req.nextUrl.origin)

    // Retornar a página HTML
    return new NextResponse(downloadPage, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    logger.error("Error in enhanced auto-download:", error)
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

function generateEnhancedDownloadPage(product: any, description: string, apiBaseUrl: string) {
  const productJson = JSON.stringify(product)
  const descriptionJson = JSON.stringify(description)
  const templatesJson = JSON.stringify(AVAILABLE_TEMPLATES)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download de Cards - ${product.productName}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"><\/script>
  <style>
    .card-preview {
      aspect-ratio: 9/16;
      max-height: 500px;
      width: auto;
    }
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 50;
      color: white;
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="loadingOverlay" class="loading-overlay">
    <div class="spinner"></div>
    <div id="loadingText">Gerando cards em todos os modelos...</div>
  </div>

  <div class="container mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Download Automático de Cards</h1>
      <p class="text-gray-600 mb-6">Cards gerados automaticamente para o produto abaixo em todos os modelos disponíveis.</p>
      
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
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button id="downloadAllButton" class="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Baixar Todos os Modelos (ZIP)
          </button>
          
          <button id="downloadTextButton" class="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Baixar Apenas Descrição (TXT)
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
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Pré-visualização dos Modelos</h2>
      <p class="text-gray-600 mb-6">Todos os modelos disponíveis foram gerados automaticamente.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="previewContainer">
        <!-- Os previews serão inseridos aqui via JavaScript -->
      </div>
    </div>
  </div>
  
  <script>
    // Dados do produto
    const product = ${productJson};
    const description = ${descriptionJson};
    const apiBaseUrl = "${apiBaseUrl}";
    const templates = ${templatesJson};
    
    // Função para mostrar o status de progresso
    function updateStatus(percent, text) {
      document.getElementById('status').classList.remove('hidden');
      document.getElementById('progress').style.width = percent + '%';
      document.getElementById('progressText').textContent = percent + '%';
      document.getElementById('statusText').textContent = text;
    }
    
    // Função para atualizar o texto de carregamento
    function updateLoadingText(text) {
      document.getElementById('loadingText').textContent = text;
    }
    
    // Função para gerar cards para todos os templates
    async function generateAllCards() {
      const cardUrls = {};
      const previewContainer = document.getElementById('previewContainer');
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        updateLoadingText('Gerando card ' + (i+1) + '/' + templates.length + ': ' + template);

        try {
          // Gerar o card via API
          const cardUrl = apiBaseUrl + '/api/download-card/' + product.itemId + '?template=' + template;
          cardUrls[template] = cardUrl;
          
          // Criar preview
          const previewDiv = document.createElement('div');
          previewDiv.className = 'flex flex-col items-center border rounded-lg p-4';
          previewDiv.innerHTML = '<h3 class="font-semibold text-lg mb-2 capitalize">' + template + '</h3>' +
            '<div class="relative overflow-hidden rounded-lg mb-3">' +
            '<img src="' + cardUrl + '" alt="Card ' + template + '" class="card-preview object-contain">' +
            '</div>' +
            '<button class="download-single w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm" data-template="' + template + '">' +
            'Baixar ' + template +
            '</button>';
          
          previewContainer.appendChild(previewDiv);
        } catch (error) {
          console.error('Error generating ' + template + ' card:', error);
        }
      }

      // Esconder overlay de carregamento
      document.getElementById('loadingOverlay').style.display = 'none';
      
      return cardUrls;
    }
    
    // Função para baixar um único template
    async function downloadSingleTemplate(template) {
      updateStatus(30, 'Baixando template ' + template + '...');
      
      try {
        const cardUrl = apiBaseUrl + '/api/download-card/' + product.itemId + '?template=' + template;
        
        // Criar link e disparar download
        const link = document.createElement('a');
        link.href = cardUrl;
        link.download = 'product_' + product.itemId + '_' + template + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar template:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    }
    
    // Função para baixar o arquivo de texto
    function downloadTextFile() {
      try {
        updateStatus(50, 'Preparando download...');
        
        // Criar conteúdo do texto
        const textContent = 'Product: ' + product.productName +
          '\\nID: ' + product.itemId +
          '\\nPrice: R$ ' + Number(product.price).toFixed(2) +
          (product.calculatedOriginalPrice ? '\\nOriginal Price: R$ ' + product.calculatedOriginalPrice : '') +
          (product.priceDiscountRate ? '\\nDiscount: ' + product.priceDiscountRate + '%' : '') +
          '\\nShop: ' + (product.shopName || 'Unknown') +
          '\\nSales: ' + product.sales +
          '\\nRating: ' + (product.ratingStar || 'N/A') +
          '\\n\\nDescription:\\n' + description +
          '\\n\\nLink: ' + (product.offerLink || 'N/A');
        
        // Criar blob e link para download
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'product_' + product.itemId + '_description.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar texto:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    }
    
    // Função para baixar todos os templates como ZIP
    async function downloadAllTemplates() {
      try {
        updateStatus(10, 'Preparando o pacote ZIP...');
        
        // Criar um novo JSZip
        const zip = new JSZip();
        
        // Adicionar arquivo de texto com informações do produto
        const textContent = 'Product: ' + product.productName +
          '\\nID: ' + product.itemId +
          '\\nPrice: R$ ' + Number(product.price).toFixed(2) +
          (product.calculatedOriginalPrice ? '\\nOriginal Price: R$ ' + product.calculatedOriginalPrice : '') +
          (product.priceDiscountRate ? '\\nDiscount: ' + product.priceDiscountRate + '%' : '') +
          '\\nShop: ' + (product.shopName || 'Unknown') +
          '\\nSales: ' + product.sales +
          '\\nRating: ' + (product.ratingStar || 'N/A') +
          '\\n\\nDescription:\\n' + description +
          '\\n\\nLink: ' + (product.offerLink || 'N/A');
        
        zip.file('product_' + product.itemId + '_info.txt', textContent);
        
        // Baixar e adicionar cada template
        for (let i = 0; i < templates.length; i++) {
          const template = templates[i];
          updateStatus(10 + Math.floor(80 * (i / templates.length)), 'Processando template ' + template + '...');
          
          try {
            const cardUrl = apiBaseUrl + '/api/download-card/' + product.itemId + '?template=' + template;
            const response = await fetch(cardUrl);
            const blob = await response.blob();
            
            zip.file('product_' + product.itemId + '_' + template + '.png', blob);
          } catch (templateError) {
            console.error('Error processing ' + template + ':', templateError);
          }
        }
        
        updateStatus(90, 'Gerando arquivo ZIP...');
        
        // Gerar o arquivo ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Baixar o ZIP
        saveAs(zipBlob, 'product_' + product.itemId + '_all_templates.zip');
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar todos os templates:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    }
    
    // Event listeners
    document.getElementById('downloadAllButton').addEventListener('click', downloadAllTemplates);
    document.getElementById('downloadTextButton').addEventListener('click', downloadTextFile);
    
    // Event listener para botões de download individual (adicionados dinamicamente)
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('download-single')) {
        const template = e.target.getAttribute('data-template');
        downloadSingleTemplate(template);
      }
    });
    
    // Iniciar geração de cards
    generateAllCards().catch(error => {
      console.error('Erro na geração de cards:', error);
      document.getElementById('loadingOverlay').style.display = 'none';
      alert('Erro ao gerar cards: ' + error.message);
    });
    
    // Iniciar download automático após 3 segundos
    setTimeout(function() {
      downloadAllTemplates();
    }, 3000);
  <\/script>
</body>
</html>`
}
