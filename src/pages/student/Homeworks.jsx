import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Badge, EmptyState, TableSkeleton } from '../../components/ui'
import { fmtDate } from '../../lib/utils'

export default function StudentHomeworks() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    const { data: student } = await supabase.from('students').select('id').eq('profile_id', profile.id).single()
    if (!student) { setLoading(false); return }
    const { data } = await supabase
      .from('homework_submissions')
      .select('*, homeworks(title, description, due_date, groups(name))')
      .eq('student_id', student.id)
      .order('id', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  if (loading) return <TableSkeleton rows={4} cols={2} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">📚 Vazifalarim</h1>

      <Card>
        {submissions.length === 0 ? (
          <EmptyState icon="📚" text="Hali vazifa berilmagan" />
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="px-5 py-4 border-b border-border last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{sub.homeworks?.title}</span>
                <Badge color={sub.is_done ? 'green' : 'orange'}>
                  {sub.is_done ? '✅ Bajarilgan' : '⏳ Bajarilmagan'}
                </Badge>
              </div>
              {sub.homeworks?.description && (
                <p className="text-sm text-text2 mb-1">{sub.homeworks.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-text2">
                <span>{sub.homeworks?.groups?.name}</span>
                {sub.homeworks?.due_date && <span>Muddat: {fmtDate(sub.homeworks.due_date)}</span>}
              </div>
              {sub.score != null && (
                <div className="mt-2 text-sm font-bold text-accent">Baho: {sub.score}</div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
