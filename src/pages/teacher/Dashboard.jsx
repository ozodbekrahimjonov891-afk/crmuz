import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, StatCard, Skeleton, EmptyState } from '../../components/ui'
import { getInitial } from '../../lib/utils'

export default function TeacherDashboard() {
  const { profile, centerId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teacherId, setTeacherId] = useState(null)
  const [groups, setGroups] = useState([])
  const [stats, setStats] = useState({ groupsCount: 0, studentsCount: 0, pendingHomeworks: 0 })

  useEffect(() => {
    if (!profile?.id) return
    loadDashboard()
  }, [profile])

  async function loadDashboard() {
    setLoading(true)
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    if (!teacher) { setLoading(false); return }
    setTeacherId(teacher.id)

    const { data: myGroups } = await supabase
      .from('groups')
      .select('*, students(count)')
      .eq('teacher_id', teacher.id)
      .eq('is_active', true)

    const totalStudents = (myGroups || []).reduce((sum, g) => sum + (g.students?.[0]?.count || 0), 0)

    const { count: pendingHw } = await supabase
      .from('homework_submissions')
      .select('id, homeworks!inner(teacher_id)', { count: 'exact' })
      .eq('homeworks.teacher_id', teacher.id)
      .eq('is_done', false)

    setGroups(myGroups || [])
    setStats({ groupsCount: myGroups?.length || 0, studentsCount: totalStudents, pendingHomeworks: pendingHw || 0 })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg sm:text-xl font-extrabold">👋 Xush kelibsiz, {profile?.full_name}</h1>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Guruhlarim" value={stats.groupsCount} icon="👥" color="blue" />
        <StatCard label="O'quvchilar" value={stats.studentsCount} icon="🎓" color="green" />
        <StatCard label="Tekshirilmagan" value={stats.pendingHomeworks} icon="📝" color="orange" />
      </div>

      <Card>
        <CardHeader title="📅 Mening guruhlarim" />
        {groups.length === 0 ? (
          <EmptyState icon="👥" text="Sizga hali guruh biriktirilmagan" />
        ) : (
          <div>
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                  {getInitial(g.name)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{g.name}</div>
                  <div className="text-xs text-text2">{g.room} · {g.start_time?.slice(0,5)}–{g.end_time?.slice(0,5)}</div>
                </div>
                <div className="text-sm text-accent font-bold">{g.students?.[0]?.count || 0} o'quvchi</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
