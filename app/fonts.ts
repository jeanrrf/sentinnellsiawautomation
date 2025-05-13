import { Bruno_Ace_SC } from "next/font/google"
import { Mona_Sans as FontSans } from "next/font/google"

export const brunoAceSC = Bruno_Ace_SC({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bruno-ace-sc",
})

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})
