"use client"

import dynamic from "next/dynamic"

// Imports dinâmicos para canvas
export const Canvas = dynamic(() => import("canvas").then((mod) => ({ default: mod.Canvas })), {
  ssr: false,
})

export const createCanvas = dynamic(() => import("canvas").then((mod) => ({ default: mod.createCanvas })), {
  ssr: false,
})

export const loadImage = dynamic(() => import("canvas").then((mod) => ({ default: mod.loadImage })), {
  ssr: false,
})

// Para Puppeteer, se necessário
export const puppeteer = dynamic(() => import("puppeteer"), {
  ssr: false,
})
