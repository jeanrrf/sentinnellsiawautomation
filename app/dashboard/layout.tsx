import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { AnimatedLogo } from "@/components/animated-logo"

import { BarChart, Clock, Download, FileVideo, Home, Menu, Search, Settings, Upload, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Gerador de Vídeos para TikTok e Shopee",
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Render the AnimatedLogo directly, not inside a Link */}
          <AnimatedLogo className="h-6 w-6" />
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Shopee TikTok Generator
          </Link>
        </div>
        <nav className="hidden flex-1 md:flex">
          <ul className="flex flex-1 items-center gap-4 text-sm font-medium">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                Início
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/busca"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                Busca
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/designer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <FileVideo className="h-4 w-4" />
                Designer
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/publicacao"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
                Publicação
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/automacao"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Clock className="h-4 w-4" />
                Automação
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/one-click"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Zap className="h-4 w-4" />
                Um Clique
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/downloads"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Downloads
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/status"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <BarChart className="h-4 w-4" />
                Status
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/configuracoes"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4 md:justify-end">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Início</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/busca">
                  <Search className="mr-2 h-4 w-4" />
                  <span>Busca</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/designer">
                  <FileVideo className="mr-2 h-4 w-4" />
                  <span>Designer</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/publicacao">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Publicação</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/automacao">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Automação</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/one-click">
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Um Clique</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/downloads">
                  <Download className="mr-2 h-4 w-4" />
                  <span>Downloads</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/status">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Status</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracoes">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}
