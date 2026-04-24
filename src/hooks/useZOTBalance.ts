import { useEffect } from 'react'
import { useWalletStore } from '@/store/walletStore'

const MOCK_MODE = import.meta.env.VITE_USE_MOCKS === 'true'

export function useZOTBalance() {
  const { account, isConnected, zotBalance, setZotBalance } = useWalletStore()

  useEffect(() => {
    if (!isConnected || !account) return
    if (MOCK_MODE) return // mock balance set at login

    const fetchBalance = async () => {
      try {
        const res = await fetch(`https://wax.greymass.com/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'zot.token', account, symbol: 'ZOT' }),
        })
        const data = await res.json()
        if (Array.isArray(data) && data[0]) {
          const balance = parseFloat(data[0].split(' ')[0])
          setZotBalance(balance)
        }
      } catch (e) {
        console.error('Failed to fetch ZOT balance', e)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30_000)
    return () => clearInterval(interval)
  }, [account, isConnected, setZotBalance])

  return zotBalance
}
