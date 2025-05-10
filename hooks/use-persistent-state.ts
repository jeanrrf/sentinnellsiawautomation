"use client"

import { useState, useEffect } from "react"

type StorageType = "localStorage" | "sessionStorage"

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storageType: StorageType = "localStorage",
): [T, (value: T | ((val: T) => T)) => void] {
  // Função para obter o valor inicial do storage ou usar o valor padrão
  const getInitialValue = (): T => {
    try {
      const storage = window[storageType]
      const storedValue = storage.getItem(key)
      return storedValue ? JSON.parse(storedValue) : initialValue
    } catch (error) {
      console.error("Error reading from storage:", error)
      return initialValue
    }
  }

  // Inicializar o estado com o valor do storage ou o valor padrão
  const [value, setValue] = useState<T>(initialValue)

  // Carregar o valor do storage quando o componente montar
  useEffect(() => {
    setValue(getInitialValue())
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  // Atualizar o storage quando o valor mudar
  useEffect(() => {
    try {
      const storage = window[storageType]
      storage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error("Error writing to storage:", error)
    }
  }, [key, value, storageType])

  return [value, setValue]
}
