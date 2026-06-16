import React, { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, 
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
import { Link, useNavigate } from "react-router-dom";
import { SmartSearch } from "@/src/components/common/SmartSearch";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { usePlanStore } from "@/src/store/planStore";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cn } from "@/src/lib/utils";

export default function Hero() {
  const navigate = useNavigate();
  const { plans, fetchPlans, isLoading } = usePlanStore();
  const [selectedPlanType, setSelectedPlanType] = useState<'student' | 'employer'>('student');

  useEffect(() => {
    if (plans.length === 0) {
      fetchPlans();
    }
  }, [plans.length, fetchPlans]);

  const ref = useRef<HTMLElement | null>(null);
  const [supportsHover, setSupportsHover] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hoverQuery = window.matchMedia("(any-hover: hover)");
    const updateHover = () => setSupportsHover(hoverQuery.matches);
    updateHover();
    if (hoverQuery.addEventListener) {
      hoverQuery.addEventListener("change", updateHover);
    } else {
      hoverQuery.addListener(updateHover);
    }
    return () => {
      if (hoverQuery.removeEventListener) {
        hoverQuery.removeEventListener("change", updateHover);
      } else {
        hoverQuery.removeListener(updateHover);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (bgRafRef.current) {
        cancelAnimationFrame(bgRafRef.current);
      }
    };
  }, []);

  const handleBackgroundPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!supportsHover || prefersReducedMotion) return;
    if (bgRafRef.current) {
      cancelAnimationFrame(bgRafRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / (rect.width || 1) - 0.5;
    const yPct = (e.clientY - rect.top) / (rect.height || 1) - 0.5;

    bgRafRef.current = requestAnimationFrame(() => {
      mouseX.set(xPct);
      mouseY.set(yPct);
    });
  };

  const handleSearch = (query: string, filters: any) => {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (filters.type !== "all") params.append("type", filters.type);
    if (filters.location !== "all") params.append("location", filters.location);
    if (filters.experience !== "all") params.append("experience", filters.experience);
    
    navigate(`/jobs?${params.toString()}`);
  };

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
    <section
      ref={ref}
      onPointerMove={handleBackgroundPointerMove}
      className="relative min-h-screen flex flex-col pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 bg-gradient-to-br from-[#f3e8ff] via-[#f9f5ff] to-[#fef7ff] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden text-slate-900 dark:text-slate-100"
    >
      {/* Lilac background with subtle gradients */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_25%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.14),_transparent_25%)]" />
      
      {/* Animated background elements */}
      <motion.div
        style={{ x: useTransform(mouseX, (v) => v / -20), y: useTransform(mouseY, (v) => v / -20) }}
        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 sm:w-[600px] h-80 sm:h-[600px] bg-purple-300/20 rounded-full blur-[120px] sm:blur-[200px] pointer-events-none"
      />
      <motion.div
        style={{ x: useTransform(mouseX, (v) => v / 20), y: useTransform(mouseY, (v) => v / 20) }}
        className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-indigo-300/15 rounded-full blur-[120px] sm:blur-[200px] pointer-events-none"
      />

      {/* Geometric plane shape on right - matching screenshot */}
      <div className="absolute top-1/3 right-0 sm:right-20 opacity-10 pointer-events-none">
        <div className="w-96 h-96 sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-purple-500/50 to-indigo-600/50 rounded-3xl transform -skew-y-12"></div>
      </div>

      {/* Floating Clouds */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -10, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 opacity-20 pointer-events-none"
      >
        <div className="w-32 h-16 bg-white/60 rounded-full blur-sm"></div>
      </motion.div>

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 15, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className="absolute top-1/3 right-1/3 opacity-15 pointer-events-none"
      >
        <div className="w-40 h-20 bg-white/50 rounded-full blur-sm"></div>
      </motion.div>

      {/* Flight Path Lines */}
      <motion.div
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
        transition={{
          duration: 8,
          delay: 1.5,
          repeat: Infinity,
          repeatDelay: 6,
          ease: "easeInOut"
        }}
        className="absolute bottom-0 left-0 pointer-events-none z-4"
      >
        <svg width="800" height="400" className="absolute bottom-0 left-0">
          <motion.path
            d="M50,350 Q200,250 400,150 T750,50"
            stroke="url(#flightGradient)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="10,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 8, delay: 1.5, repeat: Infinity, repeatDelay: 6 }}
          />
          <defs>
            <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Contrail Effects */}
      <motion.div
        animate={{
          opacity: [0, 0.6, 0.3, 0],
          scaleX: [0, 1, 1.2, 0]
        }}
        transition={{
          duration: 6,
          delay: 3,
          repeat: Infinity,
          repeatDelay: 8,
          ease: "easeOut"
        }}
        className="absolute top-1/4 left-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full blur-sm pointer-events-none z-3"
      />

      {/* Multiple Animated Planes */}
      {/* Plane 1 - Main takeoff */}
      <motion.div
        initial={{ x: -100, y: 350, rotate: -20, opacity: 0 }}
        animate={{
          x: [0, 250, 500, 750],
          y: [0, -120, -240, -400],
          rotate: [-20, -12, -5, 2],
          opacity: [0, 1, 0.9, 0.6, 0]
        }}
        transition={{
          duration: 10,
          delay: 1,
          repeat: Infinity,
          repeatDelay: 6,
          ease: "easeOut",
          times: [0, 0.25, 0.5, 0.75, 1]
        }}
        className="absolute bottom-0 left-0 pointer-events-none z-5"
      >
        <div className="relative">
          {/* Vapor trail */}
          <motion.div
            animate={{
              scaleX: [0, 1.5, 2],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 2
            }}
            className="absolute -left-40 top-1/2 w-40 h-2 bg-gradient-to-r from-transparent via-purple-300/50 to-transparent rounded-full blur-sm"
          />

          {/* Plane icon */}
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="relative"
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600 drop-shadow-xl">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" fill="currentColor"/>
            </svg>
          </motion.div>

          {/* Engine glow */}
          <motion.div
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity
            }}
            className="absolute -right-1 top-1/2 w-2 h-2 bg-orange-400 rounded-full blur-sm"
          />
        </div>
      </motion.div>

      {/* Plane 2 - Secondary flight */}
      <motion.div
        initial={{ x: 200, y: 200, rotate: 15, opacity: 0 }}
        animate={{
          x: [200, 400, 600],
          y: [200, 50, -100],
          rotate: [15, 8, 0],
          opacity: [0, 0.8, 0.4, 0]
        }}
        transition={{
          duration: 8,
          delay: 4,
          repeat: Infinity,
          repeatDelay: 8,
          ease: "easeOut"
        }}
        className="absolute bottom-0 right-0 pointer-events-none z-5"
      >
        <div className="relative">
          {/* Smaller plane */}
          <motion.div
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500 drop-shadow-lg opacity-80">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" fill="currentColor"/>
            </svg>
          </motion.div>

          {/* Mini trail */}
          <motion.div
            animate={{
              scaleX: [0, 1, 1.5],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 4.5
            }}
            className="absolute -left-24 top-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-purple-300/30 to-transparent rounded-full blur-sm"
          />
        </div>
      </motion.div>

      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px] lg:min-h-[500px]">
            {/* Left Content */}
            <div className="flex flex-col items-start lg:items-start">
              {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 sm:mb-10 lg:mb-12"
            >
              <span className="inline-flex items-center px-4 sm:px-5 py-2 rounded-full border border-orange-400/40 bg-orange-100/60 text-orange-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-200">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                India's Premier Aviation Career Platform
              </span>
            </motion.div>
            {/* Main Content */}
            <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Main Heading */}
                  <div className="space-y-3">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tighter">
                      <span className="text-slate-900 dark:text-white block">LAUNCH YOUR</span>
                      <span className="text-purple-600 dark:text-purple-400 block">AVIATION</span>
                      <span className="text-slate-900 dark:text-white block">CAREER</span>
                    </h1>
                  </div>

                  {/* Description */}
                  <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
                    ARMZ Aviation connects <span className="font-semibold text-slate-900 dark:text-white">aspiring aviators</span> with top recruiters, training pathways, and career-defining opportunities — all under one roof. Upskill. Subscribe. Take off.
                  </p>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-4"
                  >
                    <Link to="/register" className="block">
                      <Button className="h-12 px-8 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all duration-300 shadow-lg shadow-purple-600/40 dark:bg-purple-600 dark:hover:bg-purple-700">
                        EXPLORE PLANS
                      </Button>
                    </Link>
                    <Link to="/contact" className="block">
                      <Button variant="outline" className="h-12 px-8 rounded-lg border border-purple-300 bg-white dark:bg-slate-900 text-slate-700 dark:border-purple-500/50 dark:text-slate-200 hover:bg-purple-100/50 dark:hover:bg-slate-800 transition-all duration-300">
                        GLOBAL CONCLAVE 2026 →
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Right Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:flex flex-col items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-fuchsia-200/30 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-3xl blur-2xl"></div>
                
                {/* Stats Card */}
                <div className="relative backdrop-blur-md bg-white/80 dark:bg-slate-800/60 rounded-3xl p-8 sm:p-10 border border-purple-200/80 dark:border-slate-500/40 shadow-2xl dark:shadow-slate-950/50">
                  <div className="space-y-8">
                    {/* Stat 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-center pb-8 border-b border-purple-100/60 dark:border-slate-600/40"
                    >
                      <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white">5L<span className="text-orange-500 dark:text-orange-400">+</span></div>
                      <div className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mt-3">Earn Per Annum</div>
                    </motion.div>

                    {/* Stat 2 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="text-center pb-8 border-b border-purple-100/60 dark:border-slate-600/40"
                    >
                      <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white">500<span className="text-orange-500 dark:text-orange-400">+</span></div>
                      <div className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mt-3">Recruiters Network</div>
                    </motion.div>

                    {/* Stat 3 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="text-center"
                    >
                      <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white">3</div>
                      <div className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mt-3">Career Plans</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
          "glass-card flex-1 flex flex-col p-4 sm:p-6 lg:p-8 relative group transition-all duration-300 rounded-2xl sm:rounded-3xl lg:rounded-[48px]",
          'border-white/60 hover:border-purple-100 bg-white/40'
        )}
      >

        <div className="mb-6 sm:mb-10 transform-[translateZ(50px)]">
          <div className={`w-12 sm:w-16 h-12 sm:h-16 rounded-2xl sm:rounded-3xl ${colors.bg} ${colors.color} flex items-center justify-center mb-4 sm:mb-8 group-hover:rotate-6 transition-transform duration-300 shadow-sm shrink-0`}>
            <Icon size={24} className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-2xl font-display font-bold text-slate-900 mb-2 sm:mb-3">{plan.name}</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">{plan.description}</p>
        </div>

        <div className="mb-6 sm:mb-10 transform-[translateZ(40px)]">
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-4xl font-display font-bold text-slate-900">₹{Number(plan.price || 0).toLocaleString()}</span>
            <span className="text-slate-400 font-bold ml-2 text-xs sm:text-lg">/{String(plan.period || '').toLowerCase() === 'month' ? 'mo' : 'once'}</span>
          </div>
          <div className="mt-2 h-1 w-8 sm:w-12 bg-purple-100 rounded-full" />
        </div>

        <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12 grow transform-[translateZ(30px)]">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Benefits</p>
          <ul className="space-y-2 sm:space-y-4">
            {(Array.isArray(plan.features) ? plan.features : []).slice(0, 4).map((feature: string, i: number) => (
              <li key={feature}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-start text-xs sm:text-sm text-slate-700 font-medium leading-tight"
                >
                  <div className={`mt-0.5 mr-2 sm:mr-4 p-1 rounded-full ${colors.bg} ${colors.color} shrink-0`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feature}
                </motion.div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 sm:space-y-4 transform-[translateZ(20px)]">
          <Link to="/register" className="block">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="w-full h-12 rounded-lg sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all duration-300 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Select Plan
              </Button>
            </motion.div>
          </Link>
          <Link to="/jobs" className="block text-center">
            <span className="text-[9px] sm:text-xs font-bold text-slate-400 hover:text-purple-600 transition-colors cursor-pointer">
              Preview Jobs
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
