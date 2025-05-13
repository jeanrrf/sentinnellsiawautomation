// Este arquivo serve como um ponto de entrada para os imports dinâmicos
// Ele não contém diretamente os imports com ssr: false, mas exporta do componente cliente

// Exporta todos os imports do componente cliente
export * from "./client-dynamic-imports.tsx"

// Você também pode adicionar aqui qualquer lógica específica de servidor que não use ssr: false
export const isServer = typeof window === "undefined"
