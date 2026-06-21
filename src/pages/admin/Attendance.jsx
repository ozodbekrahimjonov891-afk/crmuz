import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups, useAttendance, useStudents } from '../../hooks/useData'
import { Card, CardHeader, Select, Badge, EmptyState, Button, DataTable } from '../../components/ui'
import { ATTENDANCE_LABELS, getInitial, calculateAttendancePercent } from '../../lib/utils'
import { toast } from 'sonner'

export default function AdminAttendance() {
  const { centerId, profile } = useAuth()
  const { groups } = useGroups(centerId)
  const { students } = useStudents(centerId)

  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [view, setView] = useState('daily') // 'daily' | 'stats'

  const { records, loading, markAttendance } = useAttendance(centerId, {
    groupId: selectedGroup || undefined,
    date: view === 'daily' ? selectedDate : undefined,
  })

  const groupStudents = useMemo(() => {
    if (!selectedGroup) return []
    return students.filter(s => s.group_id === selectedGroup)
  }, [students, selectedGroup])

  function recordFor(studentId) {
    return records.find(r => r.student_id === studentId)
  }

  async function handleMark(studentId, status) {
    try {
      await markAttendance(studentId, selectedGroup, selectedDate, status, profile.id)
      toast.success(`${ATTENDANCE_LABELS[status].icon} Belgilandi`)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    }
  }

  // Statistika hisoblash: har bir o'quvchi nechta dars qoldirgani
  const studentStats = useMemo(() => {
    if (view !== 'stats') return []
    const byStudent = {}
    records.forEach(r => {
      const key = r.student_id
      if (!byStudent[key]) byStudent[key] = { student: r.students, records: [] }
      byStudent[key].records.push(r)
    })
    return Object.values(byStudent).map(({ student, records }) => {
      const total = records.length
      const absent = records.filter(r => r.status === 'absent').length
      const present = records.filter(r => r.status === 'present').length
      const late = records.filter(r => r.status === 'late').length
      const excused = records.filter(r => r.status === 'excused').length
      const percent = calculateAttendancePercent(records)
      return { _key: student?.id || student?.profiles?.full_name, student, total, absent, present, late, excused, percent }
    }).sort((a, b) => a.percent - b.percent)
  }, [records, view])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-extrabold">✅ Davomat</h1>
        <div className="flex gap-2">
          <Button variant={view === 'daily' ? 'primary' : 'ghost'} onClick={() => setView('daily')} className="flex-1 sm:flex-none">
            📅 Kunlik
          </Button>
          <Button variant={view === 'stats' ? 'primary' : 'ghost'} onClick={() => setView('stats')} className="flex-1 sm:flex-none">
            📊 Statistika
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Guruh" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">-- Guruhni tanlang --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.room})</option>)}
          </Select>
          {view === 'daily' && (
            <div>
              <label className="text-xs font-semibold text-text2 mb-1.5 block">Sana</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
              />
            </div>
          )}
        </div>
      </Card>

      {!selectedGroup ? (
        <Card><EmptyState icon="👥" text="Davomat belgilash uchun guruhni tanlang" /></Card>
      ) : view === 'daily' ? (
        <Card>
          <CardHeader title={`📅 ${selectedDate} — kunlik davomat`} />
          {groupStudents.length === 0 ? (
            <EmptyState icon="🎓" text="Bu guruhda o'quvchi yo'q" />
          ) : (
            <div>
              {groupStudents.map(s => {
                const rec = recordFor(s.id)
                return (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {getInitial(s.profiles?.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{s.profiles?.full_name}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap sm:justify-end">
                      {Object.entries(ATTENDANCE_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => handleMark(s.id, key)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                            rec?.status === key
                              ? `bg-${label.color}-500/20 border-${label.color}-500 opacity-100`
                              : 'border-border opacity-40 hover:opacity-70'
                          }`}
                          style={rec?.status === key ? {
                            background: label.color === 'green' ? 'rgba(16,185,129,.2)' :
                                        label.color === 'red' ? 'rgba(239,68,68,.2)' :
                                        label.color === 'orange' ? 'rgba(245,158,11,.2)' : 'rgba(59,130,246,.2)',
                            borderColor: label.color === 'green' ? '#10b981' :
                                         label.color === 'red' ? '#ef4444' :
                                         label.color === 'orange' ? '#f59e0b' : '#3b82f6',
                          } : {}}
                        >
                          {label.icon} {label.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader title="📊 Davomat statistikasi (shu guruh bo'yicha)" />
          {studentStats.length === 0 ? (
            <EmptyState icon="📊" text="Hali davomat ma'lumoti yo'q" />
          ) : (
            <DataTable
              rows={studentStats}
              keyField="_key"
              columns={[
                { key: 'total', header: 'Jami', className: 'text-center', render: r => <span className="mono">{r.total}</span> },
                { key: 'present', header: '✅ Keldi', className: 'text-center', render: r => <span className="mono text-emerald-500">{r.present}</span> },
                { key: 'absent', header: '❌ Qoldirdi', className: 'text-center', render: r => <span className="mono text-red-500 font-bold">{r.absent}</span> },
                { key: 'late', header: '⏰ Kech', className: 'text-center', cardHidden: true, render: r => <span className="mono text-amber-500">{r.late}</span> },
                { key: 'excused', header: '📋 Uzrli', className: 'text-center', cardHidden: true, render: r => <span className="mono text-blue-500">{r.excused}</span> },
                {
                  key: 'percent', header: 'Davomat %', className: 'text-center',
                  render: r => <Badge color={r.percent >= 80 ? 'green' : r.percent >= 50 ? 'orange' : 'red'}>{r.percent}%</Badge>,
                },
              ]}
              renderCardTitle={r => r.student?.profiles?.full_name}
            />
          )}
        </Card>
      )}
    </div>
  )
}
