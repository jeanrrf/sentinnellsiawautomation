"use client"

import { useState, useEffect, useRef } from "react"
import { createLogger, ErrorCodes } from "@/lib/logger"

// Create a module-specific logger
const logger = createLogger("usePersistentState")

/**
 * Custom hook for state that persists in localStorage
 * @param key The localStorage key to store the state under
 * @param initialValue The initial value to use if no value is found in localStorage
 * @returns A stateful value and a function to update it
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Create a module-instance specific logger with the key in context
  const hookLogger = createLogger(`usePersistentState:${key}`)

  hookLogger.debug("Hook initializing", {
    context: { initialValue },
  })

  const [state, setState] = useState<T>(initialValue)
  const initializedRef = useRef(false)

  // Load the initial state from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || initializedRef.current) return

    try {
      hookLogger.debug("Loading state from localStorage")
      const item = localStorage.getItem(key)

      if (item !== null) {
        try {
          const parsedValue = JSON.parse(item)
          setState(parsedValue)
          hookLogger.debug("State loaded successfully from localStorage")
        } catch (parseError) {
          hookLogger.error("Failed to parse localStorage value", {
            code: ErrorCodes.STORAGE.INVALID_DATA,
            details: parseError,
            context: { key, rawValue: item },
          })
          // Use initial value if parsing fails
          setState(initialValue)
        }
      } else {
        hookLogger.debug("No value found in localStorage, using initial value")
        setState(initialValue)
      }
    } catch (error) {
      hookLogger.error("Error accessing localStorage", {
        code: ErrorCodes.STORAGE.READ_FAILED,
        details: error,
        context: { key },
      })
      // Use initial value if localStorage access fails
      setState(initialValue)
    } finally {
      initializedRef.current = true
    }
  }, [initialValue, key, hookLogger])

  // Update localStorage when the state changes
  useEffect(() => {
    if (typeof window === "undefined" || !initializedRef.current) return

    try {
      hookLogger.debug("Saving state to localStorage", {
        context: { value: state },
      })
      localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      hookLogger.error("Failed to save state to localStorage", {
        code: ErrorCodes.STORAGE.WRITE_FAILED,
        details: error,
        context: { key, value: state },
      })
    }
  }, [state, key, hookLogger])

  // Wrapper for setState that also updates localStorage
  const setPersistedState = (value: T) => {
    hookLogger.debug("State update requested", {
      context: { previousValue: state, newValue: value },
    })
    setState(value)
  }

  return [state, setPersistedState]
}

export default usePersistentState
