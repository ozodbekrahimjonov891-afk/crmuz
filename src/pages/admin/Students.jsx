import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useStudents, useGroups } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  Card, Button, Input, Select, Modal, ConfirmDialog,
  Badge, SearchInput, Pagination, TableSkeleton, EmptyState
} from '../../components/ui'
import { fmtMoney, fmtDate, getInitial, PAYMENT_LABELS } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const emptyForm = {
  fullName: '', phone: '', birthDate: '', address: '',
  groupId: '', paymentStatus: 'pending', discountPercent: 0, notes: '',
}

export default function AdminStudents() {
  const { centerId, profile } = useAuth()
  const { students, loading, createStudent, updateStudent, deleteStudent } = useStudents(centerId)
  const { groups } = useGroups(centerId)

  const [filterGroup, setFilterGroup] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filteredByDropdowns = students.filter(s => {
    if (filterGroup && s.group_id !== filterGroup) return false
    if (filterStatus && s.payment_status !== filterStatus) return false
    return true
  }).map(s => ({ ...s, _searchName: s.profiles?.full_name || '' }))

  const { page, setPage, search, setSearch, totalPages, paged, total } = usePagination(
    filteredByDropdowns, { perPage: 10, searchFields: ['_searchName', 'phone'] }
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(student) {
    setEditing(student)
    setForm({
      fullName: student.profiles?.full_name || '',
      phone: student.profiles?.phone || '',
      birthDate: student.birth_date || '',
      address: student.address || '',
      groupId: student.group_id || '',
      paymentStatus: student.payment_status,
      discountPercent: student.discount_percent || 0,
      notes: student.notes || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = "Ism kiritilishi shart"
    if (form.phone && !/^\+?\d{9,13}$/.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = "Telefon raqami noto'g'ri"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        // Profil yangilash
        await supabase.from('profiles').update({
          full_name: form.fullName,
          phone: form.phone,
        }).eq('id', editing.profile_id)

        await updateStudent(editing.id, {
          group_id: form.groupId || null,
          payment_status: form.paymentStatus,
          birth_date: form.birthDate || null,
          address: form.address,
          discount_percent: form.discountPercent,
          notes: form.notes,
        })
        toast.success("O'quvchi yangilandi!")
      } else {
        // Eslatma: To'liq tizimda bu auth.users orqali yaratiladi (parol bilan).
        // Soddalashtirilgan holatda: faqat profiles + students yozuvi yaratamiz (login kerak bo'lmasa).
        const { data: newProfile, error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            full_name: form.fullName,
            phone: form.phone,
            role: 'student',
            center_id: centerId,
          })
          .select()
          .single()
        if (profileErr) throw profileErr

        await createStudent({
          profile_id: newProfile.id,
          center_id: centerId,
          group_id: form.groupId || null,
          payment_status: form.paymentStatus,
          birth_date: form.birthDate || null,
          address: form.address,
          discount_percent: form.discountPercent,
          notes: form.notes,
        })
        toast.success("O'quvchi qo'shildi!")
      }
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
      await deleteStudent(deleteTarget.id)
      toast.success("O'quvchi o'chirildi")
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
        <h1 className="text-xl font-extrabold">👨‍🎓 O'quvchilar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qo'shish</Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Ism, telefon bo'yicha qidirish..." />
          <Select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
            <option value="">Barcha guruhlar</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Barcha to'lov holatlari</option>
            <option value="paid">✅ To'langan</option>
            <option value="debt">❌ Qarz</option>
            <option value="pending">⏳ Kutilmoqda</option>
          </Select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : paged.length === 0 ? (
          <EmptyState icon="🎓" text={total === 0 ? "Hali o'quvchi yo'q" : "Hech narsa topilmadi"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface2 text-left text-text2 text-xs uppercase">
                  <th className="px-4 py-3 font-bold">Ism</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Telefon</th>
                  <th className="px-4 py-3 font-bold">Guruh</th>
                  <th className="px-4 py-3 font-bold">To'lov</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Qo'shilgan</th>
                  <th className="px-4 py-3 font-bold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(s => (
                  <tr key={s.id} className="border-t border-border hover:bg-surface2 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {getInitial(s.profiles?.full_name)}
                        </div>
                        <span className="font-medium">{s.profiles?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text2 hidden md:table-cell">{s.profiles?.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div>{s.groups?.name || '—'}</div>
                      {s.groups?.room && <div className="text-xs text-text2">Xona: {s.groups.room}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={PAYMENT_LABELS[s.payment_status]?.color}>
                        {PAYMENT_LABELS[s.payment_status]?.icon} {PAYMENT_LABELS[s.payment_status]?.text}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text2 text-xs hidden md:table-cell">{fmtDate(s.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-text2 hover:text-accent transition">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-text2 hover:text-red-500 transition">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}>
        <Input label="To'liq ism" value={form.fullName} onChange={e => update('fullName', e.target.value)} error={errors.fullName} placeholder="Sardor Yusupov" />
        <Input label="Telefon" value={form.phone} onChange={e => update('phone', e.target.value)} error={errors.phone} placeholder="+998901234567" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Tug'ilgan sana" type="date" value={form.birthDate} onChange={e => update('birthDate', e.target.value)} />
          <Select label="Guruh" value={form.groupId} onChange={e => update('groupId', e.target.value)}>
            <option value="">-- Tanlang --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </div>
        <Input label="Manzil" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Tashkent, ..." />
        <div className="grid grid-cols-2 gap-3">
          <Select label="To'lov holati" value={form.paymentStatus} onChange={e => update('paymentStatus', e.target.value)}>
            <option value="paid">✅ To'langan</option>
            <option value="debt">❌ Qarz</option>
            <option value="pending">⏳ Kutilmoqda</option>
          </Select>
          <Input label="Chegirma (%)" type="number" min="0" max="100" value={form.discountPercent} onChange={e => update('discountPercent', Number(e.target.value))} />
        </div>
        <Input label="Izoh" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Qo'shimcha ma'lumot..." />

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
        title="O'quvchini o'chirish"
        message={`"${deleteTarget?.profiles?.full_name}" ni o'chirishni tasdiqlaysizmi?`}
      />
    </div>
  )
}
