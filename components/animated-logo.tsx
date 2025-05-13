"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function AnimatedLogo() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 2000)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/" className="flex items-center space-x-2">
      <span
        className={`text-2xl font-bold transition-all duration-500 ${
          isAnimating ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent" : ""
        }`}
      >
        TikTok Generator
      </span>
    </Link>
  )
}
