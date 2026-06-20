import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Badge, EmptyState, Skeleton, Select, StatCard } from '../../components/ui'
import { fmtDate, fmtMoney, MONTHS_UZ, PAYMENT_LABELS } from '../../lib/utils'

export default function ParentPayments() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [payments, setPayments] = useState([])
  const [childInfo, setChildInfo] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  useEffect(() => {
    if (selectedChild) loadPayments()
  }, [selectedChild])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('id, payment_status, profiles!students_profile_id_fkey(full_name), groups(monthly_fee)')
      .eq('parent_id', profile.id)
    setChildren(data || [])
    if (data?.length) {
      setSelectedChild(data[0].id)
      setChildInfo(data[0])
    }
    setLoading(false)
  }

  async function loadPayments() {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', selectedChild)
      .order('payment_date', { ascending: false })
    setPayments(data || [])
    setChildInfo(children.find(c => c.id === selectedChild))
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) return <Skeleton className="h-48" />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">💰 To'lovlar</h1>

      {children.length === 0 ? (
        <Card><EmptyState icon="👶" text="Farzandingiz tizimga ulanmagan" /></Card>
      ) : (
        <>
          {children.length > 1 && (
            <Card className="p-4">
              <Select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                {children.map(c => <option key={c.id} value={c.id}>{c.profiles?.full_name}</option>)}
              </Select>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Jami to'langan" value={fmtMoney(totalPaid)} icon="💵" color="green" />
            <StatCard
              label="Holat"
              value={PAYMENT_LABELS[childInfo?.payment_status]?.text || '—'}
              icon={PAYMENT_LABELS[childInfo?.payment_status]?.icon}
              color={PAYMENT_LABELS[childInfo?.payment_status]?.color}
            />
          </div>

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
        </>
      )}
    </div>
  )
}
