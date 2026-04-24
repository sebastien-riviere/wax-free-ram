import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sprout, X, Info } from 'lucide-react'
import { useFarming } from '@/hooks/useFarming'
import type { NFT, Rarity } from '@/types'

const C = {
  bg: '#0a0a0f', card: '#141420', border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed', orange: '#f97316', teal: '#0d9488',
  text: '#e2e8f0', muted: '#94a3b8',
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#6b7280', rare: '#2563eb', epic: '#7c3aed', legendary: '#d97706', mythic: '#ec4899',
}

// Daily rates per brief v4 (ZOT/j base, no profile boost)
const DAILY_RATES: Record<string, number> = {
  common: 5, rare: 15, epic: 40, legendary: 100, mythic: 280,
}

// Withdrawal fee by stake duration (anti-bot mechanism)
const FEE_TIERS = [
  { label: '< 24h', fee: '20%', color: '#ef4444', note: 'Anti-bot' },
  { label: '24h – 7j', fee: '10%', color: C.orange, note: 'Standard' },
  { label: '7j – 30j', fee: '5%', color: '#eab308', note: 'Fidélité' },
  { label: '> 30j', fee: '2%', color: '#22c55e', note: 'Long terme' },
]

function NFTPlaceholder({ rarity }: { rarity: Rarity }) {
  return (
    <div style={{
      width: '100%', height: 120, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: rarity === 'mythic' ? 'linear-gradient(135deg, #ec4899, #7c3aed)' : RARITY_COLOR[rarity] + '33',
      border: `1px solid ${RARITY_COLOR[rarity]}55`,
    }}>
      <Sprout size={32} color={RARITY_COLOR[rarity]} />
    </div>
  )
}

function StakeModal({ nft, onConfirm, onCancel }: { nft: NFT; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, maxWidth: 380, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: C.text, fontWeight: 700, fontSize: 18 }}>Stake NFT</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
        </div>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>{nft.name}</p>
        <div style={{ background: '#0a0a0f', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Daily Rate</span>
            <span style={{ color: C.teal, fontWeight: 700 }}>{DAILY_RATES[nft.rarity]} ZOT/day</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Rarity</span>
            <span style={{ color: RARITY_COLOR[nft.rarity], fontWeight: 600, textTransform: 'capitalize' }}>{nft.rarity}</span>
          </div>
        </div>
        <div style={{ background: C.orange + '11', border: `1px solid ${C.orange}33`, borderRadius: 8, padding: 10, marginBottom: 20 }}>
          <p style={{ color: C.orange, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>⚠ Fee de retrait selon durée</p>
          <p style={{ color: C.muted, fontSize: 11 }}>Unstake &lt; 24h → 20% fee · &gt; 30j → 2% fee</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', background: C.teal, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 16px ${C.teal}66` }}>Stake</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function UnstakeModal({ nft, pending, onConfirm, onCancel }: { nft: NFT; pending: number; onConfirm: () => void; onCancel: () => void }) {
  // Mock: assume staked > 7j for demo
  const feePct = 5
  const feeAmount = pending * (feePct / 100)
  const netReward = pending - feeAmount

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, maxWidth: 380, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: C.text, fontWeight: 700, fontSize: 18 }}>Unstake NFT</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
        </div>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>{nft.name}</p>
        <div style={{ background: '#0a0a0f', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Pending brut</span>
            <span style={{ color: C.text, fontWeight: 600 }}>{pending.toFixed(4)} ZOT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.orange, fontSize: 13 }}>Fee retrait (7–30j = {feePct}%)</span>
            <span style={{ color: C.orange, fontWeight: 600 }}>−{feeAmount.toFixed(4)} ZOT</span>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.teal, fontWeight: 700 }}>Net reçu</span>
            <span style={{ color: C.teal, fontWeight: 800, fontSize: 15 }}>{netReward.toFixed(4)} ZOT</span>
          </div>
        </div>
        <p style={{ color: '#22c55e', fontSize: 12, marginBottom: 20 }}>✓ Cooldown complete — ready to unstake</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', background: '#6b7280', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Unstake</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Farming() {
  const { staked, available, pendingRewards, totalPending, isLoading, stake, unstake, claimAll } = useFarming()
  const [stakeTarget, setStakeTarget] = useState<NFT | null>(null)
  const [unstakeTarget, setUnstakeTarget] = useState<NFT | null>(null)
  const [showFeeInfo, setShowFeeInfo] = useState(false)

  const totalDailyRate = staked.reduce((s, n) => s + (DAILY_RATES[n.rarity] ?? 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', padding: '24px', background: C.bg, color: C.text }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>🌱 Farming</h1>
          <p style={{ color: C.teal, fontWeight: 700, fontSize: 16, marginTop: 4 }}>
            {totalDailyRate} ZOT/day
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: C.muted, fontSize: 12 }}>Total Pending</p>
            <p style={{ color: C.teal, fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
              {totalPending.toFixed(4)} ZOT
            </p>
          </div>
          <button
            onClick={claimAll} disabled={isLoading || staked.length === 0}
            style={{
              padding: '10px 20px', background: C.teal, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, cursor: staked.length === 0 ? 'not-allowed' : 'pointer',
              opacity: staked.length === 0 ? 0.4 : 1, boxShadow: staked.length > 0 ? `0 0 20px ${C.teal}66` : 'none',
            }}
          >
            {isLoading ? '...' : 'CLAIM ALL'}
          </button>
        </div>
      </div>

      {/* Daily Rate Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h3 style={{ color: C.text, fontWeight: 600, marginBottom: 12 }}>Daily Rates by Rarity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {Object.entries(DAILY_RATES).map(([rarity, rate]) => (
            <div key={rarity} style={{ textAlign: 'center', background: '#0a0a0f', borderRadius: 8, padding: '8px 4px', border: `1px solid ${RARITY_COLOR[rarity as Rarity]}33` }}>
              <p style={{ color: RARITY_COLOR[rarity as Rarity], fontSize: 11, fontWeight: 600, textTransform: 'capitalize', marginBottom: 2 }}>{rarity}</p>
              <p style={{ color: C.teal, fontWeight: 800, fontSize: 14 }}>{rate}</p>
              <p style={{ color: C.muted, fontSize: 10 }}>ZOT/d</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Structure */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: C.text, fontWeight: 600 }}>Fee de retrait (pondéré par durée)</h3>
          <button
            onClick={() => setShowFeeInfo(!showFeeInfo)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}
          >
            <Info size={15} />
          </button>
        </div>
        {showFeeInfo && (
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 12, background: '#0a0a0f', borderRadius: 8, padding: 10 }}>
            Les fees de retrait sont prélevés sur la récompense au moment du unstake. Ils sont brûlés (sink ZOT permanent). Plus tu stakes longtemps, moins tu paies.
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {FEE_TIERS.map(tier => (
            <div key={tier.label} style={{ textAlign: 'center', background: '#0a0a0f', borderRadius: 8, padding: '10px 6px', border: `1px solid ${tier.color}33` }}>
              <p style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>{tier.label}</p>
              <p style={{ color: tier.color, fontWeight: 800, fontSize: 18 }}>{tier.fee}</p>
              <p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{tier.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staked NFTs */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Staked NFTs</h2>
      {staked.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 24 }}>
          <Sprout size={32} color={C.muted} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: C.muted }}>No NFTs staked yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {staked.map(nft => (
            <motion.div
              key={nft.assetId} layout
              style={{ background: C.card, border: `1px solid ${RARITY_COLOR[nft.rarity]}44`, borderRadius: 12, overflow: 'hidden' }}
            >
              <NFTPlaceholder rarity={nft.rarity} />
              <div style={{ padding: 12 }}>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nft.name}</p>
                <p style={{ color: RARITY_COLOR[nft.rarity], fontSize: 11, marginBottom: 8, textTransform: 'capitalize' }}>{nft.rarity}</p>
                <div style={{ background: '#0a0a0f', borderRadius: 6, padding: 8, marginBottom: 10 }}>
                  <p style={{ color: C.muted, fontSize: 10 }}>Pending</p>
                  <p style={{ color: C.teal, fontWeight: 800, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                    {(pendingRewards[nft.assetId] ?? 0).toFixed(4)} ZOT
                  </p>
                  <p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{DAILY_RATES[nft.rarity]} ZOT/day</p>
                </div>
                <button
                  onClick={() => setUnstakeTarget(nft)}
                  style={{ width: '100%', padding: '7px 0', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', fontSize: 12 }}
                >
                  Unstake
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Available to Stake */}
      {available.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Available to Stake</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {available.map(nft => (
              <motion.div
                key={nft.assetId} layout
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}
              >
                <NFTPlaceholder rarity={nft.rarity} />
                <div style={{ padding: 12 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nft.name}</p>
                  <p style={{ color: RARITY_COLOR[nft.rarity], fontSize: 11, marginBottom: 8, textTransform: 'capitalize' }}>{nft.rarity}</p>
                  <p style={{ color: C.teal, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{DAILY_RATES[nft.rarity]} ZOT/day</p>
                  <button
                    onClick={() => setStakeTarget(nft)}
                    style={{ width: '100%', padding: '7px 0', background: C.teal, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12, boxShadow: `0 0 12px ${C.teal}44` }}
                  >
                    Stake
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {stakeTarget && (
          <StakeModal
            nft={stakeTarget}
            onConfirm={() => { stake(stakeTarget.assetId); setStakeTarget(null) }}
            onCancel={() => setStakeTarget(null)}
          />
        )}
        {unstakeTarget && (
          <UnstakeModal
            nft={unstakeTarget}
            pending={pendingRewards[unstakeTarget.assetId] ?? 0}
            onConfirm={() => { unstake(unstakeTarget.assetId); setUnstakeTarget(null) }}
            onCancel={() => setUnstakeTarget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
