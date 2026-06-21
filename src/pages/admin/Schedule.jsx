import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../hooks/useData'
import { Card, CardHeader, EmptyState, TableSkeleton } from '../../components/ui'

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const DAY_SHORT = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']

// Soat 7:00 dan 21:00 gacha, har 1 soat
const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i)

function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function groupAppliesOnDay(group, dayIndex) {
  // dayIndex: 0=Dushanba ... 5=Shanba
  const isOdd = dayIndex % 2 === 0 // Dush(0), Chor(2), Juma(4) -> toq kunlar
  if (group.day_type === 'daily') return true
  if (group.day_type === 'odd') return isOdd
  if (group.day_type === 'even') return !isOdd
  return false
}

const COLORS = [
  { bg: 'rgba(59,130,246,.18)', border: '#3b82f6', text: '#3b82f6' },
  { bg: 'rgba(16,185,129,.18)', border: '#10b981', text: '#10b981' },
  { bg: 'rgba(139,92,246,.18)', border: '#8b5cf6', text: '#8b5cf6' },
  { bg: 'rgba(245,158,11,.18)', border: '#f59e0b', text: '#f59e0b' },
  { bg: 'rgba(236,72,153,.18)', border: '#ec4899', text: '#ec4899' },
  { bg: 'rgba(6,182,212,.18)', border: '#06b6d4', text: '#06b6d4' },
]

export default function AdminSchedule() {
  const { centerId } = useAuth()
  const { groups, loading } = useGroups(centerId)

  const colorMap = useMemo(() => {
    const map = {}
    groups.forEach((g, i) => { map[g.id] = COLORS[i % COLORS.length] })
    return map
  }, [groups])

  // Har bir kun uchun shu kunda bo'ladigan darslarni vaqt bo'yicha tartiblab chiqaramiz
  const dayGroups = useMemo(() => {
    return DAYS.map((_, dayIndex) =>
      groups
        .filter(g => groupAppliesOnDay(g, dayIndex) && g.start_time && g.end_time)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    )
  }, [groups])

  if (loading) return <TableSkeleton rows={6} cols={6} />

  const hasAnyGroup = groups.some(g => g.start_time && g.end_time)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">📅 Dars jadvali</h1>

      {!hasAnyGroup ? (
        <Card><EmptyState icon="📅" text="Hali jadvalga ega guruh yo'q. Guruh qo'shganda vaqt va kunlarni belgilang." /></Card>
      ) : (
        <>
          {/* DESKTOP: haftalik setka */}
          <Card className="hidden md:block overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-6 border-b border-border">
                {DAYS.map(day => (
                  <div key={day} className="px-3 py-3 text-center text-xs font-bold text-text2 uppercase border-r border-border last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-6">
                {dayGroups.map((dayList, dayIndex) => (
                  <div key={dayIndex} className="border-r border-border last:border-r-0 p-2 space-y-2 min-h-[200px]">
                    {dayList.length === 0 ? (
                      <div className="text-xs text-text2 text-center py-6">Dars yo'q</div>
                    ) : (
                      dayList.map(g => {
                        const color = colorMap[g.id]
                        return (
                          <div
                            key={g.id}
                            className="rounded-lg p-2.5 border text-xs"
                            style={{ background: color.bg, borderColor: color.border }}
                          >
                            <div className="font-bold" style={{ color: color.text }}>{g.name}</div>
                            <div className="text-text2 mt-0.5 mono">{g.start_time?.slice(0,5)}–{g.end_time?.slice(0,5)}</div>
                            <div className="text-text2 mt-0.5">📍 {g.room || '—'}</div>
                            <div className="text-text2">{g.teachers?.profiles?.full_name || '—'}</div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* MOBILE: kunlar bo'yicha vertikal ro'yxat */}
          <div className="md:hidden space-y-3">
            {DAYS.map((day, dayIndex) => (
              dayGroups[dayIndex].length > 0 && (
                <Card key={day}>
                  <CardHeader title={day} />
                  <div>
                    {dayGroups[dayIndex].map(g => {
                      const color = colorMap[g.id]
                      return (
                        <div key={g.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                          <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: color.border }} />
                          <div className="flex-1">
                            <div className="text-sm font-bold">{g.name}</div>
                            <div className="text-xs text-text2">📍 {g.room || '—'} · {g.teachers?.profiles?.full_name || '—'}</div>
                          </div>
                          <div className="text-xs font-semibold mono text-right" style={{ color: color.text }}>
                            {g.start_time?.slice(0,5)}<br/>{g.end_time?.slice(0,5)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            ))}
          </div>
        </>
      )}
    </div>
  )
}
