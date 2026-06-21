import { supabase } from './supabase'

// Admin tomonidan yangi foydalanuvchi (login+parol bilan) yaratish
export async function createUserWithLogin({ email, password, fullName, phone, role, extra }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Tizimga kirilmagan")

  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, fullName, phone, role, extra },
  })

  if (error) {
    // Supabase functions xatosini o'qishga harakat qilamiz
    const msg = data?.error || error.message || "Foydalanuvchi yaratishda xatolik"
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// Admin tomonidan parolni yangilash
export async function resetUserPassword(targetUserId, newPassword) {
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action: 'reset_password', targetUserId, newPassword },
  })
  if (error) throw new Error(data?.error || error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

// Admin tomonidan foydalanuvchini butunlay o'chirish (auth + profil)
export async function deleteUserCompletely(targetUserId) {
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action: 'delete', targetUserId },
  })
  if (error) throw new Error(data?.error || error.message)
  if (data?.error) throw new Error(data.error)
  return data
}
