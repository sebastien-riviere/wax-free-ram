const BASE_URL = 'https://wax.api.atomicassets.io/atomicassets/v1'

export async function getAssets(owner: string, collections?: string[]) {
  const params = new URLSearchParams({ owner, limit: '100' })
  if (collections?.length) params.set('collection_whitelist', collections.join(','))
  const res = await fetch(`${BASE_URL}/assets?${params}`)
  if (!res.ok) throw new Error('Failed to fetch assets')
  return res.json()
}

export async function getTemplate(collection: string, templateId: string) {
  const res = await fetch(`${BASE_URL}/templates/${collection}/${templateId}`)
  if (!res.ok) throw new Error('Failed to fetch template')
  return res.json()
}

export async function getCollections() {
  const res = await fetch(`${BASE_URL}/collections?limit=100`)
  if (!res.ok) throw new Error('Failed to fetch collections')
  return res.json()
}
