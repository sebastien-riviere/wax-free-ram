import { motion } from 'framer-motion'
import { BarChart2, Database, Flame, TrendingUp } from 'lucide-react'

const C = {
  bg: '#0a0a0f', card: '#141420', border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed', orange: '#f97316', teal: '#0d9488', green: '#22c55e',
  text: '#e2e8f0', muted: '#94a3b8',
}

// Mock — from burn_log aggregate in production
const GLOBAL_STATS = {
  totalRamMB: 14.72,
  totalRamWAX: 0.287,
  totalNFTsBurned: 1847,
  totalZOTEmitted: 284200,
  totalZOTBurned: 41300,
  netCirculation: 242900,
}

const TOP_COLLECTIONS_RAM = [
  { name: 'Alien Worlds', ram_mb: 4.2, nfts: 438, wax: 0.082 },
  { name: 'Splinterlands', ram_mb: 3.8, nfts: 392, wax: 0.074 },
  { name: 'Farming Tales', ram_mb: 2.1, nfts: 218, wax: 0.041 },
  { name: 'R-Planet', ram_mb: 1.6, nfts: 166, wax: 0.031 },
  { name: 'Crypto Pandas', ram_mb: 1.2, nfts: 125, wax: 0.023 },
  { name: 'NFT Panda', ram_mb: 0.9, nfts: 94, wax: 0.018 },
  { name: 'WAX Stickers', ram_mb: 0.5, nfts: 52, wax: 0.010 },
  { name: 'Pixel Heroes', ram_mb: 0.42, nfts: 44, wax: 0.008 },
]

const TOP_COLLECTIONS_NFTS = [...TOP_COLLECTIONS_RAM].sort((a, b) => b.nfts - a.nfts)

function StatCard({ icon: Icon, label, value, sub, iconColor }: {
  icon: React.ElementType; label: string; value: string; sub?: string; iconColor: string
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ background: iconColor + '22', padding: 8, borderRadius: 8 }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <p style={{ color: C.muted, fontSize: 13 }}>{label}</p>
      </div>
      <p style={{ color: C.text, fontWeight: 800, fontSize: 24 }}>{value}</p>
      {sub && <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function CollectionTable({ title, data, valueKey, unit, icon: Icon, color }: {
  title: string
  data: typeof TOP_COLLECTIONS_RAM
  valueKey: 'ram_mb' | 'nfts'
  unit: string
  icon: React.ElementType
  color: string
}) {
  const maxVal = Math.max(...data.map(d => d[valueKey] as number))

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} style={{ color }} />
        <h3 style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{title}</h3>
      </div>
      <div>
        {data.map((col, i) => {
          const val = col[valueKey] as number
          const pct = (val / maxVal) * 100
          return (
            <div key={col.name} style={{ padding: '12px 20px', borderBottom: i < data.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, minWidth: 20 }}>#{i + 1}</span>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{col.name}</span>
                </div>
                <span style={{ color, fontWeight: 700, fontSize: 13 }}>{val} {unit}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 4 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  style={{ background: color, height: 4, borderRadius: 4 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Stats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', padding: '24px', background: C.bg, color: C.text }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <BarChart2 size={28} color={C.violet} />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Stats</h1>
      </div>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>Métriques globales de l'écosystème ZOTVERSE</p>

      {/* Global stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Database} label="RAM libérée (total)" value={`${GLOBAL_STATS.totalRamMB} MB`} sub={`≈ ${GLOBAL_STATS.totalRamWAX} WAX`} iconColor={C.green} />
        <StatCard icon={Flame} label="NFTs burnés (total)" value={GLOBAL_STATS.totalNFTsBurned.toLocaleString()} iconColor={C.orange} />
        <StatCard icon={TrendingUp} label="ZOT émis (brut)" value={GLOBAL_STATS.totalZOTEmitted.toLocaleString()} sub="depuis le lancement" iconColor={C.violet} />
        <StatCard icon={Flame} label="ZOT détruits (sinks)" value={GLOBAL_STATS.totalZOTBurned.toLocaleString()} sub={`${((GLOBAL_STATS.totalZOTBurned / GLOBAL_STATS.totalZOTEmitted) * 100).toFixed(1)}% du brut`} iconColor="#ef4444" />
        <StatCard icon={TrendingUp} label="Circulation nette" value={GLOBAL_STATS.netCirculation.toLocaleString()} sub="sur 100M supply cap" iconColor={C.teal} />
      </div>

      {/* Collection tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
        <CollectionTable
          title="Top collections — RAM libérée (MB)"
          data={TOP_COLLECTIONS_RAM}
          valueKey="ram_mb"
          unit="MB"
          icon={Database}
          color={C.green}
        />
        <CollectionTable
          title="Top collections — NFTs burnés"
          data={TOP_COLLECTIONS_NFTS}
          valueKey="nfts"
          unit="NFTs"
          icon={Flame}
          color={C.orange}
        />
      </div>
    </motion.div>
  )
}
