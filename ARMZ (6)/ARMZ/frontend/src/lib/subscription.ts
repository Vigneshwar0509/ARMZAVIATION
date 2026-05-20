import { User } from '@/src/types';

export const ONBOARDING_ROUTE = '/onboarding/plan';

const INACTIVE_SUBSCRIPTIONS = new Set(['', 'free']);

const STUDENT_BASIC_ROUTES = [
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/jobs',
  '/dashboard/subscriptions',
  '/dashboard/subscription',
  '/dashboard/notifications',
  '/dashboard/settings',
];

const STUDENT_PREMIUM_ROUTES = [
  ...STUDENT_BASIC_ROUTES,
  '/dashboard/resume',
  '/dashboard/interviews',
  '/dashboard/applications',
  '/dashboard/courses',
  '/dashboard/assessments',
];

const STUDENT_FULL_ACCESS_ROUTES = [
  ...STUDENT_PREMIUM_ROUTES,
  '/dashboard/linkedin',
  '/dashboard/webinars',
];

const STUDENT_ROUTE_ACCESS: Record<string, string[]> = {
  basic: STUDENT_BASIC_ROUTES,
  prime: STUDENT_BASIC_ROUTES,
  premium: STUDENT_PREMIUM_ROUTES,
  all_sections: STUDENT_FULL_ACCESS_ROUTES,
  all_sections_499: STUDENT_FULL_ACCESS_ROUTES,
  placement: STUDENT_FULL_ACCESS_ROUTES,
};

const STUDENT_PLAN_TIERS: Record<string, number> = {
  basic: 1,
  prime: 1,
  premium: 2,
  all_sections: 3,
  all_sections_499: 3,
  placement: 4,
};

export const getStudentPlanTier = (planCode?: string | null): number => {
  return STUDENT_PLAN_TIERS[normalizeStoredPlanCode(planCode)] ?? 0;
};

export const isStudentPlanUpgrade = (currentPlanCode?: string | null, targetPlanCode?: string | null): boolean => {
  const currentTier = getStudentPlanTier(currentPlanCode);
  const targetTier = getStudentPlanTier(targetPlanCode);
  if (currentTier === 0 || targetTier === 0) return true;
  return targetTier > currentTier;
};

const UNKNOWN_STUDENT_PAID_ROUTES = STUDENT_PREMIUM_ROUTES;

const EMPLOYER_ROUTE_ACCESS: Record<string, string[]> = {
  recruiter_starter: ['/employer', '/employer/profile', '/employer/subscription', '/employer/post-job', '/employer/applicants'],
  recruiter_growth: ['/employer', '/employer/profile', '/employer/subscription', '/employer/post-job', '/employer/applicants', '/employer/interviews'],
  recruiter_enterprise: ['/employer', '/employer/profile', '/employer/subscription', '/employer/post-job', '/employer/applicants', '/employer/interviews', '/employer/conclaves'],
};

const EMPLOYER_PLAN_CODE_ALIASES: Record<string, string> = {
  starter: 'recruiter_starter',
  recruiter_starter: 'recruiter_starter',
  professional: 'recruiter_growth',
  recruiter_growth: 'recruiter_growth',
  growth: 'recruiter_growth',
  enterprise: 'recruiter_enterprise',
  recruiter_enterprise: 'recruiter_enterprise',
};

export const normalizePlanCode = (value?: string | null): string => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

export const normalizeStoredPlanCode = (value?: string | null): string => normalizePlanCode(value).replace(/_plan$/, '');

export const normalizePlanReference = (value?: string | null): string => {
  const normalized = normalizeStoredPlanCode(value);
  return EMPLOYER_PLAN_CODE_ALIASES[normalized] ?? normalized;
};

export const hasActiveSubscription = (user?: User | null): boolean => {
  if (!user) return false;
  return !INACTIVE_SUBSCRIPTIONS.has(normalizeStoredPlanCode(user.subscription));
};

const ROUTE_PERMISSION_MAP: Record<string, string | string[]> = {
  '/dashboard/resume': 'resume_builder',
  '/dashboard/linkedin': 'linkedin_support',
  '/dashboard/interviews': 'interview_prep',
  '/dashboard/applications': ['apply_jobs', 'apply_internships'],
  '/dashboard/webinars': 'webinars',
  '/employer/post-job': 'job_posting',
  '/employer/interviews': 'interviews.manage',
  '/employer/conclaves': 'custom.campaigns',
};

const getRoutePermissionRequirement = (pathname: string): string | string[] | undefined => {
  const normalizedPath = pathname.toLowerCase();

  return Object.entries(ROUTE_PERMISSION_MAP).find(([routePrefix]) => {
    if (normalizedPath === routePrefix) return true;
    if (routePrefix === '/dashboard' || routePrefix === '/employer') return false;
    return normalizedPath.startsWith(`${routePrefix}/`);
  })?.[1];
};

const userHasPermissionsForRoute = (pathname: string, permissions: string[]): boolean => {
  const requiredPermission = getRoutePermissionRequirement(pathname);
  if (!requiredPermission) return false;

  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((permission) => permissions.includes(permission));
  }

  return permissions.includes(requiredPermission);
};

export const requiresSubscriptionOnboarding = (user?: User | null): boolean => {
  if (!user || user.role === 'admin') return false;
  return !user.isVerified || !hasActiveSubscription(user);
};

export const getSubscriptionRouteForRole = (role?: string): string => {
  if (role === 'employer') return '/employer/subscription';
  return '/dashboard/subscriptions';
};

export const getDefaultRouteForUser = (user?: User | null): string => {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin';
  if (requiresSubscriptionOnboarding(user)) return ONBOARDING_ROUTE;
  return user.role === 'employer' ? '/employer' : '/dashboard';
};

export const canAccessRouteForPlan = (
  user: User | null | undefined,
  pathname: string,
  planPermissions?: string[] | null
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (requiresSubscriptionOnboarding(user)) {
    return pathname.startsWith(ONBOARDING_ROUTE);
  }

  const normalizedPath = pathname.toLowerCase();
  const permissionRequired = getRoutePermissionRequirement(normalizedPath);

  if (planPermissions && permissionRequired) {
    return userHasPermissionsForRoute(normalizedPath, planPermissions);
  }

  const planCode = normalizePlanReference(user.subscription);
  const routeMap = user.role === 'employer' ? EMPLOYER_ROUTE_ACCESS : STUDENT_ROUTE_ACCESS;
  const allowedPrefixes = routeMap[planCode];

  const matchesRoute = (prefix: string) => {
    if (normalizedPath === prefix) return true;
    if (prefix === '/dashboard' || prefix === '/employer') return false;
    return normalizedPath.startsWith(`${prefix}/`);
  };

  if (!allowedPrefixes) {
    const fallbackPrefixes = user.role === 'employer'
      ? EMPLOYER_ROUTE_ACCESS.recruiter_starter
      : hasActiveSubscription(user)
        ? UNKNOWN_STUDENT_PAID_ROUTES
        : STUDENT_ROUTE_ACCESS.basic;

    // Unknown active student plans should allow premium student routes,
    // since they are still valid paid subscriptions.
    return fallbackPrefixes.some(matchesRoute);
  }

  return allowedPrefixes.some(matchesRoute);
};
