import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, EmptyState, TableSkeleton, Badge } from '../../components/ui'
import { getInitial, PAYMENT_LABELS } from '../../lib/utils'

export default function TeacherGroups() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [groupStudents, setGroupStudents] = useState({})

  useEffect(() => {
    if (!profile?.id) return
    loadGroups()
  }, [profile])

  async function loadGroups() {
    setLoading(true)
    const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single()
    if (!teacher) { setLoading(false); return }

    const { data } = await supabase
      .from('groups')
      .select('*, students(count)')
      .eq('teacher_id', teacher.id)
      .eq('is_active', true)
    setGroups(data || [])
    setLoading(false)
  }

  async function toggleGroup(groupId) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null)
      return
    }
    setExpandedGroup(groupId)
    if (!groupStudents[groupId]) {
      const { data } = await supabase
        .from('students')
        .select('id, payment_status, profiles!students_profile_id_fkey(full_name, phone)')
        .eq('group_id', groupId)
        .eq('is_active', true)
      setGroupStudents(prev => ({ ...prev, [groupId]: data || [] }))
    }
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">👥 Guruhlarim</h1>

      {groups.length === 0 ? (
        <Card><EmptyState icon="👥" text="Sizga hali guruh biriktirilmagan" /></Card>
      ) : (
        groups.map(g => (
          <Card key={g.id}>
            <button onClick={() => toggleGroup(g.id)} className="w-full">
              <CardHeader
                title={`${g.name} · ${g.room} · ${g.students?.[0]?.count || 0} o'quvchi`}
                action={<span className="text-text2">{expandedGroup === g.id ? '▲' : '▼'}</span>}
              />
            </button>
            {expandedGroup === g.id && (
              <div>
                {(groupStudents[g.id] || []).length === 0 ? (
                  <EmptyState icon="🎓" text="O'quvchi yo'q" />
                ) : (
                  groupStudents[g.id].map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-t border-border">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                        {getInitial(s.profiles?.full_name)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.profiles?.full_name}</div>
                        <div className="text-xs text-text2">{s.profiles?.phone || '—'}</div>
                      </div>
                      <Badge color={PAYMENT_LABELS[s.payment_status]?.color}>
                        {PAYMENT_LABELS[s.payment_status]?.text}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
