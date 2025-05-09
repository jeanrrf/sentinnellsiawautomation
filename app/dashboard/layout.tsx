import type React from "react"
import Link from "next/link"
import { AnimatedLogo } from "@/components/animated-logo"
import { ModeToggle } from "@/components/mode-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <AnimatedLogo />
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/dashboard/busca"
              className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Busca
            </Link>
            <Link
              href="/dashboard/designer"
              className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Designer
            </Link>
            <Link
              href="/dashboard/automacao"
              className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Automação
            </Link>
            <Link
              href="/dashboard/publicacao"
              className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Publicação
            </Link>
            <Link
              href="/dashboard/configuracoes"
              className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Configurações
            </Link>
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
