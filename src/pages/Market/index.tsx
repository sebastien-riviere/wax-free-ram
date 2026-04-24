import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ShoppingCart, Package, Blend, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  mythic: '#ec4899',
}

// ── Mock Data ───────────────────────────────────────────────────────────────

interface Drop {
  id: string
  name: string
  priceZOT: number
  stock: number
  totalStock: number
  expiresAt?: number
  rarity?: string
}

const MOCK_DROPS: Drop[] = [
  { id: '1', name: 'Mystic Faucet Tool', priceZOT: 150, stock: 47, totalStock: 100, expiresAt: Date.now() + 3600000 * 48, rarity: 'rare' },
  { id: '2', name: 'Inferno Burn Set', priceZOT: 280, stock: 12, totalStock: 50, rarity: 'epic' },
  { id: '3', name: 'Legendary Profil Alpha', priceZOT: 500, stock: 3, totalStock: 10, expiresAt: Date.now() + 3600000 * 6, rarity: 'legendary' },
  { id: '4', name: 'Farm Bundle Starter', priceZOT: 95, stock: 200, totalStock: 500, rarity: 'common' },
]

interface Pack {
  id: string
  name: string
  priceZOT: number
  stock: number
  guaranteedContent: string[]
}

const MOCK_PACKS: Pack[] = [
  { id: 'p1', name: 'Starter Pack', priceZOT: 50, stock: 500, guaranteedContent: ['1x Common Tool', '2x Common Farming NFT'] },
  { id: 'p2', name: 'Hunter Pack', priceZOT: 120, stock: 150, guaranteedContent: ['1x Rare Tool', '1x Rare Farming NFT', '1x Random Profil'] },
  { id: 'p3', name: 'Legend Pack', priceZOT: 350, stock: 30, guaranteedContent: ['1x Epic+ Tool', '2x Rare+ Farming', '1x Profil Gen1'] },
]

interface BlendInput {
  name: string
  count: number
  owned: number
}

interface BlendRecipe {
  id: string
  inputs: BlendInput[]
  output: { name: string; rarity: string }
  costZOT: number
}

const MOCK_BLENDS: BlendRecipe[] = [
  {
    id: 'b1',
    inputs: [{ name: 'Common Farm NFT', count: 3, owned: 3 }, { name: 'Common Tool', count: 1, owned: 1 }],
    output: { name: 'Rare Farm NFT', rarity: 'rare' },
    costZOT: 20,
  },
  {
    id: 'b2',
    inputs: [{ name: 'Rare Farm NFT', count: 3, owned: 2 }, { name: 'Rare Tool', count: 2, owned: 1 }],
    output: { name: 'Epic Farm NFT', rarity: 'epic' },
    costZOT: 50,
  },
  {
    id: 'b3',
    inputs: [{ name: 'Epic Tool', count: 2, owned: 0 }, { name: 'Epic Profil', count: 1, owned: 0 }],
    output: { name: 'Legendary Profil', rarity: 'legendary' },
    costZOT: 200,
  },
]

// ── Countdown ───────────────────────────────────────────────────────────────

function useCountdown(targetMs?: number) {
  const [remaining, setRemaining] = useState<number | null>(
    targetMs ? Math.max(0, targetMs - Date.now()) : null
  )
  useEffect(() => {
    if (!targetMs) return
    const interval = setInterval(() => {
      const r = Math.max(0, targetMs - Date.now())
      setRemaining(r)
    }, 1000)
    return () => clearInterval(interval)
  }, [targetMs])

  if (!remaining) return null
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

// ── RarityBadge ─────────────────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: string }) {
  const c = RARITY_COLORS[rarity] ?? '#94a3b8'
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: c + '22', color: c, border: `1px solid ${c}44` }}
    >
      {rarity}
    </span>
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────

function ConfirmModal({ name, price, onConfirm, onCancel }: { name: string; price: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.15 }}
        className="rounded-2xl p-6 max-w-sm w-full"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Confirm Purchase</h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:opacity-70" style={{ color: COLORS.muted }}>
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
          You're about to buy <span style={{ color: COLORS.text, fontWeight: 600 }}>{name}</span> for{' '}
          <span style={{ color: COLORS.violet, fontWeight: 700 }}>{price} ZOT</span>. Confirm?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth onClick={onConfirm}>Confirm</Button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Unboxing Modal ───────────────────────────────────────────────────────────

const PACK_RARITIES = ['common', 'rare', 'epic']
const PACK_RARITY_LABELS = ['Common Tool', 'Rare Farm NFT', 'Epic Profil']

function UnboxingModal({ packName, onClose }: { packName: string; onClose: () => void }) {
  const [revealed, setRevealed] = useState<number[]>([])

  useEffect(() => {
    const timers = [0, 1, 2].map((i) =>
      setTimeout(() => setRevealed(prev => [...prev, i]), 600 + i * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl p-6 w-full max-w-lg"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Opening {packName}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70" style={{ color: COLORS.muted }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-4 justify-center mb-6">
          {[0, 1, 2].map((i) => {
            const isRevealed = revealed.includes(i)
            const rarity = PACK_RARITIES[i]
            const rarityColor = RARITY_COLORS[rarity]
            return (
              <div key={i} className="relative" style={{ width: 120, height: 160, perspective: 600 }}>
                <motion.div
                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
                >
                  {/* Front (back of card) */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.violet}44, ${COLORS.orange}44)`,
                      border: `1px solid ${COLORS.violet}66`,
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <Package size={32} style={{ color: COLORS.violet }} />
                  </div>
                  {/* Back (revealed face) */}
                  <div
                    className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2 p-3"
                    style={{
                      background: `linear-gradient(135deg, ${rarityColor}33, ${rarityColor}11)`,
                      border: `1px solid ${rarityColor}66`,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="w-12 h-12 rounded-lg" style={{ background: rarityColor + '44' }} />
                    <span className="text-xs font-semibold text-center" style={{ color: rarityColor }}>
                      {PACK_RARITY_LABELS[i]}
                    </span>
                    <RarityBadge rarity={rarity} />
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
        {revealed.length === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button variant="primary" size="md" fullWidth onClick={onClose}>Collect</Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// ── Drop Card ────────────────────────────────────────────────────────────────

function DropCard({ drop, onBuy }: { drop: Drop; onBuy: (drop: Drop) => void }) {
  const countdown = useCountdown(drop.expiresAt)
  const stockPct = drop.stock / drop.totalStock
  const lowStock = stockPct < 0.1

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      {/* Image placeholder */}
      <div
        className="h-36 w-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${RARITY_COLORS[drop.rarity ?? 'common']}33, ${RARITY_COLORS[drop.rarity ?? 'common']}11)`,
        }}
      >
        <div
          className="w-16 h-16 rounded-full"
          style={{ background: RARITY_COLORS[drop.rarity ?? 'common'] + '55', boxShadow: `0 0 20px ${RARITY_COLORS[drop.rarity ?? 'common']}66` }}
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight" style={{ color: COLORS.text }}>{drop.name}</p>
          {drop.rarity && <RarityBadge rarity={drop.rarity} />}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: lowStock ? '#dc262622' : COLORS.violet + '22',
              color: lowStock ? '#ef4444' : COLORS.muted,
              border: `1px solid ${lowStock ? '#ef444444' : COLORS.border}`,
            }}
          >
            {drop.stock} left
          </span>
          {countdown && (
            <span className="flex items-center gap-1 text-xs" style={{ color: COLORS.orange }}>
              <Clock size={11} />
              {countdown}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: COLORS.violet }}>{drop.priceZOT} ZOT</span>
          <Button variant="primary" size="sm" onClick={() => onBuy(drop)}>BUY</Button>
        </div>
      </div>
    </div>
  )
}

// ── Pack Card ────────────────────────────────────────────────────────────────

function PackCard({ pack, onOpen }: { pack: Pack; onOpen: (pack: Pack) => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      {/* Animated gradient */}
      <div className="h-32 w-full relative overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{
            background: `linear-gradient(135deg, ${COLORS.violet}55, ${COLORS.orange}55, ${COLORS.teal}55)`,
            backgroundSize: '200% 200%',
          }}
        />
        <Package size={40} className="relative z-10" style={{ color: '#fff', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-base font-bold" style={{ color: COLORS.text }}>{pack.name}</p>
        <ul className="space-y-1">
          {pack.guaranteedContent.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs" style={{ color: COLORS.muted }}>
              <Check size={12} style={{ color: COLORS.teal, flexShrink: 0 }} />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <span className="text-base font-bold" style={{ color: COLORS.violet }}>{pack.priceZOT} ZOT</span>
            <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>{pack.stock} in stock</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => onOpen(pack)}>OPEN PACK</Button>
        </div>
      </div>
    </div>
  )
}

// ── Blend Card ───────────────────────────────────────────────────────────────

function BlendCard({ recipe }: { recipe: BlendRecipe }) {
  const canBlend = recipe.inputs.every(inp => inp.owned >= inp.count)

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-4"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Inputs */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {recipe.inputs.map((inp, i) => {
            const ok = inp.owned >= inp.count
            return (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {ok ? (
                    <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                  ) : (
                    <X size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                  )}
                  <span className="text-xs truncate" style={{ color: ok ? COLORS.text : COLORS.muted }}>
                    {inp.count}x {inp.name}
                  </span>
                </div>
                <span className="text-xs shrink-0" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
                  {inp.owned}/{inp.count}
                </span>
              </div>
            )
          })}
          {!canBlend && (
            <a
              href="https://wax.atomichub.io/market"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: COLORS.teal }}
            >
              <ExternalLink size={11} />
              Buy on AtomicHub
            </a>
          )}
        </div>

        {/* Arrow */}
        <div className="text-xl font-bold shrink-0" style={{ color: COLORS.muted }}>→</div>

        {/* Output */}
        <div
          className="rounded-xl p-3 flex flex-col items-center gap-2 shrink-0"
          style={{
            background: RARITY_COLORS[recipe.output.rarity] + '11',
            border: `1px solid ${RARITY_COLORS[recipe.output.rarity]}33`,
            minWidth: 90,
          }}
        >
          <div
            className="w-10 h-10 rounded-lg"
            style={{ background: RARITY_COLORS[recipe.output.rarity] + '44' }}
          />
          <span className="text-xs font-semibold text-center" style={{ color: COLORS.text }}>{recipe.output.name}</span>
          <RarityBadge rarity={recipe.output.rarity} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <span className="text-sm" style={{ color: COLORS.muted }}>
          Cost: <span style={{ color: COLORS.violet, fontWeight: 700 }}>{recipe.costZOT} ZOT</span>
        </span>
        <Button variant={canBlend ? 'primary' : 'secondary'} size="sm" disabled={!canBlend}>
          <Blend size={13} />
          BLEND
        </Button>
      </div>
    </div>
  )
}

// ── Tab Bar ──────────────────────────────────────────────────────────────────

type Tab = 'drops' | 'packs' | 'blend'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'drops', label: 'Drops', icon: ShoppingCart },
  { id: 'packs', label: 'Packs', icon: Package },
  { id: 'blend', label: 'Blend', icon: Blend },
]

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Market() {
  const [activeTab, setActiveTab] = useState<Tab>('drops')
  const [confirmDrop, setConfirmDrop] = useState<Drop | null>(null)
  const [openingPack, setOpeningPack] = useState<Pack | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen p-4 md:p-6"
      style={{ background: COLORS.bg, color: COLORS.text }}
    >
      <h1 className="text-xl font-bold mb-5" style={{ color: COLORS.text }}>Market</h1>

      {/* Tab navigation */}
      <div
        className="flex gap-0 mb-6 rounded-xl overflow-hidden"
        style={{ border: `1px solid ${COLORS.border}`, background: COLORS.card }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all relative"
              style={{
                background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: isActive ? '#a78bfa' : COLORS.muted,
                borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'drops' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MOCK_DROPS.map(drop => (
                <DropCard key={drop.id} drop={drop} onBuy={setConfirmDrop} />
              ))}
            </div>
          )}

          {activeTab === 'packs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PACKS.map(pack => (
                <PackCard key={pack.id} pack={pack} onOpen={setOpeningPack} />
              ))}
            </div>
          )}

          {activeTab === 'blend' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MOCK_BLENDS.map(recipe => (
                <BlendCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {confirmDrop && (
          <ConfirmModal
            key="confirm"
            name={confirmDrop.name}
            price={confirmDrop.priceZOT}
            onConfirm={() => setConfirmDrop(null)}
            onCancel={() => setConfirmDrop(null)}
          />
        )}
        {openingPack && (
          <UnboxingModal
            key="unbox"
            packName={openingPack.name}
            onClose={() => setOpeningPack(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
