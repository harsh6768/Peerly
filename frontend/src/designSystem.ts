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
    name: 'Cirvo',
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
  hostName: string
  hostRole: string
  responseTime: string
  deposit: string
  availability: string
  matchScore: string
  description: string
}

export type TravelOption = {
  id: string
  route: string
  date: string
  itemType: string
  eta: string
  rate: string
  carrierName: string
  carrierRating: string
  capacity: string
  trustNote: string
}

export type Testimonial = {
  quote: string
  name: string
  role: string
  company: string
}

export const homeFeatures: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Trust-first discovery',
    description:
      'Every card surfaces verified badges, response time, deposit clarity, and a direct path to contact.',
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
  { value: '1,284', label: 'verified renters and senders active this week' },
  { value: '7.8 sec', label: 'median time from landing page to first action' },
  { value: '312', label: 'live routes currently open across 16 cities' },
  { value: '96.4%', label: 'requests receiving a first reply within 30 minutes' },
]

export const sampleCompanies = [
  'UrbanNest',
  'CargoLoop',
  'MetroStay',
  'ShiftMint',
  'HomeLane Pro',
  'ParcelBridge',
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
    hostName: 'Aarav Mehta',
    hostRole: 'Property manager, Blue Brick Living',
    responseTime: 'Replies in 9 min',
    deposit: '₹45,000 deposit',
    availability: 'Available for 11-month lease',
    matchScore: '94% match',
    description:
      'Bright studio five minutes from DN Nagar metro with flexible move-in and a fully documented rental agreement.',
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
    hostName: 'Ritika Shah',
    hostRole: 'Community lead, LaunchHouse Residences',
    responseTime: 'Replies in 14 min',
    deposit: '₹30,000 deposit',
    availability: 'Flexible 6-12 month stay',
    matchScore: '91% match',
    description:
      'Built for startup operators who want a furnished shared flat close to cafes, offices, and co-working spaces.',
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
    hostName: 'Neha Suri',
    hostRole: 'Operations head, Corporate Habitat',
    responseTime: 'Replies in 6 min',
    deposit: '₹56,000 deposit',
    availability: 'Corporate lease supported',
    matchScore: '97% match',
    description:
      'Premium managed room in a secure business district with housekeeping, meals, and concierge-backed onboarding.',
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
    carrierName: 'Rohan Kulkarni',
    carrierRating: '4.9 / 5',
    capacity: '2.5 kg free capacity',
    trustNote: 'Verified frequent carrier · 38 completed deliveries',
  },
  {
    id: 't2',
    route: 'Bengaluru → Chennai',
    date: 'Tomorrow, 9:00 AM',
    itemType: 'Laptop / fragile item',
    eta: '6h',
    rate: '₹599',
    carrierName: 'Divya Menon',
    carrierRating: '4.8 / 5',
    capacity: 'Cabin-safe fragile slot',
    trustNote: 'Background checked carrier · Insurance eligible',
  },
  {
    id: 't3',
    route: 'Delhi → Jaipur',
    date: 'Sun, 2:10 PM',
    itemType: 'Food / care package',
    eta: '4h 30m',
    rate: '₹399',
    carrierName: 'Karan Bedi',
    carrierRating: '4.7 / 5',
    capacity: 'Temperature-safe bag space',
    trustNote: 'Trusted weekend runner · 21 repeat senders',
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

export const testimonials: Testimonial[] = [
  {
    quote:
      'We started using Cirvo to manage verified tenant demand in Bengaluru and it cut our back-and-forth screening time in half.',
    name: 'Maya Rao',
    role: 'Growth manager',
    company: 'UrbanNest Living',
  },
  {
    quote:
      'The delivery side feels equally polished. Our ops team can post urgent city-to-city requests and immediately see trustworthy travellers.',
    name: 'Keshav Arora',
    role: 'Operations lead',
    company: 'ParcelBridge',
  },
  {
    quote:
      'Even without a backend demo, the seeded data already reads like a real category product. It helps stakeholders understand the opportunity instantly.',
    name: 'Ananya Sethi',
    role: 'Product consultant',
    company: 'ShiftMint Advisory',
  },
]

export const marketplaceSnapshot = [
  '842 verified housing leads this week',
  '312 active route offers across major corridors',
  'Average first response time under 10 minutes',
  '68% of high-intent users come from mobile web',
]
