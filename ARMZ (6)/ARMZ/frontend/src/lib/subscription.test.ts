import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_ROUTE,
  canAccessRouteForPlan,
  getDefaultRouteForUser,
  getSubscriptionRouteForRole,
  hasActiveSubscription,
  normalizePlanCode,
  normalizeStoredPlanCode,
  requiresSubscriptionOnboarding,
} from './subscription';
import { usePlanStore } from '@/src/store/planStore';

describe('subscription helpers', () => {
  it('normalizes plan codes consistently', () => {
    expect(normalizePlanCode('Recruiter Growth')).toBe('recruiter_growth');
    expect(normalizePlanCode(' premium ')).toBe('premium');
  });

  it('returns true for active paid plans', () => {
    expect(hasActiveSubscription({ subscription: 'premium' } as any)).toBe(true);
    expect(hasActiveSubscription({ subscription: ' PLACEMENT ' } as any)).toBe(true);
  });

  it('flags unpaid users for onboarding', () => {
    expect(requiresSubscriptionOnboarding({ role: 'student', isVerified: true, subscription: 'free' } as any)).toBe(true);
    expect(requiresSubscriptionOnboarding({ role: 'student', isVerified: true, subscription: 'premium' } as any)).toBe(false);
  });

  it('returns role-based subscription routes', () => {
    expect(getSubscriptionRouteForRole('employer')).toBe('/employer/subscription');
    expect(getSubscriptionRouteForRole('student')).toBe('/dashboard/subscriptions');
    expect(getSubscriptionRouteForRole(undefined)).toBe('/dashboard/subscriptions');
  });

  it('normalizes stored plan codes consistently and strips plan suffix', () => {
    expect(normalizeStoredPlanCode('All Sections 499')).toBe('all_sections_499');
    expect(normalizeStoredPlanCode('Basic Plan')).toBe('basic');
  });

  it('computes a default route for authenticated users', () => {
    expect(getDefaultRouteForUser({ role: 'student', isVerified: true, subscription: 'premium' } as any)).toBe('/dashboard');
    expect(getDefaultRouteForUser({ role: 'employer', isVerified: true, subscription: 'free' } as any)).toBe(ONBOARDING_ROUTE);
  });

  it('enforces plan-based route access', () => {
    const premiumUser = { role: 'student', isVerified: true, subscription: 'premium' } as any;
    expect(canAccessRouteForPlan(premiumUser, '/dashboard/courses')).toBe(true);
    expect(canAccessRouteForPlan(premiumUser, '/employer')).toBe(false);
  });

  it('treats unknown active student plans as premium access', () => {
    const unknownPlanUser = { role: 'student', isVerified: true, subscription: 'future_premium' } as any;
    expect(canAccessRouteForPlan(unknownPlanUser, '/dashboard')).toBe(true);
    expect(canAccessRouteForPlan(unknownPlanUser, '/dashboard/applications')).toBe(true);
    expect(canAccessRouteForPlan(unknownPlanUser, '/dashboard/resume')).toBe(true);
    expect(canAccessRouteForPlan(unknownPlanUser, '/dashboard/linkedin')).toBe(false);
  });

  it('respects explicit plan permissions when available', () => {
    const premiumUser = { role: 'student', isVerified: true, subscription: 'premium' } as any;
    const permissions = ['resume_builder', 'interview_prep'];

    expect(canAccessRouteForPlan(premiumUser, '/dashboard/resume', permissions)).toBe(true);
    expect(canAccessRouteForPlan(premiumUser, '/dashboard/webinars', permissions)).toBe(false);
    expect(canAccessRouteForPlan(premiumUser, '/employer/interviews', permissions)).toBe(false);
  });

  it('requires job posting permission for employer post-job route', () => {
    const employerUser = { role: 'employer', isVerified: true, subscription: 'recruiter_starter' } as any;

    expect(canAccessRouteForPlan(employerUser, '/employer/post-job', ['student_profiles.view', 'job_posting'])).toBe(true);
    expect(canAccessRouteForPlan(employerUser, '/employer/post-job', ['student_profiles.view'])).toBe(false);
  });

  it('allows full access for all_sections plan codes including variants', () => {
    const fullAccessUser = { role: 'student', isVerified: true, subscription: 'all sections 499' } as any;
    expect(canAccessRouteForPlan(fullAccessUser, '/dashboard')).toBe(true);
    expect(canAccessRouteForPlan(fullAccessUser, '/dashboard/webinars')).toBe(true);
    expect(canAccessRouteForPlan(fullAccessUser, '/dashboard/linkedin')).toBe(true);
  });

  it('allows basic student plans to access only core routes', () => {
    const basicUser = { role: 'student', isVerified: true, subscription: 'basic' } as any;
    expect(canAccessRouteForPlan(basicUser, '/dashboard/jobs')).toBe(true);
    expect(canAccessRouteForPlan(basicUser, '/dashboard/resume')).toBe(false);
  });

  it('normalizes subscription ids when checking employer permissions', () => {
    usePlanStore.setState({
      plans: [
        {
          id: 'Recruiter_Enterprise_Plan',
          name: 'Recruiter Enterprise',
          price: 0,
          period: 'month',
          description: 'Enterprise plan',
          features: [],
          permissions: ['interviews.manage'],
          razorpay_plan_id: null,
          isActive: true,
        },
      ],
    });

    const planStore = usePlanStore.getState();
    expect(planStore.hasPermission('recruiter_enterprise_plan', 'interviews.manage')).toBe(true);
    expect(planStore.hasPermission('Recruiter Enterprise', 'interviews.manage')).toBe(true);
  });
});
