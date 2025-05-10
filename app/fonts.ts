import { Bruno_Ace_SC } from "next/font/google"
import { Inter } from "next/font/google"

export const brunoAceSC = Bruno_Ace_SC({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bruno-ace-sc",
})

// Add the missing fontSans export
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})
