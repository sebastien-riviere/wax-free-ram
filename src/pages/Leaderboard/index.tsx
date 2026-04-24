import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Database } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import { truncateAddress } from '@/lib/utils'

const C = {
  bg: '#0a0a0f', card: '#141420', border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed', orange: '#f97316', teal: '#0d9488',
  text: '#e2e8f0', muted: '#94a3b8', green: '#22c55e',
}

type Tab = 'ram' | 'faucet' | 'burn' | 'farming' | 'xp' | 'collection'

const MOCK_DATA: Record<Tab, Array<{ rank: number; account: string; value: number; delta: number }>> = {
  ram: [
    { rank: 1, account: 'burnlord.wam', value: 4820, delta: 640 },
    { rank: 2, account: 'warlord.wam', value: 3910, delta: 320 },
    { rank: 3, account: 'nftmaster.wam', value: 3100, delta: -80 },
    { rank: 4, account: 'cryptoking.wam', value: 2540, delta: 110 },
    { rank: 5, account: 'zothunter.wam', value: 1980, delta: 250 },
    { rank: 6, account: 'mockuser.wam', value: 960, delta: 45 },
    { rank: 7, account: 'galaxybot.wam', value: 720, delta: 30 },
    { rank: 8, account: 'zenmaster.wam', value: 540, delta: -20 },
    { rank: 9, account: 'stellar.wam', value: 380, delta: 60 },
    { rank: 10, account: 'newbie.wam', value: 192, delta: 192 },
  ],
  faucet: [
    { rank: 1, account: 'warlord.wam', value: 15420, delta: 320 },
    { rank: 2, account: 'cryptoking.wam', value: 12850, delta: -50 },
    { rank: 3, account: 'nftmaster.wam', value: 9340, delta: 150 },
    { rank: 4, account: 'zothunter.wam', value: 7890, delta: 80 },
    { rank: 5, account: 'burnlord.wam', value: 6540, delta: -120 },
    { rank: 6, account: 'mockuser.wam', value: 1250, delta: 45 },
    { rank: 7, account: 'galaxybot.wam', value: 980, delta: 12 },
    { rank: 8, account: 'zenmaster.wam', value: 720, delta: -30 },
    { rank: 9, account: 'stellar.wam', value: 540, delta: 60 },
    { rank: 10, account: 'newbie.wam', value: 320, delta: 90 },
  ],
  burn: [
    { rank: 1, account: 'burnlord.wam', value: 45200, delta: 5000 },
    { rank: 2, account: 'cryptoking.wam', value: 38400, delta: -800 },
    { rank: 3, account: 'warlord.wam', value: 29100, delta: 1200 },
    { rank: 4, account: 'nftmaster.wam', value: 22500, delta: 300 },
    { rank: 5, account: 'zothunter.wam', value: 18700, delta: -200 },
    { rank: 6, account: 'mockuser.wam', value: 342, delta: 50 },
    { rank: 7, account: 'galaxybot.wam', value: 280, delta: 20 },
    { rank: 8, account: 'zenmaster.wam', value: 210, delta: -60 },
    { rank: 9, account: 'stellar.wam', value: 150, delta: 40 },
    { rank: 10, account: 'newbie.wam', value: 80, delta: 80 },
  ],
  farming: [
    { rank: 1, account: 'stellar.wam', value: 28400, delta: 2800 },
    { rank: 2, account: 'nftmaster.wam', value: 22100, delta: 1500 },
    { rank: 3, account: 'zothunter.wam', value: 17600, delta: 900 },
    { rank: 4, account: 'warlord.wam', value: 13200, delta: -300 },
    { rank: 5, account: 'burnlord.wam', value: 9800, delta: 400 },
    { rank: 6, account: 'mockuser.wam', value: 2100, delta: 150 },
    { rank: 7, account: 'galaxybot.wam', value: 1540, delta: 80 },
    { rank: 8, account: 'zenmaster.wam', value: 980, delta: -40 },
    { rank: 9, account: 'cryptoking.wam', value: 620, delta: 90 },
    { rank: 10, account: 'newbie.wam', value: 280, delta: 280 },
  ],
  xp: [
    { rank: 1, account: 'zenmaster.wam', value: 48500, delta: 2100 },
    { rank: 2, account: 'warlord.wam', value: 42300, delta: 800 },
    { rank: 3, account: 'nftmaster.wam', value: 35700, delta: -400 },
    { rank: 4, account: 'cryptoking.wam', value: 28900, delta: 600 },
    { rank: 5, account: 'burnlord.wam', value: 22100, delta: 300 },
    { rank: 6, account: 'mockuser.wam', value: 2400, delta: 200 },
    { rank: 7, account: 'galaxybot.wam', value: 1800, delta: 150 },
    { rank: 8, account: 'zothunter.wam', value: 1200, delta: -80 },
    { rank: 9, account: 'stellar.wam', value: 800, delta: 120 },
    { rank: 10, account: 'newbie.wam', value: 400, delta: 400 },
  ],
  collection: [
    { rank: 1, account: 'alienworlds', value: 124500, delta: 8200 },
    { rank: 2, account: 'splinterlands', value: 98400, delta: -1200 },
    { rank: 3, account: 'farmingstales', value: 76200, delta: 3400 },
    { rank: 4, account: 'cryptopandas', value: 54100, delta: 900 },
    { rank: 5, account: 'rplanet', value: 41800, delta: -500 },
    { rank: 6, account: 'nftpanda', value: 12300, delta: 1100 },
    { rank: 7, account: 'collectibles', value: 8700, delta: 400 },
    { rank: 8, account: 'waxstickers', value: 5400, delta: 200 },
    { rank: 9, account: 'pixelheroes', value: 3200, delta: 150 },
    { rank: 10, account: 'waxcomics', value: 1800, delta: 800 },
  ],
}

const LABELS: Record<Tab, string> = {
  ram: '🔩 RAM Warriors',
  faucet: 'Faucet Claims',
  burn: 'Burn Value',
  farming: 'Farming Yield',
  xp: 'XP Profil',
  collection: 'Collection Volume',
}

const UNIT: Record<Tab, string> = {
  ram: 'KB',
  faucet: 'ZOT',
  burn: 'ZOT',
  farming: 'ZOT',
  xp: 'XP',
  collection: 'ZOT',
}

// Monthly rewards per leaderboard tab (from leaderboard_config, paid from réserve écosystème)
const REWARDS: Record<Tab, { top1: string; top25: string; top620: string }> = {
  ram: { top1: 'NFT Légendaire + WAX', top25: 'NFT Epic + ZOT', top620: 'ZOT' },
  faucet: { top1: 'NFT Rare + ZOT', top25: 'ZOT', top620: 'ZOT' },
  burn: { top1: 'NFT Epic + ZOT', top25: 'NFT Rare + ZOT', top620: 'ZOT' },
  farming: { top1: 'NFT Epic + ZOT', top25: 'NFT Rare + ZOT', top620: 'ZOT' },
  xp: { top1: 'NFT Epic + ZOT', top25: 'ZOT', top620: 'ZOT' },
  collection: { top1: 'ZOT', top25: 'ZOT', top620: 'ZOT' },
}

const PODIUM_COLORS = ['#f59e0b', '#9ca3af', '#b45309']

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs - Date.now())
  useEffect(() => {
    const iv = setInterval(() => setRemaining(targetMs - Date.now()), 1000)
    return () => clearInterval(iv)
  }, [targetMs])
  const s = Math.max(0, Math.floor(remaining / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${d}j ${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`
}

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('ram')
  const { account } = useWalletStore()
  const data = MOCK_DATA[tab]
  const top3 = data.slice(0, 3)
  const podiumOrder = [top3[1], top3[0], top3[2]] // 2nd, 1st, 3rd
  const podiumHeights = [96, 128, 80]
  // Monthly reset — first day of next month
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const countdown = useCountdown(nextMonth.getTime())
  const rewards = REWARDS[tab]

  const tabs = Object.keys(LABELS) as Tab[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', padding: '24px', background: C.bg, color: C.text }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Trophy size={28} color={C.orange} />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Leaderboard</h1>
          <p style={{ color: C.muted, fontSize: 13 }}>Reset mensuel — distributions WAX + ZOT + NFT</p>
        </div>
      </div>

      {/* Tabs — 2 rows on mobile */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t} onClick={() => setTab(t)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: tab === t ? C.violet + '33' : C.card,
              color: tab === t ? '#a855f7' : C.muted,
              borderBottom: tab === t ? `2px solid ${C.violet}` : `2px solid transparent`,
            }}
          >
            {t === 'ram' ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Database size={11} />RAM Warriors</span> : LABELS[t]}
          </button>
        ))}
      </div>

      {/* Monthly Rewards Banner */}
      <div style={{ background: C.violet + '18', border: `1px solid ${C.violet}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rewards mensuels</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12 }}>🥇 <span style={{ color: C.text }}>{rewards.top1}</span></span>
          <span style={{ color: C.border }}>·</span>
          <span style={{ fontSize: 12 }}>🥈🥉🏅 Top 2–5 — <span style={{ color: C.text }}>{rewards.top25}</span></span>
          <span style={{ color: C.border }}>·</span>
          <span style={{ fontSize: 12 }}>Top 6–20 — <span style={{ color: C.text }}>{rewards.top620}</span></span>
        </div>
      </div>

      {/* Podium */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 40, height: 200 }}>
        {podiumOrder.map((entry, i) => {
          const ranks = [1, 0, 2]
          const h = podiumHeights[i]
          const medals = ['🥈', '🥇', '🥉']
          const isFirst = i === 1
          return (
            <div key={entry.account} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100 }}>
              <p style={{ fontSize: isFirst ? 28 : 22, marginBottom: 4 }}>{medals[i]}</p>
              <p style={{ color: C.text, fontSize: isFirst ? 13 : 11, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
                {truncateAddress(entry.account, 4)}
              </p>
              <p style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>
                {entry.value.toLocaleString()} {UNIT[tab]}
              </p>
              <div style={{
                width: '100%', height: h, borderRadius: '8px 8px 0 0',
                background: isFirst ? C.violet + '44' : C.card,
                border: `1px solid ${isFirst ? C.violet : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isFirst ? `0 0 24px ${C.violet}44` : 'none',
              }}>
                <span style={{ color: PODIUM_COLORS[ranks[i]], fontWeight: 800, fontSize: 24 }}>#{ranks[i] + 1}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 80px', padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
          {['Rank', 'Player', UNIT[tab], 'Δ mois'].map(h => (
            <span key={h} style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {data.map(entry => {
          const isMe = account && entry.account === account
          return (
            <div
              key={entry.rank}
              style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 120px 80px',
                padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                background: isMe ? C.violet + '18' : 'transparent',
                borderLeft: isMe ? `3px solid ${C.violet}` : '3px solid transparent',
              }}
            >
              <span style={{ color: C.muted, fontWeight: 700 }}>#{entry.rank}</span>
              <span style={{ color: C.text, fontWeight: isMe ? 700 : 400 }}>{truncateAddress(entry.account, 5)}</span>
              <span style={{ color: tab === 'ram' ? C.green : C.teal, fontWeight: 600 }}>{entry.value.toLocaleString()}</span>
              <span style={{ color: entry.delta >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {entry.delta >= 0 ? '+' : ''}{entry.delta}
              </span>
            </div>
          )
        })}
      </div>

      {/* Monthly Reset Countdown */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Prochain reset mensuel dans</p>
        <p style={{ color: C.orange, fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{countdown}</p>
      </div>
    </motion.div>
  )
}
