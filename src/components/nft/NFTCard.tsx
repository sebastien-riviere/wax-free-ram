import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { NFT, Rarity } from '@/types'

interface NFTCardProps {
  nft: NFT
  onStake?: () => void
  onUnstake?: () => void
  onEquip?: () => void
  onBurn?: () => void
  onSell?: () => void
  selected?: boolean
  onClick?: () => void
}

const rarityImageBg: Record<Rarity, React.CSSProperties> = {
  common: { background: '#374151' },
  rare: { background: '#1e3a8a' },
  epic: { background: '#4c1d95' },
  legendary: { background: '#78350f' },
  mythic: { background: 'linear-gradient(135deg, #4c1d95, #831843, #7c2d12)' },
}

const rarityGlow: Record<Rarity, string> = {
  common: 'none',
  rare: '0 0 16px rgba(59, 130, 246, 0.5)',
  epic: '0 0 16px rgba(124, 58, 237, 0.5)',
  legendary: '0 0 16px rgba(249, 115, 22, 0.5)',
  mythic: '0 0 20px rgba(236, 72, 153, 0.5)',
}

const rarityProgressColor: Record<Rarity, string> = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#7c3aed',
  legendary: '#f97316',
  mythic: '#ec4899',
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const labels: Record<Rarity, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    mythic: 'Mythic',
  }
  return <Badge variant={rarity}>{labels[rarity]}</Badge>
}

function StateBadge({ state }: { state: 'staked' | 'equipped' }) {
  if (state === 'staked') return <Badge variant="success">Staked</Badge>
  return <Badge variant="info">Equipped</Badge>
}

export function NFTCard({
  nft,
  onStake,
  onUnstake,
  onEquip,
  onBurn,
  onSell,
  selected = false,
  onClick,
}: NFTCardProps) {
  const { rarity, type, state, charges, maxCharges, boostPercent, dailyRate, profilBoost } = nft

  const chargePercent =
    charges != null && maxCharges != null && maxCharges > 0
      ? (charges / maxCharges) * 100
      : null

  const glowOnHover = rarityGlow[rarity]
  const selectedBorder = selected
    ? '1.5px solid #7c3aed'
    : '1px solid rgba(255, 255, 255, 0.08)'
  const selectedGlow = selected ? '0 0 16px rgba(124, 58, 237, 0.5)' : undefined

  return (
    <motion.div
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        boxShadow: selected ? selectedGlow : glowOnHover !== 'none' ? glowOnHover : undefined,
      }}
      transition={{ duration: 0.18 }}
      style={{
        background: '#141420',
        borderRadius: '12px',
        overflow: 'hidden',
        border: selectedBorder,
        boxShadow: selected ? selectedGlow : undefined,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image area */}
      <div
        style={{
          position: 'relative',
          height: '160px',
          flexShrink: 0,
          ...rarityImageBg[rarity],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '40px', opacity: 0.3 }}>◆</span>
        )}

        {/* Rarity badge — top right */}
        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
          <RarityBadge rarity={rarity} />
        </div>

        {/* State badge — top left */}
        {(state === 'staked' || state === 'equipped') && (
          <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
            <StateBadge state={state} />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* Name + Collection */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#e2e8f0',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {nft.name}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            {nft.collection}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Daily rate for farming */}
          {type === 'farming' && dailyRate != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Daily Rate</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0d9488' }}>
                +{dailyRate} ZOT/day
              </span>
            </div>
          )}

          {/* Boost for tools/profil */}
          {(type === 'tool_faucet' || type === 'tool_burn' || type === 'profil') &&
            boostPercent != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Boost</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f97316' }}>
                  +{boostPercent}%
                </span>
              </div>
            )}

          {/* Profil boost */}
          {type === 'profil' && profilBoost != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Profil Boost</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#a78bfa' }}>
                +{profilBoost}%
              </span>
            </div>
          )}

          {/* Charges for tools */}
          {(type === 'tool_faucet' || type === 'tool_burn') &&
            charges != null &&
            maxCharges != null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Charges</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {charges}/{maxCharges}
                  </span>
                </div>
                <div
                  style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '99px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${chargePercent ?? 0}%`,
                      background: rarityProgressColor[rarity],
                      borderRadius: '99px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: 'auto',
            paddingTop: '4px',
            flexWrap: 'wrap',
          }}
        >
          {type === 'farming' && state === 'available' && onStake && (
            <Button
              variant="success"
              size="sm"
              onClick={e => {
                e.stopPropagation()
                onStake()
              }}
            >
              Stake
            </Button>
          )}

          {type === 'farming' && state === 'staked' && onUnstake && (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation()
                onUnstake()
              }}
            >
              Unstake
            </Button>
          )}

          {(type === 'tool_faucet' || type === 'tool_burn') && state === 'available' && onEquip && (
            <Button
              variant="primary"
              size="sm"
              onClick={e => {
                e.stopPropagation()
                onEquip()
              }}
            >
              Equip
            </Button>
          )}

          {type === 'external' && (
            <>
              {onBurn && (
                <Button
                  variant="burn"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onBurn()
                  }}
                >
                  Burn
                </Button>
              )}
              {onSell && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onSell()
                  }}
                >
                  Sell
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
