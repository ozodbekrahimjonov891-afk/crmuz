import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, EmptyState, TableSkeleton } from '../../components/ui'

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

function groupAppliesOnDay(group, dayIndex) {
  const isOdd = dayIndex % 2 === 0
  if (group.day_type === 'daily') return true
  if (group.day_type === 'odd') return isOdd
  if (group.day_type === 'even') return !isOdd
  return false
}

function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function TeacherSchedule() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single()
    if (!teacher) { setLoading(false); return }
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('is_active', true)
    setGroups(data || [])
    setLoading(false)
  }

  const dayGroups = useMemo(() => {
    return DAYS.map((_, dayIndex) =>
      groups
        .filter(g => groupAppliesOnDay(g, dayIndex) && g.start_time && g.end_time)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    )
  }, [groups])

  if (loading) return <TableSkeleton rows={5} cols={2} />

  const hasAny = groups.length > 0

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">📅 Dars jadvalim</h1>

      {!hasAny ? (
        <Card><EmptyState icon="📅" text="Sizga hali guruh biriktirilmagan" /></Card>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day, dayIndex) => (
            dayGroups[dayIndex].length > 0 && (
              <Card key={day}>
                <CardHeader title={day} />
                <div>
                  {dayGroups[dayIndex].map(g => (
                    <div key={g.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                      <div className="w-1 h-10 rounded-full bg-accent flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-bold">{g.name}</div>
                        <div className="text-xs text-text2">📍 {g.room || '—'} · {g.subject}</div>
                      </div>
                      <div className="text-xs font-semibold mono text-accent text-right">
                        {g.start_time?.slice(0,5)}<br/>{g.end_time?.slice(0,5)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  )
}
