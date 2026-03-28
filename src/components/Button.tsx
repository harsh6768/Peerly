import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  type?: 'button' | 'submit'
  icon?: ReactNode
  onClick?: () => void
  to?: string
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  icon,
  onClick,
  to,
}: ButtonProps) {
  const className = ['button', `button-${variant}`, fullWidth ? 'button-full' : '']
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link className={className} to={to}>
        {children}
        {icon}
      </Link>
    )
  }

  return (
    <button className={className} onClick={onClick} type={type}>
      {children}
      {icon}
    </button>
  )
}
