import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Select, EmptyState, TableSkeleton } from '../../components/ui'
import { ATTENDANCE_LABELS, getInitial } from '../../lib/utils'
import { toast } from 'sonner'

export default function TeacherAttendance() {
  const { profile, centerId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    loadGroups()
  }, [profile])

  useEffect(() => {
    if (selectedGroup) loadStudentsAndRecords()
  }, [selectedGroup, selectedDate])

  async function loadGroups() {
    setLoading(true)
    const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single()
    if (!teacher) { setLoading(false); return }
    const { data } = await supabase.from('groups').select('id, name, room').eq('teacher_id', teacher.id).eq('is_active', true)
    setGroups(data || [])
    setLoading(false)
  }

  async function loadStudentsAndRecords() {
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, profiles!students_profile_id_fkey(full_name)')
      .eq('group_id', selectedGroup)
      .eq('is_active', true)
    setStudents(studentsData || [])

    const { data: recordsData } = await supabase
      .from('attendance')
      .select('*')
      .eq('group_id', selectedGroup)
      .eq('date', selectedDate)
    setRecords(recordsData || [])
  }

  function recordFor(studentId) {
    return records.find(r => r.student_id === studentId)
  }

  async function handleMark(studentId, status) {
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          center_id: centerId,
          student_id: studentId,
          group_id: selectedGroup,
          date: selectedDate,
          status,
          marked_by: profile.id,
        }, { onConflict: 'student_id,date,group_id' })
      if (error) throw error
      toast.success(`${ATTENDANCE_LABELS[status].icon} Belgilandi`)
      loadStudentsAndRecords()
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    }
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">✅ Davomat belgilash</h1>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Guruh" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">-- Tanlang --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.room})</option>)}
          </Select>
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Sana</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
            />
          </div>
        </div>
      </Card>

      {!selectedGroup ? (
        <Card><EmptyState icon="👥" text="Guruhni tanlang" /></Card>
      ) : (
        <Card>
          <CardHeader title={`${selectedDate}`} />
          {students.length === 0 ? (
            <EmptyState icon="🎓" text="O'quvchi yo'q" />
          ) : (
            students.map(s => {
              const rec = recordFor(s.id)
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 flex-wrap">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {getInitial(s.profiles?.full_name)}
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <div className="text-sm font-semibold">{s.profiles?.full_name}</div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(ATTENDANCE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleMark(s.id, key)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition"
                        style={{
                          opacity: rec?.status === key ? 1 : 0.4,
                          background: rec?.status === key
                            ? (label.color === 'green' ? 'rgba(16,185,129,.2)' :
                               label.color === 'red' ? 'rgba(239,68,68,.2)' :
                               label.color === 'orange' ? 'rgba(245,158,11,.2)' : 'rgba(59,130,246,.2)')
                            : 'transparent',
                          borderColor: label.color === 'green' ? '#10b981' :
                                       label.color === 'red' ? '#ef4444' :
                                       label.color === 'orange' ? '#f59e0b' : '#3b82f6',
                        }}
                      >
                        {label.icon} {label.text}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </Card>
      )}
    </div>
  )
}
