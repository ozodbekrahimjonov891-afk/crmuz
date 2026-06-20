import { useMemo, useState } from 'react'

export function usePagination(items, { perPage = 10, searchFields = [] } = {}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search || searchFields.length === 0) return items
    const q = search.toLowerCase()
    return items.filter(item =>
      searchFields.some(field => String(item[field] || '').toLowerCase().includes(q))
    )
  }, [items, search, searchFields])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)

  const paged = useMemo(() => {
    const start = (safePage - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, safePage, perPage])

  function updateSearch(value) {
    setSearch(value)
    setPage(1)
  }

  return {
    page: safePage,
    setPage,
    search,
    setSearch: updateSearch,
    totalPages,
    paged,
    total: filtered.length,
  }
}
