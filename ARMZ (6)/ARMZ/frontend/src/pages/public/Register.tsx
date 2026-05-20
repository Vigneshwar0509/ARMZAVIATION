import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Plane, Loader2, AlertCircle, ShieldCheck, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../store/authStore";
import { usePlanStore } from "../../store/planStore";
import { authService } from "../../services/authService";
import { paymentService } from "../../services/paymentService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import SEO from "../../components/common/SEO";
import OTPVerification from "../../components/auth/OTPVerification";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import { ENV } from "../../config/env";

type PaymentDebugState = {
  lastError: string;
  fallbackRetryAttempted: boolean;
  lastOrderId: string;
};

const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "admin123",
  "password1",
  "123456",
  "abc123",
  "iloveyou",
]);

const isPasswordTooSimilarToUserData = (password: string, fullName: string, email: string): boolean => {
  const normalizedPassword = password.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const emailLocalPart = normalizedEmail.split("@")[0] || "";
  const nameParts = fullName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (emailLocalPart && emailLocalPart.length >= 3 && normalizedPassword.includes(emailLocalPart)) {
    return true;
  }

  return nameParts.some((part) => part.length >= 3 && normalizedPassword.includes(part));
};

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
  dob: z.string().min(4, "Enter your date of birth"),
  gender: z.string().min(1, "Select your gender"),
  nationality: z.string().trim().min(2, "Enter your nationality"),
  country: z.string().trim().min(2, "Enter your country"),
  state: z.string().trim().min(2, "Enter your state"),
  city: z.string().trim().min(2, "Enter your city"),
  highestQualification: z.string().trim().min(2, "Enter your highest qualification"),
  careerInterest: z.string().trim().min(2, "Enter your career interest"),
  role: z.enum(["student", "employer"]),
  companyName: z.string().trim().optional(),
  hrName: z.string().trim().optional(),
  companyDetails: z.string().trim().optional(),
  agree: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords must match.",
      path: ["confirmPassword"],
    });
  }

  if (data.role === "employer") {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required for employer registration.",
        path: ["companyName"],
      });
    }
    if (!data.hrName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "HR name is required for employer registration.",
        path: ["hrName"],
      });
    }
    if (!data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required for employer registration.",
        path: ["phone"],
      });
    }
  }

  if (/^\d+$/.test(data.password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password cannot be entirely numeric.",
      path: ["password"],
    });
  }

  const normalizedPassword = data.password.trim().toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(normalizedPassword)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password is too common. Choose a stronger password.",
      path: ["password"],
    });
  }

  if (isPasswordTooSimilarToUserData(data.password, data.fullName, data.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password is too similar to your name or email.",
      path: ["password"],
    });
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { login, isLoading, setLoading } = useAuthStore();
  const { plans, fetchPlans, isLoading: isPlansLoading } = usePlanStore();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<RegisterFormValues | null>(null);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [paymentDebug, setPaymentDebug] = useState<PaymentDebugState>({
    lastError: '',
    fallbackRetryAttempted: false,
    lastOrderId: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "student",
      agree: false,
    },
  });

  const selectedRole = watch("role");
  const [showEmployerForm, setShowEmployerForm] = useState(false);

  const availablePlans = useMemo(
    () => plans.filter((plan) => String(plan.type || "student") === selectedRole && plan.isActive),
    [plans, selectedRole]
  );

  useEffect(() => {
    if (step === 2 && plans.length === 0) {
      void fetchPlans();
    }
  }, [fetchPlans, plans.length, step]);

  const selectedPlanDetails = useMemo(
    () => availablePlans.find((plan) => plan.id === selectedPlan) || null,
    [availablePlans, selectedPlan]
  );

  const formatPlanPrice = (plan: any) => {
    if (plan == null) return ""
    const price = Number(plan.price || 0);
    const period = String(plan.period || "month");
    return Number.isFinite(price) ? `₹${price.toLocaleString("en-IN")}/${period}` : "Contact us";
  };

  const onAccountSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      await authService.register({
        name: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        dob: data.dob,
        gender: data.gender,
        nationality: data.nationality,
        country: data.country,
        state: data.state,
        city: data.city,
        highestQualification: data.highestQualification,
        careerInterest: data.careerInterest,
        agree: data.agree,
        phone: data.phone,
        role: data.role,
        companyName: data.companyName,
        hrName: data.hrName,
        companyDetails: data.companyDetails,
      });
      setAccountData(data);
      setShowOTPVerification(true);
    } catch (error) {
      // authService already surfaces a user-facing message.
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = async (result: any) => {
    if (accountData?.role === "employer") {
      setShowOTPVerification(false);
      setStep(5);
    } else {
      if (result?.user) {
        login(result.user);
      }
      setShowOTPVerification(false);
      setStep(2);
    }
  };


  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    setStep(3);
  };

  const handlePayment = async () => {
    if (!accountData || !selectedPlan) return;

    // Safety timeout - reset loading after 5 minutes
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      toast.error('Payment process took too long. Please try again.');
    }, 5 * 60 * 1000);

    setLoading(true);
    try {
      await paymentService.loadRazorpay();
      const order = await paymentService.createOrder(selectedPlan, 'INR');
      setPaymentDebug((prev) => ({
        ...prev,
        lastError: '',
        fallbackRetryAttempted: false,
        lastOrderId: order?.id || '(no order id)',
      }));
      setLoading(false);

      await paymentService.initiatePayment(
        order,
        {
          name: accountData.fullName,
          email: accountData.email,
          phone: accountData.phone || '',
        },
        async (response) => {
          setLoading(true);
          clearTimeout(loadingTimeout);
          try {
            const result = await paymentService.processPaymentCompletion(
              selectedPlan,
              response
            );

            if (result.success) {
              // 1. Optimistic update to guarantee UI unblocking immediately
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                login({ ...currentUser, subscription: selectedPlan } as any);
                try {
                  await authService.updateProfile({ subscription: selectedPlan } as any);
                } catch (e) {
                  console.warn("Failed to sync subscription to backend", e);
                }
              }

              try {
                // 2. Try fetching fresh profile from server
                const profile = await authService.getProfile(true);
                if (profile) {
                  login({ ...profile, subscription: selectedPlan } as any);
                }
              } catch (e) {
                console.error("Failed to refresh profile from server", e);
              }
              setLoading(false);
              toast.success('Payment successful! Your subscription is active.');

              if (accountData.role === "employer") {
                navigate("/employer");
              } else {
                setStep(4);
              }
            } else {
              setLoading(false);
              toast.error(result.message || "Payment verification failed. Please try again.");
            }
          } catch (error: any) {
            setLoading(false);
            toast.error(error.response?.data?.message || "An error occurred after payment. Please try again.");
          }
        },
        (error) => {
          clearTimeout(loadingTimeout);
          setLoading(false);
          const errorText = String(error?.description || error?.message || error?.reason || '').toLowerCase();
          setPaymentDebug((prev) => ({
            ...prev,
            lastError: error?.description || error?.message || error?.reason || 'unknown_error',
            fallbackRetryAttempted: Boolean(error?.fallbackRetryAttempted),
          }));
          if (error?.reason === 'user_cancelled') {
            toast.error("Payment cancelled.");
          } else if (errorText.includes('no appropriate payment method found')) {
            toast.error('No payment methods are available for this merchant key right now. Please verify Razorpay account payment method settings in test mode.');
          } else {
            toast.error(error?.description || error?.message || error?.reason || "Payment failed. Please try again.");
          }
        }
      );
    } catch (err: any) {
      clearTimeout(loadingTimeout);
      setLoading(false);
      toast.error(err.message || "Failed to initialize payment. Please try again.");
    }
  };

  if (showOTPVerification && accountData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <SEO title="Verify Email" description="Verify your email address" />
        <div className="max-w-md w-full glass-card p-8 rounded-3xl shadow-2xl border-white/50">
          <OTPVerification
            email={accountData.email}
            type="email"
            onSuccess={handleOTPVerified}
            onCancel={() => setShowOTPVerification(false)}
            title="Verify Your Email"
            description={`We've sent a 6-digit code to ${accountData.email}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-transparent flex items-center justify-center px-4 pb-12">
      <SEO title="Register" description="Join the ARMZ Aviation community" />
      <div 
        className="max-w-2xl w-full glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl border-white/50"
      >
        {/* Progress Bar */}
        {step < 5 && (
          <div className="flex items-center justify-between mb-8 sm:mb-12 px-2 sm:px-4">
            {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-500 shrink-0",
                step >= s ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "bg-slate-100 text-slate-400"
              )}>
                {step > s ? <ShieldCheck className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div className={cn(
                  "h-1 w-8 sm:w-20 mx-1 sm:mx-2 rounded-full transition-all duration-500",
                  step > s ? "bg-purple-600" : "bg-slate-100"
                )} />
              )}
            </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
                <p className="text-slate-500">Enter your details to get started</p>
              </div>

              <form onSubmit={handleSubmit(onAccountSubmit)} className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-purple-600 font-bold">
                        {selectedRole === "employer" ? "Employer registration" : "Student registration"}
                      </p>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedRole === "employer" ? "Create your employer account" : "Create your student account"}
                      </h2>
                      <p className="text-slate-500">
                        {selectedRole === "employer"
                          ? "Enter your company details below to create an employer account."
                          : "If you are an employer, tap the button below."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRole === "employer") {
                          setValue("role", "student");
                          setShowEmployerForm(false);
                        } else {
                          setValue("role", "employer");
                          setShowEmployerForm(true);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-purple-600 bg-purple-50 px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                    >
                      {selectedRole === "employer" ? "Switch to student" : "Employer registration"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-fullName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    <Input 
                      id="register-fullName"
                      type="text" 
                      placeholder="John Doe" 
                      {...(errors.fullName ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.fullName ? "register-fullName-error" : undefined}
                      className={cn("pl-14 h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.fullName && "border-red-300 ring-1 ring-red-500")}
                      {...register("fullName")}
                    />
                  </div>
                  {errors.fullName && <p id="register-fullName-error" className="text-xs text-red-500 font-bold ml-4">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-dob" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Date of Birth</label>
                  <Input 
                    id="register-dob"
                    type="date" 
                    {...(errors.dob ? { "aria-invalid": true } : {})}
                    aria-describedby={errors.dob ? "register-dob-error" : undefined}
                    className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.dob && "border-red-300 ring-1 ring-red-500")}
                    {...register("dob")}
                  />
                  {errors.dob && <p id="register-dob-error" className="text-xs text-red-500 font-bold ml-4">{errors.dob.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-gender" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Gender</label>
                  <select id="register-gender" className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500 w-full px-4", errors.gender && "border-red-300 ring-1 ring-red-500")}
                    {...(errors.gender ? { "aria-invalid": true } : {})}
                    aria-describedby={errors.gender ? "register-gender-error" : undefined}
                    {...register("gender")}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p id="register-gender-error" className="text-xs text-red-500 font-bold ml-4">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-nationality" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Nationality</label>
                  <Input 
                    id="register-nationality"
                    type="text" 
                    placeholder="e.g. Indian" 
                    {...(errors.nationality ? { "aria-invalid": true } : {})}
                    aria-describedby={errors.nationality ? "register-nationality-error" : undefined}
                    className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.nationality && "border-red-300 ring-1 ring-red-500")}
                    {...register("nationality")}
                  />
                  {errors.nationality && <p id="register-nationality-error" className="text-xs text-red-500 font-bold ml-4">{errors.nationality.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="register-country" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Country</label>
                    <Input 
                      id="register-country"
                      type="text" 
                      placeholder="Country" 
                      {...(errors.country ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.country ? "register-country-error" : undefined}
                      className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.country && "border-red-300 ring-1 ring-red-500")}
                      {...register("country")}
                    />
                    {errors.country && <p id="register-country-error" className="text-xs text-red-500 font-bold ml-4">{errors.country.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="register-state" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">State</label>
                    <Input 
                      id="register-state"
                      type="text" 
                      placeholder="State" 
                      {...(errors.state ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.state ? "register-state-error" : undefined}
                      className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.state && "border-red-300 ring-1 ring-red-500")}
                      {...register("state")}
                    />
                    {errors.state && <p id="register-state-error" className="text-xs text-red-500 font-bold ml-4">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="register-city" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">City</label>
                    <Input 
                      id="register-city"
                      type="text" 
                      placeholder="City" 
                      {...(errors.city ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.city ? "register-city-error" : undefined}
                      className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.city && "border-red-300 ring-1 ring-red-500")}
                      {...register("city")}
                    />
                    {errors.city && <p id="register-city-error" className="text-xs text-red-500 font-bold ml-4">{errors.city.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-highestQualification" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Highest Qualification</label>
                  <Input 
                    id="register-highestQualification"
                    type="text" 
                    placeholder="e.g. B.Tech, MBA" 
                    className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.highestQualification && "border-red-300 ring-1 ring-red-500")}
                    {...register("highestQualification")}
                  />
                  {errors.highestQualification && <p className="text-xs text-red-500 font-bold ml-4">{errors.highestQualification.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-careerInterest" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Career Interest</label>
                  <Input 
                    id="register-careerInterest"
                    type="text" 
                    placeholder="e.g. Pilot, Engineer" 
                    className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.careerInterest && "border-red-300 ring-1 ring-red-500")}
                    {...register("careerInterest")}
                  />
                  {errors.careerInterest && <p className="text-xs text-red-500 font-bold ml-4">{errors.careerInterest.message}</p>}
                </div>


                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="john@example.com"
                      {...(errors.email ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.email ? "register-email-error" : undefined}
                      className={cn("pl-14 h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500 w-full", errors.email && "border-red-300 ring-1 ring-red-500")}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p id="register-email-error" className="text-xs text-red-500 font-bold ml-4">{errors.email.message}</p>}
                </div>


                <div className="space-y-2">
                  <label htmlFor="register-phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                    {selectedRole === "employer" ? "Company HR Phone" : "Phone Number (optional)"}
                  </label>
                  <Input
                    id="register-phone"
                    type="text"
                    placeholder={selectedRole === "employer" ? "e.g. +91 98765 43210" : "e.g. +91 98765 43210"}
                    className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500 w-full", errors.phone && "border-red-300 ring-1 ring-red-500")}
                    {...register("phone")}
                  />
                  {errors.phone && <p className="text-xs text-red-500 font-bold ml-4">{errors.phone.message}</p>}
                </div>

                {showEmployerForm && (
                  <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-6 space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-purple-600 font-semibold">Employer registration</p>
                        <p className="text-slate-500">Enter company details so we can connect you to the right candidates.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValue("role", "student");
                          setShowEmployerForm(false);
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Back to student form
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-companyName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Company Name</label>
                      <Input
                        id="register-companyName"
                        type="text"
                        placeholder="e.g. Airlines Pvt Ltd"
                        className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.companyName && "border-red-300 ring-1 ring-red-500")}
                        {...register("companyName")}
                      />
                      {errors.companyName && <p className="text-xs text-red-500 font-bold ml-4">{errors.companyName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-hrName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">HR Name</label>
                      <Input
                        id="register-hrName"
                        type="text"
                        placeholder="e.g. Sarah Smith"
                        className={cn("h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.hrName && "border-red-300 ring-1 ring-red-500")}
                        {...register("hrName")}
                      />
                      {errors.hrName && <p className="text-xs text-red-500 font-bold ml-4">{errors.hrName.message}</p>}
                    </div>

                  </div>
                )}



                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    <Input 
                      id="register-password"
                      type="password" 
                      placeholder="••••••••" 
                      {...(errors.password ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.password ? "register-password-error" : undefined}
                      className={cn("pl-14 h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.password && "border-red-300 ring-1 ring-red-500")}
                      {...register("password")}
                    />
                  </div>
                  {errors.password && <p id="register-password-error" className="text-xs text-red-500 font-bold ml-4">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-confirmPassword" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                    <Input 
                      id="register-confirmPassword"
                      type="password" 
                      placeholder="Re-enter password" 
                      {...(errors.confirmPassword ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.confirmPassword ? "register-confirmPassword-error" : undefined}
                      className={cn("pl-14 h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500", errors.confirmPassword && "border-red-300 ring-1 ring-red-500")}
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && <p id="register-confirmPassword-error" className="text-xs text-red-500 font-bold ml-4">{errors.confirmPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-4">
                    <input type="checkbox" id="agree" className="h-5 w-5 rounded-md border-slate-300 text-purple-600" {...register("agree")} />
                    <label htmlFor="agree" className="text-sm text-slate-500 font-medium">I agree to the Terms & Conditions</label>
                  </div>
                  {errors.agree && <p className="text-xs text-red-500 font-bold ml-4">{errors.agree.message}</p>}
                </div>

                <Button type="submit" className="h-16 text-lg group">
                  Continue to Plans <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-purple-600 font-semibold">Step 2 • Choose a plan</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Select the plan that matches your goals</h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                  {selectedRole === "employer" ? "Choose the right hiring package for your company." : "Choose the best path for your aviation career."}
                </p>
              </div>

              {isPlansLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/50 animate-pulse h-80" />
                  ))}
                </div>
              ) : availablePlans.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                  No subscription plans are available right now. Please ask an admin to create one in Plan Management.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {availablePlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col h-full hover:-translate-y-1",
                        selectedPlan === plan.id ? "border-purple-600 bg-purple-50/50" : "border-slate-100 bg-white hover:border-purple-200"
                      )}
                    >
                      <div className="mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{plan.name}</span>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPlanPrice(plan)}</h3>
                      </div>
                      <ul className="space-y-3 grow">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start text-xs text-slate-600 font-medium">
                            <ShieldCheck className="h-4 w-4 text-purple-600 mr-2 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button variant={selectedPlan === plan.id ? "primary" : "outline"} className="mt-8 w-full">
                        Select {plan.name}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors w-full text-center uppercase tracking-widest">
                Back to Account Details
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Secure Payment</h1>
                <p className="text-slate-500">Complete your subscription to {selectedPlan} plan</p>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{selectedPlanDetails?.name || selectedPlan} Plan</h4>
                    <p className="text-xs text-slate-500 mt-1">Billed monthly</p>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {selectedPlanDetails?.price || plans.find(p => p.id === selectedPlan)?.price}
                  </span>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Razorpay Secure Payment</p>
                      <p className="text-xs text-slate-500">Auto-pay enabled for seamless renewal</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handlePayment} className="w-full h-16 text-lg group" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>Proceed to Payment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
                
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  Secure 256-bit SSL Encrypted Payment via Razorpay
                </p>

                {import.meta.env.DEV && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Payment Diagnostics</p>
                    <div className="text-xs text-amber-900 space-y-1">
                      <p>Page Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'n/a'}</p>
                      <p>API Base URL: {ENV.API_BASE_URL || '(empty)'}</p>
                      <p>Razorpay Key: {ENV.RAZORPAY_KEY_ID ? `${ENV.RAZORPAY_KEY_ID.slice(0, 12)}...` : 'Missing'}</p>
                      <p>Order ID: {paymentDebug.lastOrderId || '(not created yet)'}</p>
                      <p>Fallback Retry Attempted: {paymentDebug.fallbackRetryAttempted ? 'Yes' : 'No'}</p>
                      <p>Last Error: {paymentDebug.lastError || '(none)'}</p>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setStep(2)} className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors w-full text-center uppercase tracking-widest">
                Change Plan
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="text-center space-y-8 py-10"
            >
              <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Welcome Aboard!</h1>
                <p className="text-slate-600 text-lg">Your account has been created and subscription is active.</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-3xl inline-block">
                <p className="text-purple-700 font-bold uppercase tracking-widest text-xs">Plan Activated: {plans.find((plan) => plan.id === selectedPlan)?.name || selectedPlan}</p>
              </div>
              <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full h-16 text-lg">
                Enter Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="text-center space-y-8 py-10"
            >
              <div className="h-24 w-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Application Submitted</h1>
                <p className="text-slate-600 text-lg">Your employer account is pending verification.</p>
                <p className="text-slate-500 text-sm max-w-md mx-auto mt-4">
                  To ensure the highest quality of opportunities for our candidates, all employer accounts must be verified by our admin team before posting jobs or accessing candidate profiles. You will receive an email once your account is approved.
                </p>
              </div>
              <Button onClick={() => navigate('/')} size="lg" className="w-full h-16 text-lg mt-8">
                Return to Home <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 && (
          <div className="mt-10 text-center">
            <p className="text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
