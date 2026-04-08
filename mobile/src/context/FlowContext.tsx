import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

const STORAGE_KEY = '@cirvo/housing_flow_mode'

export type HousingFlowMode = 'find_room' | 'tenant_replacement'

type FlowContextValue = {
  flowMode: HousingFlowMode
  setFlowMode: (mode: HousingFlowMode) => void
  toggleFlow: () => void
  isHydrated: boolean
}

const FlowContext = createContext<FlowContextValue | undefined>(undefined)

export function FlowProvider({ children }: PropsWithChildren) {
  const [flowMode, setFlowModeState] = useState<HousingFlowMode>('find_room')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'find_room' || stored === 'tenant_replacement') {
        setFlowModeState(stored)
      }
      setIsHydrated(true)
    })
  }, [])

  const setFlowMode = useCallback((mode: HousingFlowMode) => {
    setFlowModeState(mode)
    void AsyncStorage.setItem(STORAGE_KEY, mode)
  }, [])

  const toggleFlow = useCallback(() => {
    setFlowModeState((prev) => {
      const next = prev === 'find_room' ? 'tenant_replacement' : 'find_room'
      void AsyncStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ flowMode, setFlowMode, toggleFlow, isHydrated }),
    [flowMode, setFlowMode, toggleFlow, isHydrated],
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

export function useFlow() {
  const ctx = useContext(FlowContext)
  if (!ctx) throw new Error('useFlow must be used inside FlowProvider')
  return ctx
}
