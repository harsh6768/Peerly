import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Globe2,
  Link as LinkIcon,
  MailCheck,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { apiRequest } from '../lib/api'
import { useAppAuth } from '../context/AppAuthContext'

type VerificationResponse = {
  user: {
    id: string
    name: string
    email: string
    isVerified: boolean
    verificationType: 'WORK_EMAIL' | 'LINKEDIN' | null
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
    workEmail: string | null
    companyName: string | null
    linkedinUrl: string | null
    createdAt: string
    statusLabel: string
    badges: string[]
  }
  incentives: string[]
  availableMethods: Array<{
    type: 'WORK_EMAIL' | 'LINKEDIN'
    recommended: boolean
    label: string
  }>
}

type VerificationMetrics = {
  totalUsers: number
  verifiedUsers: number
  verificationRate: number
  pendingLinkedinReviews: number
  boostedListings: number
  publishedListings: number
  trackedMetrics: string[]
}

type ListingPreview = {
  id: string
  title: string
  city: string
  locality: string
  isBoosted: boolean
  owner: {
    fullName: string
    isVerified: boolean
    companyName: string | null
  }
}

type OtpRequestResponse = {
  success: boolean
  delivery: {
    destination: string
    expiresInMinutes: number
  }
  companyName: string
  otpPreview?: string
}

const statusToneMap = {
  Verified: 'green',
  'Pending verification': 'gray',
  'Not verified': 'red',
} as const

export function TrustCenterPage() {
  const {
    configured,
    error,
    isLoading,
    isSyncing,
    onboardingPrompt,
    sessionToken,
    signInWithGoogle,
    signOut,
    user,
  } = useAppAuth()
  const [verification, setVerification] = useState<VerificationResponse | null>(null)
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null)
  const [listings, setListings] = useState<ListingPreview[]>([])
  const [workEmail, setWorkEmail] = useState(user?.workEmail ?? '')
  const [otp, setOtp] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl ?? '')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [otpPreview, setOtpPreview] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionToken) {
      setVerification(null)
      return
    }

    void loadProtectedData()
  }, [sessionToken])

  useEffect(() => {
    setWorkEmail(user?.workEmail ?? '')
    setLinkedinUrl(user?.linkedinUrl ?? '')
  }, [user])

  async function loadProtectedData() {
    if (!sessionToken) {
      return
    }

    try {
      const [verificationPayload, metricsPayload, listingsPayload] = await Promise.all([
        apiRequest<VerificationResponse>('/verification/me', {
          token: sessionToken,
        }),
        apiRequest<VerificationMetrics>('/verification/metrics'),
        apiRequest<ListingPreview[]>('/listings'),
      ])

      setVerification(verificationPayload)
      setMetrics(metricsPayload)
      setListings(listingsPayload.slice(0, 4))
    } catch (loadError) {
      setFeedback(loadError instanceof Error ? loadError.message : 'Unable to load trust center data.')
    }
  }

  async function handleWorkEmailRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionToken) {
      return
    }

    try {
      setBusyAction('work-email-request')
      setFeedback(null)
      const response = await apiRequest<OtpRequestResponse>('/verification/work-email/request-otp', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({ workEmail }),
      })

      setOtpPreview(response.otpPreview ?? null)
      setFeedback(
        `OTP sent to ${response.delivery.destination}. Expires in ${response.delivery.expiresInMinutes} minutes.`,
      )
    } catch (requestError) {
      setFeedback(requestError instanceof Error ? requestError.message : 'Unable to send OTP.')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleWorkEmailConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionToken) {
      return
    }

    try {
      setBusyAction('work-email-confirm')
      setFeedback(null)
      const response = await apiRequest<VerificationResponse>('/verification/work-email/confirm', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({ workEmail, otp }),
      })

      setVerification(response)
      setOtp('')
      setOtpPreview(null)
      setFeedback('Work email verified. Your trust badge is now live.')
      await loadProtectedData()
    } catch (confirmError) {
      setFeedback(confirmError instanceof Error ? confirmError.message : 'Unable to verify OTP.')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleLinkedinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionToken) {
      return
    }

    try {
      setBusyAction('linkedin')
      setFeedback(null)
      await apiRequest('/verification/linkedin/submit', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({ linkedinUrl }),
      })

      setFeedback('LinkedIn verification submitted. It is now pending review.')
      await loadProtectedData()
    } catch (linkedinError) {
      setFeedback(
        linkedinError instanceof Error
          ? linkedinError.message
          : 'Unable to submit LinkedIn verification.',
      )
    } finally {
      setBusyAction(null)
    }
  }

  if (!user) {
    return (
      <div className="page">
        <section className="section">
          <div className="page-inner trust-hero">
            <div className="trust-copy reveal">
              <Badge tone="purple">Authentication + Verification</Badge>
              <h1>Google onboarding with a trust layer that increases visibility.</h1>
              <p>
                Users can sign in with Google through Supabase, then add work-email or
                LinkedIn verification when they are ready. The product stays low-friction,
                but verified members get ranked higher and feel safer to contact.
              </p>

              <div className="hero-actions">
                <Button
                  disabled={!configured || isLoading || isSyncing}
                  icon={<Globe2 size={18} />}
                  onClick={() => void signInWithGoogle()}
                >
                  Continue with Google
                </Button>
              </div>

              <div className="trust-pillars">
                <span className="pill">
                  <ShieldCheck size={16} />
                  Supabase Google OAuth
                </span>
                <span className="pill">
                  <MailCheck size={16} />
                  Work email OTP
                </span>
                <span className="pill">
                  <LinkIcon size={16} />
                  LinkedIn review fallback
                </span>
              </div>

              {(error || !configured) && (
                <div className="auth-config-note">
                  <strong>Setup required</strong>
                  <p>
                    {error ??
                      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on the frontend, plus SUPABASE_URL and SUPABASE_ANON_KEY on the backend.'}
                  </p>
                </div>
              )}
            </div>

            <Card className="trust-summary-card reveal reveal-delay">
              <div className="mini-row">
                <Badge tone="green">Recommended</Badge>
                <TrendingUp size={16} />
              </div>
              <strong>Verification incentives</strong>
              <div className="trust-summary-list">
                <div>
                  <CheckCircle2 size={18} />
                  <span>Higher ranking in listings</span>
                </div>
                <div>
                  <Sparkles size={18} />
                  <span>More visibility across the marketplace</span>
                </div>
                <div>
                  <BadgeCheck size={18} />
                  <span>Verified Professional badge across the UI</span>
                </div>
                <div>
                  <Building2 size={18} />
                  <span>Company name shown for trusted profiles</span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="section">
        <div className="page-inner trust-dashboard">
          <div className="section-head reveal">
            <div className="eyebrow">Trust Center</div>
            <h2>{onboardingPrompt}</h2>
            <p>
              Authentication is complete. Choose the verification path that fits best today,
              and the product will reward trust without blocking access.
            </p>
          </div>

          <div className="trust-grid">
            <Card className="trust-status-card">
              <div className="trust-status-top">
                <div>
                  <span className="muted">Signed in as</span>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
                <Badge tone={statusToneFor(verification?.user.statusLabel)}>
                  {verification?.user.statusLabel ?? 'Not verified'}
                </Badge>
              </div>

              <div className="trust-badges">
                {(verification?.user.badges ?? []).map((badge) => (
                  <span className="pill" key={badge}>
                    <ShieldCheck size={14} />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="status-detail-grid">
                <div>
                  <span className="muted">Auth provider</span>
                  <strong>Google via Supabase</strong>
                </div>
                <div>
                  <span className="muted">Verification type</span>
                  <strong>{formatEnum(verification?.user.verificationType) ?? 'Not selected yet'}</strong>
                </div>
                <div>
                  <span className="muted">Company</span>
                  <strong>{verification?.user.companyName ?? 'Pending verification'}</strong>
                </div>
                <div>
                  <span className="muted">App session</span>
                  <strong>{isSyncing ? 'Refreshing' : 'Active'}</strong>
                </div>
              </div>

              <Button icon={<TimerReset size={16} />} onClick={() => void signOut()} variant="ghost">
                Sign out
              </Button>
            </Card>

            <Card className="verification-method-card">
              <div className="mini-row">
                <Badge tone="green">Recommended</Badge>
                <MailCheck size={18} />
              </div>
              <h3>Verify with Work Email</h3>
              <p>
                Corporate email verification is the fastest path to a verified badge and
                company attribution.
              </p>

              <form className="stack-form" onSubmit={handleWorkEmailRequest}>
                <label className="field">
                  <span>Work email</span>
                  <input
                    onChange={(event) => setWorkEmail(event.target.value)}
                    placeholder="name@company.com"
                    type="email"
                    value={workEmail}
                  />
                </label>
                <Button
                  disabled={busyAction === 'work-email-request' || !workEmail}
                  fullWidth
                  type="submit"
                >
                  Send OTP
                </Button>
              </form>

              <form className="stack-form compact-form" onSubmit={handleWorkEmailConfirm}>
                <label className="field">
                  <span>OTP</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="6-digit code"
                    value={otp}
                  />
                </label>
                <Button
                  disabled={busyAction === 'work-email-confirm' || otp.length !== 6}
                  fullWidth
                  type="submit"
                  variant="secondary"
                >
                  Verify email
                </Button>
              </form>

              {otpPreview && (
                <div className="dev-note">
                  <strong>Local OTP preview</strong>
                  <span>{otpPreview}</span>
                </div>
              )}
            </Card>

            <Card className="verification-method-card">
              <div className="mini-row">
                <Badge tone="gray">Secondary</Badge>
                <LinkIcon size={18} />
              </div>
              <h3>Verify with LinkedIn</h3>
              <p>
                Submit a public LinkedIn profile URL to enter manual review. This keeps MVP
                scope lean without relying on the LinkedIn API.
              </p>

              <form className="stack-form" onSubmit={handleLinkedinSubmit}>
                <label className="field">
                  <span>LinkedIn profile URL</span>
                  <input
                    onChange={(event) => setLinkedinUrl(event.target.value)}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    type="url"
                    value={linkedinUrl}
                  />
                </label>
                <Button disabled={busyAction === 'linkedin' || !linkedinUrl} fullWidth type="submit">
                  Submit for review
                </Button>
              </form>
            </Card>
          </div>

          {feedback && <div className="feedback-banner">{feedback}</div>}

          {metrics && (
            <div className="trust-metrics-grid">
              <Card>
                <span className="muted">Verified users</span>
                <strong>{metrics.verifiedUsers}</strong>
                <p>{metrics.verificationRate}% of the current user base</p>
              </Card>
              <Card>
                <span className="muted">Pending LinkedIn reviews</span>
                <strong>{metrics.pendingLinkedinReviews}</strong>
                <p>Manual review workload for the trust queue</p>
              </Card>
              <Card>
                <span className="muted">Boosted listings</span>
                <strong>{metrics.boostedListings}</strong>
                <p>Listings receiving paid or manual priority</p>
              </Card>
              <Card>
                <span className="muted">Tracked KPIs</span>
                <strong>{metrics.trackedMetrics.length}</strong>
                <p>Verification funnel and listing success indicators</p>
              </Card>
            </div>
          )}

          <div className="listing-priority-section">
            <div className="section-head">
              <div className="eyebrow">Listing priority</div>
              <h2>Boosted listings first, then verified users, then everyone else.</h2>
              <p>
                This preview is pulled from the live listing API so the ranking rules are
                visible in the product, not just described in docs.
              </p>
            </div>

            <div className="priority-listings">
              {listings.map((listing) => (
                <Card className="priority-listing-card" key={listing.id}>
                  <div className="mini-row">
                    <Badge tone={listing.isBoosted ? 'purple' : listing.owner.isVerified ? 'green' : 'gray'}>
                      {listing.isBoosted
                        ? 'Boosted'
                        : listing.owner.isVerified
                          ? 'Verified owner'
                          : 'Standard'}
                    </Badge>
                    <span className="muted">
                      {listing.city}, {listing.locality}
                    </span>
                  </div>
                  <strong>{listing.title}</strong>
                  <p>
                    {listing.owner.fullName}
                    {listing.owner.companyName ? ` · ${listing.owner.companyName}` : ''}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function formatEnum(value?: string | null) {
  if (!value) {
    return null
  }

  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function statusToneFor(statusLabel?: string) {
  if (!statusLabel || !(statusLabel in statusToneMap)) {
    return 'red'
  }

  return statusToneMap[statusLabel as keyof typeof statusToneMap]
}
