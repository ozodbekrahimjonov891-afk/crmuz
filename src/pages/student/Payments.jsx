import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Badge, EmptyState, TableSkeleton, StatCard } from '../../components/ui'
import { fmtDate, fmtMoney, MONTHS_UZ, PAYMENT_LABELS } from '../../lib/utils'

export default function StudentPayments() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [studentInfo, setStudentInfo] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data: student } = await supabase
      .from('students')
      .select('id, payment_status, groups(name, monthly_fee)')
      .eq('profile_id', profile.id)
      .single()
    setStudentInfo(student)

    if (student) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student.id)
        .order('payment_date', { ascending: false })
      setPayments(data || [])
    }
    setLoading(false)
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) return <TableSkeleton rows={5} cols={3} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">💰 To'lovlarim</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jami to'langan" value={fmtMoney(totalPaid)} icon="💵" color="green" />
        <StatCard
          label="Holat"
          value={PAYMENT_LABELS[studentInfo?.payment_status]?.text || '—'}
          icon={PAYMENT_LABELS[studentInfo?.payment_status]?.icon}
          color={PAYMENT_LABELS[studentInfo?.payment_status]?.color}
        />
      </div>

      {studentInfo?.groups?.monthly_fee && (
        <Card className="p-4">
          <div className="text-sm text-text2">Oylik to'lov miqdori</div>
          <div className="text-xl font-extrabold mono text-accent">{fmtMoney(studentInfo.groups.monthly_fee)} so'm</div>
        </Card>
      )}

      <Card>
        <CardHeader title="📋 To'lov tarixi" />
        {payments.length === 0 ? (
          <EmptyState icon="💰" text="Hali to'lov yo'q" />
        ) : (
          payments.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-semibold mono text-emerald-500">{fmtMoney(p.amount)} so'm</div>
                <div className="text-xs text-text2">{MONTHS_UZ[p.month - 1]} {p.year} · {fmtDate(p.payment_date)}</div>
              </div>
              <Badge color="green">✅ To'langan</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
