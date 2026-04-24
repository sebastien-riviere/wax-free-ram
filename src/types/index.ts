export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export type NFTType = 'tool_faucet' | 'tool_burn' | 'profil' | 'farming' | 'external'

export type NFTState = 'available' | 'staked' | 'equipped' | 'locked'

export interface NFT {
  assetId: string
  templateId: string
  name: string
  collection: string
  rarity: Rarity
  type: NFTType
  image?: string
  state: NFTState
  // Tool Faucet / Tool Burn
  charges?: number
  maxCharges?: number
  boostPercent?: number
  // Farming
  dailyRate?: number
  lastClaimTs?: number
  stakedAt?: number
  // Profil
  xp?: number
  level?: number
  profilBoost?: number
}

export interface FarmingStake {
  assetId: string
  nft: NFT
  lastClaimTs: number
  stakedAt: number
}

export interface RewardBreakdown {
  base: number
  toolBoost: number
  profilBoost: number
  total: number
}

export interface LeaderboardEntry {
  rank: number
  account: string
  value: number
  delta?: number
}

export interface DropCard {
  id: string
  name: string
  image?: string
  priceZOT: number
  stock: number
  totalStock: number
  expiresAt?: number
}

export interface PackCard {
  id: string
  name: string
  image?: string
  priceZOT: number
  stock: number
  guaranteedContent: string[]
}

export interface BlendRecipe {
  id: string
  inputs: Array<{ templateId: string; name: string; count: number; owned: number }>
  output: { templateId: string; name: string; rarity: Rarity }
  costZOT: number
}

export type WalletType = 'wax' | 'anchor'

export interface WalletState {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  walletType: WalletType | null
  zotBalance: number
  login: (type: WalletType) => Promise<void>
  logout: () => void
}
