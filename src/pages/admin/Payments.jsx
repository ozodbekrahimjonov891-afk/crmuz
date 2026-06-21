import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePayments, useStudents } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  Card, StatCard, Button, Input, Select, Modal, ConfirmDialog,
  Badge, SearchInput, Pagination, TableSkeleton, EmptyState
} from '../../components/ui'
import { fmtMoney, fmtDate, getInitial, MONTHS_UZ } from '../../lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

export default function AdminPayments() {
  const { centerId, profile } = useAuth()
  const { payments, loading, createPayment, deletePayment } = usePayments(centerId)
  const { students } = useStudents(centerId)

  const [filterMonth, setFilterMonth] = useState('')

  const withSearch = payments
    .filter(p => !filterMonth || p.month === Number(filterMonth))
    .map(p => ({ ...p, _searchName: p.students?.profiles?.full_name || '' }))

  const { page, setPage, search, setSearch, totalPages, paged, total } = usePagination(
    withSearch, { perPage: 10, searchFields: ['_searchName'] }
  )

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const now = new Date()
  const thisMonthTotal = payments
    .filter(p => p.month === now.getMonth() + 1 && p.year === now.getFullYear())
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const debtStudents = students.filter(s => s.payment_status === 'debt').length

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    studentId: '', amount: '', month: now.getMonth() + 1, year: now.getFullYear(),
    method: 'cash', note: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  function openCreate() {
    setForm({
      studentId: '', amount: '', month: now.getMonth() + 1, year: now.getFullYear(),
      method: 'cash', note: '',
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const errs = {}
    if (!form.studentId) errs.studentId = "O'quvchini tanlang"
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Summa kiritilishi shart"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      await createPayment({
        center_id: centerId,
        student_id: form.studentId,
        amount: Number(form.amount),
        month: Number(form.month),
        year: Number(form.year),
        payment_method: form.method,
        note: form.note,
        received_by: profile.id,
      })
      toast.success("To'lov qabul qilindi!")
      setModalOpen(false)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePayment(deleteTarget.id)
      toast.success("To'lov o'chirildi")
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">💰 To'lovlar</h1>
        <Button onClick={openCreate}><Plus size={16} /> To'lov qabul qilish</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Jami to'lovlar" value={fmtMoney(totalPaid)} icon="💵" color="blue" />
        <StatCard label="Bu oylik" value={fmtMoney(thisMonthTotal)} icon="📅" color="green" />
        <StatCard label="Qarzdorlar" value={debtStudents} icon="⚠️" color="orange" />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="O'quvchi ismi bo'yicha qidirish..." />
          <Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">Barcha oylar</option>
            {MONTHS_UZ.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : paged.length === 0 ? (
          <EmptyState icon="💰" text={total === 0 ? "Hali to'lov yo'q" : "Hech narsa topilmadi"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface2 text-left text-text2 text-xs uppercase">
                  <th className="px-4 py-3 font-bold">O'quvchi</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Guruh</th>
                  <th className="px-4 py-3 font-bold">Summa</th>
                  <th className="px-4 py-3 font-bold">Oy/Yil</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Sana</th>
                  <th className="px-4 py-3 font-bold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className="border-t border-border hover:bg-surface2 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {getInitial(p.students?.profiles?.full_name)}
                        </div>
                        <span className="font-medium">{p.students?.profiles?.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text2 hidden md:table-cell">{p.students?.groups?.name || '—'}</td>
                    <td className="px-4 py-3 mono text-emerald-500 font-semibold">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-3">{MONTHS_UZ[p.month - 1]} {p.year}</td>
                    <td className="px-4 py-3 text-text2 text-xs hidden md:table-cell">{fmtDate(p.payment_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-text2 hover:text-red-500 transition">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="To'lov qabul qilish">
        <Select label="O'quvchi" value={form.studentId} onChange={e => update('studentId', e.target.value)}>
          <option value="">-- Tanlang --</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.full_name} ({s.groups?.name || 'guruhsiz'})</option>)}
        </Select>
        {errors.studentId && <p className="text-xs text-red-500 mb-2">{errors.studentId}</p>}

        <Input label="Summa (so'm)" type="number" value={form.amount} onChange={e => update('amount', e.target.value)} error={errors.amount} placeholder="500000" />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Oy" value={form.month} onChange={e => update('month', e.target.value)}>
            {MONTHS_UZ.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </Select>
          <Input label="Yil" type="number" value={form.year} onChange={e => update('year', Number(e.target.value))} />
        </div>

        <Select label="To'lov usuli" value={form.method} onChange={e => update('method', e.target.value)}>
          <option value="cash">Naqd</option>
          <option value="card">Karta</option>
          <option value="transfer">O'tkazma</option>
        </Select>

        <Input label="Izoh" value={form.note} onChange={e => update('note', e.target.value)} placeholder="Ixtiyoriy" />

        <div className="flex gap-3 mt-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Bekor</Button>
          <Button onClick={handleSubmit} loading={saving} className="flex-1">Saqlash</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="To'lovni o'chirish"
        message="Bu to'lov yozuvini o'chirishni tasdiqlaysizmi?"
      />
    </div>
  )
}
