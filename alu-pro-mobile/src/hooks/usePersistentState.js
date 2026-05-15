import { useEffect, useState } from 'react'

const resolveInitialValue = (initialValue) =>
  typeof initialValue === 'function' ? initialValue() : initialValue

export const usePersistentState = (storageKey, initialValue) => {
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(storageKey)

    if (storedValue !== null) {
      try {
        return JSON.parse(storedValue)
      } catch (error) {
        console.warn(`Failed to parse localStorage key "${storageKey}"`, error)
      }
    }

    return resolveInitialValue(initialValue)
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [storageKey, state])

  return [state, setState]
}
