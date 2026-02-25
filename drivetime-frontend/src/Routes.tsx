import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { StudentLayout } from './layouts/StudentLayout';
import { InstructorLayout } from './layouts/InstructorLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BookingsManager } from './components/admin/BookingsManager';
import { InstructorsManager } from './components/admin/InstructorsManager';
import { StudentBookingPage } from './pages/student/StudentBookingPage';
import { StudentMyClasses } from './pages/student/StudentMyClasses';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorAvailability } from './pages/instructor/InstructorAvailability';
import { LandingPage } from './pages/public/LandingPage';
import { SchoolRegister } from './pages/public/SchoolRegister';
import { FindSchool } from './pages/public/FindSchool';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { AboutPage } from './pages/public/AboutPage';
import { BlogPage } from './pages/public/BlogPage';
import { ContactPage } from './pages/public/ContactPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';

export function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard-redirect" replace />} />
      <Route path="/register-school" element={<SchoolRegister />} />
      <Route path="/find-school" element={<FindSchool />} />
      <Route path="/login/admin" element={<Navigate to="/find-school" replace />} />
      <Route path="/login/:slug?" element={!user ? <LoginPage /> : <Navigate to="/dashboard-redirect" replace />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Redirect Helper */}
      <Route path="/dashboard-redirect" element={
          !user ? <Navigate to="/login" replace /> :
          user.role === 'student' ? <Navigate to="/student/dashboard" replace /> :
          user.role === 'instructor' ? <Navigate to="/instructor/dashboard" replace /> :
          (user.role === 'admin' || user.role === 'superadmin') ? <Navigate to="/admin/dashboard" replace /> :
          <Navigate to="/login" replace />
      } />

      {/* Student Routes */}
      <Route path="/student" element={user?.role === 'student' ? <StudentLayout /> : <Navigate to="/login" />}>
         <Route path="dashboard" element={<StudentBookingPage />} />
         {/* Assuming Dashboard serves as Booking Page for now or make separate dashboard */}
         <Route path="bookings" element={<StudentMyClasses />} />
         <Route path="progress" element={<div>Progreso (Próximamente)</div>} />
         <Route path="profile" element={<div>Perfil (Próximamente)</div>} />
      </Route>

      {/* Instructor Routes */}
      <Route path="/instructor" element={user?.role === 'instructor' ? <InstructorLayout /> : <Navigate to="/login" />}>
         <Route path="dashboard" element={<InstructorDashboard />} />
         <Route path="students" element={<div>Mis Alumnos (Próximamente)</div>} />
         <Route path="availability" element={<InstructorAvailability />} />
         <Route path="evaluations" element={<div>Evaluaciones (Próximamente)</div>} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={user?.role === 'admin' || user?.role === 'superadmin' ? <AdminLayout /> : <Navigate to="/login" />}>
         <Route path="dashboard" element={<AdminDashboard />} />
         <Route path="bookings" element={<BookingsManager />} />
         <Route path="users" element={<div>Gestión Usuarios</div>} />
         <Route path="instructors" element={<InstructorsManager />} />
         <Route path="config" element={<div>Configuración</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
