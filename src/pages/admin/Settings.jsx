import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, Button, Input } from '../../components/ui'
import { toast } from 'sonner'

export default function AdminSettings() {
  const { center, centerId, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    name: center?.name || '',
    address: center?.address || '',
    phone: center?.phone || '',
  })
  const [saving, setSaving] = useState(false)

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('centers').update(form).eq('id', centerId)
      if (error) throw error
      toast.success('Sozlamalar saqlandi!')
      refreshProfile()
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-extrabold">⚙️ Tizim sozlamalari</h1>

      <Card>
        <CardHeader title="🏢 Markaz ma'lumotlari" />
        <div className="p-5">
          <Input label="Markaz nomi" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Yuksalish" />
          <Input label="Manzil" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Tashkent, ..." />
          <Input label="Telefon" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+998901234567" />
          <Button onClick={handleSave} loading={saving} className="w-full mt-2">Saqlash</Button>
        </div>
      </Card>
    </div>
  )
}
