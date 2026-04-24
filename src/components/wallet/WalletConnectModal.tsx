import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Wallet2, Shield, X, ChevronRight, Loader2 } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import type { WalletType } from '@/types'

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { login, isConnecting } = useWalletStore()
  const [error, setError] = useState<string | null>(null)
  const [loadingType, setLoadingType] = useState<WalletType | null>(null)

  async function handleLogin(type: WalletType) {
    setError(null)
    setLoadingType(type)
    try {
      await login(type)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed. Please try again.')
    } finally {
      setLoadingType(null)
    }
  }

  const options: Array<{
    type: WalletType
    icon: React.ReactNode
    label: string
    description: string
  }> = [
    {
      type: 'wax',
      icon: <Wallet2 size={22} />,
      label: 'WAX Cloud Wallet',
      description: 'Browser-based, no extension needed',
    },
    {
      type: 'anchor',
      icon: <Shield size={22} />,
      label: 'Anchor Wallet',
      description: 'Desktop app, hardware wallet support',
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '400px',
              background: '#141420',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '32px',
              zIndex: 101,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d1d5db')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Connect Wallet
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                Choose your WAX wallet to get started
              </p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {options.map(({ type, icon, label, description }) => {
                const isLoading = loadingType === type
                const isDisabled = isConnecting && !isLoading

                return (
                  <button
                    key={type}
                    onClick={() => handleLogin(type)}
                    disabled={isConnecting}
                    style={{
                      background: '#1a1a28',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      width: '100%',
                      textAlign: 'left',
                      opacity: isDisabled ? 0.5 : 1,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isConnecting) (e.currentTarget.style.background = '#222236')
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#1a1a28'
                    }}
                  >
                    {/* Icon */}
                    <span
                      style={{
                        color: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isLoading ? (
                        <Loader2 size={22} className="animate-spin" />
                      ) : (
                        icon
                      )}
                    </span>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {description}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight size={16} style={{ color: '#4b5563', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.12)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#f87171',
                    overflow: 'hidden',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
