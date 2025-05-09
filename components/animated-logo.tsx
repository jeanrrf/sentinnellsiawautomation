"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

/**
 * AnimatedLogo - Logo animado com gradiente que se adapta ao tema
 * Não inclui o Link para evitar aninhamento de tags <a>
 */
export function AnimatedLogo() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determinar as cores do gradiente com base no tema
  const getGradientColors = () => {
    if (!mounted) return "linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a)"

    return theme === "dark"
      ? "linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a)"
      : "linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a)"
  }

  return (
    <h1
      className="text-3xl font-bold tracking-tight cursor-pointer"
      style={{
        backgroundImage: getGradientColors(),
        backgroundSize: "300% 300%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        animation: "gradient 5s ease infinite",
        filter: "drop-shadow(0 2px 12px rgba(177, 85, 255, 0.5))",
      }}
    >
      SENTINNELL AutoSeller
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </h1>
  )
}
