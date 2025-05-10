import chromium from "chrome-aws-lambda"
import puppeteer from "puppeteer-core"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"

// Configuração para executar o Puppeteer em ambiente serverless
export async function getBrowser() {
  // Verifica se estamos em ambiente de desenvolvimento ou produção
  const isDev = process.env.NODE_ENV === "development"

  if (isDev) {
    // Em desenvolvimento, usa o Chrome local
    return puppeteer.launch({
      args: chromium.args,
      headless: true,
      defaultViewport: { width: 1080, height: 1920 },
      ignoreHTTPSErrors: true,
    })
  } else {
    // Em produção (Vercel), usa o Chrome AWS Lambda
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: { width: 1080, height: 1920 },
      ignoreHTTPSErrors: true,
    })
  }
}

// Função para renderizar o HTML como imagem
export async function renderHtmlToImage(html: string, options = { width: 1080, height: 1920 }) {
  console.log("Iniciando renderização do HTML para imagem...")

  // Criar diretório temporário se não existir
  const tmpDir = path.join(tmpdir(), "shopee-tiktok-generator")
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  // Gerar nome de arquivo único
  const timestamp = Date.now()
  const htmlPath = path.join(tmpDir, `card-${timestamp}.html`)
  const imagePath = path.join(tmpDir, `card-${timestamp}.png`)

  // Salvar HTML em arquivo temporário
  fs.writeFileSync(htmlPath, html)
  console.log(`HTML salvo em: ${htmlPath}`)

  let browser
  try {
    browser = await getBrowser()
    const page = await browser.newPage()

    // Configurar viewport
    await page.setViewport({
      width: options.width,
      height: options.height,
      deviceScaleFactor: 2, // Para melhor qualidade
    })

    // Carregar o HTML do arquivo
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" })

    // Aguardar carregamento completo (incluindo fontes e animações)
    await page.waitForTimeout(1000)

    // Capturar screenshot
    await page.screenshot({
      path: imagePath,
      type: "png",
      fullPage: true,
      omitBackground: false,
    })

    console.log(`Screenshot salvo em: ${imagePath}`)
    return { imagePath, htmlPath }
  } catch (error) {
    console.error("Erro ao renderizar HTML para imagem:", error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
