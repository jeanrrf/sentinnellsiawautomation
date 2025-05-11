import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { renderProductCardTemplate, createFallbackDescription } from "@/lib/template-renderer"
import { getCachedProducts } from "@/lib/redis"

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

    // Create description
    const description = createFallbackDescription(product)

    // Generate HTML for download page
    const downloadPage = generateDownloadPage(product, description)

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

function generateDownloadPage(product: any, description: string) {
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
            Template Moderno
          </button>
          
          <button id="downloadAgemini" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Template Agemini
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
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Pré-visualização dos Templates</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium text-gray-700 mb-2">Template Moderno</h3>
          <div class="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <iframe id="previewModern" class="w-full h-[500px] border-0" srcdoc="${encodeURIComponent(renderProductCardTemplate(product, description, "portrait"))}"></iframe>
          </div>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-700 mb-2">Template Agemini</h3>
          <div class="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <iframe id="previewAgemini" class="w-full h-[500px] border-0" srcdoc="${encodeURIComponent(renderProductCardTemplate(product, description, "ageminipara"))}"></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Função para capturar o conteúdo de um iframe como imagem
    async function captureIframe(iframeId) {
      return new Promise((resolve, reject) => {
        const iframe = document.getElementById(iframeId);
        const iframeWindow = iframe.contentWindow;
        
        // Esperar o iframe carregar completamente
        if (iframe.complete) {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Definir dimensões do canvas
            canvas.width = iframe.contentDocument.documentElement.scrollWidth;
            canvas.height = iframe.contentDocument.documentElement.scrollHeight;
            
            // Criar uma imagem HTML a partir do conteúdo do iframe
            const img = new Image();
            img.crossOrigin = "Anonymous";
            
            // Converter o documento HTML para uma URL de dados
            const data = new XMLSerializer().serializeToString(iframe.contentDocument);
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.width + '" height="' + canvas.height + '">' +
                        '<foreignObject width="100%" height="100%">' +
                        '<div xmlns="http://www.w3.org/1999/xhtml">' +
                        data +
                        '</div></foreignObject></svg>';
            
            const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            
            img.onload = function() {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(function(blob) {
                resolve(blob);
              }, 'image/png');
            };
            
            img.onerror = function(e) {
              reject(new Error('Failed to load image: ' + e));
            };
            
            img.src = url;
          } catch (error) {
            reject(error);
          }
        } else {
          iframe.onload = function() {
            try {
              const canvas = document.createElement('canvas');
              // ... mesmo código acima
            } catch (error) {
              reject(error);
            }
          };
        }
      });
    }
    
    // Função para mostrar o status de progresso
    function updateStatus(percent, text) {
      document.getElementById('status').classList.remove('hidden');
      document.getElementById('progress').style.width = percent + '%';
      document.getElementById('progressText').textContent = percent + '%';
      document.getElementById('statusText').textContent = text;
    }
    
    // Função para baixar o template moderno
    document.getElementById('downloadModern').addEventListener('click', async function() {
      try {
        updateStatus(10, 'Capturando template moderno...');
        
        // Capturar o iframe como imagem
        const blob = await captureIframe('previewModern');
        
        updateStatus(90, 'Preparando download...');
        
        // Baixar a imagem
        saveAs(blob, 'product_${product.itemId}_modern.png');
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar template moderno:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    });
    
    // Função para baixar o template agemini
    document.getElementById('downloadAgemini').addEventListener('click', async function() {
      try {
        updateStatus(10, 'Capturando template agemini...');
        
        // Capturar o iframe como imagem
        const blob = await captureIframe('previewAgemini');
        
        updateStatus(90, 'Preparando download...');
        
        // Baixar a imagem
        saveAs(blob, 'product_${product.itemId}_agemini.png');
        
        updateStatus(100, 'Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar template agemini:', error);
        updateStatus(0, 'Erro: ' + error.message);
      }
    });
    
    // Função para baixar todos os templates como ZIP
    document.getElementById('downloadAll').addEventListener('click', async function() {
      try {
        updateStatus(10, 'Capturando templates...');
        
        // Capturar os iframes como imagens
        const modernBlob = await captureIframe('previewModern');
        updateStatus(30, 'Template moderno capturado...');
        
        const ageminiBlob = await captureIframe('previewAgemini');
        updateStatus(50, 'Template agemini capturado...');
        
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
        zip.file('product_${product.itemId}_agemini.png', ageminiBlob);
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
    
    // Iniciar download automático após 2 segundos
    setTimeout(function() {
      document.getElementById('downloadAll').click();
    }, 2000);
  </script>
</body>
</html>`
}
