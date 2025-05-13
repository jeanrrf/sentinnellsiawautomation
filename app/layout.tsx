import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { fontSans } from "@/app/fonts"
import { cn } from "@/lib/utils"
import { ToastProvider } from "@/components/ui/use-toast"
// Importar o RedirectErrorHandler no topo do arquivo
import { RedirectErrorHandler } from "@/components/redirect-error-handler"

export const metadata = {
  title: "Shopee TikTok Generator",
  description: "Gerador automatizado de vídeos para TikTok a partir de produtos da Shopee",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Modificar o retorno da função RootLayout para envolver o children com o RedirectErrorHandler
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RedirectErrorHandler fallbackPath="/dashboard">
            <ToastProvider>{children}</ToastProvider>
          </RedirectErrorHandler>
        </ThemeProvider>
      </body>
    </html>
  )
}
