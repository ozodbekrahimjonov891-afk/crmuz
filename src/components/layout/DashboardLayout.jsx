import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS, getInitial } from '../../lib/utils'
import {
  LayoutDashboard, Users, UserCog, Layers, Wallet, CalendarCheck, Calendar,
  BookOpen, BarChart3, Bell, Settings, LogOut, Moon, Sun, Menu, X
} from 'lucide-react'
import { useEffect } from 'react'

const NAV_ITEMS = {
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students', icon: Users, label: "O'quvchilar" },
    { to: '/admin/teachers', icon: UserCog, label: "O'qituvchilar" },
    { to: '/admin/groups', icon: Layers, label: 'Guruhlar' },
    { to: '/admin/schedule', icon: Calendar, label: 'Dars jadvali' },
    { to: '/admin/payments', icon: Wallet, label: "To'lovlar" },
    { to: '/admin/attendance', icon: CalendarCheck, label: 'Davomat' },
    { to: '/admin/reports', icon: BarChart3, label: 'Hisobotlar' },
    { to: '/admin/notifications', icon: Bell, label: 'Xabarnomalar' },
    { to: '/admin/settings', icon: Settings, label: 'Sozlamalar' },
  ],
  teacher: [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/teacher/groups', icon: Layers, label: "Guruhlarim" },
    { to: '/teacher/schedule', icon: Calendar, label: 'Dars jadvali' },
    { to: '/teacher/attendance', icon: CalendarCheck, label: 'Davomat' },
    { to: '/teacher/homeworks', icon: BookOpen, label: 'Vazifalar' },
  ],
  student: [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/attendance', icon: CalendarCheck, label: 'Davomatim' },
    { to: '/student/payments', icon: Wallet, label: "To'lovlarim" },
    { to: '/student/homeworks', icon: BookOpen, label: 'Vazifalar' },
  ],
  parent: [
    { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/parent/child', icon: Users, label: 'Farzandim' },
    { to: '/parent/attendance', icon: CalendarCheck, label: 'Davomat' },
    { to: '/parent/payments', icon: Wallet, label: "To'lovlar" },
  ],
}

const MOBILE_NAV_LIMIT = 4

export default function DashboardLayout() {
  const { profile, role, signOut, center } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const items = NAV_ITEMS[role] || []
  const mobileItems = items.slice(0, MOBILE_NAV_LIMIT)
  const moreItems = items.slice(MOBILE_NAV_LIMIT)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-surface fixed inset-y-0 left-0">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-extrabold text-white">
            {getInitial(center?.name)}
          </div>
          <div>
            <div className="font-extrabold text-sm">{center?.name || 'EduCRM'}</div>
            <div className="text-xs text-text2">O'quv markazi</div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition ${
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-text2 hover:bg-surface2 hover:text-text'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text2 hover:bg-surface2 transition"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Yorug\' rejim' : 'Qorong\'u rejim'}
          </button>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              {getInitial(profile?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{profile?.full_name}</div>
              <div className="text-[10px] text-cyan-500">{ROLE_LABELS[role]}</div>
            </div>
            <button onClick={handleLogout} title="Chiqish">
              <LogOut size={15} className="text-text2 hover:text-red-500 transition" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
            {getInitial(center?.name)}
          </div>
          <span className="font-bold text-sm">{center?.name || 'EduCRM'}</span>
        </div>
        <button onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
      </header>

      {/* MOBILE SLIDE MENU */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="w-72 bg-surface h-full p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold">Menyu</span>
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {getInitial(profile?.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{profile?.full_name}</div>
                <div className="text-[10px] text-cyan-500">{ROLE_LABELS[role]}</div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 ${
                      isActive ? 'bg-accent/15 text-accent' : 'text-text2'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => setDark(!dark)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text2 mb-2"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              {dark ? "Yorug' rejim" : "Qorong'u rejim"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500"
            >
              <LogOut size={16} /> Chiqish
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 md:p-7 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-surface border-t border-border flex z-40">
        {mobileItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                isActive ? 'text-accent' : 'text-text2'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
        {moreItems.length > 0 && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-text2"
          >
            <Menu size={20} />
            Ko'proq
          </button>
        )}
      </nav>
    </div>
  )
}
