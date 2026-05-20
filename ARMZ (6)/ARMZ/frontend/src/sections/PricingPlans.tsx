import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Globe,
  Users,
  Check,
  Zap,
  Crown,
  GraduationCap,
  Building2
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { usePlanStore } from "@/src/store/planStore";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cn } from "@/src/lib/utils";

export default function PricingPlans() {
  const { plans, fetchPlans, isLoading } = usePlanStore();
  const [selectedPlanType, setSelectedPlanType] = useState<'student' | 'employer'>('student');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (plans.length === 0) {
      fetchPlans();
    }
  }, [plans.length, fetchPlans]);

  const getPlanKey = (plan: any) => {
    const base = plan?.id ?? plan?.slug ?? plan?.code ?? plan?.name ?? '';
    return String(base).trim().toLowerCase().replace(/\s+/g, '_');
  };

  const getPlanType = (plan: any): 'student' | 'employer' => {
    const explicitType = String(plan?.type ?? plan?.plan_type ?? '').toLowerCase();
    if (explicitType === 'student' || explicitType === 'employer') {
      return explicitType;
    }

    const key = getPlanKey(plan);
    if (key.includes('recruiter') || key.includes('employer') || key.includes('enterprise')) {
      return 'employer';
    }

    return 'student';
  };

  const isPlanActive = (plan: any) => {
    if (typeof plan?.isActive === 'boolean') return plan.isActive;
    if (typeof plan?.is_active === 'boolean') return plan.is_active;
    return true;
  };

  const filteredPlans = plans
    .filter((plan) => getPlanType(plan) === selectedPlanType && isPlanActive(plan))
    .sort((a, b) => {
      const priceA = Number(a.price || 0);
      const priceB = Number(b.price || 0);
      if (priceA !== priceB) return priceA - priceB;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });

  const planTypeOptions = [
    {
      id: 'student',
      label: 'For Students',
      description: 'Launch your aviation career',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'employer',
      label: 'For Employers',
      description: 'Find top aviation talent',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const getPlanIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case "prime": return Globe;
      case "premium": return Zap;
      case "placement": return Crown;
      case "recruiter_starter": return Users;
      case "recruiter_growth": return Building2;
      case "recruiter_enterprise": return Sparkles;
      default: return Zap;
    }
  };

  const getPlanColors = (id: string) => {
    switch (id.toLowerCase()) {
      case "prime": return { color: "text-blue-500", bg: "bg-blue-50" };
      case "premium": return { color: "text-purple-600", bg: "bg-purple-50" };
      case "placement": return { color: "text-amber-600", bg: "bg-amber-50" };
      case "recruiter_starter": return { color: "text-emerald-600", bg: "bg-emerald-50" };
      case "recruiter_growth": return { color: "text-purple-600", bg: "bg-purple-50" };
      case "recruiter_enterprise": return { color: "text-rose-600", bg: "bg-rose-50" };
      default: return { color: "text-purple-600", bg: "bg-purple-50" };
    }
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-purple-300/10 rounded-full blur-[120px] sm:blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-blue-300/10 rounded-full blur-[120px] sm:blur-[200px]" />
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 sm:mb-6">
              Choose Your Path
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Select from our flexible subscription plans designed for aspiring aviators and aviation employers alike.
            </p>
          </motion.div>

          {/* Plan Type Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
              {planTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedPlanType(option.id as 'student' | 'employer')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300",
                      selectedPlanType === option.id
                        ? `${option.bgColor} ${option.color} shadow-md`
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Icon size={16} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.label.split(' ')[1]}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-96 rounded-3xl" />
              ))}
            </div>
          ) : filteredPlans.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {filteredPlans.map((plan, index) => (
                <InteractivePlanCard
                  key={getPlanKey(plan)}
                  plan={plan}
                  Icon={getPlanIcon(plan.id || plan.code || plan.name)}
                  colors={getPlanColors(plan.id || plan.code || plan.name)}
                  index={index}
                  selectedPlanType={selectedPlanType}
                  enableTilt={!prefersReducedMotion}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-12"
            >
              <p className="text-slate-500 text-lg">No plans available for this category.</p>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 sm:mt-16 lg:mt-20 text-center"
          >
            <p className="text-slate-600 mb-6">Not sure which plan is right for you?</p>
            <Link to="/contact" className="inline-block">
              <Button className="h-12 px-8 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all duration-300 shadow-lg shadow-purple-600/40">
                Talk to Our Team
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const InteractivePlanCard = ({ plan, Icon, colors, index, selectedPlanType, enableTilt }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const rafRef = useRef<number | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;

    const native = e.nativeEvent as PointerEvent;
    const offsetX = native.offsetX;
    const offsetY = native.offsetY;
    const width = cardRef.current.clientWidth || 1;
    const height = cardRef.current.clientHeight || 1;
    const xPct = offsetX / width - 0.5;
    const yPct = offsetY / height - 0.5;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      x.set(xPct);
      y.set(yPct);
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      className="flex w-full"
    >
      <div
        className={cn(
          "glass-card flex-1 flex flex-col p-4 sm:p-6 lg:p-8 relative group transition-all duration-300 rounded-2xl sm:rounded-3xl lg:rounded-[32px]",
          'border border-white/60 hover:border-purple-100 bg-white/40 backdrop-blur-md hover:shadow-xl'
        )}
      >
        {/* Icon and Title */}
        <div className="mb-6 sm:mb-10">
          <div
            className={`w-12 sm:w-16 h-12 sm:h-16 rounded-2xl sm:rounded-3xl ${colors.bg} ${colors.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-sm shrink-0`}
          >
            <Icon size={24} className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-bold text-slate-900">
              ₹{Number(plan.final_price || plan.price || 0).toLocaleString()}
            </span>
            <span className="text-slate-400 font-bold ml-2 text-xs sm:text-lg">
              /{String(plan.period || '').toLowerCase() === 'month' ? 'mo' : 'once'}
            </span>
          </div>
          <div className="mt-2 h-1 w-8 sm:w-12 bg-purple-100 rounded-full" />
          
          {/* Pricing Breakdown Tooltip */}
          {(plan.pricing_breakdown || plan.price !== undefined) && (
            (() => {
              const breakdown = plan.pricing_breakdown || {
                base_price: Number(plan.price || 0),
                razorpay_fee_percentage: Number(plan.razorpay_fee_percentage ?? 2),
                gst_percentage: Number(plan.gst_percentage ?? 18),
                razorpay_fee: ((Number(plan.price || 0) * Number(plan.razorpay_fee_percentage ?? 2)) / 100),
                gst_amount: ((Number(plan.price || 0) * Number(plan.gst_percentage ?? 18)) / 100),
                final_price: Number(plan.final_price ?? 0) || Number(plan.price || 0) + ((Number(plan.price || 0) * Number(plan.razorpay_fee_percentage ?? 2)) / 100) + ((Number(plan.price || 0) * Number(plan.gst_percentage ?? 18)) / 100),
              };
              return (
                <div className="mt-3 p-2.5 sm:p-3 bg-slate-50 rounded-lg text-xs sm:text-[11px] space-y-1.5 font-medium text-slate-600 border border-slate-100">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-semibold">₹{Number(breakdown.base_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax</span>
                    <span>+ ₹{Number((breakdown.razorpay_fee || 0) + (breakdown.gst_amount || 0)).toLocaleString()}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-purple-600">
                    <span>Total:</span>
                    <span>₹{Number(breakdown.final_price || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Features */}
        <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12 grow">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Key Benefits
          </p>
          <ul className="space-y-2 sm:space-y-3">
            {(Array.isArray(plan.features) ? plan.features : []).slice(0, 4).map((feature: string, i: number) => (
              <li key={feature}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-start text-xs sm:text-sm text-slate-700 font-medium leading-tight"
                >
                  <div className={`mt-0.5 mr-2 sm:mr-3 p-1 rounded-full ${colors.bg} ${colors.color} shrink-0`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feature}
                </motion.div>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 sm:space-y-4">
          <Link to="/register" className="block">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button className="w-full h-11 sm:h-12 rounded-lg sm:rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all duration-300 shadow-md text-sm sm:text-base">
                Get Started
              </Button>
            </motion.div>
          </Link>
          <Link to="/jobs" className="block text-center">
            <span className="text-[9px] sm:text-xs font-bold text-slate-400 hover:text-purple-600 transition-colors cursor-pointer">
              Explore Opportunities
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
