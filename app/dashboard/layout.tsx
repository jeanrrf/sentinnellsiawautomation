"use client"

import type React from "react"

import { type ReactNode, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Palette, Cog, Zap, ImageIcon, TrendingUp, LayoutDashboard } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"
import { Badge } from "@/components/ui/badge"
import { DashboardFooter } from "@/components/dashboard-footer"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Shopee TikTok Generator</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavLink href="/dashboard/busca" icon={Search} label="Busca" />
              <NavLink href="/dashboard/designer" icon={Palette} label="Designer" />
              <NavLink href="/dashboard/one-click" icon={Zap} label="Geração Rápida" />
              <NavLink href="/dashboard/midia-produto" icon={ImageIcon} label="Mídia do Produto" />
              <NavLink href="/dashboard/tendencias" icon={TrendingUp} label="Tendências" isNew={true} />
              <NavLink href="/dashboard/automacao" icon={Cog} label="Automação" />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <Suspense>{children}</Suspense>
      </main>
      <DashboardFooter />
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  isNew = false,
}: {
  href: string
  icon: React.ElementType
  label: string
  isNew?: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`transition-colors hover:text-foreground/80 relative group ${
        isActive ? "text-foreground" : "text-foreground/60"
      }`}
    >
      <div className="flex items-center gap-1">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
        {isNew && (
          <Badge variant="default" className="ml-1 h-5 bg-green-500 hover:bg-green-600 px-1.5 py-0 text-[10px]">
            NOVO
          </Badge>
        )}
      </div>
      {isActive && <div className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-foreground" />}
    </Link>
  )
}
