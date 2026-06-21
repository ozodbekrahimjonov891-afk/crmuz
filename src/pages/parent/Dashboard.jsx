import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, StatCard, Skeleton, EmptyState, Badge } from '../../components/ui'
import { PAYMENT_LABELS, getInitial, calculateAttendancePercent, fmtDate } from '../../lib/utils'

export default function ParentDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data: kids } = await supabase
      .from('students')
      .select('*, profiles!students_profile_id_fkey(full_name), groups(name, room, start_time, end_time)')
      .eq('parent_id', profile.id)

    const enriched = await Promise.all((kids || []).map(async (k) => {
      const { data: att } = await supabase.from('attendance').select('status').eq('student_id', k.id)
      const { data: lastAtt } = await supabase
        .from('attendance').select('date, status').eq('student_id', k.id)
        .order('date', { ascending: false }).limit(1).single()
      return {
        ...k,
        attendancePercent: calculateAttendancePercent(att || []),
        lastAttendance: lastAtt,
      }
    }))

    setChildren(enriched)
    setLoading(false)
  }

  if (loading) return <Skeleton className="h-48" />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold">👋 Xush kelibsiz, {profile?.full_name}</h1>

      {children.length === 0 ? (
        <Card><EmptyState icon="👶" text="Farzandingiz tizimga ulanmagan" /></Card>
      ) : (
        children.map(child => (
          <Card key={child.id}>
            <CardHeader title={`👶 ${child.profiles?.full_name}`} />
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard label="Davomat" value={`${child.attendancePercent}%`} color={child.attendancePercent >= 80 ? 'green' : 'orange'} />
                <StatCard
                  label="To'lov"
                  value={PAYMENT_LABELS[child.payment_status]?.icon}
                  color={PAYMENT_LABELS[child.payment_status]?.color}
                />
                <StatCard label="Guruh" value={child.groups?.name || '—'} color="blue" />
              </div>
              {child.lastAttendance && (
                <div className="text-sm text-text2">
                  So'nggi dars: {fmtDate(child.lastAttendance.date)} —{' '}
                  <Badge color={child.lastAttendance.status === 'present' ? 'green' : 'red'}>
                    {child.lastAttendance.status === 'present' ? '✅ Keldi' : '❌ Kelmadi'}
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
