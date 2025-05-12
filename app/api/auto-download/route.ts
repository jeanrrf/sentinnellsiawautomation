import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { renderProductCardTemplate, createFallbackDescription } from "@/lib/template-renderer"
import { getCachedProducts } from "@/lib/redis"

const logger = createLogger("API:AutoDownload")

// Sample product data to use when Redis is unavailable
const SAMPLE_PRODUCT = {
  itemId: "sample123",
  productName: "Produto Demonstração",
  price: "99.90",
  shopName: "Loja Exemplo",
  sales: 1234,
  ratingStar: 4.8,
  offerLink: "https://example.com/product",
  images: ["https://via.placeholder.com/500"],
  description: "Este é um produto de demonstração usado quando não há conexão com o Redis.",
  categories: ["Exemplo", "Demonstração"],
  discount: 20,
  originalPrice: "129.90",
}

export async function GET(req: NextRequest) {
  try {
    logger.info("Enhanced auto-download request received")

    // Try to get products from cache
    let product
    try {
      const products = await getCachedProducts()

      if (products && Array.isArray(products) && products.length > 0) {
        // Select a random product
        const randomIndex = Math.floor(Math.random() * products.length)
        product = products[randomIndex]
        logger.info(`Selected random product: ${product.itemId}`)
      } else {
        // Use sample product if no products found
        logger.warning("No products found in cache, using sample product")
        product = SAMPLE_PRODUCT
      }
    } catch (error) {
      // Handle Redis connection error
      logger.error("Error connecting to Redis:", error)
      logger.warning("Using sample product due to Redis connection error")
      product = SAMPLE_PRODUCT
    }

    // Create description
    const description = product.description || createFallbackDescription(product)

    // Generate cards with different templates
    const modernTemplate = renderProductCardTemplate(product, description, "portrait")
    const ageminiTemplate = renderProductCardTemplate(product, description, "ageminipara")

    // Create a client-side HTML that will handle the download
    const clientHtml = generateClientDownloadPage(product, description, modernTemplate, ageminiTemplate)

    // Return the HTML page
    return new NextResponse(clientHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    logger.error("Error in auto-download:", error)

    // Return an error page instead of JSON
    const errorHtml = generateErrorPage(error.message || "Unknown error occurred")
    return new NextResponse(errorHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  }
}

// Function to generate an error page
function generateErrorPage(errorMessage: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro na Geração de Cards</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    body {
      background-color: #f5f5f5;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 30px;
      text-align: center;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #e53e3e;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
      color: #e53e3e;
    }
    p {
      margin-bottom: 20px;
      color: #4a5568;
      line-height: 1.6;
    }
    .error-details {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: left;
      font-family: monospace;
      color: #e53e3e;
    }
    .button {
      padding: 12px 20px;
      background-color: #4a6cf7;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      display: inline-block;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #3a5ce5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Erro na Geração de Cards</h1>
    <p>Ocorreu um erro ao tentar gerar os cards de produto. Por favor, tente novamente mais tarde ou entre em contato com o suporte.</p>
    
    <div class="error-details">
      ${errorMessage}
    </div>
    
    <a href="/dashboard/one-click" class="button">Voltar para a página anterior</a>
  </div>
</body>
</html>`
}

// Function to generate a client-side HTML page that handles the download
function generateClientDownloadPage(
  product: any,
  description: string,
  modernTemplate: string,
  ageminiTemplate: string,
) {
  // Escape the templates for embedding in JavaScript
  const escapedModernTemplate = JSON.stringify(modernTemplate)
  const escapedAgeminiTemplate = JSON.stringify(ageminiTemplate)

  // Create text content for the description file
  const textContent = `
Product: ${product.productName}
ID: ${product.itemId}
Price: R$ ${Number(product.price).toFixed(2)}
Shop: ${product.shopName || "Unknown"}
Sales: ${product.sales}
Rating: ${product.ratingStar || "N/A"}

Description:
${description}

Link: ${product.offerLink || "N/A"}
  `.trim()

  const escapedTextContent = JSON.stringify(textContent)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download de Cards - ${product.productName}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    body {
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }
    .card-previews {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .card-preview {
      flex: 1;
      min-width: 300px;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .card-preview h2 {
      background-color: #f0f0f0;
      padding: 10px;
      font-size: 18px;
      margin: 0;
    }
    .card-preview iframe {
      width: 100%;
      height: 600px;
      border: none;
    }
    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
    }
    .button {
      padding: 12px 20px;
      background-color: #4a6cf7;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #3a5ce5;
    }
    .button:disabled {
      background-color: #a0a0a0;
      cursor: not-allowed;
    }
    .button-secondary {
      background-color: #6c757d;
    }
    .button-secondary:hover {
      background-color: #5a6268;
    }
    .button-success {
      background-color: #28a745;
    }
    .button-success:hover {
      background-color: #218838;
    }
    .status {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .status.info {
      background-color: #cce5ff;
      border: 1px solid #b8daff;
      color: #004085;
    }
    .status.success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    .status.error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    .progress-container {
      width: 100%;
      background-color: #e9ecef;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .progress-bar {
      height: 10px;
      background-color: #4a6cf7;
      border-radius: 4px;
      width: 0%;
      transition: width 0.3s ease;
    }
    .description {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      white-space: pre-wrap;
      font-family: monospace;
      max-height: 200px;
      overflow-y: auto;
    }
    @media (max-width: 768px) {
      .card-preview {
        min-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Download de Cards - ${product.productName}</h1>
    
    <div id="statusContainer" class="status info">
      Preparando os arquivos para download...
    </div>
    
    <div class="progress-container">
      <div id="progressBar" class="progress-bar"></div>
    </div>
    
    <div class="buttons">
      <button id="downloadAllButton" class="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Baixar Todos os Arquivos (ZIP)
      </button>
      
      <button id="downloadModernButton" class="button button-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Baixar Template Moderno
      </button>
      
      <button id="downloadAlternativeButton" class="button button-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Baixar Template Alternativo
      </button>
      
      <button id="downloadTextButton" class="button button-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Baixar Descrição (TXT)
      </button>
    </div>
    
    <h2>Descrição do Produto</h2>
    <div class="description">${textContent}</div>
    
    <div class="card-previews">
      <div class="card-preview">
        <h2>Template Moderno</h2>
        <div id="modernPreview" style="width: 100%; height: 600px;"></div>
      </div>
      
      <div class="card-preview">
        <h2>Template Agemini</h2>
        <div id="ageminiPreview" style="width: 100%; height: 600px;"></div>
      </div>
    </div>
  </div>

  <script>
    // Templates
    const modernTemplate = ${escapedModernTemplate};
    const ageminiTemplate = ${escapedAgeminiTemplate};
    const textContent = ${escapedTextContent};
    
    // DOM elements
    const statusContainer = document.getElementById('statusContainer');
    const progressBar = document.getElementById('progressBar');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const downloadModernButton = document.getElementById('downloadModernButton');
    const downloadAlternativeButton = document.getElementById('downloadAlternativeButton');
    const downloadTextButton = document.getElementById('downloadTextButton');
    const modernPreview = document.getElementById('modernPreview');
    const ageminiPreview = document.getElementById('ageminiPreview');
    
    // Set up previews
    modernPreview.innerHTML = '<iframe srcdoc="' + modernTemplate.replace(/"/g, '&quot;') + '"></iframe>';
    ageminiPreview.innerHTML = '<iframe srcdoc="' + ageminiTemplate.replace(/"/g, '&quot;') + '"></iframe>';
    
    // Helper functions
    function updateStatus(message, type = 'info') {
      statusContainer.className = 'status ' + type;
      statusContainer.textContent = message;
    }
    
    function updateProgress(percent) {
      progressBar.style.width = percent + '%';
    }
    
    // Download functions
    async function captureIframe(iframe) {
      return new Promise((resolve) => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          // Use html2canvas to capture the iframe content
          html2canvas(doc.body, {
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true
          }).then(canvas => {
            resolve(canvas.toDataURL('image/png'));
          }).catch(error => {
            console.error('Error capturing iframe:', error);
            // Fallback to a placeholder image
            resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QIJBywfp3IOswAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAADOElEQVR42u3UMQEAAAjDMOZf9DDB5QMSUCnbTgCASYQFgLAACAsAYQEgLACEBYCwABAWAMICQFgACAuAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLgLE6MLABINHfFQAAAABJRU5ErkJggg==');
          });
        } catch (error) {
          console.error('Error accessing iframe content:', error);
          // Fallback to a placeholder image
          resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QIJBywfp3IOswAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAADOElEQVR42u3UMQEAAAjDMOZf9DDB5QMSUCnbTgCASYQFgLAACAsAYQEgLACEBYCwABAWAMICQFgACAuAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLAGEBICwAhAWAsAAQFgDCAkBYAAgLgLE6MLABINHfFQAAAABJRU5ErkJggg==');
        }
      });
    }
    
    async function downloadAllFiles() {
      try {
        updateStatus('Preparando o pacote ZIP...', 'info');
        updateProgress(10);
        
        // Disable buttons during processing
        downloadAllButton.disabled = true;
        downloadModernButton.disabled = true;
        downloadAlternativeButton.disabled = true;
        downloadTextButton.disabled = true;
        
        // Create a new JSZip instance
        const zip = new JSZip();
        
        // Get the iframe elements
        const modernIframe = modernPreview.querySelector('iframe');
        const ageminiIframe = ageminiPreview.querySelector('iframe');
        
        updateProgress(20);
        updateStatus('Capturando template moderno...', 'info');
        
        // Capture the modern template
        const modernDataUrl = await captureIframe(modernIframe);
        const modernBlob = await fetch(modernDataUrl).then(r => r.blob());
        zip.file('product_${product.itemId}_modern.png', modernBlob);
        
        updateProgress(50);
        updateStatus('Capturando template Agemini...', 'info');
        
        // Capture the agemini template
        const ageminiDataUrl = await captureIframe(ageminiIframe);
        const ageminiBlob = await fetch(ageminiDataUrl).then(r => r.blob());
        zip.file('product_${product.itemId}_agemini.png', ageminiBlob);
        
        updateProgress(80);
        updateStatus('Adicionando descrição...', 'info');
        
        // Add the text content
        zip.file('product_${product.itemId}_info.txt', textContent);
        
        updateProgress(90);
        updateStatus('Gerando arquivo ZIP...', 'info');
        
        // Generate the ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Save the ZIP file
        saveAs(zipBlob, 'product_${product.itemId}_package.zip');
        
        updateProgress(100);
        updateStatus('Download concluído com sucesso!', 'success');
        
        // Re-enable buttons
        downloadAllButton.disabled = false;
        downloadModernButton.disabled = false;
        downloadAlternativeButton.disabled = false;
        downloadTextButton.disabled = false;
      } catch (error) {
        console.error('Error generating ZIP:', error);
        updateStatus('Erro ao gerar o pacote: ' + error.message, 'error');
        
        // Re-enable buttons
        downloadAllButton.disabled = false;
        downloadModernButton.disabled = false;
        downloadAlternativeButton.disabled = false;
        downloadTextButton.disabled = false;
      }
    }
    
    async function downloadSingleTemplate(iframe, filename) {
      try {
        updateStatus('Preparando o download...', 'info');
        updateProgress(30);
        
        // Capture the template
        const dataUrl = await captureIframe(iframe);
        
        updateProgress(70);
        
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        updateProgress(100);
        updateStatus('Download concluído com sucesso!', 'success');
      } catch (error) {
        console.error('Error downloading template:', error);
        updateStatus('Erro ao baixar o template: ' + error.message, 'error');
      }
    }
    
    function downloadTextFile() {
      try {
        updateStatus('Preparando o download...', 'info');
        updateProgress(50);
        
        // Create a blob from the text content
        const blob = new Blob([textContent], { type: 'text/plain' });
        
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'product_${product.itemId}_info.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        updateProgress(100);
        updateStatus('Download concluído com sucesso!', 'success');
      } catch (error) {
        console.error('Error downloading text:', error);
        updateStatus('Erro ao baixar o texto: ' + error.message, 'error');
      }
    }
    
    // Event listeners
    downloadAllButton.addEventListener('click', downloadAllFiles);
    
    downloadModernButton.addEventListener('click', () => {
      const iframe = modernPreview.querySelector('iframe');
      downloadSingleTemplate(iframe, 'product_${product.itemId}_modern.png');
    });
    
    downloadAlternativeButton.addEventListener('click', () => {
      const iframe = ageminiPreview.querySelector('iframe');
      downloadSingleTemplate(iframe, 'product_${product.itemId}_agemini.png');
    });
    
    downloadTextButton.addEventListener('click', downloadTextFile);
    
    // Start the download automatically
    window.addEventListener('load', () => {
      // Wait a moment to ensure iframes are loaded
      setTimeout(() => {
        downloadAllFiles();
      }, 2000);
    });
  </script>
</body>
</html>`
}
