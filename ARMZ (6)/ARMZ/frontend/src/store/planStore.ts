import { create } from 'zustand';
import { apiService } from '@/src/services/api';
import { normalizePlanReference, normalizeStoredPlanCode } from '@/src/lib/subscription';

interface Plan {
  id: string;
  name: string;
  price: number;
  razorpay_fee?: number;
  razorpay_fee_percentage?: number;
  gst_amount?: number;
  gst_percentage?: number;
  final_price?: number;
  pricing_breakdown?: {
    base_price: number;
    razorpay_fee: number;
    razorpay_fee_percentage: number;
    gst_amount: number;
    gst_percentage: number;
    final_price: number;
  };
  period: string;
  description: string;
  features: string[];
  permissions: string[];
  razorpay_plan_id: string | null;
  type?: 'student' | 'employer';
  isActive?: boolean;
}

interface PlanState {
  plans: Plan[];
  isLoading: boolean;
  fetchPlans: () => Promise<void>;
  hasPermission: (subscriptionId: string | undefined, permissionId: string) => boolean;
}

const toPlanArray = (payload: unknown): Plan[] => {
  if (Array.isArray(payload)) return payload as Plan[];

  if (payload && typeof payload === 'object') {
    const maybeObject = payload as Record<string, unknown>;
    if (Array.isArray(maybeObject.results)) return maybeObject.results as Plan[];
    if (Array.isArray(maybeObject.data)) return maybeObject.data as Plan[];
    if (Array.isArray(maybeObject.plans)) return maybeObject.plans as Plan[];
  }

  return [];
};

const normalizePlan = (plan: any): Plan => ({
  id: String(plan?.code ?? plan?.id ?? plan?.name ?? ""),
  name: String(plan?.name ?? ""),
  price: Number(plan?.price ?? 0),
  razorpay_fee: plan?.razorpay_fee !== undefined ? Number(plan.razorpay_fee) : undefined,
  razorpay_fee_percentage:
    plan?.razorpay_fee_percentage !== undefined ? Number(plan.razorpay_fee_percentage) : undefined,
  gst_amount: plan?.gst_amount !== undefined ? Number(plan.gst_amount) : undefined,
  gst_percentage: plan?.gst_percentage !== undefined ? Number(plan.gst_percentage) : undefined,
  final_price: plan?.final_price !== undefined ? Number(plan.final_price) : undefined,
  pricing_breakdown: plan?.pricing_breakdown
    ? {
        base_price: Number(plan.pricing_breakdown.base_price ?? 0),
        razorpay_fee: Number(plan.pricing_breakdown.razorpay_fee ?? 0),
        razorpay_fee_percentage: Number(plan.pricing_breakdown.razorpay_fee_percentage ?? 0),
        gst_amount: Number(plan.pricing_breakdown.gst_amount ?? 0),
        gst_percentage: Number(plan.pricing_breakdown.gst_percentage ?? 0),
        final_price: Number(plan.pricing_breakdown.final_price ?? 0),
      }
    : undefined,
  period: String(plan?.period ?? "month"),
  description: String(plan?.description ?? ""),
  features: Array.isArray(plan?.features) ? plan.features.map((feature: unknown) => String(feature)) : [],
  permissions: Array.isArray(plan?.permissions)
    ? plan.permissions.map((permission: unknown) => String(permission).toLowerCase())
    : [],
  razorpay_plan_id: plan?.razorpay_plan_id ? String(plan.razorpay_plan_id) : null,
  type: plan?.type === "employer" ? "employer" : "student",
  isActive: typeof plan?.isActive === "boolean" ? plan.isActive : typeof plan?.is_active === "boolean" ? plan.is_active : true,
});

const PERMISSION_ALIASES: Record<string, string[]> = {
  job_posting: ['post_job'],
};

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  isLoading: false,
  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const res = await apiService.getPlans();
      const incomingPlans = toPlanArray(res.data).map(normalizePlan).filter((plan) => plan.id);
      set({ plans: incomingPlans, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      set({ plans: [], isLoading: false });
    }
  },
  hasPermission: (subscriptionId, permissionId) => {
    if (!subscriptionId) return false;
    const normalizedSubscriptionId = normalizePlanReference(String(subscriptionId));
    const normalizedPermissionId = String(permissionId).toLowerCase();
    const plan = get().plans.find((p) => normalizePlanReference(String(p.id)) === normalizedSubscriptionId);
    if (!plan) return false;

    const availablePermissions = new Set(plan.permissions);
    if (PERMISSION_ALIASES[normalizedPermissionId]) {
      PERMISSION_ALIASES[normalizedPermissionId].forEach((alias) => availablePermissions.add(alias));
    }

    for (const [alias, equivalents] of Object.entries(PERMISSION_ALIASES)) {
      if (availablePermissions.has(alias)) {
        equivalents.forEach((equivalent) => availablePermissions.add(equivalent));
      }
      equivalents.forEach((equivalent) => {
        if (availablePermissions.has(equivalent)) {
          availablePermissions.add(alias);
        }
      });
    }

    return availablePermissions.has(normalizedPermissionId);
  }
}));
