import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', centerName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.fullName || !form.centerName || !form.email || !form.password) {
      setError("Barcha maydonlarni to'ldiring")
      return
    }
    if (form.password.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak")
      return
    }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName, form.centerName)
      toast.success("Ro'yxatdan muvaffaqiyatli o'tdingiz!")
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <GraduationCap className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-text">Yangi markaz</h1>
          <p className="text-text2 text-sm mt-1">Admin sifatida ro'yxatdan o'ting</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Ismingiz</label>
            <input
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              placeholder="Ozodbek Raximjonov"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Markaz nomi</label>
            <input
              value={form.centerName}
              onChange={e => update('centerName', e.target.value)}
              placeholder="Yuksalish"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="admin@markaz.uz"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Parol</label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Kamida 6 belgi"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Ro'yxatdan o'tish
          </button>
        </form>

        <p className="text-center text-sm text-text2 mt-5">
          Akkauntingiz bormi?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  )
}
