import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Clock3,
  HandHelping,
  Home,
  Landmark,
  MessageCircleMore,
  PackageCheck,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'

export const designTokens = {
  project: {
    name: 'Trusted Network',
    type: 'saas-web-mobile',
    designPrinciples: [
      'minimal',
      'mobile-first',
      'card-based',
      'high-trust',
      'fast-interactions',
    ],
  },
  colors: {
    primary: '#6C63FF',
    primaryDark: '#5A52E0',
    gradient: ['#8B85FF', '#B6B3FF'],
    background: {
      white: '#FFFFFF',
      light: '#F7F8FC',
    },
  },
  uxRules: [
    'always_visible_cta',
    'highlight_urgency',
    'minimal_navigation',
    'direct_contact',
  ],
} as const

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
  badge: string
}

export type Listing = {
  id: string
  title: string
  rent: string
  location: string
  moveIn: string
  type: string
  occupancy: string
  verified: boolean
  urgent?: boolean
  stats: string[]
  amenities: string[]
}

export type TravelOption = {
  id: string
  route: string
  date: string
  itemType: string
  eta: string
  rate: string
}

export const homeFeatures: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Trust-first discovery',
    description:
      'Every card surfaces verified badges, move-in readiness, and a direct path to contact.',
    badge: 'Verified listings',
  },
  {
    icon: Route,
    title: 'Fast mobile interactions',
    description:
      'Bottom navigation, scrollable chips, and one-tap actions keep the app useful on the move.',
    badge: '44px touch targets',
  },
  {
    icon: Sparkles,
    title: 'One system for web and mobile',
    description:
      'The same components stretch from small phones to wide dashboards without losing clarity.',
    badge: 'Responsive by default',
  },
]

export const trustStats = [
  { value: '1.2k+', label: 'verified tenants and senders onboarded' },
  { value: '<10s', label: 'average time to reach the primary CTA' },
  { value: '92%', label: 'users choosing direct contact from cards' },
  { value: '24/7', label: 'support-ready status messaging' },
]

export const liveListings: Listing[] = [
  {
    id: 'l1',
    title: 'Sherman Oaks Studio',
    rent: '₹23,000 / month',
    location: 'Andheri West, Mumbai',
    moveIn: 'Move in 12 Apr',
    type: 'Studio',
    occupancy: 'Single occupant',
    verified: true,
    urgent: true,
    stats: ['1 bath', 'Furnished', 'Near metro'],
    amenities: ['Verified owner', 'Wi-Fi ready', 'Lift access'],
  },
  {
    id: 'l2',
    title: 'Shared 2BHK for founders',
    rent: '₹18,500 / month',
    location: 'HSR Layout, Bengaluru',
    moveIn: 'Move in today',
    type: 'Shared flat',
    occupancy: '2 open spots',
    verified: true,
    stats: ['2 bath', 'Co-working nearby', 'Pet friendly'],
    amenities: ['Background checked', 'Parking', 'Power backup'],
  },
  {
    id: 'l3',
    title: 'Company leased premium room',
    rent: '₹28,000 / month',
    location: 'Sector 43, Gurugram',
    moveIn: 'Move in 18 Apr',
    type: 'Private room',
    occupancy: 'Professionals only',
    verified: true,
    stats: ['Attached bath', 'Meal plan', 'Security desk'],
    amenities: ['Company badge', 'Daily cleaning', 'Gym access'],
  },
]

export const tenantFilters = [
  'Verified only',
  'Move in this week',
  'Under ₹25k',
  'Near metro',
  'Private room',
  'Urgent',
]

export const travelOptions: TravelOption[] = [
  {
    id: 't1',
    route: 'Mumbai → Pune',
    date: 'Today, 6:40 PM',
    itemType: 'Documents / small parcel',
    eta: '2h 40m',
    rate: '₹249',
  },
  {
    id: 't2',
    route: 'Bengaluru → Chennai',
    date: 'Tomorrow, 9:00 AM',
    itemType: 'Laptop / fragile item',
    eta: '6h',
    rate: '₹599',
  },
  {
    id: 't3',
    route: 'Delhi → Jaipur',
    date: 'Sun, 2:10 PM',
    itemType: 'Food / care package',
    eta: '4h 30m',
    rate: '₹399',
  },
]

export const sendModes = [
  {
    id: 'send',
    title: 'Send an item',
    description: 'Post your pickup, drop-off, and urgency details.',
    icon: PackageCheck,
  },
  {
    id: 'carry',
    title: 'Carry for others',
    description: 'Share your route and spare luggage capacity.',
    icon: HandHelping,
  },
] as const

export const processHighlights = [
  {
    icon: Clock3,
    title: 'Always-visible CTA',
    description: 'Primary actions stay reachable whether the user is browsing or filling a form.',
  },
  {
    icon: MessageCircleMore,
    title: 'Direct contact',
    description: 'Every listing and travel card leads to a fast chat or WhatsApp-style handoff.',
  },
  {
    icon: Landmark,
    title: 'High-trust signals',
    description: 'Verified, company, urgent, and route status badges surface without clutter.',
  },
]

export const supportHighlights = [
  {
    icon: Building2,
    title: 'Mobile-first product shell',
    description:
      'Stacked sections on small screens expand into clean two-column layouts on tablets and desktops.',
  },
  {
    icon: Home,
    title: 'Card-based housing journey',
    description:
      'Reusable cards power discovery, detail, and message flows across the tenant experience.',
  },
  {
    icon: Truck,
    title: 'Cross-border delivery language',
    description:
      'Travel routes, item types, ETA, and trust tiers make the send-item flow feel fast and safe.',
  },
]
