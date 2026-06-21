import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import RoleRedirect from './pages/RoleRedirect'

import Login from './pages/auth/Login'

import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminTeachers from './pages/admin/Teachers'
import AdminGroups from './pages/admin/Groups'
import AdminSchedule from './pages/admin/Schedule'
import AdminPayments from './pages/admin/Payments'
import AdminAttendance from './pages/admin/Attendance'
import AdminReports from './pages/admin/Reports'
import AdminNotifications from './pages/admin/Notifications'
import AdminSettings from './pages/admin/Settings'

import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherGroups from './pages/teacher/Groups'
import TeacherSchedule from './pages/teacher/Schedule'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherHomeworks from './pages/teacher/Homeworks'

import StudentDashboard from './pages/student/Dashboard'
import StudentAttendance from './pages/student/Attendance'
import StudentPayments from './pages/student/Payments'
import StudentHomeworks from './pages/student/Homeworks'

import ParentDashboard from './pages/parent/Dashboard'
import ParentChild from './pages/parent/Child'
import ParentAttendance from './pages/parent/Attendance'
import ParentPayments from './pages/parent/Payments'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" theme="dark" richColors />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/redirect" element={<RoleRedirect />} />

          {/* ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/teachers" element={<AdminTeachers />} />
            <Route path="/admin/groups" element={<AdminGroups />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* TEACHER */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/groups" element={<TeacherGroups />} />
            <Route path="/teacher/schedule" element={<TeacherSchedule />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/homeworks" element={<TeacherHomeworks />} />
          </Route>

          {/* STUDENT */}
          <Route element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/payments" element={<StudentPayments />} />
            <Route path="/student/homeworks" element={<StudentHomeworks />} />
          </Route>

          {/* PARENT */}
          <Route element={<ProtectedRoute allowedRoles={['parent']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/child" element={<ParentChild />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/payments" element={<ParentPayments />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
