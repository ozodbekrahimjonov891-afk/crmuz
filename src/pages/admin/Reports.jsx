import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Button, Skeleton, EmptyState } from '../../components/ui'
import { fmtMoney, MONTHS_UZ } from '../../lib/utils'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

export default function AdminReports() {
  const { centerId, center } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!centerId) return
    loadData()
  }, [centerId])

  async function loadData() {
    setLoading(true)
    const [paymentsRes, studentsRes, groupsRes, attendanceRes] = await Promise.all([
      supabase.from('payments').select('amount, month, year, payment_date').eq('center_id', centerId),
      supabase.from('students').select('id, payment_status, created_at, group_id').eq('center_id', centerId).eq('is_active', true),
      supabase.from('groups').select('id, name').eq('center_id', centerId),
      supabase.from('attendance').select('status, date').eq('center_id', centerId),
    ])

    // Oylik daromad (oxirgi 6 oy)
    const incomeByMonth = {}
    ;(paymentsRes.data || []).forEach(p => {
      const key = `${MONTHS_UZ[p.month - 1]?.slice(0,3)} ${p.year}`
      incomeByMonth[key] = (incomeByMonth[key] || 0) + Number(p.amount)
    })
    const incomeChart = Object.entries(incomeByMonth).slice(-6).map(([name, value]) => ({ name, value }))

    // O'quvchilar dinamikasi (oylar bo'yicha qo'shilgan)
    const studentsByMonth = {}
    ;(studentsRes.data || []).forEach(s => {
      const d = new Date(s.created_at)
      const key = `${MONTHS_UZ[d.getMonth()]?.slice(0,3)} ${d.getFullYear()}`
      studentsByMonth[key] = (studentsByMonth[key] || 0) + 1
    })
    const studentsChart = Object.entries(studentsByMonth).slice(-6).map(([name, value]) => ({ name, value }))

    // To'lov holati taqsimoti
    const paid = (studentsRes.data || []).filter(s => s.payment_status === 'paid').length
    const debt = (studentsRes.data || []).filter(s => s.payment_status === 'debt').length
    const pending = (studentsRes.data || []).filter(s => s.payment_status === 'pending').length
    const paymentPie = [
      { name: "To'langan", value: paid },
      { name: 'Qarz', value: debt },
      { name: 'Kutilmoqda', value: pending },
    ]

    // Davomat statistikasi
    const totalAtt = (attendanceRes.data || []).length
    const presentAtt = (attendanceRes.data || []).filter(a => a.status === 'present').length
    const attendancePercent = totalAtt ? Math.round((presentAtt / totalAtt) * 100) : 0

    setData({
      incomeChart, studentsChart, paymentPie, attendancePercent,
      totalStudents: studentsRes.data?.length || 0,
      totalIncome: (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0),
      groups: groupsRes.data || [],
      rawStudents: studentsRes.data || [],
      rawPayments: paymentsRes.data || [],
    })
    setLoading(false)
  }

  function exportExcel() {
    if (!data) return
    const wb = XLSX.utils.book_new()

    const studentsSheet = XLSX.utils.json_to_sheet(
      data.rawStudents.map(s => ({
        'Holat': s.payment_status,
        "Qo'shilgan sana": new Date(s.created_at).toLocaleDateString('uz-UZ'),
      }))
    )
    XLSX.utils.book_append_sheet(wb, studentsSheet, "O'quvchilar")

    const paymentsSheet = XLSX.utils.json_to_sheet(
      data.rawPayments.map(p => ({
        'Summa': p.amount,
        'Oy': MONTHS_UZ[p.month - 1],
        'Yil': p.year,
        'Sana': new Date(p.payment_date).toLocaleDateString('uz-UZ'),
      }))
    )
    XLSX.utils.book_append_sheet(wb, paymentsSheet, "To'lovlar")

    XLSX.writeFile(wb, `${center?.name || 'EduCRM'}_hisobot.xlsx`)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">📈 Hisobotlar</h1>
        <Button onClick={exportExcel}><Download size={16} /> Excel export</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="💵 Oylik daromad" />
          <div className="p-4 h-64">
            {data.incomeChart.length === 0 ? (
              <EmptyState icon="💵" text="Ma'lumot yo'q" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incomeChart}>
                  <XAxis dataKey="name" stroke="currentColor" fontSize={11} opacity={0.5} />
                  <YAxis stroke="currentColor" fontSize={11} opacity={0.5} />
                  <Tooltip formatter={(v) => [fmtMoney(v) + " so'm", 'Daromad']} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="🎓 O'quvchilar dinamikasi" />
          <div className="p-4 h-64">
            {data.studentsChart.length === 0 ? (
              <EmptyState icon="🎓" text="Ma'lumot yo'q" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.studentsChart}>
                  <XAxis dataKey="name" stroke="currentColor" fontSize={11} opacity={0.5} />
                  <YAxis stroke="currentColor" fontSize={11} opacity={0.5} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="💰 To'lov holati taqsimoti" />
          <div className="p-4 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.paymentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.paymentPie.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="✅ Umumiy davomat foizi" />
          <div className="p-8 flex flex-col items-center justify-center h-64">
            <div className="text-5xl font-extrabold mono text-emerald-500 mb-2">{data.attendancePercent}%</div>
            <div className="text-sm text-text2">Barcha guruhlar bo'yicha o'rtacha</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
