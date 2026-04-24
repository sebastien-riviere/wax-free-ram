import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  common: { background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.4)' },
  rare: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' },
  epic: { background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.4)' },
  legendary: { background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', border: '1px solid rgba(234, 179, 8, 0.4)' },
  mythic: {
    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(124, 58, 237, 0.2))',
    color: '#f0abfc',
    border: '1px solid rgba(240, 171, 252, 0.4)',
  },
  success: { background: 'rgba(13, 148, 136, 0.15)', color: '#2dd4bf', border: '1px solid rgba(13, 148, 136, 0.4)' },
  warning: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' },
  error: { background: 'rgba(220, 38, 38, 0.15)', color: '#f87171', border: '1px solid rgba(220, 38, 38, 0.4)' },
  info: { background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', border: '1px solid rgba(6, 182, 212, 0.4)' },
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center font-medium', className)}
      style={{
        ...variantStyles[variant],
        borderRadius: '9999px',
        padding: '2px 10px',
        fontSize: '11px',
        lineHeight: '18px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
