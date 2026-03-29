import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'purple' | 'gray' | 'green' | 'red'
}

export function Badge({ children, tone = 'purple' }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
