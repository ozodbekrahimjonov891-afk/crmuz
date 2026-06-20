import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Button, Input, Select, Modal, EmptyState, TableSkeleton } from '../../components/ui'
import { fmtDate, getInitial } from '../../lib/utils'
import { toast } from 'sonner'
import { Plus, Bell } from 'lucide-react'

export default function AdminNotifications() {
  const { centerId, profile } = useAuth()
  const [sent, setSent] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ recipientId: '', title: '', message: '', type: 'info' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!centerId) return
    loadData()
  }, [centerId])

  async function loadData() {
    setLoading(true)
    const [notifRes, profRes] = await Promise.all([
      supabase.from('notifications').select('*, profiles!notifications_recipient_id_fkey(full_name, role)').eq('center_id', centerId).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, role').eq('center_id', centerId).neq('id', profile.id),
    ])
    setSent(notifRes.data || [])
    setProfiles(profRes.data || [])
    setLoading(false)
  }

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSend() {
    if (!form.recipientId || !form.title || !form.message) {
      toast.error("Barcha maydonlarni to'ldiring")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('notifications').insert({
        center_id: centerId,
        recipient_id: form.recipientId,
        title: form.title,
        message: form.message,
        type: form.type,
      })
      if (error) throw error
      toast.success("Xabar yuborildi!")
      setModalOpen(false)
      setForm({ recipientId: '', title: '', message: '', type: 'info' })
      loadData()
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">🔔 Xabarnomalar</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Xabar yuborish</Button>
      </div>

      <Card>
        <CardHeader title="📤 Yuborilgan xabarlar" />
        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : sent.length === 0 ? (
          <EmptyState icon="🔔" text="Hali xabar yuborilmagan" />
        ) : (
          <div>
            {sent.map(n => (
              <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Bell size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{n.title}</span>
                    <span className="text-xs text-text2">{fmtDate(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-text2 mt-0.5">{n.message}</p>
                  <div className="text-xs text-accent mt-1">
                    → {n.profiles?.full_name} {n.is_read ? '· O\'qilgan ✓' : '· O\'qilmagan'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi xabar yuborish">
        <Select label="Qabul qiluvchi" value={form.recipientId} onChange={e => update('recipientId', e.target.value)}>
          <option value="">-- Tanlang --</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
          ))}
        </Select>
        <Input label="Sarlavha" value={form.title} onChange={e => update('title', e.target.value)} placeholder="To'lov eslatmasi" />
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text2 mb-1.5 block">Xabar matni</label>
          <textarea
            value={form.message}
            onChange={e => update('message', e.target.value)}
            rows={4}
            placeholder="Hurmatli ..., iltimos to'lovni amalga oshiring..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition resize-none"
          />
        </div>
        <Select label="Turi" value={form.type} onChange={e => update('type', e.target.value)}>
          <option value="info">ℹ️ Ma'lumot</option>
          <option value="warning">⚠️ Ogohlantirish</option>
          <option value="payment">💰 To'lov eslatmasi</option>
        </Select>

        <div className="flex gap-3 mt-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Bekor</Button>
          <Button onClick={handleSend} loading={saving} className="flex-1">Yuborish</Button>
        </div>
      </Modal>
    </div>
  )
}
