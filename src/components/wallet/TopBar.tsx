import { useState, useRef, useEffect } from 'react'
import { Coins, Wallet2, Copy, LogOut, ChevronDown } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import { WalletConnectModal } from './WalletConnectModal'

function formatBalance(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function truncateAccount(account: string): string {
  if (account.length <= 12) return account
  return account.slice(0, 4) + '...' + account.slice(-5)
}

const isTestnet = import.meta.env.VITE_NETWORK === 'testnet'

export function TopBar() {
  const { account, isConnected, zotBalance, logout } = useWalletStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleCopy() {
    if (!account) return
    await navigator.clipboard.writeText(account)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '16px',
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            flexShrink: 0,
          }}
        >
          ZOTVERSE
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ZOT Balance */}
        {isConnected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '6px 12px',
              flexShrink: 0,
            }}
          >
            <Coins size={14} style={{ color: '#f97316' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
              {formatBalance(zotBalance)} ZOT
            </span>
            {/* Network badge */}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isTestnet ? 'rgba(249, 115, 22, 0.15)' : 'rgba(13, 148, 136, 0.15)',
                color: isTestnet ? '#f97316' : '#0d9488',
                border: `1px solid ${isTestnet ? 'rgba(249, 115, 22, 0.3)' : 'rgba(13, 148, 136, 0.3)'}`,
              }}
            >
              {isTestnet ? 'TESTNET' : 'MAINNET'}
            </span>
          </div>
        )}

        {/* Wallet button */}
        {!isConnected ? (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#7c3aed',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
              padding: '0 16px',
              height: '36px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(124, 58, 237, 0.4)',
              flexShrink: 0,
              transition: 'box-shadow 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.7)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(124, 58, 237, 0.4)')}
          >
            <Wallet2 size={15} />
            Connect Wallet
          </button>
        ) : (
          <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setIsDropdownOpen(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: '8px',
                padding: '0 12px',
                height: '36px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#a78bfa',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)')}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#0d9488',
                  flexShrink: 0,
                }}
              />
              {account ? truncateAccount(account) : ''}
              <ChevronDown
                size={13}
                style={{
                  transition: 'transform 0.15s ease',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#141420',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  zIndex: 60,
                }}
              >
                <button
                  onClick={handleCopy}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#2dd4bf' : '#cbd5e1',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(255,255,255,0.06)',
                    margin: '0 10px',
                  }}
                />
                <button
                  onClick={() => {
                    logout()
                    setIsDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <WalletConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
