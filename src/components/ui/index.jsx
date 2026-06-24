import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export function Card({ children, className }) {
  return (
    <div className={cn('bg-surface border border-border rounded-2xl overflow-hidden', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, action, className }) {
  return (
    <div className={cn('px-5 py-4 border-b border-border flex items-center justify-between', className)}>
      <h3 className="text-sm font-bold">{title}</h3>
      {action}
    </div>
  )
}

export function StatCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-500',
    green: 'text-emerald-500',
    orange: 'text-amber-500',
    purple: 'text-violet-500',
    red: 'text-red-500',
  }
  return (
    <Card className="p-5 relative overflow-hidden">
      <div className="text-xs font-semibold text-text2 uppercase tracking-wide mb-2">{label}</div>
      <div className={cn('text-3xl font-extrabold mono', colors[color])}>{value}</div>
      {icon && <div className="absolute top-4 right-4 text-xl opacity-50">{icon}</div>}
    </Card>
  )
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    red: 'bg-red-500/15 text-red-500 border-red-500/30',
    orange: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    gray: 'bg-surface2 text-text2 border-border',
  }
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border inline-block', colors[color])}>
      {children}
    </span>
  )
}

export function Button({ children, variant = 'primary', loading, className, ...props }) {
  const variants = {
    primary: 'bg-accent text-white hover:bg-blue-600 shadow-sm shadow-blue-500/20',
    ghost: 'bg-surface2 text-text2 border border-border hover:text-text',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20',
  }
  return (
    <button
      className={cn(
        'px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-60',
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Input({ label, error, className, ...props }) {
  return (
    <div className="mb-3.5">
      {label && <label className="text-xs font-semibold text-text2 mb-1.5 block">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-surface2 text-text text-sm outline-none transition',
          error ? 'border-red-500' : 'border-border focus:border-accent',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="mb-3.5">
      {label && <label className="text-xs font-semibold text-text2 mb-1.5 block">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-surface2 text-text text-sm outline-none transition cursor-pointer',
          error ? 'border-red-500' : 'border-border focus:border-accent',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(
        'bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl p-6 w-full max-h-[90vh] overflow-y-auto animate-in',
        maxWidth
      )}>
        <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4 md:hidden" />
        {title && <h3 className="text-lg font-extrabold mb-5">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Tasdiqlash"}>
      <p className="text-sm text-text2 mb-5">{message || "Bu amalni bajarishni tasdiqlaysizmi?"}</p>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1">Bekor qilish</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">
          Tasdiqlash
        </Button>
      </div>
    </Modal>
  )
}

export function EmptyState({ icon = '📭', text }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-sm text-text2">{text}</div>
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = "Qidirish..." }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text2 text-sm">🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
      />
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg border border-border text-sm text-text2 disabled:opacity-40"
      >
        ←
      </button>
      <span className="text-sm text-text2 px-2">{page} / {totalPages}</span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg border border-border text-sm text-text2 disabled:opacity-40"
      >
        →
      </button>
    </div>
  )
}


export function ResponsiveTable({
  columns,
  data,
  keyField = 'id',
  renderCell,
  renderCardTitle,
  actions,
  emptyIcon = '📭',
  emptyText = 'Maʼlumot topilmadi',
}) {
  if (!data || data.length === 0) {
    return <EmptyState icon={emptyIcon} text={emptyText} />
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface2 text-left text-text2 text-xs uppercase">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 font-bold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-bold text-right">Amallar</th>}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row[keyField]} className="border-t border-border hover:bg-surface2 transition">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 align-top">
                    {renderCell(row, col)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-border">
        {data.map(row => (
          <div key={row[keyField]} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm flex-1">
                {renderCardTitle ? renderCardTitle(row) : renderCell(row, columns[0])}
              </div>
              {actions && (
                <div className="flex items-center gap-1 -mt-1 -mr-1 shrink-0">
                  {actions(row)}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {columns.slice(renderCardTitle ? 0 : 1).map(col => (
                <div key={col.key} className="min-w-0">
                  <div className="text-[10px] font-semibold text-text2 uppercase tracking-wide mb-0.5">
                    {col.label}
                  </div>
                  <div className="text-xs">
                    {renderCell(row, col)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
