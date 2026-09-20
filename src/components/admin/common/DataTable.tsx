import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, AlertCircle, Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onSort?: (key: string, order: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'No records found.',
  page = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  onSort,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (!onSort) return
    let nextOrder: 'asc' | 'desc' = 'asc'
    if (sortKey === key && sortOrder === 'asc') nextOrder = 'desc'
    setSortKey(key)
    setSortOrder(nextOrder)
    onSort(key, nextOrder)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
        <AlertCircle size={36} className="text-red-500 mb-2" />
        <h4 className="text-base font-semibold text-red-700 dark:text-red-400">Failed to load data</h4>
        <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        size={14}
                        className={`transition-colors ${
                          sortKey === col.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 opacity-60'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_col, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Inbox size={40} className="mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div>
            Showing Page <span className="font-semibold">{page}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
            {totalItems !== undefined && <span> ({totalItems} total records)</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
