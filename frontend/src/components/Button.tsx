import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  fullWidth?: boolean
  type?: 'button' | 'submit'
  icon?: ReactNode
  onClick?: () => void
  to?: string
  disabled?: boolean
}

export function Button({
  children,
  variant = 'primary',
  className,
  fullWidth = false,
  type = 'button',
  icon,
  onClick,
  to,
  disabled = false,
}: ButtonProps) {
  const resolvedClassName = ['button', `button-${variant}`, fullWidth ? 'button-full' : '', className]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link className={resolvedClassName} to={to}>
        {children}
        {icon}
      </Link>
    )
  }

  return (
    <button className={resolvedClassName} disabled={disabled} onClick={onClick} type={type}>
      {children}
      {icon}
    </button>
  )
}
