import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/src/store/authStore";
import { usePlanStore } from "@/src/store/planStore";
import { ONBOARDING_ROUTE, canAccessRouteForPlan, normalizeStoredPlanCode, requiresSubscriptionOnboarding } from "@/src/lib/subscription";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "employer" | "student")[];
  allowSubscriptionBypass?: boolean;
  allowPlanAccessBypass?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowSubscriptionBypass = false,
  allowPlanAccessBypass = false,
}) => {
  const { isAuthenticated, user, hasBootstrappedAuth } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();
  const location = useLocation();

  useEffect(() => {
    if (plans.length === 0) {
      void fetchPlans();
    }
  }, [fetchPlans, plans.length]);

  if (!hasBootstrappedAuth) {
    return null;
  }

  if (!isAuthenticated) {
    const isAskingForAdmin = allowedRoles?.includes("admin");
    const loginPath = isAskingForAdmin ? "/admin-login" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
    const redirectPath = user.role === 'employer' ? '/employer' : user.role === 'student' ? '/dashboard' : '/admin';
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowSubscriptionBypass && user && requiresSubscriptionOnboarding(user)) {
    return (
      <Navigate
        to={ONBOARDING_ROUTE}
        state={{ from: location, reason: "subscription_required" }}
        replace
      />
    );
  }

  const currentPlanPermissions = plans.find(
    (plan) => normalizeStoredPlanCode(plan.id) === normalizeStoredPlanCode(user?.subscription)
  )?.permissions;

  if (!allowPlanAccessBypass && user && !canAccessRouteForPlan(user, location.pathname, currentPlanPermissions)) {
    const redirectPath = user.role === 'employer' ? '/employer' : '/dashboard';
    return (
      <Navigate
        to={redirectPath}
        state={{ from: location, reason: "plan_access_denied" }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
