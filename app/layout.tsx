import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { fontSans } from "@/app/fonts"
import { cn } from "@/lib/utils"
import { ToastProvider } from "@/components/ui/use-toast"

export const metadata = {
  title: "Shopee TikTok Generator",
  description: "Gerador automatizado de vídeos para TikTok a partir de produtos da Shopee",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
