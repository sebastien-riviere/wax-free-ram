const BASE_URL = 'https://wax.api.atomicassets.io/atomicmarket/v1'

export async function getFloorPrice(collection: string, templateId: string) {
  const params = new URLSearchParams({ collection_name: collection, template_id: templateId })
  const res = await fetch(`${BASE_URL}/prices/assets?${params}`)
  if (!res.ok) throw new Error('Failed to fetch floor price')
  const data = await res.json()
  return data?.data?.[0]?.median ?? null
}
