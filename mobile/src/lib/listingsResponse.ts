export type ListingsPage<T = unknown> = {
  items: T[]
  nextCursor: string | null
}

export function asListingsPage<T = unknown>(data: unknown): ListingsPage<T> {
  if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as ListingsPage<T>).items)) {
    return data as ListingsPage<T>
  }
  if (Array.isArray(data)) {
    return { items: data as T[], nextCursor: null }
  }
  return { items: [], nextCursor: null }
}
