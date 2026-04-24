import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'burn' | 'success' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: '#7c3aed',
    border: '1px solid #8b5cf6',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(124, 58, 237, 0.4)',
  },
  secondary: {
    background: 'transparent',
    border: '1px solid rgba(139, 92, 246, 0.5)',
    color: '#a78bfa',
    boxShadow: 'none',
  },
  burn: {
    background: '#f97316',
    border: '1px solid #fb923c',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)',
  },
  success: {
    background: '#0d9488',
    border: '1px solid #14b8a6',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(13, 148, 136, 0.4)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    color: '#cbd5e1',
    boxShadow: 'none',
  },
  danger: {
    background: '#dc2626',
    border: '1px solid #ef4444',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(220, 38, 38, 0.4)',
  },
}

const variantHoverShadow: Record<string, string> = {
  primary: '0 0 20px rgba(124, 58, 237, 0.7)',
  secondary: '0 0 12px rgba(139, 92, 246, 0.3)',
  burn: '0 0 20px rgba(249, 115, 22, 0.7)',
  success: '0 0 20px rgba(13, 148, 136, 0.7)',
  ghost: 'none',
  danger: '0 0 20px rgba(220, 38, 38, 0.7)',
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '13px', gap: '6px' },
  md: { height: '40px', padding: '0 16px', fontSize: '14px', gap: '8px' },
  lg: { height: '48px', padding: '0 24px', fontSize: '16px', gap: '10px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      whileHover={!isDisabled ? { boxShadow: variantHoverShadow[variant] } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg font-medium cursor-pointer select-none transition-opacity',
        fullWidth && 'w-full',
        isDisabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      disabled={isDisabled}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {loading ? (
        <Loader2
          style={{ width: size === 'sm' ? 14 : size === 'lg' ? 18 : 16, height: size === 'sm' ? 14 : size === 'lg' ? 18 : 16 }}
          className="animate-spin"
        />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', width: size === 'sm' ? 14 : size === 'lg' ? 18 : 16, height: size === 'sm' ? 14 : size === 'lg' ? 18 : 16 }}>
          {icon}
        </span>
      ) : null}
      {children && <span>{children}</span>}
    </motion.button>
  )
}
