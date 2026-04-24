import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WalletType } from '@/types'

interface WalletStore {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  walletType: WalletType | null
  zotBalance: number
  login: (type: WalletType) => Promise<void>
  logout: () => void
  setZotBalance: (balance: number) => void
}

const MOCK_MODE = import.meta.env.VITE_USE_MOCKS === 'true'

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, _get) => ({
      account: null,
      isConnected: false,
      isConnecting: false,
      walletType: null,
      zotBalance: 0,

      login: async (type: WalletType) => {
        set({ isConnecting: true })
        try {
          if (MOCK_MODE) {
            await new Promise(r => setTimeout(r, 800))
            set({
              account: 'mockuser.wam',
              isConnected: true,
              isConnecting: false,
              walletType: type,
              zotBalance: 1250.4567,
            })
            return
          }

          if (type === 'wax') {
            const { default: WaxJS } = await import('@waxio/waxjs')
            const wax = new WaxJS({
              rpcEndpoint: 'https://wax.greymass.com',
              tryAutoLogin: false,
            })
            const account = await wax.login()
            set({ account, isConnected: true, isConnecting: false, walletType: 'wax' })
          } else {
            const AnchorLink = (await import('anchor-link')).default
            const AnchorLinkBrowserTransport = (await import('anchor-link-browser-transport')).default
            const transport = new AnchorLinkBrowserTransport()
            const link = new AnchorLink({
              transport,
              chains: [{ chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4', nodeUrl: 'https://wax.greymass.com' }],
            })
            const identity = await link.login('zotverse')
            set({ account: String(identity.session.auth.actor), isConnected: true, isConnecting: false, walletType: 'anchor' })
          }
        } catch (err) {
          console.error('Wallet login failed:', err)
          set({ isConnecting: false })
          throw err
        }
      },

      logout: () => {
        set({ account: null, isConnected: false, walletType: null, zotBalance: 0 })
      },

      setZotBalance: (balance: number) => {
        set({ zotBalance: balance })
      },
    }),
    {
      name: 'zotverse-wallet',
      partialize: (state) => ({
        account: state.account,
        isConnected: state.isConnected,
        walletType: state.walletType,
      }),
    }
  )
)
