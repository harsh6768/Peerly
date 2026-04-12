import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

const housingIntentStorageKey = 'cirvo.housing-intent'

export const housingIntentValues = {
  findRoom: 'FIND_ROOM',
  tenantReplacement: 'TENANT_REPLACEMENT',
} as const

export type HousingIntent = (typeof housingIntentValues)[keyof typeof housingIntentValues]

type HousingIntentContextValue = {
  intent: HousingIntent
  setIntent: (intent: HousingIntent) => void
}

const HousingIntentContext = createContext<HousingIntentContextValue | undefined>(undefined)

export function HousingIntentProvider({ children }: PropsWithChildren) {
  const [intent, setIntentState] = useState<HousingIntent>(() => {
    if (typeof window === 'undefined') {
      return housingIntentValues.findRoom
    }

    const storedIntent = window.localStorage.getItem(housingIntentStorageKey)
    return isHousingIntent(storedIntent) ? storedIntent : housingIntentValues.findRoom
  })

  useEffect(() => {
    window.localStorage.setItem(housingIntentStorageKey, intent)
  }, [intent])

  const value = useMemo(
    () => ({
      intent,
      setIntent: setIntentState,
    }),
    [intent],
  )

  return <HousingIntentContext.Provider value={value}>{children}</HousingIntentContext.Provider>
}

export function useHousingIntent() {
  const context = useContext(HousingIntentContext)

  if (!context) {
    throw new Error('useHousingIntent must be used within a HousingIntentProvider.')
  }

  return context
}

function isHousingIntent(value: string | null): value is HousingIntent {
  return value === housingIntentValues.findRoom || value === housingIntentValues.tenantReplacement
}
