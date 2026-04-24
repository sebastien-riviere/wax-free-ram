import { motion } from 'framer-motion'
import { Coins, Package, Sprout, TrendingUp, RefreshCw, Database, Droplets } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import { truncateAddress, formatZOT } from '@/lib/utils'
import { useFarming } from '@/hooks/useFarming'
import { mockNFTs, mockProfil } from '@/services/mocks/mockNFTs'
import type { NFT } from '@/types'

const COLORS = {
  bg: '#0a0a0f',
  card: '#141420',
  border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed',
  orange: '#f97316',
  teal: '#0d9488',
  green: '#22c55e',
  text: '#e2e8f0',
  muted: '#94a3b8',
}

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  mythic: '#ec4899',
}

function RarityBadge({ rarity }: { rarity: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: RARITY_COLORS[rarity] + '22', color: RARITY_COLORS[rarity], border: `1px solid ${RARITY_COLORS[rarity]}44` }}
    >
      {rarity}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, iconColor, sub }: { icon: React.ElementType; label: string; value: string; iconColor: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="p-2 rounded-lg" style={{ background: iconColor + '22' }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: COLORS.muted }}>{label}</p>
        <p className="text-lg font-bold mt-0.5" style={{ color: COLORS.text }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>{sub}</p>}
      </div>
    </div>
  )
}

function StatsGrid() {
  const { zotBalance } = useWalletStore()
  const equipped = mockNFTs.filter(n => n.state === 'equipped')
  const staked = mockNFTs.filter(n => n.state === 'staked')


  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard icon={Coins} label="ZOT Balance" value={`${formatZOT(zotBalance, 2)} ZOT`} iconColor={COLORS.violet} />
      <StatCard icon={Package} label="NFTs Équipés" value={String(equipped.length)} iconColor={COLORS.teal} />
      <StatCard icon={Sprout} label="Farming Actif" value={String(staked.length)} iconColor={COLORS.green} />
      <StatCard icon={TrendingUp} label="Pending Rewards" value="342.8 ZOT" iconColor={COLORS.orange} />
    </div>
  )
}

function RamStats() {
  // Mock values — from burn_log aggregate in production
  const totalRamMB = 14.72
  const totalRamWAX = 0.287
  const myRamMB = 0.94
  const myRamWAX = 0.0183

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Database size={16} style={{ color: COLORS.green }} />
        <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>RAM libérée</h2>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: COLORS.muted }}>Global (tous wallets)</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold" style={{ color: COLORS.green }}>{totalRamMB} MB</span>
            <span className="text-sm font-semibold" style={{ color: COLORS.teal }}>≈ {totalRamWAX} WAX</span>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <p className="text-xs font-medium mb-1" style={{ color: COLORS.muted }}>Votre contribution</p>
          <div className="flex justify-between items-center">
            <span className="text-base font-bold" style={{ color: COLORS.text }}>{myRamMB} MB</span>
            <span className="text-sm" style={{ color: COLORS.teal }}>≈ {myRamWAX} WAX</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TreasuryWAX() {
  // Mock — from swap_config.treasury_balance in production
  const treasuryWAX = 412.5
  const capDaily = 50

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Droplets size={16} style={{ color: COLORS.teal }} />
        <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>Treasury WAX</h2>
      </div>
      <p className="text-2xl font-bold" style={{ color: COLORS.teal }}>{treasuryWAX.toLocaleString()} WAX</p>
      <p className="text-xs mt-1" style={{ color: COLORS.muted }}>Cap distribution journalier : {capDaily} WAX</p>
    </div>
  )
}

function ActiveNFTs() {
  const equippedNFTs: NFT[] = mockNFTs.filter(
    n => n.state === 'equipped' && (n.type === 'tool_faucet' || n.type === 'tool_burn' || n.type === 'profil')
  ).slice(0, 5)

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: COLORS.text }}>Equipped NFTs</h2>
      {equippedNFTs.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.muted }}>No NFTs equipped</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {equippedNFTs.map(nft => (
            <div
              key={nft.assetId}
              className="rounded-lg p-3"
              style={{ background: '#0a0a0f', border: `1px solid ${COLORS.border}` }}
            >
              <p className="text-sm font-medium truncate mb-1" style={{ color: COLORS.text }}>{nft.name}</p>
              <RarityBadge rarity={nft.rarity} />
              {nft.charges !== undefined && nft.maxCharges !== undefined && (
                <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
                  Charges: <span style={{ color: COLORS.violet }}>{nft.charges}/{nft.maxCharges}</span>
                </p>
              )}
              {nft.boostPercent !== undefined && (
                <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                  Boost: <span style={{ color: COLORS.teal }}>+{nft.boostPercent}%</span>
                </p>
              )}
              {nft.level !== undefined && (
                <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                  Lv <span style={{ color: COLORS.orange }}>{nft.level}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PendingRewards() {
  const { totalPending } = useFarming()

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>Pending Rewards</h2>
        <button className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: COLORS.violet + '22' }}>
          <RefreshCw size={14} style={{ color: COLORS.violet }} />
        </button>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Faucet', value: '12.4 ZOT', color: COLORS.violet },
          { label: 'Burn', value: '45.2 ZOT', color: COLORS.orange },
          { label: 'Farming', value: `${formatZOT(totalPending, 4)} ZOT`, color: '#22c55e' },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-sm" style={{ color: COLORS.muted }}>{item.label}</span>
            <span className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Total</span>
          <span className="text-xl font-bold" style={{ color: COLORS.orange }}>
            {formatZOT(57.6 + totalPending, 2)} ZOT
          </span>
        </div>
      </div>
    </div>
  )
}

function LeaderboardSnapshot() {
  const entries = [
    { rank: 1, emoji: '🥇', account: 'warlord.wam', value: 15420 },
    { rank: 2, emoji: '🥈', account: 'cryptoking.wam', value: 12850 },
    { rank: 3, emoji: '🥉', account: 'nftmaster.wam', value: 9340 },
  ]

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: COLORS.text }}>Leaderboard Top 3</h2>
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.rank} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="text-base">{e.emoji}</span>
              <span className="text-sm font-medium" style={{ color: COLORS.text }}>{e.account}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: COLORS.violet }}>
              {e.value.toLocaleString()} ZOT
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { account, isConnected } = useWalletStore()
  const profil = mockProfil

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen p-4 md:p-6"
      style={{ background: COLORS.bg, color: COLORS.text }}
    >
      {/* Header */}
      <div className="mb-6">
        {isConnected && account ? (
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
                Welcome back, <span style={{ color: COLORS.violet }}>{truncateAddress(account)}</span>
              </h1>
              {profil && (
                <p className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
                  {profil.name} — Level <span style={{ color: COLORS.orange }}>{profil.level}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>Dashboard</h1>
        )}
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: StatsGrid + RAM */}
        <div className="space-y-4">
          <StatsGrid />
          <RamStats />
          <TreasuryWAX />
        </div>

        {/* Centre: ActiveNFTs */}
        <div>
          <ActiveNFTs />
        </div>

        {/* Right: PendingRewards + LeaderboardSnapshot */}
        <div className="space-y-4">
          <PendingRewards />
          <LeaderboardSnapshot />
        </div>
      </div>
    </motion.div>
  )
}
