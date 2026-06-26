import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CourseDetailPage from "../pages/CourseDetailPage"
import CoursesPage from "../pages/CoursesPage"
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import CalendarPage from "../pages/CalendarPage"
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/courses/:id" element={<PrivateRoute><CourseDetailPage /></PrivateRoute>} />
        <Route path="/courses" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}