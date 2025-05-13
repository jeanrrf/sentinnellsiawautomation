import type { ReactNode } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Separator } from "@/components/ui/separator"
import { LayoutDashboard, Search, Palette, Zap, ImageIcon, TrendingUp, Cog, Package, HelpCircle } from "lucide-react"

interface DashboardWithNavProps {
  children: ReactNode
  title: string
  description?: string
}

export function DashboardWithNav({ children, title, description }: DashboardWithNavProps) {
  const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: "Busca",
      href: "/dashboard/busca",
      icon: <Search className="h-4 w-4" />,
    },
    {
      title: "Designer",
      href: "/dashboard/designer",
      icon: <Palette className="h-4 w-4" />,
    },
    {
      title: "Geração Rápida",
      href: "/dashboard/one-click",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Mídia do Produto",
      href: "/dashboard/midia-produto",
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      title: "Tendências",
      href: "/dashboard/tendencias",
      icon: <TrendingUp className="h-4 w-4" />,
      isNew: true,
    },
    {
      title: "Cards Animados",
      href: "/dashboard/cards-animados",
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: "Automação",
      href: "/dashboard/automacao",
      icon: <Cog className="h-4 w-4" />,
    },
    {
      title: "Diagnósticos",
      href: "/diagnostics",
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ]

  return (
    <div className="container">
      <div className="space-y-6 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
