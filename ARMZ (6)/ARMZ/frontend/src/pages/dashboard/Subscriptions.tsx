import React, { useState, useEffect } from "react";
import { Check, Zap, Shield, Crown, Loader2, Star, Sparkles, Rocket, ArrowRight, Download, Printer } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { usePlanStore } from "@/src/store/planStore";
import { usePayment } from "@/src/hooks/usePayment";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { getStudentPlanTier, normalizeStoredPlanCode } from '@/src/lib/subscription';

interface BillingRecord {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  planId: string;
  planName: string;
  createdAt: string;
}

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
  tier: number;
  period: string;
  description: string;
  features: string[];
  permissions: string[];
  type?: string;
}

interface SubscriptionStatus {
  currentPlan: Plan | null;
  pendingChange: Plan | null;
  subscriptionStatus: string;
  expiresAt: string | null;
}

export default function Subscriptions() {
  const { user } = useAuthStore();
  const { plans, fetchPlans, isLoading: plansLoading } = usePlanStore();
  const { openPayment } = usePayment();
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isSubscriptionStatusLoading, setIsSubscriptionStatusLoading] = useState(true);
  const [subscriptionStatusError, setSubscriptionStatusError] = useState<string | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    if (plans.length === 0) {
      fetchPlans();
    }
  }, [fetchPlans, plans.length]);

  useEffect(() => {
    if (user?.id) {
      void loadBillingHistory();
      void loadSubscriptionStatus();
    }
  }, [user?.id]);

  const loadSubscriptionStatus = async () => {
    try {
      setIsSubscriptionStatusLoading(true);
      setSubscriptionStatusError(null);
      const response = await apiService.getPlanChangeStatus();
      setSubscriptionStatus(response.data);
    } catch (error: any) {
      console.error("Failed to load subscription status:", error);
      setSubscriptionStatusError(error?.message || "Failed to load subscription status");
      setSubscriptionStatus(null);
    } finally {
      setIsSubscriptionStatusLoading(false);
    }
  };

  const loadBillingHistory = async () => {
    if (!user?.id) return;

    try {
      setIsBillingLoading(true);
      const response = await apiService.getPaymentHistory(user.id);
      const rawPayments = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.payments)
          ? response.data.payments
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

      setBillingHistory(rawPayments.map((item: any) => ({
        id: String(item.id || item.paymentId || item.razorpay_payment_id || Date.now()),
        paymentId: String(item.paymentId || item.razorpay_payment_id || item.id || ""),
        orderId: String(item.orderId || item.razorpay_order_id || ""),
        amount: Number(item.amount || 0),
        currency: String(item.currency || "INR"),
        status: String(item.status || "pending"),
        planId: String(item.planId || ""),
        planName: String(item.planName || item.planId || "Plan"),
        createdAt: String(item.createdAt || ""),
      })));
    } catch (error) {
      console.error("Failed to load billing history:", error);
    } finally {
      setIsBillingLoading(false);
    }
  };

  const formatMoney = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatReceiptDate = (value: string) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlanFinalPrice = (plan?: Plan | null) => {
    if (!plan) return 0;
    const directFinal = plan.final_price;
    if (typeof directFinal === "number" && !Number.isNaN(directFinal)) return directFinal;
    const breakdownFinal = plan.pricing_breakdown?.final_price;
    if (typeof breakdownFinal === "number" && !Number.isNaN(breakdownFinal)) return breakdownFinal;
    const fee = plan.razorpay_fee ?? plan.pricing_breakdown?.razorpay_fee ?? 0;
    const gst = plan.gst_amount ?? plan.pricing_breakdown?.gst_amount ?? 0;
    return plan.price + fee + gst;
  };

  const getPlanTaxTotal = (plan?: Plan | null) => {
    if (!plan) return 0;
    const fee = plan.razorpay_fee ?? plan.pricing_breakdown?.razorpay_fee ?? 0;
    const gst = plan.gst_amount ?? plan.pricing_breakdown?.gst_amount ?? 0;
    return fee + gst;
  };

  const findPaymentPlan = (payment: BillingRecord) => {
    return plans.find((plan) =>
      String(plan.id) === String(payment.planId) ||
      normalizeStoredPlanCode(plan.id) === normalizeStoredPlanCode(payment.planId)
    );
  };

  const getPaymentPlanTotal = (payment: BillingRecord) => {
    const matchedPlan = findPaymentPlan(payment);
    if (!matchedPlan) return payment.amount;
    return getPlanFinalPrice(matchedPlan);
  };

  const buildReceiptHtml = (payment: BillingRecord) => {
    const dateText = formatReceiptDate(payment.createdAt);
    return `
      <html>
        <head>
          <title>Bill - ${payment.planName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            .card { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #ede9fe; color: #6d28d9; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-top: 20px; }
            .item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
            .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
            .value { font-size: 15px; font-weight: 700; color: #0f172a; word-break: break-word; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <div class="badge">Bill Copy</div>
                <h1 style="margin:12px 0 6px;font-size:28px;">${payment.planName}</h1>
                <p style="margin:0;color:#475569;">Subscription payment receipt and bill copy</p>
              </div>
              <div style="text-align:right;color:#64748b;font-size:13px;">
                <div><strong>Status:</strong> ${payment.status}</div>
                <div><strong>Date:</strong> ${dateText}</div>
              </div>
            </div>
            <div class="grid">
              <div class="item"><div class="label">Plan</div><div class="value">${payment.planName}</div></div>
              <div class="item"><div class="label">Amount</div><div class="value">${formatMoney(payment.amount, payment.currency)}</div></div>
              <div class="item"><div class="label">Payment ID</div><div class="value">${payment.paymentId || payment.id}</div></div>
              <div class="item"><div class="label">Order ID</div><div class="value">${payment.orderId || "N/A"}</div></div>
              <div class="item"><div class="label">Subscription Status</div><div class="value">Active benefits unlocked</div></div>
              <div class="item"><div class="label">Purchased On</div><div class="value">${dateText}</div></div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintBill = (payment: BillingRecord) => {
    const html = buildReceiptHtml(payment);
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      toast.error("Pop-up blocked. Please allow pop-ups to print the bill.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.onload = () => popup.print();
  };

  const handleDownloadBill = (payment: BillingRecord) => {
    const html = buildReceiptHtml(payment);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bill-${payment.paymentId || payment.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadHistory = () => {
    if (!billingHistory.length) {
      toast.error("No billing history available to download.");
      return;
    }

    setIsExportingHistory(true);
    const rows = [
      ["Date", "Plan", "Payment ID", "Order ID", "Amount", "Currency", "Status"],
      ...billingHistory.map((item) => [
        formatReceiptDate(item.createdAt),
        item.planName,
        item.paymentId,
        item.orderId,
        String(item.amount),
        item.currency,
        item.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `subscription-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    toast.success("Billing history downloaded");
    setIsExportingHistory(false);
  };

  const getPlanTierValue = (plan?: Plan | null): number => {
    if (!plan) return 0;

    const explicitTier = plan.tier;
    if (typeof explicitTier === 'number' && explicitTier > 0) return explicitTier;
    if (typeof explicitTier === 'string') {
      const parsedTier = Number(explicitTier);
      if (!Number.isNaN(parsedTier) && parsedTier > 0) return parsedTier;
    }

    const price = plan.price;
    if (typeof price === 'number' && price > 0) return price;
    const parsedPrice = Number(price);
    return Number.isNaN(parsedPrice) ? 0 : parsedPrice;
  };

  const getLocalCurrentPlanTier = () => {
    return getStudentPlanTier(user?.subscription);
  };

  const isLocalUpgrade = (plan: Plan) => {
    const currentLocalTier = getLocalCurrentPlanTier();
    const targetTier = getPlanTierValue(plan);
    return targetTier > currentLocalTier;
  };

  const isLocalDowngrade = (plan: Plan) => {
    const currentLocalTier = getLocalCurrentPlanTier();
    const targetTier = getPlanTierValue(plan);
    return targetTier < currentLocalTier;
  };

  const handleUpgrade = (planId: string, planName: string) => {
    if (!user) {
      toast.error("Please login to upgrade");
      return;
    }
    
    const targetPlan = plans.find(p => String(p.id) === String(planId));
    if (!targetPlan) {
      openPayment(planId, planName);
      return;
    }

    const hasLocalCurrentPlan = getLocalCurrentPlanTier() > 0;
    if (!subscriptionStatus?.currentPlan && hasLocalCurrentPlan) {
      if (isLocalUpgrade(targetPlan)) {
        openPayment(planId, planName);
        return;
      }

      if (isLocalDowngrade(targetPlan)) {
        toast.error("Unable to verify downgrade timing. Please try again later.");
        return;
      }

      toast.error("This plan is already active or cannot be changed right now.");
      return;
    }

    if (!subscriptionStatus?.currentPlan) {
      openPayment(planId, planName);
      return;
    }

    const currentTier = getPlanTierValue(subscriptionStatus.currentPlan);
    const targetTier = getPlanTierValue(targetPlan);

    if (targetTier > currentTier) {
      openPayment(planId, planName);
      return;
    }

    if (targetTier < currentTier) {
      if (!isDowngradeAllowed(targetPlan)) {
        toast.error("Downgrades are not available until your current plan expires.");
        return;
      }

      handleDowngradePlan(planId, planName);
      return;
    }

    toast.error("This plan is already active or cannot be changed right now.");
  };

  const handleDowngradePlan = async (planId: string, planName: string) => {
    if (isChangingPlan) return;

    try {
      setIsChangingPlan(true);
      const response = await apiService.changePlan(planId);
      
      if (response.data.success) {
        // Reload subscription status
        await loadSubscriptionStatus();
        
        if (response.data.immediate) {
          toast.success(`Successfully changed to ${planName}`);
        } else {
          const expiryDate = response.data.expiresAt 
            ? new Date(response.data.expiresAt).toLocaleDateString('en-IN')
            : 'the end of your current billing period';
          toast.success(
            `Downgrade scheduled! You'll switch to ${planName} on ${expiryDate}`,
            { duration: 5000 }
          );
        }
      } else {
        toast.error(response.data.message || 'Failed to change plan');
      }
    } catch (error: any) {
      console.error("Failed to change plan:", error);
      toast.error(error?.response?.data?.message || 'Failed to change plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const getPlanActionLabel = (plan: Plan): string => {
    if (!subscriptionStatus?.currentPlan) {
      if (getLocalCurrentPlanTier() > 0) {
        const currentTier = getLocalCurrentPlanTier();
        const targetTier = getPlanTierValue(plan);

        if (targetTier > currentTier) return "Upgrade Now";
        if (targetTier < currentTier) return "Available after plan expiry";
        return "Current Plan";
      }
      return "Subscribe Now";
    }
    
    if (String(plan.id) === String(subscriptionStatus.currentPlan.id)) {
      if (subscriptionStatus.pendingChange) {
        return `Downgrading to ${subscriptionStatus.pendingChange.name}`;
      }
      return "Current Plan";
    }

    const currentTier = getPlanTierValue(subscriptionStatus.currentPlan);
    const targetTier = getPlanTierValue(plan);

    if (targetTier > currentTier) return "Upgrade Now";
    if (targetTier < currentTier) {
      if (!isDowngradeAllowed(plan)) return "Available after plan expiry";
      return "Downgrade";
    }
    return "Change Plan";
  };

  const isDowngradeAllowed = (plan: Plan): boolean => {
    if (!subscriptionStatus?.currentPlan) return true;
    
    const currentTier = getPlanTierValue(subscriptionStatus.currentPlan);
    const targetTier = getPlanTierValue(plan);
    
    // Only check expiry for downgrades
    if (targetTier >= currentTier) return true;
    
    // If expiry is missing, block the downgrade until we know the current plan end date
    if (!subscriptionStatus.expiresAt) return false;
    
    const expiryDate = new Date(subscriptionStatus.expiresAt);
    const now = new Date();
    return now >= expiryDate;
  };

  const getPlanIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case "prime": return Shield;
      case "premium": return Zap;
      case "placement": return Crown;
      default: return Shield;
    }
  };

  const getPlanGradient = (id: string) => {
    switch (id.toLowerCase()) {
      case "prime": return "from-blue-500 to-cyan-500";
      case "premium": return "from-purple-500 to-pink-500";
      case "placement": return "from-amber-500 to-orange-500";
      default: return "from-slate-500 to-slate-600";
    }
  };

  const isPlacement = (id: string) => id.toLowerCase() === "placement";

  if (plansLoading) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-bold text-slate-900">Choose Your Plan</h1>
          <p className="text-slate-500 text-lg font-medium mt-4">Unlock premium features and accelerate your aviation career with our specialized plans.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {plans.filter(plan => (plan.type ?? 'student') === 'student').map((plan, index) => {
          const normalizedUserPlan = normalizeStoredPlanCode(user?.subscription);
          const normalizedPlanId = normalizeStoredPlanCode(plan.id);
          const isCurrent = normalizedUserPlan === normalizedPlanId;
          const currentPlanTier = getStudentPlanTier(user?.subscription);
          const planTier = getStudentPlanTier(plan.id);
          
          // Only show "Previous Plan" for plans that are actually lower tier than current
          // Students should be able to upgrade to any higher tier plan at any time
          const isPreviousPlan = !isCurrent && currentPlanTier > planTier;
          
          const Icon = getPlanIcon(plan.id);
          const gradient = getPlanGradient(plan.id);
          const isPlacementPlan = isPlacement(plan.id);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`glass-card p-8 rounded-4xl! border-2 transition-all relative overflow-hidden flex flex-col ${
                isPlacementPlan
                  ? 'border-amber-400/50 shadow-2xl shadow-amber-100/30 scale-[1.02] lg:-mt-4'
                  : isCurrent
                    ? 'border-purple-600/50 shadow-xl shadow-purple-100/20'
                    : 'border-white/20 hover:border-purple-200/50'
              }`}
            >
              {isPlacementPlan && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-amber-400 via-orange-500 to-amber-400" />
              )}

              {isCurrent && (
                <div className="absolute top-6 -right-8.75 bg-purple-600 text-white text-[10px] font-bold py-1 px-12 rotate-45 uppercase tracking-widest">
                  Current
                </div>
              )}

              {isPlacementPlan && !isCurrent && (
                <div className="absolute top-6 -right-7.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold py-1 px-10 rotate-45 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Best Value
                </div>
              )}

              <div className="space-y-6 grow">
                <div className={`inline-flex p-4 rounded-2xl bg-linear-to-br ${gradient} text-white shadow-lg`}>
                  <Icon className="h-7 w-7" />
                </div>

                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                  <div className="flex items-baseline mt-4">
                    <span className="text-4xl font-display font-bold text-slate-900">
                        ₹{getPlanFinalPrice(plan).toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 font-medium ml-2">
                        /{plan.period === 'month' ? 'month' : 'one-time'}
                      </span>
                    </div>
                    {getPlanFinalPrice(plan) !== plan.price && (
                      <p className="text-sm text-slate-500 mt-1">
                        ₹{plan.price.toLocaleString('en-IN')} + ₹{getPlanTaxTotal(plan).toLocaleString('en-IN')} taxes/fees = ₹{getPlanFinalPrice(plan).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-slate-100">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-slate-600 font-medium text-sm">
                        <Check className={`h-4 w-4 mr-3 shrink-0 mt-0.5 ${
                          isPlacementPlan ? 'text-amber-500' : 'text-purple-600'
                        }`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              <button
                onClick={() => handleUpgrade(plan.id, plan.name)}
                disabled={
                  isCurrent ||
                  isChangingPlan ||
                  (!subscriptionStatus?.currentPlan && !isSubscriptionStatusLoading && getLocalCurrentPlanTier() > 0 && !isLocalUpgrade(plan) && !isLocalDowngrade(plan))
                }
                className={`w-full py-4 mt-8 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-slate-100/50 text-slate-400 cursor-default'
                    : isChangingPlan
                      ? 'bg-slate-400/50 text-slate-400 cursor-wait'
                      : (!subscriptionStatus?.currentPlan && !isSubscriptionStatusLoading && getLocalCurrentPlanTier() > 0 && !isLocalUpgrade(plan) && !isLocalDowngrade(plan))
                        ? 'bg-slate-300/50 text-slate-500 cursor-not-allowed'
                        : isPlacementPlan
                        ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200/50 hover:scale-105'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200 hover:scale-105'
                }`}
              >
                {isChangingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isCurrent ? (
                  'Current Plan'
                ) : !subscriptionStatus && !isSubscriptionStatusLoading && !user?.subscription ? (
                  'Loading plan status...'
                ) : isPlacementPlan && isDowngradeAllowed(plan) ? (
                  <>
                    <Rocket className="h-4 w-4" />
                    Get Placement Access
                  </>
                ) : (
                  <>
                    {getPlanActionLabel(plan)}
                    {isDowngradeAllowed(plan) && <ArrowRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-8 rounded-4xl! border-amber-100 bg-linear-to-br from-amber-50/50 to-orange-50/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 text-white">
            <Crown className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Why Choose Placement Plan?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Star, title: "Guaranteed Interviews", desc: "Get direct interview opportunities with top aviation companies" },
            { icon: Sparkles, title: "1-on-1 Mentorship", desc: "Personal guidance from industry veterans throughout your journey" },
            { icon: Rocket, title: "Placement Support", desc: "Dedicated assistance until you land your dream aviation job" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/80 text-amber-600 shadow-sm">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-8 rounded-4xl! border-slate-200 bg-white/90"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Billing History</h3>
            <p className="text-sm text-slate-500 mt-1">Print or download any bill, and export your full subscription history.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadHistory}
              disabled={isExportingHistory || billingHistory.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExportingHistory ? "Downloading..." : "Download History"}
            </button>
            <button
              type="button"
              onClick={() => void loadBillingHistory()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-purple-200 hover:text-purple-600"
            >
              Refresh
            </button>
          </div>
        </div>

        {isBillingLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : billingHistory.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No payment history found yet. Once you purchase a plan, your bill and receipt download options will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {billingHistory.map((payment) => (
              <div key={payment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{payment.planName}</h4>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${payment.status === "success" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {payment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Paid on {formatReceiptDate(payment.createdAt)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatMoney(payment.amount, payment.currency)}</p>
                    {getPaymentPlanTotal(payment) !== payment.amount && (
                      <p className="mt-1 text-xs text-slate-500">
                        Plan total incl. tax: {formatMoney(getPaymentPlanTotal(payment), payment.currency)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400 break-all">Payment ID: {payment.paymentId || payment.id}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handlePrintBill(payment)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-purple-200 hover:text-purple-600"
                    >
                      <Printer className="h-4 w-4" />
                      Print Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBill(payment)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-purple-700"
                    >
                      <Download className="h-4 w-4" />
                      Download Bill
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
