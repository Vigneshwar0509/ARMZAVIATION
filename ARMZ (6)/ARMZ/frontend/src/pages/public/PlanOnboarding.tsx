import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, Check, Loader2, ShieldCheck, Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import SEO from "@/src/components/common/SEO";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useAuthStore } from "@/src/store/authStore";
import { usePlanStore } from "@/src/store/planStore";
import { authService } from "@/src/services/authService";
import { paymentService } from "@/src/services/paymentService";
import { getDefaultRouteForUser, normalizePlanCode, requiresSubscriptionOnboarding } from "@/src/lib/subscription";
import { cn } from "@/src/lib/utils";

type Step = "role" | "plan" | "payment";

export default function PlanOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, isLoading, setLoading } = useAuthStore();
  const { plans, fetchPlans, isLoading: isPlansLoading } = usePlanStore();

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<"student" | "employer">((user?.role as "student" | "employer") || "student");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [employerProfile, setEmployerProfile] = useState({
    company_name: user?.company_name || "",
    hr_name: user?.hr_name || "",
    phone: user?.phone || "",
    company_details: user?.company_details || "",
  });

  useEffect(() => {
    if (!user) return;
    if (!requiresSubscriptionOnboarding(user)) {
      navigate(getDefaultRouteForUser(user), { replace: true });
      return;
    }
    if (plans.length === 0) {
      void fetchPlans();
    }
  }, [fetchPlans, navigate, plans.length, user]);

  useEffect(() => {
    const reason = (location.state as any)?.reason;
    if (reason === "subscription_required") {
      toast.error("Please select a plan and complete payment before accessing your dashboard.", {
        id: "subscription-required",
      });
      // Clear the state to prevent duplicate toasts
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const availablePlans = useMemo(
    () => plans.filter((plan) => (plan.type || "student") === selectedRole),
    [plans, selectedRole]
  );

  const selectedPlan = useMemo(
    () => availablePlans.find((plan) => normalizePlanCode(plan.id) === normalizePlanCode(selectedPlanId)) || null,
    [availablePlans, selectedPlanId]
  );

  const selectedPlanPricing = useMemo(() => {
    if (!selectedPlan) return null;
    const basePrice = Number(selectedPlan.price || 0);
    const razorpayFeePercentage = Number(selectedPlan.razorpay_fee_percentage ?? 2);
    const gstPercentage = Number(selectedPlan.gst_percentage ?? 18);
    const razorpayFee = (basePrice * razorpayFeePercentage) / 100;
    const gstAmount = (basePrice * gstPercentage) / 100;
    const finalPrice = typeof selectedPlan.final_price === 'number'
      ? selectedPlan.final_price
      : basePrice + razorpayFee + gstAmount;

    return {
      basePrice,
      razorpayFeePercentage,
      gstPercentage,
      razorpayFee,
      gstAmount,
      finalPrice,
    };
  }, [selectedPlan]);

  const handleRoleContinue = async () => {
    if (!user) return;
    if (selectedRole === "employer" && (!employerProfile.company_name || !employerProfile.hr_name || !employerProfile.phone)) {
      toast.error("Company name, HR name, and phone are required for employer onboarding.");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        role: selectedRole,
        ...employerProfile,
      } as any);
      login(updatedUser);
      setStep("plan");
    } catch {
      // authService shows message
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !selectedPlan) return;

    setLoading(true);
    try {
      const refreshedUser = await authService.updateProfile({
        role: selectedRole,
        ...employerProfile,
      } as any);
      login(refreshedUser);

      const order = await paymentService.createOrder(selectedPlan.id, "INR");
      setLoading(false);

      await paymentService.initiatePayment(
        order,
        {
          name: refreshedUser.name,
          email: refreshedUser.email,
          phone: refreshedUser.phone || employerProfile.phone,
        },
        async (response) => {
          setLoading(true);
          const result = await paymentService.processPaymentCompletion(selectedPlan.id, response);
          if (!result.success) {
            setLoading(false);
            toast.error("Payment verification failed. Please try again.");
            return;
          }

        // Optimistic update to instantly unlock dashboard
        const activeUser = { ...refreshedUser, subscription: selectedPlan.id };
        login(activeUser as any);

        try {
          await authService.updateProfile({ subscription: selectedPlan.id } as any);
          const profile = await authService.getProfile(true);
          if (profile) {
            login({ ...profile, subscription: selectedPlan.id } as any);
          }
        } catch (e) {
          console.error("Profile refresh failed", e);
        }

          setLoading(false);
          toast.success(`${selectedPlan.name} activated successfully.`);
        navigate(getDefaultRouteForUser(activeUser as any), { replace: true });
        },
        (error) => {
          setLoading(false);
          if (error?.reason !== "user_cancelled") {
            toast.error(error?.description || error?.message || "Payment failed. Please try again.");
          }
        }
      );
    } catch (error: any) {
      setLoading(false);
      toast.error(error?.message || "Unable to continue with payment.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent px-4 pb-12 pt-24">
      <SEO title="Complete Your Plan Setup" description="Choose your role, select a plan, and activate your dashboard." />
      <div className="mx-auto max-w-5xl">
        <div className="glass-card rounded-[40px] border-white/50 p-6 shadow-2xl sm:p-10">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700">
              <Sparkles className="h-4 w-4" />
              Complete Subscription Setup
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Finish your account before entering the dashboard</h1>
            <p className="mt-3 text-sm text-slate-500 sm:text-base">Verify your role, choose the right plan, and activate access in one flow.</p>
          </div>

          <div className="mb-8 flex items-center justify-center gap-3">
            {["role", "plan", "payment"].map((item, index) => {
              const active = ["role", "plan", "payment"].indexOf(step) >= index;
              return (
                <div key={item} className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", active ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400")}>
                    {active ? <ShieldCheck className="h-5 w-5" /> : index + 1}
                  </div>
                  {index < 2 && <div className={cn("h-1 w-10 rounded-full sm:w-24", ["role", "plan", "payment"].indexOf(step) > index ? "bg-purple-600" : "bg-slate-100")} />}
                </div>
              );
            })}
          </div>

          {step === "role" && (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className={cn("rounded-3xl border-2 p-6 text-left transition-all", selectedRole === "student" ? "border-purple-600 bg-purple-50" : "border-slate-100 bg-white")}
                >
                  <User className="h-7 w-7 text-purple-600" />
                  <h2 className="mt-4 text-xl font-bold text-slate-900">Student Access</h2>
                  <p className="mt-2 text-sm text-slate-500">Career tools, job discovery, premium mentoring, and learning support.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("employer")}
                  className={cn("rounded-3xl border-2 p-6 text-left transition-all", selectedRole === "employer" ? "border-purple-600 bg-purple-50" : "border-slate-100 bg-white")}
                >
                  <Building2 className="h-7 w-7 text-purple-600" />
                  <h2 className="mt-4 text-xl font-bold text-slate-900">Employer Access</h2>
                  <p className="mt-2 text-sm text-slate-500">Recruitment workspace, applicant reviews, and hiring workflow tools.</p>
                </button>
              </div>

              {selectedRole === "employer" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Company name"
                    value={employerProfile.company_name}
                    onChange={(event) => setEmployerProfile((prev) => ({ ...prev, company_name: event.target.value }))}
                  />
                  <Input
                    placeholder="HR name"
                    value={employerProfile.hr_name}
                    onChange={(event) => setEmployerProfile((prev) => ({ ...prev, hr_name: event.target.value }))}
                  />
                  <Input
                    placeholder="Phone number"
                    value={employerProfile.phone}
                    onChange={(event) => setEmployerProfile((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                  <Input
                    placeholder="Company details"
                    value={employerProfile.company_details}
                    onChange={(event) => setEmployerProfile((prev) => ({ ...prev, company_details: event.target.value }))}
                  />
                </div>
              )}

              <Button onClick={handleRoleContinue} className="h-14 w-full text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue to Plan Selection"}
              </Button>
            </div>
          )}

          {step === "plan" && (
            <div className="space-y-8">
              {isPlansLoading ? (
                <div className="flex min-h-60 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  {availablePlans.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                      No subscription plans are available right now. Please create plans in Plan Management or refresh the page once plans are configured.
                    </div>
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                      {availablePlans.map((plan) => (
                        <button
                          type="button"
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={cn(
                            "rounded-3xl border-2 p-6 text-left transition-all hover:-translate-y-1",
                            normalizePlanCode(selectedPlanId) === normalizePlanCode(plan.id)
                              ? "border-purple-600 bg-purple-50"
                              : "border-slate-100 bg-white"
                          )}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{plan.name}</p>
                          {(() => {
                            const basePrice = Number(plan.price || 0);
                            const razorpayFeePercentage = Number(plan.razorpay_fee_percentage ?? 2);
                            const gstPercentage = Number(plan.gst_percentage ?? 18);
                            const razorpayFee = (basePrice * razorpayFeePercentage) / 100;
                            const gstAmount = (basePrice * gstPercentage) / 100;
                            const finalPrice = typeof plan.final_price === 'number'
                              ? plan.final_price
                              : basePrice + razorpayFee + gstAmount;
                            return (
                              <>
                                <p className="mt-3 text-3xl font-bold text-slate-900">Rs. {finalPrice.toLocaleString("en-IN")}</p>
                                <p className="text-xs text-slate-500">Incl. tax: Rs. {basePrice.toLocaleString("en-IN")} + ₹{(razorpayFee + gstAmount).toLocaleString("en-IN")}</p>
                              </>
                            );
                          })()}
                          <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                          <div className="mt-6 space-y-3">
                            {plan.features.map((feature, index) => (
                              <div key={`${plan.id}-${index}`} className="flex items-start gap-2 text-sm text-slate-600">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-14 flex-1" onClick={() => setStep("role")}>
                  Back
                </Button>
                <Button type="button" className="h-14 flex-1" onClick={() => setStep("payment")} disabled={!selectedPlanId}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {step === "payment" && selectedPlan && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-purple-100 bg-purple-50/60 p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700">Selected Plan</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">{selectedPlan.name}</h2>
                <p className="mt-2 text-slate-600">Rs. {Number(selectedPlanPricing?.finalPrice ?? selectedPlan.price ?? 0).toLocaleString("en-IN")} / {selectedPlan.period || "month"}</p>
                {selectedPlanPricing && (
                  <p className="mt-1 text-xs text-slate-500">Includes tax: ₹{selectedPlanPricing.basePrice.toLocaleString("en-IN")} + ₹{(selectedPlanPricing.razorpayFee + selectedPlanPricing.gstAmount).toLocaleString("en-IN")}</p>
                )}
              </div>

              <div className="space-y-3">
                {selectedPlan.features.map((feature, index) => (
                  <div key={`${selectedPlan.id}-feature-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-14 flex-1" onClick={() => setStep("plan")}>
                  Change Plan
                </Button>
                <Button type="button" className="h-14 flex-1" onClick={handlePayment} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay and Activate ${selectedPlan.name}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
