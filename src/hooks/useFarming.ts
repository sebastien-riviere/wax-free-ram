import { useState, useEffect, useCallback } from 'react'
import type { NFT } from '@/types'
import { mockFarmingStaked, mockFarmingAvailable } from '@/services/mocks/mockNFTs'

const DAILY_RATES: Record<string, number> = {
  common: 10,
  rare: 30,
  epic: 80,
  legendary: 200,
  mythic: 500,
}

const HALVING_MULTIPLIER = 1.0 // à brancher sur contrat prod

export function useFarming() {
  const [staked, setStaked] = useState<NFT[]>(mockFarmingStaked)
  const [available, setAvailable] = useState<NFT[]>(mockFarmingAvailable)
  const [pendingRewards, setPendingRewards] = useState<Record<string, number>>({})
  const [totalPending, setTotalPending] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const calcPending = useCallback((nft: NFT) => {
    if (!nft.lastClaimTs) return 0
    const elapsed = Date.now() / 1000 - nft.lastClaimTs
    const rate = DAILY_RATES[nft.rarity] ?? nft.dailyRate ?? 0
    return (elapsed / 86400) * rate * HALVING_MULTIPLIER
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const rewards: Record<string, number> = {}
      let total = 0
      for (const nft of staked) {
        const r = calcPending(nft)
        rewards[nft.assetId] = r
        total += r
      }
      setPendingRewards(rewards)
      setTotalPending(total)
    }, 1000)
    return () => clearInterval(interval)
  }, [staked, calcPending])

  const stake = useCallback(async (assetId: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const nft = available.find(n => n.assetId === assetId)
    if (nft) {
      const now = Math.floor(Date.now() / 1000)
      const stakedNft = { ...nft, state: 'staked' as const, lastClaimTs: now, stakedAt: now }
      setAvailable(prev => prev.filter(n => n.assetId !== assetId))
      setStaked(prev => [...prev, stakedNft])
    }
    setIsLoading(false)
  }, [available])

  const unstake = useCallback(async (assetId: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const nft = staked.find(n => n.assetId === assetId)
    if (nft) {
      setStaked(prev => prev.filter(n => n.assetId !== assetId))
      setAvailable(prev => [...prev, { ...nft, state: 'available' as const }])
    }
    setIsLoading(false)
  }, [staked])

  const claimAll = useCallback(async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const now = Math.floor(Date.now() / 1000)
    setStaked(prev => prev.map(n => ({ ...n, lastClaimTs: now })))
    setIsLoading(false)
  }, [])

  return { staked, available, pendingRewards, totalPending, isLoading, stake, unstake, claimAll, calcPending }
}
