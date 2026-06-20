import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Button, Input, Select, Modal, EmptyState, TableSkeleton, Badge } from '../../components/ui'
import { fmtDate, getInitial } from '../../lib/utils'
import { toast } from 'sonner'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'

export default function TeacherHomeworks() {
  const { profile, centerId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teacherId, setTeacherId] = useState(null)
  const [groups, setGroups] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [expanded, setExpanded] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ groupId: '', title: '', description: '', dueDate: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    init()
  }, [profile])

  async function init() {
    setLoading(true)
    const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single()
    if (!teacher) { setLoading(false); return }
    setTeacherId(teacher.id)

    const { data: groupsData } = await supabase.from('groups').select('id, name').eq('teacher_id', teacher.id).eq('is_active', true)
    setGroups(groupsData || [])

    await loadHomeworks(teacher.id)
    setLoading(false)
  }

  async function loadHomeworks(tId) {
    const { data } = await supabase
      .from('homeworks')
      .select('*, groups(name), homework_submissions(*, students(profiles!students_profile_id_fkey(full_name)))')
      .eq('teacher_id', tId)
      .order('created_at', { ascending: false })
    setHomeworks(data || [])
  }

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleCreate() {
    if (!form.groupId || !form.title) {
      toast.error("Guruh va sarlavhani kiriting")
      return
    }
    setSaving(true)
    try {
      const { data: hw, error } = await supabase.from('homeworks').insert({
        center_id: centerId,
        group_id: form.groupId,
        teacher_id: teacherId,
        title: form.title,
        description: form.description,
        due_date: form.dueDate || null,
      }).select().single()
      if (error) throw error

      const { data: groupStudents } = await supabase.from('students').select('id').eq('group_id', form.groupId)
      if (groupStudents?.length) {
        await supabase.from('homework_submissions').insert(
          groupStudents.map(s => ({ homework_id: hw.id, student_id: s.id }))
        )
      }
      toast.success('Vazifa berildi!')
      setModalOpen(false)
      setForm({ groupId: '', title: '', description: '', dueDate: '' })
      loadHomeworks(teacherId)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleDone(submissionId, isDone) {
    await supabase.from('homework_submissions').update({ is_done: !isDone, submitted_at: !isDone ? new Date().toISOString() : null }).eq('id', submissionId)
    loadHomeworks(teacherId)
  }

  async function setScore(submissionId, score) {
    await supabase.from('homework_submissions').update({ score: Number(score) }).eq('id', submissionId)
    loadHomeworks(teacherId)
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">📚 Vazifalar</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Vazifa berish</Button>
      </div>

      {homeworks.length === 0 ? (
        <Card><EmptyState icon="📚" text="Hali vazifa berilmagan" /></Card>
      ) : (
        homeworks.map(hw => {
          const done = hw.homework_submissions?.filter(s => s.is_done).length || 0
          const total = hw.homework_submissions?.length || 0
          return (
            <Card key={hw.id}>
              <button onClick={() => setExpanded(expanded === hw.id ? null : hw.id)} className="w-full">
                <CardHeader
                  title={`${hw.title} · ${hw.groups?.name}`}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge color={done === total ? 'green' : 'orange'}>{done}/{total} bajardi</Badge>
                      {expanded === hw.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  }
                />
              </button>
              {expanded === hw.id && (
                <div>
                  {hw.description && <p className="px-5 py-3 text-sm text-text2 border-b border-border">{hw.description}</p>}
                  {hw.due_date && <p className="px-5 py-2 text-xs text-text2">📅 Topshirish: {fmtDate(hw.due_date)}</p>}
                  {(hw.homework_submissions || []).map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 px-5 py-3 border-t border-border flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                        {getInitial(sub.students?.profiles?.full_name)}
                      </div>
                      <div className="flex-1 min-w-[120px] text-sm font-medium">{sub.students?.profiles?.full_name}</div>
                      <button
                        onClick={() => toggleDone(sub.id, sub.is_done)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${sub.is_done ? 'bg-emerald-500/20 text-emerald-500' : 'bg-surface2 text-text2'}`}
                      >
                        {sub.is_done ? '✅ Bajargan' : '⏳ Bajarmagan'}
                      </button>
                      <input
                        type="number"
                        placeholder="Baho"
                        defaultValue={sub.score || ''}
                        onBlur={e => e.target.value && setScore(sub.id, e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg border border-border bg-surface2 text-text text-xs text-center outline-none focus:border-accent"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi vazifa">
        <Select label="Guruh" value={form.groupId} onChange={e => update('groupId', e.target.value)}>
          <option value="">-- Tanlang --</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
        <Input label="Sarlavha" value={form.title} onChange={e => update('title', e.target.value)} placeholder="2-bob mashqlari" />
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text2 mb-1.5 block">Tavsif</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition resize-none"
          />
        </div>
        <Input label="Topshirish sanasi" type="date" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} />

        <div className="flex gap-3 mt-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Bekor</Button>
          <Button onClick={handleCreate} loading={saving} className="flex-1">Berish</Button>
        </div>
      </Modal>
    </div>
  )
}
