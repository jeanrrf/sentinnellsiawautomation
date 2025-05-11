import { DownloadManager } from "@/components/download-manager"

export default function DownloadsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Downloads</h1>
        <p className="text-muted-foreground">Baixe cards e arquivos gerados pelo sistema</p>
      </div>

      <DownloadManager />

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-8">
        <h2 className="text-lg font-medium text-amber-800 mb-2">Problemas com downloads?</h2>
        <p className="text-amber-700 mb-4">
          Se você está tendo problemas para baixar arquivos, aqui estão algumas soluções:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-amber-700">
          <li>
            <strong>Verifique o bloqueador de pop-ups:</strong> Muitos navegadores bloqueiam downloads automáticos.
            Procure por um ícone de bloqueio na barra de endereços e permita pop-ups para este site.
          </li>
          <li>
            <strong>Use o método alternativo:</strong> Clique no botão "Abrir em Nova Aba" para abrir o download
            diretamente.
          </li>
          <li>
            <strong>Tente outro navegador:</strong> Se o problema persistir, tente usar outro navegador como Chrome,
            Firefox ou Edge.
          </li>
          <li>
            <strong>Verifique as configurações:</strong> Alguns navegadores têm configurações específicas para
            downloads. Verifique se o seu navegador está configurado para perguntar onde salvar os arquivos.
          </li>
        </ul>
      </div>
    </div>
  )
}
