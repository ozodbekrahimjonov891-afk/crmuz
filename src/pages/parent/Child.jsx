import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, EmptyState, Skeleton } from '../../components/ui'
import { fmtDate } from '../../lib/utils'

export default function ParentChild() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*, profiles!students_profile_id_fkey(full_name, phone), groups(name, subject, room, start_time, end_time, day_type)')
      .eq('parent_id', profile.id)
    setChildren(data || [])
    setLoading(false)
  }

  if (loading) return <Skeleton className="h-48" />

  const dayTypeLabel = { odd: 'Toq kunlar', even: 'Juft kunlar', daily: 'Har kuni' }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">👶 Farzandim</h1>

      {children.length === 0 ? (
        <Card><EmptyState icon="👶" text="Farzandingiz tizimga ulanmagan" /></Card>
      ) : (
        children.map(child => (
          <Card key={child.id}>
            <CardHeader title={child.profiles?.full_name} />
            <div className="p-5 space-y-3">
              <Row label="Telefon" value={child.profiles?.phone || '—'} />
              <Row label="Tug'ilgan sana" value={fmtDate(child.birth_date)} />
              <Row label="Manzil" value={child.address || '—'} />
              <Row label="Guruh" value={child.groups?.name || '—'} />
              <Row label="Fan" value={child.groups?.subject || '—'} />
              <Row label="Xona" value={child.groups?.room || '—'} />
              <Row label="Dars vaqti" value={child.groups ? `${child.groups.start_time?.slice(0,5)}–${child.groups.end_time?.slice(0,5)} (${dayTypeLabel[child.groups.day_type]})` : '—'} />
              {child.notes && <Row label="Izoh" value={child.notes} />}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
      <span className="text-text2">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
