import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, Lock, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/src/components/ui/Button";
import { useAuthStore } from "@/src/store/authStore";
import { usePlanStore } from "@/src/store/planStore";
import {
  canAccessRouteForPlan,
  getSubscriptionRouteForRole,
  normalizePlanCode,
  normalizePlanReference,
} from "@/src/lib/subscription";

interface PlanAccessGateProps {
  children: React.ReactNode;
  featureName: string;
  description: string;
}

const formatPlanName = (value?: string | null) => {
  const normalized = normalizePlanCode(value);
  if (!normalized) return "your current";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function PlanAccessGate({
  children,
  featureName,
  description,
}: PlanAccessGateProps) {
  const { user } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPlan = plans.find(
    (plan) => normalizePlanReference(plan.id) === normalizePlanReference(user?.subscription)
  );
  const currentPlanPermissions = currentPlan?.permissions ?? [];

  const attemptedPlanRefreshRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (plans.length === 0) {
      void fetchPlans();
      return;
    }

    const currentPlanCode = normalizePlanReference(user?.subscription);
    const hasCurrentPlan = plans.some(
      (plan) => normalizePlanReference(plan.id) === currentPlanCode
    );

    if (user?.subscription && !hasCurrentPlan && attemptedPlanRefreshRef.current !== currentPlanCode) {
      attemptedPlanRefreshRef.current = currentPlanCode;
      void fetchPlans();
    }
  }, [fetchPlans, plans, plans.length, user?.subscription]);

  if (canAccessRouteForPlan(user, location.pathname, currentPlanPermissions)) {
    return <>{children}</>;
  }

  const subscriptionRoute = getSubscriptionRouteForRole(user?.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden rounded-4xl border border-slate-200"
    >
      <div className="h-2 bg-linear-to-r from-amber-400 via-purple-500 to-indigo-500" />
      <div className="p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-inner">
          <Lock className="h-10 w-10" />
        </div>

        <div className="mt-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            <Crown className="h-4 w-4 text-amber-500" />
            {formatPlanName(user?.subscription)} Plan
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900">
            {featureName} is locked on your current plan
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-500 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            "Upgrade your plan to unlock this dashboard section.",
            "Keep your account active and access features by subscription tier.",
            "Return here right after payment with your new plan permissions.",
          ].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white/80 p-5 text-sm font-medium text-slate-600">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="gap-2"
            onClick={() =>
              navigate(subscriptionRoute, {
                state: { returnTo: location.pathname, reason: "plan_upgrade_required" },
              })
            }
          >
            <Sparkles className="h-4 w-4" />
            Upgrade Plan
          </Button>
          <Link to={user?.role === "employer" ? "/employer" : "/dashboard"}>
            <Button size="lg" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
