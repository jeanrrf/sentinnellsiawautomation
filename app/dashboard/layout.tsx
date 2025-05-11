import { type ReactNode, Suspense } from "react"
import Link from "next/link"
import { Home, Search, Palette, Cog, Zap } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Shopee TikTok Generator</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Início</span>
                </div>
              </Link>
              <Link href="/dashboard/busca" className="transition-colors hover:text-foreground/80 text-foreground/60">
                <div className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  <span>Busca</span>
                </div>
              </Link>
              <Link
                href="/dashboard/designer"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                <div className="flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  <span>Designer</span>
                </div>
              </Link>
              <Link
                href="/dashboard/one-click"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>Geração Rápida</span>
                </div>
              </Link>
              <Link
                href="/dashboard/automacao"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                <div className="flex items-center gap-1">
                  <Cog className="h-4 w-4" />
                  <span>Automação</span>
                </div>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}
