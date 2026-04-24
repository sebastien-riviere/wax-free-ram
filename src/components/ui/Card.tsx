import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  variant?: 'default' | 'glow' | 'flat'
  glowColor?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({
  variant = 'default',
  glowColor = 'rgba(124, 58, 237, 0.5)',
  children,
  className,
  onClick,
}: CardProps) {
  const baseStyle: React.CSSProperties = {
    borderRadius: '12px',
    position: 'relative',
    overflow: 'hidden',
  }

  const variantStyle: React.CSSProperties =
    variant === 'default'
      ? {
          background: '#141420',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'none',
        }
      : variant === 'glow'
      ? {
          background: '#141420',
          border: `1px solid ${glowColor}`,
          boxShadow: `0 0 16px ${glowColor}`,
        }
      : {
          background: 'transparent',
          border: '1px solid transparent',
          boxShadow: 'none',
        }

  const hoverStyle =
    variant === 'default'
      ? { y: -2, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }
      : variant === 'glow'
      ? { y: -2, boxShadow: `0 0 28px ${glowColor}` }
      : {}

  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverStyle}
      transition={{ duration: 0.2 }}
      className={cn(onClick && 'cursor-pointer', className)}
      style={{ ...baseStyle, ...variantStyle }}
    >
      {children}
    </motion.div>
  )
}
