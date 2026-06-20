import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export function useStudents(centerId) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles!students_profile_id_fkey(full_name, phone),
        groups(name, monthly_fee, room),
        parent:profiles!students_parent_id_fkey(full_name, phone)
      `)
      .eq('center_id', centerId)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Xatolik: ' + error.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }, [centerId])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  async function createStudent(payload) {
    const { error } = await supabase.from('students').insert(payload)
    if (error) throw error
    await fetchStudents()
  }

  async function updateStudent(id, payload) {
    const { error } = await supabase.from('students').update(payload).eq('id', id)
    if (error) throw error
    await fetchStudents()
  }

  async function deleteStudent(id) {
    // Soft delete
    const { error } = await supabase.from('students').update({ is_active: false }).eq('id', id)
    if (error) throw error
    await fetchStudents()
  }

  return { students, loading, fetchStudents, createStudent, updateStudent, deleteStudent }
}

export function useTeachers(centerId) {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTeachers = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('teachers')
      .select('*, profiles(full_name, phone)')
      .eq('center_id', centerId)
      .order('created_at', { ascending: false })
    if (error) toast.error('Xatolik: ' + error.message)
    else setTeachers(data || [])
    setLoading(false)
  }, [centerId])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  async function createTeacher(payload) {
    const { error } = await supabase.from('teachers').insert(payload)
    if (error) throw error
    await fetchTeachers()
  }

  async function updateTeacher(id, payload) {
    const { error } = await supabase.from('teachers').update(payload).eq('id', id)
    if (error) throw error
    await fetchTeachers()
  }

  async function deleteTeacher(id) {
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) throw error
    await fetchTeachers()
  }

  return { teachers, loading, fetchTeachers, createTeacher, updateTeacher, deleteTeacher }
}

export function useGroups(centerId) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('groups')
      .select('*, teachers(profiles(full_name)), students(count)')
      .eq('center_id', centerId)
      .order('created_at', { ascending: false })
    if (error) toast.error('Xatolik: ' + error.message)
    else setGroups(data || [])
    setLoading(false)
  }, [centerId])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  async function createGroup(payload) {
    const { error } = await supabase.from('groups').insert(payload)
    if (error) throw error
    await fetchGroups()
  }

  async function updateGroup(id, payload) {
    const { error } = await supabase.from('groups').update(payload).eq('id', id)
    if (error) throw error
    await fetchGroups()
  }

  async function deleteGroup(id) {
    const { error } = await supabase.from('groups').update({ is_active: false }).eq('id', id)
    if (error) throw error
    await fetchGroups()
  }

  return { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup }
}

export function usePayments(centerId) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(profiles!students_profile_id_fkey(full_name), groups(name))')
      .eq('center_id', centerId)
      .order('payment_date', { ascending: false })
    if (error) toast.error('Xatolik: ' + error.message)
    else setPayments(data || [])
    setLoading(false)
  }, [centerId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function createPayment(payload) {
    const { error } = await supabase.from('payments').insert(payload)
    if (error) throw error
    // O'quvchining to'lov holatini yangilash
    if (payload.student_id) {
      await supabase.from('students').update({ payment_status: 'paid' }).eq('id', payload.student_id)
    }
    await fetchPayments()
  }

  async function deletePayment(id) {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) throw error
    await fetchPayments()
  }

  return { payments, loading, fetchPayments, createPayment, deletePayment }
}

export function useAttendance(centerId, { groupId, date } = {}) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    let query = supabase
      .from('attendance')
      .select('*, students(profiles!students_profile_id_fkey(full_name)), groups(name, room)')
      .eq('center_id', centerId)
    if (groupId) query = query.eq('group_id', groupId)
    if (date) query = query.eq('date', date)
    const { data, error } = await query.order('date', { ascending: false })
    if (error) toast.error('Xatolik: ' + error.message)
    else setRecords(data || [])
    setLoading(false)
  }, [centerId, groupId, date])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function markAttendance(studentId, groupId, date, status, markedBy, note = '') {
    const { error } = await supabase
      .from('attendance')
      .upsert(
        {
          center_id: centerId,
          student_id: studentId,
          group_id: groupId,
          date,
          status,
          note,
          marked_by: markedBy,
        },
        { onConflict: 'student_id,date,group_id' }
      )
    if (error) throw error
    await fetchRecords()
  }

  return { records, loading, fetchRecords, markAttendance }
}

// O'quvchining barcha davomat tarixini olish (statistik hisoblash uchun)
export async function fetchStudentAttendanceHistory(studentId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, groups(name, room)')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export function useHomeworks(centerId, groupId) {
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHomeworks = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    let query = supabase
      .from('homeworks')
      .select('*, groups(name), homework_submissions(*)')
      .eq('center_id', centerId)
    if (groupId) query = query.eq('group_id', groupId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) toast.error('Xatolik: ' + error.message)
    else setHomeworks(data || [])
    setLoading(false)
  }, [centerId, groupId])

  useEffect(() => { fetchHomeworks() }, [fetchHomeworks])

  async function createHomework(payload) {
    const { data, error } = await supabase.from('homeworks').insert(payload).select().single()
    if (error) throw error
    // Avtomatik barcha guruh o'quvchilari uchun submission yaratish
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('group_id', payload.group_id)
    if (students?.length) {
      await supabase.from('homework_submissions').insert(
        students.map(s => ({ homework_id: data.id, student_id: s.id }))
      )
    }
    await fetchHomeworks()
  }

  async function updateSubmission(submissionId, payload) {
    const { error } = await supabase
      .from('homework_submissions')
      .update(payload)
      .eq('id', submissionId)
    if (error) throw error
    await fetchHomeworks()
  }

  return { homeworks, loading, fetchHomeworks, createHomework, updateSubmission }
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
    if (!error) setNotifications(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    await fetchNotifications()
  }

  async function sendNotification(payload) {
    const { error } = await supabase.from('notifications').insert(payload)
    if (error) throw error
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, loading, fetchNotifications, markRead, sendNotification, unreadCount }
}
