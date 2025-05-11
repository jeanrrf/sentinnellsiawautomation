/**
 * Utilitários para download de arquivos
 */

/**
 * Faz o download de um arquivo a partir de uma URL
 * @param url URL do arquivo
 * @param filename Nome do arquivo para download
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => resolve(), 500)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Faz o download de um arquivo de texto
 * @param content Conteúdo do arquivo de texto
 * @param filename Nome do arquivo para download
 */
export async function downloadTextFile(content: string, filename: string): Promise<void> {
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)

  try {
    await downloadFile(url, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Faz o download de múltiplos arquivos em sequência
 * @param files Array de objetos com URL e nome do arquivo
 */
export async function downloadMultipleFiles(files: { url: string; filename: string }[]): Promise<void> {
  for (const file of files) {
    await downloadFile(file.url, file.filename)
  }
}

/**
 * Cria um arquivo ZIP contendo múltiplos arquivos
 * Requer a biblioteca JSZip
 * @param files Array de objetos com dados e nome do arquivo
 * @param zipFilename Nome do arquivo ZIP
 */
export async function downloadAsZip(
  files: { data: Blob | string; filename: string }[],
  zipFilename: string,
): Promise<void> {
  try {
    // Importar JSZip dinamicamente
    const JSZip = (await import("jszip")).default

    const zip = new JSZip()

    // Adicionar arquivos ao ZIP
    for (const file of files) {
      zip.file(file.filename, file.data)
    }

    // Gerar o arquivo ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" })

    // Fazer download do ZIP
    const zipUrl = URL.createObjectURL(zipBlob)
    await downloadFile(zipUrl, zipFilename)
    URL.revokeObjectURL(zipUrl)
  } catch (error) {
    console.error("Erro ao criar arquivo ZIP:", error)
    throw error
  }
}
