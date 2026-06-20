import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, StatCard, Badge, Skeleton, EmptyState } from '../../components/ui'
import { fmtMoney, getInitial, PAYMENT_LABELS } from '../../lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function AdminDashboard() {
  const { centerId } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentStudents, setRecentStudents] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!centerId) return
    loadDashboard()
  }, [centerId])

  async function loadDashboard() {
    setLoading(true)

    const [studentsRes, teachersRes, groupsRes, paymentsRes] = await Promise.all([
      supabase.from('students').select('id, payment_status', { count: 'exact' }).eq('center_id', centerId).eq('is_active', true),
      supabase.from('teachers').select('id', { count: 'exact' }).eq('center_id', centerId),
      supabase.from('groups').select('id', { count: 'exact' }).eq('center_id', centerId).eq('is_active', true),
      supabase.from('payments').select('amount, payment_date').eq('center_id', centerId),
    ])

    const totalStudents = studentsRes.count || 0
    const debts = (studentsRes.data || []).filter(s => s.payment_status === 'debt').length
    const totalTeachers = teachersRes.count || 0
    const totalGroups = groupsRes.count || 0

    const now = new Date()
    const thisMonthIncome = (paymentsRes.data || [])
      .filter(p => {
        const d = new Date(p.payment_date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Oxirgi 6 oylik daromad grafigi
    const monthly = {}
    ;(paymentsRes.data || []).forEach(p => {
      const d = new Date(p.payment_date)
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`
      monthly[key] = (monthly[key] || 0) + Number(p.amount)
    })
    const chartData = Object.entries(monthly).slice(-6).map(([name, value]) => ({ name, value }))

    setStats({ totalStudents, debts, totalTeachers, totalGroups, thisMonthIncome })
    setMonthlyData(chartData)

    const { data: recent } = await supabase
      .from('students')
      .select('id, payment_status, profiles!students_profile_id_fkey(full_name), groups(name)')
      .eq('center_id', centerId)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentStudents(recent || [])

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold">📊 Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="O'quvchilar" value={stats.totalStudents} icon="🎓" color="blue" />
        <StatCard label="Bu oylik daromad" value={fmtMoney(stats.thisMonthIncome)} icon="💵" color="green" />
        <StatCard label="Qarzdorlar" value={stats.debts} icon="⚠️" color="orange" />
        <StatCard label="O'qituvchilar" value={stats.totalTeachers} icon="👨‍🏫" color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="📋 Oxirgi qo'shilgan o'quvchilar" />
          {recentStudents.length === 0 ? (
            <EmptyState icon="🎓" text="Hali o'quvchi yo'q" />
          ) : (
            <div>
              {recentStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {getInitial(s.profiles?.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.profiles?.full_name}</div>
                    <div className="text-xs text-text2">{s.groups?.name || 'Guruhsiz'}</div>
                  </div>
                  <Badge color={PAYMENT_LABELS[s.payment_status]?.color}>
                    {PAYMENT_LABELS[s.payment_status]?.icon} {PAYMENT_LABELS[s.payment_status]?.text}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="📈 Oylik daromad dinamikasi" />
          <div className="p-4 h-64">
            {monthlyData.length === 0 ? (
              <EmptyState icon="📈" text="Hali to'lov yo'q" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" stroke="currentColor" fontSize={11} opacity={0.5} />
                  <YAxis stroke="currentColor" fontSize={11} opacity={0.5} />
                  <Tooltip
                    formatter={(v) => [fmtMoney(v) + " so'm", 'Daromad']}
                    contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 8 }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
