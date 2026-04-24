import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { mockExternalNFTs, mockToolBurn } from '@/services/mocks/mockNFTs'
import type { NFT, Rarity } from '@/types'

const C = {
  bg: '#0a0a0f', card: '#141420', border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed', orange: '#f97316', teal: '#0d9488',
  text: '#e2e8f0', muted: '#94a3b8',
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#6b7280', rare: '#2563eb', epic: '#7c3aed', legendary: '#d97706', mythic: '#ec4899',
}

const RARITY_BASE_ZOT: Record<Rarity, number> = {
  common: 5, rare: 20, epic: 60, legendary: 150, mythic: 400,
}

function NFTPlaceholder({ rarity, size = 100 }: { rarity: Rarity; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 8,
        background: rarity === 'mythic'
          ? 'linear-gradient(135deg, #ec4899, #7c3aed)'
          : RARITY_COLOR[rarity] + '44',
        border: `1px solid ${RARITY_COLOR[rarity]}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Flame size={size / 3} color={RARITY_COLOR[rarity]} />
    </div>
  )
}

function ConfirmModal({ nfts, reward, onConfirm, onCancel }: {
  nfts: NFT[]; reward: number; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirm Burn</h3>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
          Burn <strong style={{ color: C.orange }}>{nfts.length} NFT{nfts.length > 1 ? 's' : ''}</strong> for approximately{' '}
          <strong style={{ color: C.orange }}>~{reward.toFixed(2)} ZOT</strong>?
        </p>
        <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 20 }}>⚠ This action is irreversible.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px 0', background: C.orange, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: `0 0 20px ${C.orange}66` }}
          >
            🔥 BURN
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Toast({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, right: 24, background: C.orange, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 200, boxShadow: `0 0 24px ${C.orange}88` }}
    >
      {msg}
    </motion.div>
  )
}

export default function Burn() {
  const [nfts, setNfts] = useState<NFT[]>(mockExternalNFTs)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterRarity, setFilterRarity] = useState('all')
  const [filterCollection, setFilterCollection] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  const burnTools = mockToolBurn.filter(t => t.state === 'equipped')
  const burnBoost = burnTools[0]?.boostPercent ?? 0

  const filtered = nfts.filter(n => {
    if (filterRarity !== 'all' && n.rarity !== filterRarity) return false
    if (filterCollection !== 'all' && n.collection !== filterCollection) return false
    return true
  })

  const selectedNFTs = nfts.filter(n => selected.has(n.assetId))
  const baseReward = selectedNFTs.reduce((sum, n) => sum + RARITY_BASE_ZOT[n.rarity], 0)
  const boostReward = baseReward * (burnBoost / 100)
  const totalReward = baseReward + boostReward

  const toggle = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const handleBurn = () => {
    setNfts(prev => prev.filter(n => !selected.has(n.assetId)))
    setSelected(new Set())
    setShowModal(false)
    setToast(`+${totalReward.toFixed(2)} ZOT burned!`)
    setTimeout(() => setToast(''), 3000)
  }

  const collections = ['all', ...Array.from(new Set(nfts.map(n => n.collection)))]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', padding: '24px', background: C.bg, color: C.text }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[1fr_280px]">
        {/* Left: BurnInterface */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🔥 Burn NFTs</h1>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Select NFTs to burn and earn ZOT rewards</p>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <select
              value={filterCollection} onChange={e => setFilterCollection(e.target.value)}
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
            >
              {collections.map(c => <option key={c} value={c}>{c === 'all' ? 'All Collections' : c}</option>)}
            </select>
            <select
              value={filterRarity} onChange={e => setFilterRarity(e.target.value)}
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
            >
              {['all', 'common', 'rare', 'epic', 'legendary', 'mythic'].map(r => (
                <option key={r} value={r}>{r === 'all' ? 'All Rarities' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* NFT Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {filtered.map(nft => (
              <motion.div
                key={nft.assetId} onClick={() => toggle(nft.assetId)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  background: C.card, border: `2px solid ${selected.has(nft.assetId) ? C.orange : C.border}`,
                  borderRadius: 12, padding: 12, cursor: 'pointer',
                  boxShadow: selected.has(nft.assetId) ? `0 0 16px ${C.orange}44` : 'none',
                }}
              >
                <NFTPlaceholder rarity={nft.rarity} size={80} />
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nft.name}</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{nft.collection}</p>
                <span style={{ fontSize: 10, color: RARITY_COLOR[nft.rarity], background: RARITY_COLOR[nft.rarity] + '22', padding: '2px 6px', borderRadius: 9999, marginTop: 4, display: 'inline-block' }}>
                  {nft.rarity}
                </span>
                <p style={{ fontSize: 12, color: C.orange, marginTop: 4, fontWeight: 600 }}>~{RARITY_BASE_ZOT[nft.rarity]} ZOT</p>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <p style={{ color: C.muted, gridColumn: '1/-1', textAlign: 'center', padding: 32 }}>No NFTs to burn</p>
            )}
          </div>

          {/* OracleSimulator */}
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: C.card, border: `1px solid ${C.orange}44`, borderRadius: 12, padding: 20, marginBottom: 16 }}
            >
              <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Estimated Reward</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>Base value ({selected.size} NFT{selected.size > 1 ? 's' : ''})</span>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{baseReward.toFixed(2)} ZOT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: burnBoost > 0 ? '#22c55e' : C.muted, fontSize: 13 }}>
                    Burn Tool boost {burnBoost > 0 ? `(+${burnBoost}%)` : '(no tool)'}
                  </span>
                  <span style={{ color: burnBoost > 0 ? '#22c55e' : C.muted, fontSize: 13, fontWeight: 600 }}>+{boostReward.toFixed(2)} ZOT</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>Total</span>
                  <span style={{ color: C.orange, fontWeight: 800, fontSize: 18, textShadow: `0 0 12px ${C.orange}88` }}>{totalReward.toFixed(2)} ZOT</span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{ width: '100%', marginTop: 16, padding: '12px 0', background: C.orange, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 0 20px ${C.orange}66` }}
              >
                🔥 BURN {selected.size} NFT{selected.size > 1 ? 's' : ''}
              </button>
            </motion.div>
          )}
        </div>

        {/* Right: Tool Slots + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Burn Tool Slots */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: C.text, fontWeight: 600, marginBottom: 12 }}>Burn Tools Equipped</h3>
            {[0, 1, 2].map(i => {
              const tool = burnTools[i]
              return (
                <div key={i} style={{ background: '#0a0a0f', border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  {tool ? (
                    <>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{tool.name}</p>
                      <p style={{ color: RARITY_COLOR[tool.rarity], fontSize: 11, marginBottom: 6 }}>{tool.rarity}</p>
                      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 4 }}>
                        <div style={{ background: C.orange, height: 4, borderRadius: 4, width: `${((tool.charges ?? 0) / (tool.maxCharges ?? 1)) * 100}%` }} />
                      </div>
                      <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{tool.charges}/{tool.maxCharges} charges</p>
                    </>
                  ) : (
                    <button style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>+ Equip Tool</button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Burn History */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: C.text, fontWeight: 600, marginBottom: 12 }}>Burn History</h3>
            {[
              { name: 'Alien Worlds Shovel', reward: 5, ts: '2h ago' },
              { name: 'Splinterlands Card', reward: 23, ts: '6h ago' },
              { name: 'R-Planet Element', reward: 69, ts: '1d ago' },
              { name: 'Farming Tales Cow', reward: 5.75, ts: '2d ago' },
              { name: 'Crypto Panda', reward: 172.5, ts: '3d ago' },
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                <div>
                  <p style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>{h.name}</p>
                  <p style={{ color: C.muted, fontSize: 11 }}>{h.ts}</p>
                </div>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 13 }}>+{h.reward} ZOT</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <ConfirmModal nfts={selectedNFTs} reward={totalReward} onConfirm={handleBurn} onCancel={() => setShowModal(false)} />
        )}
        {toast && <Toast msg={toast} />}
      </AnimatePresence>
    </motion.div>
  )
}
