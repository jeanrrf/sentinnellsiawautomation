import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { brunoAceSC } from "./fonts"
import "./globals.css"

export const metadata = {
  title: "Shopee TikTok Video Generator",
  description: "Gerador automatizado de vídeos para TikTok com produtos da Shopee",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet" />
      </head>
      <body className={`${brunoAceSC.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
