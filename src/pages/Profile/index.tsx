import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Droplets, Sprout, Trophy, Package, ShoppingBag, ExternalLink, User } from 'lucide-react'
import { mockProfil, mockNFTs } from '@/services/mocks/mockNFTs'
import type { Rarity } from '@/types'

const C = {
  bg: '#0a0a0f', card: '#141420', border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed', orange: '#f97316', teal: '#0d9488',
  text: '#e2e8f0', muted: '#94a3b8',
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#6b7280', rare: '#2563eb', epic: '#7c3aed', legendary: '#d97706', mythic: '#ec4899',
}

const XP_FOR_NEXT = 3000
const CURRENT_XP = 2400
const CURRENT_LEVEL = 3

const BADGES = [
  { name: 'First Burn', icon: Flame, earned: true, color: C.orange },
  { name: '100 Claims', icon: Droplets, earned: true, color: C.violet },
  { name: 'Farmer', icon: Sprout, earned: true, color: '#22c55e' },
  { name: 'Legend', icon: Trophy, earned: false, color: C.orange },
  { name: 'Collector', icon: Package, earned: false, color: C.teal },
  { name: 'Market Maker', icon: ShoppingBag, earned: false, color: '#a855f7' },
]

const RANK_TITLES: Record<number, string> = {
  1: 'Initiate', 2: 'Seeker', 3: 'Apprentice', 4: 'Adept', 5: 'Expert',
}

export default function Profile() {
  const profil = mockProfil
  const allProfils = mockNFTs.filter(n => n.type === 'profil')
  const [equippedId, setEquippedId] = useState(profil?.assetId ?? null)
  const xpPercent = (CURRENT_XP / XP_FOR_NEXT) * 100
  const equippedProfil = allProfils.find(n => n.assetId === equippedId) ?? profil

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', padding: '24px', background: C.bg, color: C.text, display: 'flex', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={24} color={C.violet} /> Profile
        </h1>

        {/* ProfileNFT */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20, textAlign: 'center' }}>
          {equippedProfil ? (
            <>
              <div style={{
                width: 160, height: 160, borderRadius: 16, margin: '0 auto 16px',
                background: `linear-gradient(135deg, ${RARITY_COLOR[equippedProfil.rarity]}66, ${RARITY_COLOR[equippedProfil.rarity]}22)`,
                border: `2px solid ${RARITY_COLOR[equippedProfil.rarity]}88`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${RARITY_COLOR[equippedProfil.rarity]}44`,
              }}>
                <User size={60} color={RARITY_COLOR[equippedProfil.rarity]} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{equippedProfil.name}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, textTransform: 'capitalize',
                  background: RARITY_COLOR[equippedProfil.rarity] + '22', color: RARITY_COLOR[equippedProfil.rarity], border: `1px solid ${RARITY_COLOR[equippedProfil.rarity]}44`,
                }}>
                  {equippedProfil.rarity}
                </span>
                {equippedProfil.profilBoost && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, background: C.teal + '22', color: C.teal, border: `1px solid ${C.teal}44` }}>
                    +{(equippedProfil.profilBoost * 100).toFixed(0)}% boost
                  </span>
                )}
              </div>
              <p style={{ color: C.muted, fontSize: 12 }}>{equippedProfil.collection}</p>
            </>
          ) : (
            <>
              <div style={{ width: 160, height: 160, borderRadius: 16, margin: '0 auto 16px', background: '#1a1a28', border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={48} color={C.muted} />
              </div>
              <p style={{ color: C.muted, marginBottom: 16 }}>No Profile Equipped</p>
              <a href="https://neftyblocks.com" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.violet, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Buy on NeftyBlocks <ExternalLink size={14} />
              </a>
            </>
          )}
        </div>

        {/* XP Progress */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Level {CURRENT_LEVEL}</h3>
              <p style={{ color: C.muted, fontSize: 13 }}>{RANK_TITLES[CURRENT_LEVEL] ?? 'Adept'}</p>
            </div>
            <span style={{ background: C.violet + '22', color: '#a855f7', border: `1px solid ${C.violet}44`, padding: '4px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 13 }}>
              Lv {CURRENT_LEVEL}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 8, marginBottom: 8 }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 0.8, delay: 0.2 }}
              style={{ height: 8, borderRadius: 8, background: `linear-gradient(90deg, ${C.violet}, #a855f7)`, boxShadow: `0 0 8px ${C.violet}88` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted }}>
            <span>{CURRENT_XP.toLocaleString()} XP</span>
            <span>{(XP_FOR_NEXT - CURRENT_XP).toLocaleString()} XP to Level {CURRENT_LEVEL + 1}</span>
          </div>
        </div>

        {/* Badges */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Badges</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {BADGES.map(({ name, icon: Icon, earned, color }) => (
              <div
                key={name}
                style={{
                  background: '#0a0a0f', borderRadius: 10, padding: 16, textAlign: 'center',
                  border: `1px solid ${earned ? color + '44' : C.border}`,
                  opacity: earned ? 1 : 0.4,
                  boxShadow: earned ? `0 0 12px ${color}22` : 'none',
                }}
              >
                <Icon size={28} color={earned ? color : C.muted} style={{ margin: '0 auto 8px' }} />
                <p style={{ color: earned ? C.text : C.muted, fontSize: 11, fontWeight: 600 }}>{name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Button */}
        <a
          href="https://neftyblocks.com" target="_blank" rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '12px 0', background: 'transparent',
            border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
            fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 20,
          }}
        >
          Upgrade Profile on NeftyBlocks <ExternalLink size={14} color={C.muted} />
        </a>

        {/* Change Profile */}
        {allProfils.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Change Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allProfils.map(p => (
                <button
                  key={p.assetId}
                  onClick={() => setEquippedId(p.assetId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                    background: equippedId === p.assetId ? C.violet + '22' : '#0a0a0f',
                    border: `1px solid ${equippedId === p.assetId ? C.violet : C.border}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: RARITY_COLOR[p.rarity] + '44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color={RARITY_COLOR[p.rarity]} />
                  </div>
                  <div>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                    <p style={{ color: RARITY_COLOR[p.rarity], fontSize: 11, textTransform: 'capitalize' }}>{p.rarity}</p>
                  </div>
                  {equippedId === p.assetId && (
                    <span style={{ marginLeft: 'auto', color: C.violet, fontSize: 12, fontWeight: 700 }}>Equipped</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
