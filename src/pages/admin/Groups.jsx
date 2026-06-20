import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups, useTeachers } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  Card, Button, Input, Select, Modal, ConfirmDialog,
  SearchInput, Pagination, TableSkeleton, EmptyState
} from '../../components/ui'
import { fmtMoney } from '../../lib/utils'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'

const emptyForm = {
  name: '', subject: '', teacherId: '', dayType: 'odd',
  startTime: '09:00', endTime: '10:30', room: '', monthlyFee: 0, maxStudents: 20,
}

export default function AdminGroups() {
  const { centerId } = useAuth()
  const { groups, loading, createGroup, updateGroup, deleteGroup } = useGroups(centerId)
  const { teachers } = useTeachers(centerId)

  const { page, setPage, search, setSearch, totalPages, paged, total } = usePagination(
    groups, { perPage: 10, searchFields: ['name', 'subject', 'room'] }
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(group) {
    setEditing(group)
    setForm({
      name: group.name, subject: group.subject, teacherId: group.teacher_id || '',
      dayType: group.day_type || 'odd', startTime: group.start_time?.slice(0,5) || '09:00',
      endTime: group.end_time?.slice(0,5) || '10:30', room: group.room || '',
      monthlyFee: group.monthly_fee || 0, maxStudents: group.max_students || 20,
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = "Guruh nomi kiritilishi shart"
    if (!form.subject.trim()) errs.subject = "Fan kiritilishi shart"
    if (!form.room.trim()) errs.room = "Xona raqami/nomi kiritilishi shart"
    if (form.startTime >= form.endTime) errs.endTime = "Tugash vaqti boshlanishdan keyin bo'lishi kerak"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name, subject: form.subject,
        teacher_id: form.teacherId || null,
        day_type: form.dayType,
        start_time: form.startTime, end_time: form.endTime,
        room: form.room,
        monthly_fee: form.monthlyFee,
        max_students: form.maxStudents,
      }
      if (editing) {
        await updateGroup(editing.id, payload)
        toast.success("Guruh yangilandi!")
      } else {
        await createGroup({ ...payload, center_id: centerId })
        toast.success("Guruh qo'shildi!")
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
      await deleteGroup(deleteTarget.id)
      toast.success("Guruh o'chirildi")
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const dayTypeLabel = { odd: 'Toq kunlar', even: 'Juft kunlar', daily: 'Har kuni' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">👥 Guruhlar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qo'shish</Button>
      </div>

      <Card className="p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Guruh nomi, fan, xona bo'yicha qidirish..." />
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : paged.length === 0 ? (
          <EmptyState icon="👥" text={total === 0 ? "Hali guruh yo'q" : "Hech narsa topilmadi"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface2 text-left text-text2 text-xs uppercase">
                  <th className="px-4 py-3 font-bold">Guruh</th>
                  <th className="px-4 py-3 font-bold">O'qituvchi</th>
                  <th className="px-4 py-3 font-bold">Xona</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Vaqt</th>
                  <th className="px-4 py-3 font-bold">O'quvchilar</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Narx</th>
                  <th className="px-4 py-3 font-bold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(g => (
                  <tr key={g.id} className="border-t border-border hover:bg-surface2 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{g.name}</div>
                      <div className="text-xs text-text2">{g.subject}</div>
                    </td>
                    <td className="px-4 py-3">{g.teachers?.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-surface2 px-2 py-1 rounded-lg">
                        <MapPin size={12} /> {g.room || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs mono">{g.start_time?.slice(0,5)}–{g.end_time?.slice(0,5)}</div>
                      <div className="text-xs text-text2">{dayTypeLabel[g.day_type]}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-accent font-semibold">{g.students?.[0]?.count || 0}</span>
                      <span className="text-text2"> / {g.max_students}</span>
                    </td>
                    <td className="px-4 py-3 mono hidden md:table-cell">{fmtMoney(g.monthly_fee)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(g)} className="p-1.5 text-text2 hover:text-accent transition">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(g)} className="p-1.5 text-text2 hover:text-red-500 transition">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Guruhni tahrirlash" : "Yangi guruh"}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Guruh nomi" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} placeholder="Kimyo A1" />
          <Input label="Fan" value={form.subject} onChange={e => update('subject', e.target.value)} error={errors.subject} placeholder="Kimyo" />
        </div>
        <Select label="O'qituvchi" value={form.teacherId} onChange={e => update('teacherId', e.target.value)}>
          <option value="">-- Tanlang --</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.profiles?.full_name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Xona"
            value={form.room}
            onChange={e => update('room', e.target.value)}
            error={errors.room}
            placeholder="201-xona"
          />
          <Select label="Kunlar" value={form.dayType} onChange={e => update('dayType', e.target.value)}>
            <option value="odd">Toq kunlar (D,Ch,J)</option>
            <option value="even">Juft kunlar (S,P,Sh)</option>
            <option value="daily">Har kuni</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Boshlanish" type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} />
          <Input label="Tugash" type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} error={errors.endTime} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Oylik narx (so'm)" type="number" value={form.monthlyFee} onChange={e => update('monthlyFee', Number(e.target.value))} placeholder="500000" />
          <Input label="Maksimal o'quvchi" type="number" value={form.maxStudents} onChange={e => update('maxStudents', Number(e.target.value))} />
        </div>

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
        title="Guruhni o'chirish"
        message={`"${deleteTarget?.name}" guruhini o'chirishni tasdiqlaysizmi?`}
      />
    </div>
  )
}
