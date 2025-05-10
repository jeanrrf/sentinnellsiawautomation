import type React from "react"
import Link from "next/link"
import { AnimatedLogo } from "@/components/animated-logo"
import { ModeToggle } from "@/components/mode-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Barra de navegação */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AnimatedLogo />
          </Link>
          <nav className="hidden flex-1 md:flex">
            <ul className="flex flex-1 items-center justify-center space-x-1">
              <li>
                <Link
                  href="/dashboard/busca"
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Busca
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/designer"
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Designer
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/automacao"
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Automação
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/publicacao"
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Publicação
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/configuracoes"
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Configurações
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex items-center space-x-2">
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
