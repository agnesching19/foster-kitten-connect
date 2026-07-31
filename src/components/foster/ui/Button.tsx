import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white shadow-sm active:bg-brand-600 hover:bg-brand-600',
  secondary:
    'bg-white text-ink border border-border shadow-sm active:bg-brand-50 hover:bg-brand-50',
  ghost: 'bg-transparent text-brand-700 active:bg-brand-100 hover:bg-brand-50',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 py-2.5 text-sm font-semibold rounded-xl',
  lg: 'min-h-14 px-5 py-3.5 text-base font-semibold rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center gap-2 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
