import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, StatCard, Skeleton, Badge } from '../../components/ui'
import { PAYMENT_LABELS, calculateAttendancePercent } from '../../lib/utils'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState(null)
  const [attendancePercent, setAttendancePercent] = useState(0)
  const [nextHomeworks, setNextHomeworks] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    loadDashboard()
  }, [profile])

  async function loadDashboard() {
    setLoading(true)
    const { data: student } = await supabase
      .from('students')
      .select('*, groups(name, room, start_time, end_time, day_type)')
      .eq('profile_id', profile.id)
      .single()
    setStudentInfo(student)

    if (student) {
      const { data: attRecords } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id)
      setAttendancePercent(calculateAttendancePercent(attRecords || []))

      const { data: homeworks } = await supabase
        .from('homework_submissions')
        .select('*, homeworks(title, due_date)')
        .eq('student_id', student.id)
        .eq('is_done', false)
        .limit(3)
      setNextHomeworks(homeworks || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg sm:text-xl font-extrabold">👋 Salom, {profile?.full_name}</h1>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Davomat" value={`${attendancePercent}%`} icon="✅" color={attendancePercent >= 80 ? 'green' : 'orange'} />
        <StatCard label="To'lov" value={PAYMENT_LABELS[studentInfo?.payment_status]?.icon || '—'} icon="💰" color={PAYMENT_LABELS[studentInfo?.payment_status]?.color} />
        <StatCard label="Vazifalar" value={nextHomeworks.length} icon="📝" color="purple" />
      </div>

      <Card>
        <CardHeader title="📅 Mening guruhim" />
        <div className="p-5">
          {studentInfo?.groups ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{studentInfo.groups.name}</div>
                <div className="text-sm text-text2">{studentInfo.groups.room} · {studentInfo.groups.start_time?.slice(0,5)}–{studentInfo.groups.end_time?.slice(0,5)}</div>
              </div>
            </div>
          ) : (
            <p className="text-text2 text-sm">Guruhga biriktirilmagansiz</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="📝 Bajarilmagan vazifalar" />
        {nextHomeworks.length === 0 ? (
          <div className="p-5 text-sm text-text2">Barcha vazifalar bajarilgan! 🎉</div>
        ) : (
          nextHomeworks.map(hw => (
            <div key={hw.id} className="px-5 py-3 border-b border-border last:border-0">
              <div className="font-medium text-sm">{hw.homeworks?.title}</div>
              {hw.homeworks?.due_date && <div className="text-xs text-text2 mt-0.5">Topshirish: {new Date(hw.homeworks.due_date).toLocaleDateString('uz-UZ')}</div>}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
