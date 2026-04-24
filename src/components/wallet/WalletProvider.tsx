import { createContext, useContext } from 'react'
import { useWalletStore } from '@/store/walletStore'
import type { WalletState } from '@/types'

const WalletContext = createContext<WalletState | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWalletStore()
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
