import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTeachers } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  Card, Button, Input, Modal, ConfirmDialog,
  SearchInput, Pagination, TableSkeleton, EmptyState, ResponsiveTable
} from '../../components/ui'
import { fmtMoney, getInitial } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { createUserWithLogin, resetUserPassword, deleteUserCompletely } from '../../lib/adminApi'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react'

const emptyForm = { fullName: '', phone: '', email: '', password: '', subject: '', salary: 0 }

function randomPassword() {
  return Math.random().toString(36).slice(-8)
}

export default function AdminTeachers() {
  const { centerId } = useAuth()
  const { teachers, loading, fetchTeachers, updateTeacher } = useTeachers(centerId)

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
  const [resetTarget, setResetTarget] = useState(null)
  const [newPass, setNewPass] = useState('')
  const [resetting, setResetting] = useState(false)

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, password: randomPassword() })
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(teacher) {
    setEditing(teacher)
    setForm({
      fullName: teacher.profiles?.full_name || '',
      phone: teacher.profiles?.phone || '',
      email: '', password: '',
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
    if (!editing) {
      if (!form.email.trim()) errs.email = "Email kiritilishi shart"
      if (!form.password || form.password.length < 6) errs.password = "Parol kamida 6 belgi"
    }
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
        await createUserWithLogin({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          role: 'teacher',
          extra: { subject: form.subject, salary: form.salary },
        })
        toast.success(`O'qituvchi qo'shildi! Login: ${form.email} / Parol: ${form.password}`)
        await fetchTeachers()
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
      await deleteUserCompletely(deleteTarget.profile_id)
      toast.success("O'qituvchi butunlay o'chirildi")
      setDeleteTarget(null)
      await fetchTeachers()
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleResetPassword() {
    if (!newPass || newPass.length < 6) {
      toast.error("Parol kamida 6 belgidan iborat bo'lishi kerak")
      return
    }
    setResetting(true)
    try {
      await resetUserPassword(resetTarget.profile_id, newPass)
      toast.success(`Yangi parol o'rnatildi: ${newPass}`)
      setResetTarget(null)
      setNewPass('')
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setResetting(false)
    }
  }

  // Jadval ustunlari — bitta joyda, ham desktop, ham mobile shu yerdan foydalanadi
  const columns = [
    { key: 'name', label: 'Ism' },
    { key: 'subject', label: 'Fan' },
    { key: 'phone', label: 'Telefon' },
    { key: 'salary', label: 'Maosh' },
  ]

  function renderCell(t, col) {
    switch (col.key) {
      case 'name':
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitial(t.profiles?.full_name)}
            </div>
            <span className="font-medium">{t.profiles?.full_name}</span>
          </div>
        )
      case 'subject':
        return t.subject
      case 'phone':
        return <span className="text-text2">{t.profiles?.phone || '—'}</span>
      case 'salary':
        return <span className="mono text-emerald-500 font-semibold">{fmtMoney(t.salary)}</span>
      default:
        return null
    }
  }

  function renderActions(t) {
    return (
      <>
        <button onClick={() => setResetTarget(t)} title="Parolni tiklash" className="p-1.5 text-text2 hover:text-amber-500 transition">
          <KeyRound size={15} />
        </button>
        <button onClick={() => openEdit(t)} className="p-1.5 text-text2 hover:text-accent transition">
          <Pencil size={15} />
        </button>
        <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-text2 hover:text-red-500 transition">
          <Trash2 size={15} />
        </button>
      </>
    )
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
        ) : (
          <ResponsiveTable
            columns={columns}
            data={paged}
            keyField="id"
            renderCell={renderCell}
            actions={renderActions}
            emptyIcon="👨‍🏫"
            emptyText={total === 0 ? "Hali o'qituvchi yo'q" : "Hech narsa topilmadi"}
          />
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}>
        <Input label="To'liq ism" value={form.fullName} onChange={e => update('fullName', e.target.value)} error={errors.fullName} placeholder="Jamshid Abdullayev" />

        {!editing && (
          <>
            <Input label="Email (login uchun)" value={form.email} onChange={e => update('email', e.target.value)} error={errors.email} placeholder="jamshid@gmail.com" />
            <div className="flex gap-2 items-end mb-3.5">
              <div className="flex-1">
                <Input label="Parol" value={form.password} onChange={e => update('password', e.target.value)} error={errors.password} className="mb-0" />
              </div>
              <Button variant="ghost" type="button" onClick={() => update('password', randomPassword())} className="mb-0">🎲 Generatsiya</Button>
            </div>
          </>
        )}

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
        message={`"${deleteTarget?.profiles?.full_name}" ni butunlay o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
      />

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Parolni tiklash">
        <p className="text-sm text-text2 mb-3">
          <strong>{resetTarget?.profiles?.full_name}</strong> uchun yangi parol o'rnating:
        </p>
        <div className="flex gap-2 items-end mb-3.5">
          <div className="flex-1">
            <Input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Yangi parol" className="mb-0" />
          </div>
          <Button variant="ghost" type="button" onClick={() => setNewPass(randomPassword())} className="mb-0">🎲</Button>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setResetTarget(null)} className="flex-1">Bekor</Button>
          <Button onClick={handleResetPassword} loading={resetting} className="flex-1">O'rnatish</Button>
        </div>
      </Modal>
    </div>
  )
}
