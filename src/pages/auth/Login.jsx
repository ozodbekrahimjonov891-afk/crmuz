import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError("Email va parolni kiriting")
      return
    }
    setLoading(true)
    try {
      const { user } = await signIn(email, password)
      // Profil yuklanguncha biroz kutamiz, keyin App.jsx routing hal qiladi
      toast.success("Xush kelibsiz!")
      navigate('/redirect')
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email yoki parol noto\'g\'ri'
        : err.message)
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
          <h1 className="text-2xl font-extrabold text-text">EduCRM</h1>
          <p className="text-text2 text-sm mt-1">O'quv markazi boshqaruv tizimi</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@markaz.uz"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text2 mb-1.5 block">Parol</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
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
            Kirish
          </button>
        </form>

        <p className="text-center text-xs text-text2 mt-5">
          Login ma'lumotlaringiz yo'qmi? Administratoringizga murojaat qiling.
        </p>
      </div>
    </div>
  )
}
