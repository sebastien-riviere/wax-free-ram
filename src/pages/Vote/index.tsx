import { motion } from 'framer-motion'
import { Vote as VoteIcon, Lock, Clock, CheckCircle, XCircle } from 'lucide-react'

const C = {
  bg: '#0a0a0f', card: '#141420', border: 'rgba(255,255,255,0.12)',
  violet: '#7c3aed', orange: '#f97316', teal: '#0d9488',
  text: '#e2e8f0', muted: '#94a3b8',
}

// Disabled banner — vote.contract not yet active
function DisabledBanner() {
  return (
    <div style={{ background: C.orange + '18', border: `1px solid ${C.orange}44`, borderRadius: 12, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <Lock size={20} style={{ color: C.orange, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ color: C.orange, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Gouvernance désactivée — Activation après MVP</p>
        <p style={{ color: C.muted, fontSize: 13 }}>
          Le contrat vote.contract est déployé mais inactif. La gouvernance communautaire sera ouverte sur décision du fondateur après la phase MVP.
        </p>
      </div>
    </div>
  )
}

// Mock proposals (for UI preview — all disabled)
const MOCK_PROPOSALS = [
  {
    id: 'p1',
    collection: 'alienworlds',
    submitter: 'warlord.wam',
    status: 'active' as const,
    votesFor: 1240,
    votesAgainst: 320,
    totalWeight: 1560,
    endsIn: '3j 14h',
    burnValueWAX: 0.08,
  },
  {
    id: 'p2',
    collection: 'cryptopandas',
    submitter: 'nftmaster.wam',
    status: 'pending' as const,
    votesFor: 0,
    votesAgainst: 0,
    totalWeight: 0,
    endsIn: 'En attente de vote',
    burnValueWAX: 0.05,
  },
  {
    id: 'p3',
    collection: 'farminglands',
    submitter: 'zenmaster.wam',
    status: 'rejected' as const,
    votesFor: 280,
    votesAgainst: 890,
    totalWeight: 1170,
    endsIn: 'Clôturé',
    burnValueWAX: 0.04,
  },
]

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Vote en cours', color: C.teal, icon: Clock },
  pending: { label: 'En attente', color: C.muted, icon: Clock },
  approved: { label: 'Approuvé', color: '#22c55e', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: '#ef4444', icon: XCircle },
}

function ProposalCard({ proposal }: { proposal: typeof MOCK_PROPOSALS[0] }) {
  const pct = proposal.totalWeight > 0 ? (proposal.votesFor / proposal.totalWeight) * 100 : 0
  const status = STATUS_LABEL[proposal.status]
  const StatusIcon = status.icon

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, opacity: 0.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{proposal.collection}</p>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Soumis par {proposal.submitter}</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: status.color, background: status.color + '18', padding: '3px 8px', borderRadius: 9999 }}>
          <StatusIcon size={10} />
          {status.label}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>Approbation</span>
          <span style={{ color: pct >= 60 ? '#22c55e' : C.text, fontWeight: 700, fontSize: 12 }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6 }}>
          <div style={{ background: pct >= 60 ? '#22c55e' : C.orange, height: 6, borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: '#22c55e', fontSize: 11 }}>✓ {proposal.votesFor} pour</span>
          <span style={{ color: '#ef4444', fontSize: 11 }}>✗ {proposal.votesAgainst} contre</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <span style={{ color: C.muted, fontSize: 12 }}>Burn value estimé : {proposal.burnValueWAX} WAX/NFT</span>
        <span style={{ color: C.muted, fontSize: 11 }}>{proposal.endsIn}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          disabled
          style={{ flex: 1, padding: '8px 0', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: 'not-allowed' }}
        >
          ✗ Contre
        </button>
        <button
          disabled
          style={{ flex: 1, padding: '8px 0', background: C.teal + '33', border: `1px solid ${C.teal}66`, borderRadius: 8, color: C.teal, fontWeight: 700, fontSize: 13, cursor: 'not-allowed' }}
        >
          ✓ Pour
        </button>
      </div>
    </div>
  )
}

export default function Vote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', padding: '24px', background: C.bg, color: C.text }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <VoteIcon size={28} color={C.violet} />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Gouvernance</h1>
      </div>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
        Vote communautaire pour l'intégration de collections partenaires dans le Burn Engine
      </p>

      <DisabledBanner />

      {/* How it works */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
        <h3 style={{ color: C.text, fontWeight: 600, marginBottom: 16 }}>Comment ça marche</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { step: '1', title: 'Soumission', desc: 'Une collection soumet sa candidature — 50 ZOT anti-spam (sink)', duration: '3 jours' },
            { step: '2', title: 'Vote communauté', desc: 'Les holders de NFT Profil votent — poids par rareté (Common=1 … Pionnier=7)', duration: '7 jours' },
            { step: '3', title: 'Résultat', desc: 'Seuil 60% approbation → inscription dans collection_registry → split RAM 70/20/10', duration: 'Instantané' },
          ].map(s => (
            <div key={s.step} style={{ background: '#0a0a0f', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: C.violet + '33', color: '#a855f7', fontWeight: 800, fontSize: 14, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.step}
                </span>
                <p style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{s.title}</p>
              </div>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{s.desc}</p>
              <p style={{ color: C.teal, fontSize: 11, marginTop: 8, fontWeight: 600 }}>⏱ {s.duration}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preview proposals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Propositions (aperçu)</h2>
        <button
          disabled
          style={{ padding: '8px 16px', background: C.violet + '33', border: `1px solid ${C.violet}66`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: 'not-allowed' }}
        >
          + Soumettre une collection
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {MOCK_PROPOSALS.map(p => <ProposalCard key={p.id} proposal={p} />)}
      </div>
    </motion.div>
  )
}
