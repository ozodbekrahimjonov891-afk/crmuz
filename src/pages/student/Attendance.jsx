import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Badge, EmptyState, TableSkeleton, Select } from '../../components/ui'
import { fmtDate, ATTENDANCE_LABELS, MONTHS_UZ, calculateAttendancePercent } from '../../lib/utils'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data: student } = await supabase.from('students').select('id').eq('profile_id', profile.id).single()
    if (!student) { setLoading(false); return }
    const { data } = await supabase
      .from('attendance')
      .select('*, groups(name, room)')
      .eq('student_id', student.id)
      .order('date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  const filtered = records.filter(r => new Date(r.date).getMonth() + 1 === Number(filterMonth))
  const percent = calculateAttendancePercent(filtered)

  if (loading) return <TableSkeleton rows={5} cols={3} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">✅ Davomatim</h1>

      <Card className="p-4">
        <Select label="Oy" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          {MONTHS_UZ.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </Select>
        <div className="mt-3 text-center">
          <div className="text-3xl font-extrabold mono" style={{ color: percent >= 80 ? '#10b981' : '#f59e0b' }}>{percent}%</div>
          <div className="text-xs text-text2">Shu oy davomat foizi</div>
        </div>
      </Card>

      <Card>
        <CardHeader title="📋 Davomat tarixi" />
        {filtered.length === 0 ? (
          <EmptyState icon="✅" text="Bu oyda davomat yozuvi yo'q" />
        ) : (
          filtered.map(r => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-medium">{fmtDate(r.date)}</div>
                <div className="text-xs text-text2">{r.groups?.name} · {r.groups?.room}</div>
              </div>
              <Badge color={ATTENDANCE_LABELS[r.status]?.color}>
                {ATTENDANCE_LABELS[r.status]?.icon} {ATTENDANCE_LABELS[r.status]?.text}
              </Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
