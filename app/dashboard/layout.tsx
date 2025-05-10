import type React from "react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { AnimatedLogo } from "@/components/animated-logo"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <AnimatedLogo />
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link href="/dashboard/busca" className="text-sm font-medium transition-colors hover:text-primary">
                Busca
              </Link>
              <Link href="/dashboard/designer" className="text-sm font-medium transition-colors hover:text-primary">
                Designer
              </Link>
              <Link href="/dashboard/automacao" className="text-sm font-medium transition-colors hover:text-primary">
                Automação
              </Link>
              <Link href="/dashboard/publicacao" className="text-sm font-medium transition-colors hover:text-primary">
                Publicação
              </Link>
              <Link href="/dashboard/status" className="text-sm font-medium transition-colors hover:text-primary">
                Status
              </Link>
              <Link
                href="/dashboard/configuracoes"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Configurações
              </Link>
            </nav>
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
