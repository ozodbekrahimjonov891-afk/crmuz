import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTeachers } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  Card, Button, Input, Modal, ConfirmDialog,
  SearchInput, Pagination, TableSkeleton, EmptyState
} from '../../components/ui'
import { fmtMoney, getInitial } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const emptyForm = { fullName: '', phone: '', subject: '', salary: 0 }

export default function AdminTeachers() {
  const { centerId } = useAuth()
  const { teachers, loading, createTeacher, updateTeacher, deleteTeacher } = useTeachers(centerId)

  const withSearch = teachers.map(t => ({ ...t, _searchName: t.profiles?.full_name || '' }))
  const { page, setPage, search, setSearch, totalPages, paged, total } = usePagination(
    withSearch, { perPage: 10, searchFields: ['_searchName', 'subject'] }
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

  function openEdit(teacher) {
    setEditing(teacher)
    setForm({
      fullName: teacher.profiles?.full_name || '',
      phone: teacher.profiles?.phone || '',
      subject: teacher.subject || '',
      salary: teacher.salary || 0,
    })
    setErrors({})
    setModalOpen(true)
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = "Ism kiritilishi shart"
    if (!form.subject.trim()) errs.subject = "Fan kiritilishi shart"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await supabase.from('profiles').update({
          full_name: form.fullName, phone: form.phone,
        }).eq('id', editing.profile_id)
        await updateTeacher(editing.id, { subject: form.subject, salary: form.salary })
        toast.success("O'qituvchi yangilandi!")
      } else {
        const { data: newProfile, error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            full_name: form.fullName,
            phone: form.phone,
            role: 'teacher',
            center_id: centerId,
          })
          .select()
          .single()
        if (profileErr) throw profileErr

        await createTeacher({
          profile_id: newProfile.id,
          center_id: centerId,
          subject: form.subject,
          salary: form.salary,
        })
        toast.success("O'qituvchi qo'shildi!")
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
      await deleteTeacher(deleteTarget.id)
      toast.success("O'qituvchi o'chirildi")
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
        <h1 className="text-xl font-extrabold">👨‍🏫 O'qituvchilar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qo'shish</Button>
      </div>

      <Card className="p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Ism, fan bo'yicha qidirish..." />
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : paged.length === 0 ? (
          <EmptyState icon="👨‍🏫" text={total === 0 ? "Hali o'qituvchi yo'q" : "Hech narsa topilmadi"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface2 text-left text-text2 text-xs uppercase">
                  <th className="px-4 py-3 font-bold">Ism</th>
                  <th className="px-4 py-3 font-bold">Fan</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">Telefon</th>
                  <th className="px-4 py-3 font-bold">Maosh</th>
                  <th className="px-4 py-3 font-bold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-surface2 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {getInitial(t.profiles?.full_name)}
                        </div>
                        <span className="font-medium">{t.profiles?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{t.subject}</td>
                    <td className="px-4 py-3 text-text2 hidden md:table-cell">{t.profiles?.phone || '—'}</td>
                    <td className="px-4 py-3 mono text-emerald-500 font-semibold">{fmtMoney(t.salary)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-text2 hover:text-accent transition">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-text2 hover:text-red-500 transition">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}>
        <Input label="To'liq ism" value={form.fullName} onChange={e => update('fullName', e.target.value)} error={errors.fullName} placeholder="Jamshid Abdullayev" />
        <Input label="Fan" value={form.subject} onChange={e => update('subject', e.target.value)} error={errors.subject} placeholder="Kimyo" />
        <Input label="Telefon" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+998901234567" />
        <Input label="Oylik maosh (so'm)" type="number" value={form.salary} onChange={e => update('salary', Number(e.target.value))} placeholder="4000000" />

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
        title="O'qituvchini o'chirish"
        message={`"${deleteTarget?.profiles?.full_name}" ni o'chirishni tasdiqlaysizmi?`}
      />
    </div>
  )
}
