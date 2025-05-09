"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

export function AnimatedLogo() {
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logoRef.current) {
      logoRef.current.innerHTML = `
      <style>
        @keyframes autoseller-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .autoseller-logo-animated {
          font-family: 'Bruno Ace SC', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a);
          background-size: 300% 300%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: autoseller-gradient 5s ease infinite;
          text-align: center;
          filter: drop-shadow(0 2px 12px #b155ff88);
          border-radius: 18px;
          padding: 0 12px;
          display: inline-block;
        }
      </style>
      <span class="autoseller-logo-animated">SENTINNELL AutoSeller</span>
    `
    }
  }, [])

  return (
    <Link href="/">
      <div ref={logoRef} className="flex justify-center cursor-pointer"></div>
    </Link>
  )
}
