/**
 * Utilitários para melhorar a acessibilidade dos componentes
 */

// Função para gerar um ID único para elementos
export function generateUniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

// Função para verificar se um elemento tem um label associado
export function hasAssociatedLabel(id: string): boolean {
  if (typeof document === "undefined") return true

  const element = document.getElementById(id)
  if (!element) return false

  // Verificar se há um label explícito
  const labels = document.querySelectorAll(`label[for="${id}"]`)
  if (labels.length > 0) return true

  // Verificar se o elemento está dentro de um label
  let parent = element.parentElement
  while (parent) {
    if (parent.tagName.toLowerCase() === "label") return true
    parent = parent.parentElement
  }

  return false
}

// Função para adicionar aria-label a elementos sem label
export function ensureAccessibleLabel(element: HTMLElement, fallbackText: string): void {
  const id = element.id || generateUniqueId("elem")
  element.id = id

  if (!hasAssociatedLabel(id)) {
    element.setAttribute("aria-label", fallbackText)
  }
}

// Função para garantir que botões tenham texto acessível
export function ensureButtonAccessibility(button: HTMLButtonElement): void {
  // Se o botão não tem conteúdo de texto
  if (!button.textContent?.trim()) {
    // Verificar se tem aria-label ou aria-labelledby
    if (!button.getAttribute("aria-label") && !button.getAttribute("aria-labelledby")) {
      console.warn("Botão sem texto acessível:", button)
      // Tentar inferir um label a partir de ícones ou contexto
      const iconElement = button.querySelector("svg, img, i")
      if (iconElement) {
        const iconName =
          iconElement.getAttribute("data-icon") ||
          iconElement.getAttribute("alt") ||
          iconElement.className.split(" ").find((c) => c.includes("icon"))
        if (iconName) {
          button.setAttribute("aria-label", `Botão ${iconName}`)
        } else {
          button.setAttribute("aria-label", "Botão de ação")
        }
      } else {
        button.setAttribute("aria-label", "Botão de ação")
      }
    }
  }

  // Garantir que o botão tenha um title para tooltip
  if (!button.getAttribute("title")) {
    button.setAttribute("title", button.textContent?.trim() || button.getAttribute("aria-label") || "Botão")
  }
}
