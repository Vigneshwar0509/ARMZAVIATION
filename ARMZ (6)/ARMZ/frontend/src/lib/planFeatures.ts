import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Calendar, Users, Shield, MessageSquare, Target, BarChart3, Briefcase, CreditCard, Plus, User } from 'lucide-react';

export interface PermissionDefinition {
  id: string;
  type: 'student' | 'employer';
  name: string;
  description: string;
  route?: string;
}

export interface EmployerNavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: string;
}

export const STUDENT_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { id: 'job_search', type: 'student', name: 'Job Search', description: 'Access to basic job listings' },
  { id: 'public_profile', type: 'student', name: 'Public Profile', description: 'Visibility in the expert database' },
  { id: 'email_alerts', type: 'student', name: 'Email Alerts', description: 'Standard job notification emails' },
  { id: 'priority_apps', type: 'student', name: 'Priority Applications', description: 'Applications appear at the top for recruiters' },
  { id: 'resume_builder', type: 'student', name: 'Resume Builder', description: 'Access to premium resume templates' },
  { id: 'interview_prep', type: 'student', name: 'Interview Schedule', description: 'Access to interview scheduling and preparation tools' },
  { id: 'messaging', type: 'student', name: 'Direct Messaging', description: 'Chat directly with recruiters' },
  { id: 'linkedin_support', type: 'student', name: 'LinkedIn Support', description: 'Professional profile optimization' },
  { id: 'webinars', type: 'student', name: 'Webinar Access', description: 'Exclusive access to industry webinars' },
  { id: 'mentorship', type: 'student', name: 'Personal Mentorship', description: '1-on-1 sessions with industry experts' },
];

export const EMPLOYER_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { id: 'student_profiles.view', type: 'employer', name: 'Student Profiles', description: 'View candidate profiles and resumes', route: '/employer/applicants' },
  { id: 'student_profiles.contact', type: 'employer', name: 'Contact Students', description: 'Unlock direct candidate contact details' },
  { id: 'recruiter_access', type: 'employer', name: 'Recruiter Access', description: 'Special tools for hiring managers' },
  { id: 'job_posting', type: 'employer', name: 'Job Posting', description: 'Post and manage job listings from your employer dashboard', route: '/employer/post-job' },
  { id: 'interviews.manage', type: 'employer', name: 'Interview Management', description: 'Schedule and manage candidate interviews from your employer dashboard', route: '/employer/interviews' },
  { id: 'custom.campaigns', type: 'employer', name: 'Custom Campaigns', description: 'Launch custom branded recruitment campaigns and employer conclaves', route: '/employer/conclaves' },
  { id: 'analytics.advanced', type: 'employer', name: 'Advanced Analytics', description: 'Access advanced hiring analytics' },
];

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  ...STUDENT_PERMISSION_DEFINITIONS,
  ...EMPLOYER_PERMISSION_DEFINITIONS,
];

export const EMPLOYER_FEATURE_ICONS: Record<string, LucideIcon> = {
  'student_profiles.view': Users,
  'student_profiles.contact': MessageSquare,
  recruiter_access: Shield,
  job_posting: Briefcase,
  'interviews.manage': Calendar,
  'custom.campaigns': Target,
  'analytics.advanced': BarChart3,
};

export const EMPLOYER_NAV_ITEMS: EmployerNavigationItem[] = [
  { path: '/employer', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employer/applicants', label: 'Applicants', icon: Users, requiredPermission: 'student_profiles.view' },
  { path: '/employer/interviews', label: 'Interviews', icon: Calendar, requiredPermission: 'interviews.manage' },
  { path: '/employer/post-job', label: 'Post a Job', icon: Plus, requiredPermission: 'job_posting' },
  { path: '/employer/conclaves', label: 'Conclaves', icon: Target, requiredPermission: 'custom.campaigns' },
  { path: '/employer/profile', label: 'Profile', icon: User },
  { path: '/employer/subscription', label: 'Subscription', icon: CreditCard },
];
