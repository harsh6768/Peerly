import * as AuthSession from 'expo-auth-session'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { apiRequest } from './api'
import { clearStoredToken, getStoredToken, storeToken } from './storage'
import { supabase, supabaseConfigReady } from './supabase'

WebBrowser.maybeCompleteAuthSession()

export type AppUser = {
  id: string
  name: string
  email: string
  isAdmin: boolean
  phone: string | null
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
  session: { token: string; expiresAt: string }
  user: AppUser
  onboarding: { prompt: string; recommendedVerificationMethod: 'WORK_EMAIL' | 'LINKEDIN' }
}

type AuthContextValue = {
  configured: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  sessionToken: string | null
  user: AppUser | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (updates: { phone: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastExchangedRef = useRef<string | null>(null)
  const activeExchangeRef = useRef<string | null>(null)

  useEffect(() => {
    void bootstrapSession()
  }, [])

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && !sessionToken) {
        void exchangeSupabaseSession(data.session.access_token)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        void exchangeSupabaseSession(nextSession.access_token)
      }
    })

    return () => subscription.unsubscribe()
  }, [sessionToken])

  async function bootstrapSession() {
    try {
      const storedToken = await getStoredToken()
      if (!storedToken) return
      await hydrateSession(storedToken)
    } finally {
      setIsLoading(false)
    }
  }

  async function hydrateSession(token: string) {
    try {
      setError(null)
      const session = await apiRequest<AppSessionResponse>('/auth/me', { token })
      persistSession(session)
    } catch {
      await clearStoredToken()

      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          await exchangeSupabaseSession(data.session.access_token)
          return
        }
      }

      clearSession()
    }
  }

  async function exchangeSupabaseSession(accessToken: string) {
    if (
      accessToken === activeExchangeRef.current ||
      accessToken === lastExchangedRef.current
    ) {
      return
    }

    try {
      activeExchangeRef.current = accessToken
      setIsSyncing(true)
      setError(null)

      const payload = await apiRequest<LoginResponse>('/auth/supabase/google-login', {
        method: 'POST',
        body: JSON.stringify({ accessToken }),
      })

      await persistSession({
        token: payload.session.token,
        expiresAt: payload.session.expiresAt,
        user: payload.user,
      })
      lastExchangedRef.current = accessToken
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      if (activeExchangeRef.current === accessToken) {
        activeExchangeRef.current = null
      }
      setIsLoading(false)
      setIsSyncing(false)
    }
  }

  async function persistSession(session: AppSessionResponse) {
    await storeToken(session.token)
    setSessionToken(session.token)
    setUser(session.user)
  }

  function clearSession() {
    lastExchangedRef.current = null
    activeExchangeRef.current = null
    setSessionToken(null)
    setUser(null)
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setIsSyncing(true)
    setError(null)

    try {
      // Must match Supabase → Authentication → URL Configuration → Redirect URLs.
      // Production checklist: repo root DEPLOYMENT.md §3. Expo Go: exp://… ; standalone/TestFlight: cirvo://… (app.json scheme).
      const redirectTo = AuthSession.makeRedirectUri({ path: '/' })
      if (__DEV__) {
        console.warn(
          '[OAuth] Paste this exact redirect URL into Supabase Redirect URLs if login opens the website:',
          redirectTo,
        )
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        return
      }

      if (!data?.url) {
        setError('Could not start Google sign-in.')
        return
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

      if (result.type !== 'success' || !result.url) {
        return
      }

      const callbackUrl = result.url
      const hashIdx = callbackUrl.indexOf('#')
      const searchParams =
        hashIdx >= 0
          ? new URLSearchParams(callbackUrl.slice(hashIdx + 1))
          : new URL(callbackUrl).searchParams

      let accessToken = searchParams.get('access_token')
      let refreshToken = searchParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        const code = new URL(callbackUrl).searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
          }
          return
        }
        setError('Could not complete sign-in. Add redirect URL in Supabase (see app scheme).')
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        setError(sessionError.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setIsSyncing(false)
    }
  }

  async function signOut() {
    try {
      if (sessionToken) {
        await apiRequest('/auth/logout', { method: 'POST', token: sessionToken })
      }
    } catch {
      // keep sign-out resilient
    }

    await clearStoredToken()
    clearSession()

    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  async function refreshSession() {
    if (!sessionToken) return
    await hydrateSession(sessionToken)
  }

  async function updateProfile(updates: { phone: string }) {
    if (!sessionToken) {
      throw new Error('Sign in to update your profile.')
    }
    setIsSyncing(true)
    setError(null)
    try {
      const updated = await apiRequest<AppUser>('/auth/profile', {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({ phone: updates.phone }),
      })
      setUser(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update profile.'
      setError(message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        configured: supabaseConfigReady,
        isLoading,
        isSyncing,
        error,
        sessionToken,
        user,
        signInWithGoogle,
        signOut,
        refreshSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
