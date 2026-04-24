import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock } from 'lucide-react'
import { mockNFTs } from '@/services/mocks/mockNFTs'

const COLORS = {
  bg: '#0a0a0f',
  card: '#141420',
  border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed',
  orange: '#f97316',
  teal: '#0d9488',
  text: '#e2e8f0',
  muted: '#94a3b8',
}

// Mock: 2h30 restantes sur 6h cooldown
const TOTAL_COOLDOWN = 6 * 3600 // 6h en secondes
const REMAINING = 2.5 * 3600    // 2h30
const PERCENT_REMAINING = REMAINING / TOTAL_COOLDOWN // 0.375 (37.5%)
const IS_AVAILABLE = false

function CooldownDisplay() {
  const size = 200
  const strokeWidth = 10
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  // Stroke-dashoffset: 0 = full, circumference = empty
  // On veut montrer le temps écoulé (62.5%) donc offset = remaining%
  const dashOffset = circumference * PERCENT_REMAINING

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={IS_AVAILABLE ? COLORS.violet : '#475569'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={20} style={{ color: IS_AVAILABLE ? COLORS.violet : COLORS.muted }} />
          <span className="text-2xl font-bold mt-1" style={{ color: IS_AVAILABLE ? COLORS.violet : COLORS.text }}>
            2h 30m
          </span>
          <span className="text-xs" style={{ color: COLORS.muted }}>
            {IS_AVAILABLE ? 'Ready!' : 'Cooldown'}
          </span>
        </div>
      </div>
    </div>
  )
}

function RewardPreview() {
  const equippedFaucet = mockNFTs.find(n => n.type === 'tool_faucet' && n.state === 'equipped')
  const equippedProfil = mockNFTs.find(n => n.type === 'profil' && n.state === 'equipped')
  const faucetBoost = equippedFaucet && (equippedFaucet.charges ?? 0) > 0 ? 1.0 : 0
  const profilBoost = equippedProfil ? 1.5 : 0
  const base = 10
  const total = base + faucetBoost + profilBoost

  const rows = [
    {
      label: 'Base reward',
      value: `${base} ZOT`,
      icon: null,
      color: COLORS.text,
    },
    {
      label: equippedFaucet
        ? `${equippedFaucet.name} (+${equippedFaucet.boostPercent}%)`
        : 'No Faucet Tool',
      value: faucetBoost > 0 ? `+${faucetBoost} ZOT` : '+0 ZOT',
      icon: '🔧',
      color: (equippedFaucet && (equippedFaucet.charges ?? 0) > 0) ? '#22c55e' : COLORS.muted,
    },
    {
      label: equippedProfil ? `${equippedProfil.name} (+15%)` : 'No Profil',
      value: profilBoost > 0 ? `+${profilBoost} ZOT` : '+0 ZOT',
      icon: '👤',
      color: profilBoost > 0 ? COLORS.teal : COLORS.muted,
    },
  ]

  return (
    <div className="rounded-xl p-4 w-full" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.muted }}>Expected Reward</h3>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm flex items-center gap-1.5" style={{ color: COLORS.muted }}>
              {row.icon && <span>{row.icon}</span>}
              {row.label}
            </span>
            <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <span className="text-sm font-bold" style={{ color: COLORS.text }}>Total</span>
        <span className="text-xl font-bold" style={{ color: COLORS.orange }}>{total} ZOT</span>
      </div>
    </div>
  )
}

const LOOT_HISTORY = [
  { id: 1, ago: 'Il y a 6h', amount: 12.5, drop: { name: 'Common Tool', rarity: 'common' } },
  { id: 2, ago: 'Il y a 12h', amount: 11.0, drop: null },
  { id: 3, ago: 'Il y a 18h', amount: 18.5, drop: { name: 'Rare Faucet', rarity: 'rare' } },
  { id: 4, ago: 'Il y a 24h', amount: 10.0, drop: null },
  { id: 5, ago: 'Il y a 30h', amount: 13.5, drop: null },
]

function LootHistory() {
  return (
    <div className="rounded-xl p-4 w-full" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.muted }}>Recent Claims</h3>
      <div className="space-y-2">
        {LOOT_HISTORY.map(entry => (
          <div key={entry.id} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: COLORS.muted }}>{entry.ago}</span>
            </div>
            <div className="flex items-center gap-3">
              {entry.drop ? (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#3b82f622', color: '#3b82f6' }}>
                  🎁 {entry.drop.name}
                </span>
              ) : (
                <span className="text-xs" style={{ color: COLORS.muted }}>—</span>
              )}
              <span className="text-sm font-semibold" style={{ color: COLORS.violet }}>+{entry.amount} ZOT</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToolFaucetSlots() {
  const tools = mockNFTs.filter(n => n.type === 'tool_faucet' && n.state === 'equipped')

  if (tools.length === 0) return null

  return (
    <div className="rounded-xl p-4 w-full" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.muted }}>Tool Faucet Equipped</h3>
      <div className="space-y-3">
        {tools.map(tool => {
          const pct = ((tool.charges ?? 0) / (tool.maxCharges ?? 1)) * 100
          return (
            <div key={tool.assetId}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>{tool.name}</span>
                <span className="text-xs" style={{ color: COLORS.muted }}>{tool.charges}/{tool.maxCharges}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: COLORS.violet }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={() => setTimeout(onDone, 2000)}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg"
      style={{ background: COLORS.violet, color: '#fff' }}
    >
      {message}
    </motion.div>
  )
}

export default function Faucet() {
  const [toast, setToast] = useState<string | null>(null)

  const handleClaim = () => {
    if (!IS_AVAILABLE) return
    setToast('Claimed! +18.5 ZOT')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen p-4 md:p-6"
      style={{ background: COLORS.bg }}
    >
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>ZOT Faucet</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>Claim your free ZOT every 6 hours</p>
        </div>

        {/* Cooldown + Claim */}
        <div className="flex flex-col items-center gap-6">
          <CooldownDisplay />

          {/* Claim button */}
          {IS_AVAILABLE ? (
            <motion.button
              onClick={handleClaim}
              animate={{ boxShadow: ['0 0 0px #7c3aed', '0 0 24px #7c3aed88', '0 0 0px #7c3aed'] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-10 py-4 rounded-xl text-lg font-bold cursor-pointer"
              style={{ background: COLORS.violet, color: '#fff' }}
            >
              <div className="flex items-center gap-2">
                <Zap size={20} />
                CLAIM ZOT
              </div>
            </motion.button>
          ) : (
            <button
              disabled
              className="px-10 py-4 rounded-xl text-lg font-bold cursor-not-allowed opacity-40"
              style={{ background: '#334155', color: COLORS.muted }}
            >
              <div className="flex items-center gap-2">
                <Clock size={20} />
                CLAIM ZOT
              </div>
            </button>
          )}
        </div>

        {/* Tool Faucet Slots */}
        <ToolFaucetSlots />

        {/* Reward Preview */}
        <RewardPreview />

        {/* Loot History */}
        <LootHistory />
      </div>
    </motion.div>
  )
}
