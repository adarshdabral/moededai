import {
  BarChart3,
  Bell,
  BookOpen,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  MessageCircleQuestion,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  ClipboardList,
  FileWarning,
  KeyRound,
  ScrollText,
  Megaphone,
} from 'lucide-react';
import type { Role } from '@/types/api';

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard, end: true },
    { label: 'AI Tutor', to: '/student/ai-tutor', icon: Sparkles },
    { label: 'Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Knowledge Score', to: '/student/knowledge-score', icon: Gauge },
    { label: 'Analytics', to: '/student/analytics', icon: BarChart3 },
    { label: 'Assessments', to: '/student/assessments', icon: ClipboardList },
    { label: 'Doubts', to: '/student/doubts', icon: MessageCircleQuestion },
    { label: 'Notifications', to: '/student/notifications', icon: Bell },
    { label: 'Settings', to: '/student/settings', icon: Settings },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard, end: true },
    { label: 'Students', to: '/teacher/students', icon: Users },
    { label: 'Courses', to: '/teacher/courses', icon: GraduationCap },
    { label: 'Doubts', to: '/teacher/doubts', icon: MessagesSquare },
    { label: 'Reports', to: '/teacher/reports', icon: FileWarning },
    { label: 'Notifications', to: '/teacher/notifications', icon: Bell },
    { label: 'Settings', to: '/teacher/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Courses', to: '/admin/courses', icon: GraduationCap },
    { label: 'Reports', to: '/admin/reports', icon: FileWarning },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Identity Mapping', to: '/admin/identity-mapping', icon: KeyRound },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
    { label: 'Notifications', to: '/admin/notifications', icon: Megaphone },
    { label: 'Platform Settings', to: '/admin/settings', icon: ShieldCheck },
  ],
};
