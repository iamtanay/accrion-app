interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded border'

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  const variantStyles = {
    default: 'bg-bg-tertiary border-border text-fg-secondary',
    success: 'bg-success/10 border-success/30 text-success',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    danger: 'bg-danger/10 border-danger/30 text-danger',
    neutral: 'bg-bg-primary border-border text-fg-muted',
  }

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}
