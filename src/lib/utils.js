import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function fmtMoney(n) {
  return Number(n || 0).toLocaleString('uz-UZ')
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-UZ')
}

export const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
]

export const DAYS_UZ = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak']

export const PAYMENT_LABELS = {
  paid: { text: "To'langan", color: 'green', icon: '✅' },
  debt: { text: 'Qarz', color: 'red', icon: '❌' },
  pending: { text: 'Kutilmoqda', color: 'orange', icon: '⏳' },
}

export const ATTENDANCE_LABELS = {
  present: { text: 'Keldi', color: 'green', icon: '✅' },
  absent: { text: 'Kelmadi', color: 'red', icon: '❌' },
  late: { text: 'Kech keldi', color: 'orange', icon: '⏰' },
  excused: { text: "Uzrli", color: 'blue', icon: '📋' },
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  teacher: "O'qituvchi",
  student: "O'quvchi",
  parent: 'Ota-ona',
}

export function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase()
}

export function calculateAttendancePercent(records) {
  if (!records || records.length === 0) return 0
  const present = records.filter(r => r.status === 'present' || r.status === 'late').length
  return Math.round((present / records.length) * 100)
}
