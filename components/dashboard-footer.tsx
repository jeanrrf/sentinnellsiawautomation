import Link from "next/link"

export function DashboardFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Shopee TikTok Generator. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/help" className="hover:underline">
            Ajuda
          </Link>
          <Link href="/terms" className="hover:underline">
            Termos
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
