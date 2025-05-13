import { redirect } from "next/navigation"

export default function Home() {
  // Usar try/catch para evitar loops de redirecionamento
  try {
    redirect("/dashboard")
  } catch (error) {
    // Fallback caso o redirecionamento falhe
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Shopee TikTok Generator</h1>
        <p className="mb-4">Redirecionando para o dashboard...</p>
        <a href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Ir para o Dashboard
        </a>
      </div>
    )
  }
}
