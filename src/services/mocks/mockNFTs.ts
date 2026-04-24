import type { NFT } from '@/types'

export const mockNFTs: NFT[] = [
  // 3 Tool Faucet
  { assetId: '1001', templateId: 'tf001', name: 'Bronze Faucet Tool', collection: 'zotverse', rarity: 'common', type: 'tool_faucet', state: 'equipped', charges: 8, maxCharges: 10, boostPercent: 10 },
  { assetId: '1002', templateId: 'tf002', name: 'Silver Faucet Tool', collection: 'zotverse', rarity: 'rare', type: 'tool_faucet', state: 'available', charges: 5, maxCharges: 10, boostPercent: 25 },
  { assetId: '1003', templateId: 'tf003', name: 'Gold Faucet Tool', collection: 'zotverse', rarity: 'epic', type: 'tool_faucet', state: 'available', charges: 3, maxCharges: 8, boostPercent: 50 },
  // 3 Tool Burn
  { assetId: '2001', templateId: 'tb001', name: 'Ember Burn Tool', collection: 'zotverse', rarity: 'common', type: 'tool_burn', state: 'equipped', charges: 6, maxCharges: 10, boostPercent: 15 },
  { assetId: '2002', templateId: 'tb002', name: 'Flame Burn Tool', collection: 'zotverse', rarity: 'rare', type: 'tool_burn', state: 'available', charges: 4, maxCharges: 8, boostPercent: 30 },
  { assetId: '2003', templateId: 'tb003', name: 'Inferno Burn Tool', collection: 'zotverse', rarity: 'common', type: 'tool_burn', state: 'available', charges: 9, maxCharges: 10, boostPercent: 15 },
  // 1 Profil
  { assetId: '3001', templateId: 'pr001', name: 'Genesis Profil #42', collection: 'zotverse', rarity: 'rare', type: 'profil', state: 'equipped', profilBoost: 0.15, xp: 2400, level: 3 },
  // 5 Farming
  { assetId: '4001', templateId: 'fm001', name: 'Terra Farm NFT', collection: 'zotverse', rarity: 'common', type: 'farming', state: 'staked', dailyRate: 10, lastClaimTs: Math.floor(Date.now() / 1000) - 3600, stakedAt: Math.floor(Date.now() / 1000) - 86400 },
  { assetId: '4002', templateId: 'fm001', name: 'Terra Farm NFT', collection: 'zotverse', rarity: 'common', type: 'farming', state: 'staked', dailyRate: 10, lastClaimTs: Math.floor(Date.now() / 1000) - 43200, stakedAt: Math.floor(Date.now() / 1000) - 172800 },
  { assetId: '4003', templateId: 'fm001', name: 'Terra Farm NFT', collection: 'zotverse', rarity: 'common', type: 'farming', state: 'staked', dailyRate: 10, lastClaimTs: Math.floor(Date.now() / 1000) - 172800, stakedAt: Math.floor(Date.now() / 1000) - 259200 },
  { assetId: '4004', templateId: 'fm002', name: 'Aqua Farm NFT', collection: 'zotverse', rarity: 'rare', type: 'farming', state: 'available', dailyRate: 30 },
  { assetId: '4005', templateId: 'fm002', name: 'Aqua Farm NFT', collection: 'zotverse', rarity: 'rare', type: 'farming', state: 'available', dailyRate: 30 },
  // 8 external NFTs to burn
  { assetId: '5001', templateId: 'ext001', name: 'Alien Worlds Shovel', collection: 'alien.worlds', rarity: 'common', type: 'external', state: 'available' },
  { assetId: '5002', templateId: 'ext002', name: 'Splinterlands Card', collection: 'splinterlands', rarity: 'rare', type: 'external', state: 'available' },
  { assetId: '5003', templateId: 'ext003', name: 'Farming Tales Cow', collection: 'farmingtales', rarity: 'common', type: 'external', state: 'available' },
  { assetId: '5004', templateId: 'ext004', name: 'R-Planet Element', collection: 'rplanet', rarity: 'epic', type: 'external', state: 'available' },
  { assetId: '5005', templateId: 'ext005', name: 'Wax Stash NFT', collection: 'waxstash', rarity: 'common', type: 'external', state: 'available' },
  { assetId: '5006', templateId: 'ext006', name: 'Kolobok Character', collection: 'kolobok', rarity: 'rare', type: 'external', state: 'available' },
  { assetId: '5007', templateId: 'ext007', name: 'Crypto Panda', collection: 'cryptopanda', rarity: 'legendary', type: 'external', state: 'available' },
  { assetId: '5008', templateId: 'ext008', name: 'NFT Stars Token', collection: 'nftstars', rarity: 'common', type: 'external', state: 'available' },
]

export const mockFarmingStaked = mockNFTs.filter(n => n.type === 'farming' && n.state === 'staked')
export const mockFarmingAvailable = mockNFTs.filter(n => n.type === 'farming' && n.state === 'available')
export const mockToolFaucet = mockNFTs.filter(n => n.type === 'tool_faucet')
export const mockToolBurn = mockNFTs.filter(n => n.type === 'tool_burn')
export const mockProfil = mockNFTs.find(n => n.type === 'profil') ?? null
export const mockExternalNFTs = mockNFTs.filter(n => n.type === 'external')
