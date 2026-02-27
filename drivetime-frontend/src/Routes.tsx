import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { PublicLayout } from './layouts/PublicLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { InstructorLayout } from './layouts/InstructorLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BookingsManager } from './components/admin/BookingsManager';
import { InstructorsManager } from './components/admin/InstructorsManager';
import { UsersManager } from './components/admin/UsersManager';
import { ReviewsManager } from './components/admin/ReviewsManager';
import { TenantSettings } from './components/admin/TenantSettings';
import { VehiclesManager } from './components/admin/VehiclesManager';
import { PacksManager } from './components/admin/PacksManager';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentBookingPage } from './pages/student/StudentBookingPage';
import { StudentMyClasses } from './pages/student/StudentMyClasses';
import { StudentPayments } from './pages/student/StudentPayments';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorAvailability } from './pages/instructor/InstructorAvailability';
import { InstructorStudents } from './pages/instructor/InstructorStudents';
import { InstructorPending } from './pages/instructor/InstructorPending';
import { LandingPage } from './pages/public/LandingPage';
import { SchoolRegister } from './pages/public/SchoolRegister';
import { FindSchool } from './pages/public/FindSchool';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { AboutPage } from './pages/public/AboutPage';
import { BlogPage } from './pages/public/BlogPage';
import { ContactPage } from './pages/public/ContactPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { ProfilePage } from './pages/common/ProfilePage';

export function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard-redirect" replace />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      <Route path="/register-school" element={<SchoolRegister />} />
      <Route path="/find-school" element={<FindSchool />} />
      <Route path="/login/admin" element={<Navigate to="/find-school" replace />} />
      <Route path="/login/:slug?" element={!user ? <LoginPage /> : <Navigate to="/dashboard-redirect" replace />} />

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
         <Route path="dashboard" element={<StudentDashboard />} />
         <Route path="book" element={<StudentBookingPage />} />
         <Route path="bookings" element={<StudentMyClasses />} />
         <Route path="payments" element={<StudentPayments />} />
         <Route path="progress" element={<div>Progreso (Próximamente)</div>} />
         <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Instructor Routes */}
      <Route path="/instructor" element={user?.role === 'instructor' ? <InstructorLayout /> : <Navigate to="/login" />}>
         <Route path="dashboard" element={<InstructorDashboard />} />
         <Route path="pendientes" element={<InstructorPending />} />
         <Route path="students" element={<InstructorStudents />} />
         <Route path="availability" element={<InstructorAvailability />} />
         <Route path="evaluations" element={<div>Evaluaciones (Próximamente)</div>} />
         <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={user?.role === 'admin' || user?.role === 'superadmin' ? <AdminLayout /> : <Navigate to="/login" />}>
         <Route path="dashboard" element={<AdminDashboard />} />
         <Route path="bookings" element={<BookingsManager />} />
         <Route path="reviews" element={<ReviewsManager />} />
         <Route path="users" element={<UsersManager />} />
         <Route path="instructors" element={<InstructorsManager />} />
         <Route path="vehicles" element={<VehiclesManager />} />
         <Route path="packs" element={<PacksManager />} />
         <Route path="config" element={<TenantSettings />} />
         <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
