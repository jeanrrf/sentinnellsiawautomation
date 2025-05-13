import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Obter a resposta original
  const response = NextResponse.next()

  // Adicionar cabeçalhos de segurança
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Cache-Control", "public, max-age=3600")

  // Verificar se estamos em um loop de redirecionamento
  const url = request.nextUrl.pathname

  // Se for a página raiz, não aplicar lógica de loop para evitar conflitos com o redirecionamento intencional
  if (url === "/") {
    return response
  }

  // Verificar cookie de redirecionamento
  const redirectHistory = request.cookies.get("redirect_history")?.value
  const redirectPaths = redirectHistory ? JSON.parse(redirectHistory) : []

  // Se o mesmo caminho aparecer mais de 2 vezes na história, estamos em um loop
  const pathCount = redirectPaths.filter((path: string) => path === url).length

  if (pathCount > 2) {
    // Limpar histórico e redirecionar para dashboard
    const cleanResponse = NextResponse.redirect(new URL("/dashboard", request.url))
    cleanResponse.cookies.set("redirect_history", JSON.stringify([]))
    return cleanResponse
  }

  // Atualizar histórico de redirecionamento (manter apenas os últimos 5)
  const newHistory = [...redirectPaths, url].slice(-5)
  response.cookies.set("redirect_history", JSON.stringify(newHistory))

  return response
}

export const config = {
  matcher: [
    // Aplicar a todas as rotas exceto as que começam com:
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
