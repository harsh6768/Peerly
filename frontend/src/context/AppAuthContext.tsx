import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { apiRequest } from '../lib/api'
import { supabase, supabaseConfigReady } from '../lib/supabase'

const appSessionStorageKey = 'trusted-network.app-session'

type AppUser = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  authProvider: 'GOOGLE'
  isVerified: boolean
  verificationType: 'WORK_EMAIL' | 'LINKEDIN' | null
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  workEmail: string | null
  companyName: string | null
  linkedinUrl: string | null
  createdAt: string
}

type AppSessionResponse = {
  token: string
  expiresAt: string
  user: AppUser
}

type LoginResponse = {
  session: {
    token: string
    expiresAt: string
  }
  user: AppUser
  onboarding: {
    prompt: string
    recommendedVerificationMethod: 'WORK_EMAIL' | 'LINKEDIN'
  }
}

type AppAuthContextValue = {
  configured: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  sessionToken: string | null
  sessionExpiresAt: string | null
  user: AppUser | null
  onboardingPrompt: string
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AppAuthContext = createContext<AppAuthContextValue | undefined>(undefined)

export function AppAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onboardingPrompt, setOnboardingPrompt] = useState(
    'Get verified to increase trust and visibility',
  )
  const lastExchangedAccessTokenRef = useRef<string | null>(null)
  const activeExchangeAccessTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const storedToken = window.localStorage.getItem(appSessionStorageKey)
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    void hydrateAppSession(storedToken)
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && !sessionToken) {
        void exchangeSupabaseSession(data.session.access_token)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        void exchangeSupabaseSession(nextSession.access_token)
        return
      }

      if (!window.localStorage.getItem(appSessionStorageKey)) {
        clearSession()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [sessionToken])

  async function hydrateAppSession(token: string) {
    try {
      setError(null)
      const session = await apiRequest<AppSessionResponse>('/auth/me', {
        token,
      })

      persistSession(session)
    } catch (sessionError) {
      window.localStorage.removeItem(appSessionStorageKey)

      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          await exchangeSupabaseSession(data.session.access_token)
          return
        }
      }

      clearSession()
      setError(toErrorMessage(sessionError))
    } finally {
      setIsLoading(false)
    }
  }

  async function exchangeSupabaseSession(accessToken: string) {
    if (
      accessToken === activeExchangeAccessTokenRef.current ||
      accessToken === lastExchangedAccessTokenRef.current
    ) {
      return
    }

    try {
      activeExchangeAccessTokenRef.current = accessToken
      setIsSyncing(true)
      setError(null)

      const payload = await apiRequest<LoginResponse>('/auth/supabase/google-login', {
        method: 'POST',
        body: JSON.stringify({
          accessToken,
        }),
      })

      persistSession({
        token: payload.session.token,
        expiresAt: payload.session.expiresAt,
        user: payload.user,
      })
      lastExchangedAccessTokenRef.current = accessToken
      setOnboardingPrompt(payload.onboarding.prompt)
    } catch (exchangeError) {
      setError(toErrorMessage(exchangeError))
    } finally {
      if (activeExchangeAccessTokenRef.current === accessToken) {
        activeExchangeAccessTokenRef.current = null
      }
      setIsLoading(false)
      setIsSyncing(false)
    }
  }

  function persistSession(session: AppSessionResponse) {
    window.localStorage.setItem(appSessionStorageKey, session.token)
    setSessionToken(session.token)
    setSessionExpiresAt(session.expiresAt)
    setUser(session.user)
  }

  function clearSession() {
    window.localStorage.removeItem(appSessionStorageKey)
    lastExchangedAccessTokenRef.current = null
    activeExchangeAccessTokenRef.current = null
    setSessionToken(null)
    setSessionExpiresAt(null)
    setUser(null)
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    })

    if (signInError) {
      setError(signInError.message)
    }
  }

  async function signOut() {
    try {
      if (sessionToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token: sessionToken,
        })
      }
    } catch {
      // Keep sign-out resilient even if the app session is already stale.
    }

    clearSession()

    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  async function refreshSession() {
    if (!sessionToken) {
      return
    }

    await hydrateAppSession(sessionToken)
  }

  return (
    <AppAuthContext.Provider
      value={{
        configured: supabaseConfigReady,
        isLoading,
        isSyncing,
        error,
        sessionToken,
        sessionExpiresAt,
        user,
        onboardingPrompt,
        signInWithGoogle,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  )
}

export function useAppAuth() {
  const context = useContext(AppAuthContext)

  if (!context) {
    throw new Error('useAppAuth must be used inside AppAuthProvider.')
  }

  return context
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
