"use client"

import { useState, useEffect, useRef } from "react"

type StorageType = "localStorage" | "sessionStorage"

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storageType: StorageType = "localStorage",
): [T, (value: T | ((val: T) => T)) => void] {
  // Função para obter o valor inicial do storage ou usar o valor padrão
  const getInitialValue = (): T => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const storage = window[storageType]
      const storedValue = storage.getItem(key)

      if (storedValue === null) {
        return initialValue
      }

      try {
        return JSON.parse(storedValue)
      } catch (parseError) {
        console.error(`Error parsing stored value for key "${key}":`, parseError)
        return initialValue
      }
    } catch (error) {
      console.error(`Error reading from ${storageType} for key "${key}":`, error)
      return initialValue
    }
  }

  // Inicializar o estado com o valor inicial (será atualizado no useEffect)
  const [value, setValue] = useState<T>(initialValue)

  // Usar uma ref para rastrear se o valor inicial já foi carregado
  const initializedRef = useRef(false)

  // Carregar o valor do storage quando o componente montar
  useEffect(() => {
    if (typeof window === "undefined") return

    if (!initializedRef.current) {
      const initialStoredValue = getInitialValue()
      setValue(initialStoredValue)
      initializedRef.current = true
    }
  }, []) // Executar apenas uma vez na montagem

  // Atualizar o storage quando o valor mudar
  useEffect(() => {
    if (typeof window === "undefined") return

    // Não salvar no storage até que o valor inicial tenha sido carregado
    if (!initializedRef.current) return

    try {
      const storage = window[storageType]
      storage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to ${storageType} for key "${key}":`, error)
    }
  }, [key, value, storageType])

  return [value, setValue]
}
