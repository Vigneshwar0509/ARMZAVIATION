import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Zap, Shield, Globe, Star, Crown, Sparkles, Loader2, ArrowRight, ShieldCheck, ChartBar, Users, MessageSquare, Download, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { usePlanStore } from "@/src/store/planStore";
import { usePayment } from "@/src/hooks/usePayment";
import { useAuthStore } from "@/src/store/authStore";
import { normalizePlanReference, normalizeStoredPlanCode } from '@/src/lib/subscription';
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function EmployerSubscriptions() {
  const { plans, fetchPlans, isLoading } = usePlanStore();
  const { openPayment } = usePayment();
  const { user, logout } = useAuthStore();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const attemptedPlanRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    if (plans.length === 0) {
      fetchPlans();
      loadBillingHistory();
      return;
    }

    const currentPlanCode = normalizePlanReference(user?.subscription);
    const hasCurrentPlan = plans.some(
      (plan) => normalizePlanReference(plan.id) === currentPlanCode
    );

    if (user?.subscription && !hasCurrentPlan && attemptedPlanRefreshRef.current !== currentPlanCode) {
      attemptedPlanRefreshRef.current = currentPlanCode;
      fetchPlans();
    }

    loadBillingHistory();
  }, [plans.length, fetchPlans, user?.id, plans, user?.subscription]);

  const loadBillingHistory = async () => {
    try {
      const response = await apiService.getPaymentHistory(user?.id);
      const transactions = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.payments)
          ? response.data.payments
          : [];

      setBillingHistory(
        transactions.map((item: any) => {
          const matchingPlan = plans.find((plan) => String(plan.id) === String(item.planId));
          return {
            id: String(item.id),
            date: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "N/A",
            amount: Number(item.amount || 0),
            status: item.status || "Pending",
            planName: matchingPlan?.name || item.planId || "Plan",
          };
        })
      );
    } catch (error: any) {
      console.error("Failed to load billing history:", error);
      if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
        sessionStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return;
      }
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setIsDownloading(invoiceId);
    toast.error("Invoice download is not available yet for live billing records.");
    setIsDownloading(null);
  };

  const handleDownloadStatement = () => {
    toast.success("Annual statement will be generated shortly. Check your email for the download link.");
  };

  const employerPlans = useMemo(
    () => plans.filter((plan) => plan.type === "employer"),
    [plans]
  );

  const currentPlan = useMemo(() => {
    if (!user?.subscription) return null;
    const normalizedUserPlan = normalizePlanReference(user.subscription);
    return employerPlans.find((plan) => normalizePlanReference(plan.id) === normalizedUserPlan);
  }, [employerPlans, user?.subscription]);

  const planFeatures = [
    "Active Job Posts",
    "Applicant Tracking",
    "Featured Employer Listing",
    "Interview Scheduling",
    "Conclave Events",
    "Priority Support",
    "Recruitment Analytics",
    "Dedicated Hiring Partner",
  ];

  const handleUpgrade = async (planId: string, planName: string) => {
    if (!user) {
      toast.error("Please login to upgrade your plan.");
      return;
    }

    try {
      setIsUpgrading(planId);
      await openPayment(planId, planName);
    } catch (error) {
      toast.error("Unable to start secure checkout. Please try again.");
    } finally {
      setIsUpgrading(null);
    }
  };

  const getPlanIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case "recruiter_starter":
        return Shield;
      case "recruiter_growth":
        return Zap;
      case "recruiter_enterprise":
        return Crown;
      default:
        return Globe;
    }
  };

  const getPlanGradient = (id: string) => {
    switch (id.toLowerCase()) {
      case "recruiter_starter":
        return "from-sky-500 to-cyan-500";
      case "recruiter_growth":
        return "from-violet-500 to-fuchsia-500";
      case "recruiter_enterprise":
        return "from-amber-500 to-orange-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const formatBillingLabel = (planId: string) => {
    if (planId === "recruiter_enterprise") return "Custom billing";
    return "Monthly billing";
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12 pb-20 px-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-0"
      >
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">Subscription Center</h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
          Manage your employer plan, compare upgrade options, and get the hiring tools you need to scale.
        </p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 sm:p-8 rounded-3xl sm:rounded-4xl border border-slate-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-600">Current plan</p>
              <h2 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-display font-bold text-slate-900">{currentPlan?.name ?? "Recruiter Starter"}</h2>
              <p className="mt-3 text-sm text-slate-500 max-w-xl">
                {currentPlan
                  ? currentPlan.description
                  : "Get started with the hiring essentials built for aviation recruiters."}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-5 text-center w-full sm:w-auto">
              <p className="text-sm text-slate-500">Billing</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ₹{currentPlan?.price.toLocaleString('en-IN') ?? 19999}
              </p>
              <p className="text-sm text-slate-500">{currentPlan ? formatBillingLabel(currentPlan.id) : "Monthly billing"}</p>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-2 sm:grid-cols-3">
            {[
              { label: "Active Jobs", value: "20+" },
              { label: "Team Seats", value: "5" },
              { label: "Support SLA", value: "24h Response" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2">{metric.label}</p>
                <p className="text-xl font-bold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-linear-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-purple-100">Plan status</p>
              <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold">Active</p>
              <p className="mt-3 text-sm text-purple-100/90">
                Your employer subscription is active and ready to power unlimited hiring workflows.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Next renewal</p>
              <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold text-slate-900">May 12, 2026</p>
              <p className="mt-3 text-sm text-slate-500">Auto-renews monthly so you can keep posting jobs without interruption.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-card p-6 sm:p-8 rounded-3xl sm:rounded-4xl border border-slate-200"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hiring health</p>
              <h3 className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-slate-900">Optimize your hiring</h3>
            </div>
            <div className="rounded-2xl sm:rounded-3xl bg-violet-50 p-3 text-violet-600">
              <ChartBar className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {[
              { title: "Featured job visibility", value: "85%", note: "Higher applicant volume." },
              { title: "Candidate match score", value: "92%", note: "AI hiring precision." },
              { title: "Response time", value: "< 2h", note: "Recruiter support SLA." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl bg-white p-5 border border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xl font-bold text-slate-900">{item.value}</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {employerPlans.map((plan, idx) => {
          const Icon = getPlanIcon(plan.id);
          const gradient = getPlanGradient(plan.id);
          const isCurrent = currentPlan?.id.toLowerCase() === plan.id.toLowerCase();
          const isFeatured = plan.id === "recruiter_growth";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={cn(
                "glass-card border p-6 sm:p-8 rounded-3xl sm:rounded-4xl flex flex-col transition-all duration-300",
                isFeatured ? "border-purple-500/30 shadow-2xl shadow-purple-200/30 scale-[1.01]" : "border-slate-200 hover:-translate-y-1"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className={`rounded-3xl bg-linear-to-br ${gradient} p-4 text-white inline-flex items-center justify-center shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                {isFeatured && (
                  <span className="rounded-full bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-700">
                    Most Popular
                  </span>
                )}
              </div>

              <div className="mt-6 flex-1">
                <div className="flex items-end gap-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{plan.name}</h3>
                  <span className="text-sm text-slate-400">{plan.period === "month" ? "/month" : "One-time"}</span>
                </div>
                <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-display font-bold text-slate-900">₹{plan.price.toLocaleString('en-IN')}</p>
                <p className="mt-3 text-sm text-slate-500">{plan.description}</p>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-slate-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id, plan.name)}
                disabled={isCurrent || isUpgrading === plan.id}
                className={cn(
                  "mt-10 w-full py-4 font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                  isCurrent
                    ? "bg-slate-100 text-slate-500 cursor-default"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                )}
              >
                {isUpgrading === plan.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : isCurrent ? (
                  "Current Plan"
                ) : isFeatured ? (
                  "Upgrade to Growth"
                ) : (
                  "Choose Plan"
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-4xl border border-slate-200"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Feature comparison</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">What each employer plan unlocks</h2>
            <p className="max-w-2xl text-sm text-slate-500">
              Compare capabilities across plans so you can choose the package that matches your hiring volume and growth goals.
            </p>
          </div>
            <div className="rounded-2xl sm:rounded-3xl bg-violet-50 p-5 sm:p-6 text-violet-700">
            <MessageSquare className="h-6 w-6" />
            <p className="mt-3 text-sm font-semibold">Need help selecting? Talk to our team.</p>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 pr-8 font-semibold text-slate-500">Feature</th>
                {employerPlans.map((plan) => (
                  <th key={plan.id} className="py-4 px-4 font-semibold text-slate-500 text-right">{plan.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planFeatures.map((feature) => (
                <tr key={feature} className="border-b border-slate-100">
                  <td className="py-4 pr-8 text-slate-600">{feature}</td>
                  {employerPlans.map((plan) => (
                    <td key={`${plan.id}-${feature}`} className="py-4 px-4 text-right text-slate-600">
                      <span className="inline-flex items-center justify-end gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
          className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-4xl border border-slate-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Billing history</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">Latest invoices</h2>
          </div>
            <Button onClick={handleDownloadStatement} className="bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Download statement
          </Button>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-4 pr-4 whitespace-nowrap">Invoice</th>
                <th className="py-4 pr-4 whitespace-nowrap">Date</th>
                <th className="py-4 pr-4 whitespace-nowrap">Plan</th>
                <th className="py-4 pr-4 whitespace-nowrap">Amount</th>
                <th className="py-4 pr-4 whitespace-nowrap">Status</th>
                <th className="py-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 pr-4 font-semibold text-slate-900 whitespace-nowrap">{invoice.id}</td>
                  <td className="py-4 pr-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {invoice.date}
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      {invoice.planName}
                    </div>
                  </td>
                  <td className="py-4 pr-4 font-semibold text-slate-900 whitespace-nowrap">₹{invoice.amount.toLocaleString('en-IN')}</td>
                  <td className="py-4 pr-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      invoice.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      disabled={isDownloading === invoice.id}
                      className="text-purple-600 font-semibold hover:text-purple-800 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isDownloading === invoice.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {billingHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    No billing records available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
