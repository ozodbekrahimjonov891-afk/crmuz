import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Badge, EmptyState, Skeleton, Select } from '../../components/ui'
import { fmtDate, ATTENDANCE_LABELS, MONTHS_UZ, calculateAttendancePercent } from '../../lib/utils'

export default function ParentAttendance() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [records, setRecords] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  useEffect(() => {
    if (selectedChild) loadRecords()
  }, [selectedChild])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('id, profiles!students_profile_id_fkey(full_name)')
      .eq('parent_id', profile.id)
    setChildren(data || [])
    if (data?.length) setSelectedChild(data[0].id)
    setLoading(false)
  }

  async function loadRecords() {
    const { data } = await supabase
      .from('attendance')
      .select('*, groups(name, room)')
      .eq('student_id', selectedChild)
      .order('date', { ascending: false })
    setRecords(data || [])
  }

  const percent = calculateAttendancePercent(records)

  if (loading) return <Skeleton className="h-48" />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">✅ Davomat</h1>

      {children.length === 0 ? (
        <Card><EmptyState icon="👶" text="Farzandingiz tizimga ulanmagan" /></Card>
      ) : (
        <>
          {children.length > 1 && (
            <Card className="p-4">
              <Select label="Farzand" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                {children.map(c => <option key={c.id} value={c.id}>{c.profiles?.full_name}</option>)}
              </Select>
            </Card>
          )}

          <Card className="p-5 text-center">
            <div className="text-3xl font-extrabold mono" style={{ color: percent >= 80 ? '#10b981' : '#f59e0b' }}>{percent}%</div>
            <div className="text-xs text-text2">Umumiy davomat foizi</div>
          </Card>

          <Card>
            <CardHeader title="📋 Davomat tarixi" />
            {records.length === 0 ? (
              <EmptyState icon="✅" text="Davomat ma'lumoti yo'q" />
            ) : (
              records.map(r => (
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
        </>
      )}
    </div>
  )
}
