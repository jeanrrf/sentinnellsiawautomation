"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Search,
  Palette,
  Cog,
  Zap,
  ImageIcon,
  Menu,
  TrendingUp,
  Package,
  LayoutDashboard,
  HelpCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const mainRoutes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/busca",
      label: "Busca",
      icon: Search,
    },
    {
      href: "/dashboard/designer",
      label: "Designer",
      icon: Palette,
    },
    {
      href: "/dashboard/one-click",
      label: "Geração Rápida",
      icon: Zap,
    },
  ]

  const mediaRoutes = [
    {
      href: "/dashboard/midia-produto",
      label: "Mídia do Produto",
      icon: ImageIcon,
    },
    {
      href: "/dashboard/tendencias",
      label: "Tendências",
      icon: TrendingUp,
      isNew: true,
    },
  ]

  const toolsRoutes = [
    {
      href: "/dashboard/automacao",
      label: "Automação",
      icon: Cog,
    },
    {
      href: "/dashboard/cards-animados",
      label: "Cards Animados",
      icon: Package,
    },
    {
      href: "/diagnostics",
      label: "Diagnósticos",
      icon: HelpCircle,
    },
  ]

  const renderNavLink = (route: any) => (
    <Link
      key={route.href}
      href={route.href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-2 px-7 py-2 text-sm font-medium ${
        pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {route.icon ? <route.icon className="h-4 w-4" /> : null}
      <span className="flex items-center">
        {route.label}
        {route.isNew && (
          <Badge variant="default" className="ml-2 h-5 bg-green-500 hover:bg-green-600 px-1.5 py-0 text-[10px]">
            NOVO
          </Badge>
        )}
      </span>
    </Link>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <span className="font-bold">Shopee TikTok Generator</span>
          </Link>
        </div>
        <div className="mt-8 flex flex-col gap-2">
          <div className="px-7 text-xs font-semibold text-muted-foreground">Principal</div>
          {mainRoutes.map(renderNavLink)}

          <Separator className="my-2" />
          <div className="px-7 text-xs font-semibold text-muted-foreground">Mídia</div>
          {mediaRoutes.map(renderNavLink)}

          <Separator className="my-2" />
          <div className="px-7 text-xs font-semibold text-muted-foreground">Ferramentas</div>
          {toolsRoutes.map(renderNavLink)}
        </div>
      </SheetContent>
    </Sheet>
  )
}
