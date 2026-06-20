import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, centers(*)')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, fullName, centerName) {
    // 1. Markaz yaratish
    const { data: center, error: centerErr } = await supabase
      .from('centers')
      .insert({ name: centerName })
      .select()
      .single()
    if (centerErr) throw centerErr

    // 2. Auth foydalanuvchi yaratish
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authErr) throw authErr

    // 3. Profil yaratish (admin sifatida)
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      role: 'admin',
      center_id: center.id,
    })
    if (profileErr) throw profileErr

    // 4. Markazga admin_id qo'shish
    await supabase.from('centers').update({ admin_id: authData.user.id }).eq('id', center.id)

    return authData
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    role: profile?.role,
    centerId: profile?.center_id,
    center: profile?.centers,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile: () => user && loadProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
