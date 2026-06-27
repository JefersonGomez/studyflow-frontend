import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import CourseDetailPage from "../pages/CourseDetailPage"
import CoursesPage from "../pages/CoursesPage"
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import CalendarPage from "../pages/CalendarPage"
import TasksPage from '../pages/TasksPage'
import NotesPage from '../pages/NotesPage'
import CourseWhiteboardsPage from "../pages/CourseWhiteboardsPage";

// ✅ Variantes SUTILES: Menos movimiento vertical para evitar fondo blanco
// ✅ Nueva variante sin "golpes" ni rebotes
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 6 // Reducido de 8px a 6px para ser más sutil
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    // Curva "easeOutQuart": empieza suave, acelera un poco y frena MUY gradualmente
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -4, 
    transition: { 
      duration: 0.25, 
      ease: [0.55, 0.085, 0.68, 0.53] // EaseInCubic: salida natural hacia arriba
    } 
  }
};
// AppRoutes.jsx
const fadeVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: "100vh", background: "#0f0f0f" }}
    >
      {children}
    </motion.div>
  );
}
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  const location = useLocation();

  return (
    // ✅ initial={false} evita animación brusca al recargar la página
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute><AnimatedPage><DashboardPage /></AnimatedPage></PrivateRoute>
        } />
        
        <Route path="/courses" element={
          <PrivateRoute><AnimatedPage><CoursesPage /></AnimatedPage></PrivateRoute>
        } />
        
        <Route path="/courses/:id" element={
          <PrivateRoute><AnimatedPage><CourseDetailPage /></AnimatedPage></PrivateRoute>
        } />
        
        <Route path="/calendar" element={
          <PrivateRoute><AnimatedPage><CalendarPage /></AnimatedPage></PrivateRoute>
        } />
        
        <Route path="/tasks" element={
          <PrivateRoute><AnimatedPage><TasksPage /></AnimatedPage></PrivateRoute>
        } />
        
        <Route path="/notes" element={
          <PrivateRoute><AnimatedPage><NotesPage /></AnimatedPage></PrivateRoute>
        } />
        
        <Route path="/courses/:id/whiteboards" element={
          <PrivateRoute><AnimatedPage><CourseWhiteboardsPage /></AnimatedPage></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}