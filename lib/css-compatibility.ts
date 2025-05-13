/**
 * Utilitários para garantir compatibilidade CSS entre navegadores
 */

// Função para adicionar prefixos de fornecedor a propriedades CSS
export function addVendorPrefixes(styles: Record<string, string>): Record<string, string> {
  const prefixedStyles: Record<string, string> = {}

  Object.entries(styles).forEach(([property, value]) => {
    // Propriedade original
    prefixedStyles[property] = value

    // Adicionar prefixos para propriedades conhecidas que precisam deles
    if (property === "user-select") {
      prefixedStyles["-webkit-user-select"] = value
      prefixedStyles["-moz-user-select"] = value
      prefixedStyles["-ms-user-select"] = value
    }

    if (property === "text-size-adjust") {
      prefixedStyles["-webkit-text-size-adjust"] = value
      prefixedStyles["-moz-text-size-adjust"] = value
      prefixedStyles["-ms-text-size-adjust"] = value
    }

    // Adicionar outros prefixos conforme necessário
    if (property.includes("backdrop-filter")) {
      prefixedStyles["-webkit-backdrop-filter"] = value
    }

    if (property.includes("appearance")) {
      prefixedStyles["-webkit-appearance"] = value
      prefixedStyles["-moz-appearance"] = value
    }
  })

  return prefixedStyles
}

// Função para aplicar estilos com prefixos a um elemento
export function applyCompatibleStyles(element: HTMLElement, styles: Record<string, string>): void {
  const prefixedStyles = addVendorPrefixes(styles)

  Object.entries(prefixedStyles).forEach(([property, value]) => {
    ;(element.style as any)[property] = value
  })
}

// Classe para criar regras CSS compatíveis
export class CompatibleCSSRule {
  static createStyleSheet(): HTMLStyleElement {
    const styleSheet = document.createElement("style")
    document.head.appendChild(styleSheet)
    return styleSheet
  }

  static addRule(styleSheet: HTMLStyleElement, selector: string, styles: Record<string, string>): void {
    const prefixedStyles = addVendorPrefixes(styles)

    const cssText = `${selector} {
      ${Object.entries(prefixedStyles)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join("\n")}
    }`

    styleSheet.textContent += cssText
  }
}
