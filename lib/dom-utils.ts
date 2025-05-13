/**
 * Utilitários para manipulação do DOM de forma segura
 */

/**
 * Encontra um elemento no DOM de forma segura
 * @param selector Seletor CSS para encontrar o elemento
 * @param parent Elemento pai onde buscar (opcional, padrão é document)
 * @returns O elemento encontrado ou null se não encontrado
 */
export function findElement(selector: string, parent: Element | Document = document): Element | null {
  try {
    return parent.querySelector(selector)
  } catch (error) {
    console.warn(`Erro ao buscar elemento "${selector}":`, error)
    return null
  }
}

/**
 * Encontra múltiplos elementos no DOM de forma segura
 * @param selector Seletor CSS para encontrar os elementos
 * @param parent Elemento pai onde buscar (opcional, padrão é document)
 * @returns Array de elementos encontrados ou array vazio se nenhum for encontrado
 */
export function findElements(selector: string, parent: Element | Document = document): Element[] {
  try {
    return Array.from(parent.querySelectorAll(selector))
  } catch (error) {
    console.warn(`Erro ao buscar elementos "${selector}":`, error)
    return []
  }
}

/**
 * Verifica se um elemento existe no DOM
 * @param selector Seletor CSS para verificar
 * @param parent Elemento pai onde buscar (opcional, padrão é document)
 * @returns true se o elemento existir, false caso contrário
 */
export function elementExists(selector: string, parent: Element | Document = document): boolean {
  try {
    return parent.querySelector(selector) !== null
  } catch (error) {
    console.warn(`Erro ao verificar existência do elemento "${selector}":`, error)
    return false
  }
}
