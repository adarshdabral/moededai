import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { GuestRoute } from '@/components/layout/GuestRoute';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/layout/PageLoader';
import { RootRedirect } from '@/components/layout/RootRedirect';

const LoginPage = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPassword').then((m) => ({ default: m.ResetPasswordPage }))
);

const NotFoundPage = lazy(() => import('@/pages/shared/NotFound').then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('@/pages/shared/Forbidden').then((m) => ({ default: m.ForbiddenPage })));
const UnauthorizedPage = lazy(() =>
  import('@/pages/shared/Unauthorized').then((m) => ({ default: m.UnauthorizedPage }))
);
const ServerErrorPage = lazy(() =>
  import('@/pages/shared/ServerError').then((m) => ({ default: m.ServerErrorPage }))
);
const MaintenancePage = lazy(() =>
  import('@/pages/shared/Maintenance').then((m) => ({ default: m.MaintenancePage }))
);

// ---- student ----
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard').then((m) => ({ default: m.StudentDashboardPage })));
const AiTutorPage = lazy(() => import('@/pages/student/AiTutor').then((m) => ({ default: m.AiTutorPage })));
const StudentCoursesPage = lazy(() => import('@/pages/student/Courses').then((m) => ({ default: m.StudentCoursesPage })));
const StudentCourseDetailPage = lazy(() =>
  import('@/pages/student/CourseDetail').then((m) => ({ default: m.StudentCourseDetailPage }))
);
const TopicDetailPage = lazy(() => import('@/pages/student/TopicDetail').then((m) => ({ default: m.TopicDetailPage })));
const TakeTestPage = lazy(() => import('@/pages/student/TakeTest').then((m) => ({ default: m.TakeTestPage })));
const AttemptResultPage = lazy(() =>
  import('@/pages/student/AttemptResult').then((m) => ({ default: m.AttemptResultPage }))
);
const KnowledgeScorePage = lazy(() =>
  import('@/pages/student/KnowledgeScore').then((m) => ({ default: m.KnowledgeScorePage }))
);
const StudentAnalyticsPage = lazy(() =>
  import('@/pages/student/Analytics').then((m) => ({ default: m.StudentAnalyticsPage }))
);
const AssessmentsPage = lazy(() => import('@/pages/student/Assessments').then((m) => ({ default: m.AssessmentsPage })));
const AssessmentDetailPage = lazy(() =>
  import('@/pages/student/AssessmentDetail').then((m) => ({ default: m.AssessmentDetailPage }))
);
const StudentDoubtsPage = lazy(() => import('@/pages/student/Doubts').then((m) => ({ default: m.StudentDoubtsPage })));
const NotificationsPage = lazy(() =>
  import('@/pages/student/Notifications').then((m) => ({ default: m.NotificationsPage }))
);
const ProfilePage = lazy(() => import('@/pages/student/Profile').then((m) => ({ default: m.ProfilePage })));
const StudentSettingsPage = lazy(() =>
  import('@/pages/student/Settings').then((m) => ({ default: m.StudentSettingsPage }))
);

// ---- teacher ----
const TeacherDashboard = lazy(() => import('@/pages/teacher/Dashboard').then((m) => ({ default: m.TeacherDashboardPage })));
const TeacherStudentsPage = lazy(() => import('@/pages/teacher/Students').then((m) => ({ default: m.TeacherStudentsPage })));
const StudentDetailPage = lazy(() => import('@/pages/teacher/StudentDetail').then((m) => ({ default: m.StudentDetailPage })));
const TeacherCoursesPage = lazy(() => import('@/pages/teacher/Courses').then((m) => ({ default: m.TeacherCoursesPage })));
const TeacherCourseDetailPage = lazy(() =>
  import('@/pages/teacher/CourseDetail').then((m) => ({ default: m.TeacherCourseDetailPage }))
);
const TeacherDoubtsPage = lazy(() => import('@/pages/teacher/Doubts').then((m) => ({ default: m.TeacherDoubtsPage })));
const TeacherDoubtDetailPage = lazy(() =>
  import('@/pages/teacher/DoubtDetail').then((m) => ({ default: m.TeacherDoubtDetailPage }))
);
const TeacherReportsPage = lazy(() => import('@/pages/teacher/Reports').then((m) => ({ default: m.TeacherReportsPage })));
const TeacherNotificationsPage = lazy(() =>
  import('@/pages/teacher/Notifications').then((m) => ({ default: m.TeacherNotificationsPage }))
);
const TeacherSettingsPage = lazy(() =>
  import('@/pages/teacher/Settings').then((m) => ({ default: m.TeacherSettingsPage }))
);

// ---- admin ----
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/Users').then((m) => ({ default: m.AdminUsersPage })));
const AdminCoursesPage = lazy(() => import('@/pages/admin/Courses').then((m) => ({ default: m.AdminCoursesPage })));
const AdminCourseDetailPage = lazy(() =>
  import('@/pages/admin/CourseDetail').then((m) => ({ default: m.AdminCourseDetailPage }))
);
const AdminReportsPage = lazy(() => import('@/pages/admin/Reports').then((m) => ({ default: m.AdminReportsPage })));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/Analytics').then((m) => ({ default: m.AdminAnalyticsPage })));
const IdentityMappingPage = lazy(() =>
  import('@/pages/admin/IdentityMapping').then((m) => ({ default: m.IdentityMappingPage }))
);
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogs').then((m) => ({ default: m.AuditLogsPage })));
const AdminNotificationsPage = lazy(() =>
  import('@/pages/admin/Notifications').then((m) => ({ default: m.AdminNotificationsPage }))
);
const PlatformSettingsPage = lazy(() =>
  import('@/pages/admin/PlatformSettings').then((m) => ({ default: m.PlatformSettingsPage }))
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<AppShell />}>
            <Route index element={<StudentDashboard />} />
            <Route path="ai-tutor" element={<AiTutorPage />} />
            <Route path="ai-tutor/:conversationId" element={<AiTutorPage />} />
            <Route path="courses" element={<StudentCoursesPage />} />
            <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
            <Route path="courses/:courseId/topics/:topicId" element={<TopicDetailPage />} />
            <Route path="attempts/:attemptId/take" element={<TakeTestPage />} />
            <Route path="attempts/:attemptId" element={<AttemptResultPage />} />
            <Route path="knowledge-score" element={<KnowledgeScorePage />} />
            <Route path="analytics" element={<StudentAnalyticsPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="assessments/:assessmentId" element={<AssessmentDetailPage />} />
            <Route path="doubts" element={<StudentDoubtsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<AppShell />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudentsPage />} />
            <Route path="students/:studentId" element={<StudentDetailPage />} />
            <Route path="courses" element={<TeacherCoursesPage />} />
            <Route path="courses/:courseId" element={<TeacherCourseDetailPage />} />
            <Route path="doubts" element={<TeacherDoubtsPage />} />
            <Route path="doubts/:doubtId" element={<TeacherDoubtDetailPage />} />
            <Route path="reports" element={<TeacherReportsPage />} />
            <Route path="notifications" element={<TeacherNotificationsPage />} />
            <Route path="settings" element={<TeacherSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/:courseId" element={<AdminCourseDetailPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="identity-mapping" element={<IdentityMappingPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<PlatformSettingsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
