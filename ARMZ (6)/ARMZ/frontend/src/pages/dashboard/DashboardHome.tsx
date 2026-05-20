import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { 
  Briefcase, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  Building2,
  Plane,
  Bell,
  FileText,
  Sparkles,
  User,
  LineChart,
  Send,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/store/authStore";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usePlanStore } from "@/src/store/planStore";
import { canAccessRouteForPlan, normalizePlanCode, normalizeStoredPlanCode } from "@/src/lib/subscription";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
const CareerRoadmap = lazy(() => import("@/src/components/dashboard/CareerRoadmap"));

import { useDashboardStats, useApplications, useJobs, useSavedJobs } from "@/src/hooks/useQueries";

export default function DashboardHome() {
  const APPS_PAGE_SIZE = 4;
  const { user } = useAuthStore();
  const { hasPermission, plans, fetchPlans } = usePlanStore();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats("30d");
  const { data: recentApps = [], isLoading: isAppsLoading } = useApplications(user?.id, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: jobs = [], isLoading: isJobsLoading } = useJobs();
  const { data: savedJobs = [], isLoading: isSavedLoading } = useSavedJobs(user?.id);
  const navigate = useNavigate();
  const [currentAppsPage, setCurrentAppsPage] = useState(1);

  const isLoading = isStatsLoading || isAppsLoading || isJobsLoading || isSavedLoading;
  const currentPlanCode = normalizePlanCode(user?.subscription);
  const isPlacementPlan = currentPlanCode === "placement";
  const planFeatureCards = [
    {
      title: "Resume Builder",
      description: "Build and export aviation-ready resumes for recruiter review.",
      permission: "resume_builder",
      href: "/dashboard/resume",
      icon: FileText,
    },
    {
      title: "LinkedIn Support",
      description: "Optimize your profile for placement and recruiter visibility.",
      permission: "linkedin_support",
      href: "/dashboard/linkedin",
      icon: User,
    },
    {
      title: "Webinars",
      description: "Join live sessions, workshops, and placement preparation events.",
      permission: "webinars",
      href: "/dashboard/webinars",
      icon: Plane,
    },
  ] as const;

  const profileCompleteness = user ? 85 : 0; // Simulated logic

  useEffect(() => {
    if (plans.length === 0) {
      void fetchPlans();
    }
  }, [fetchPlans, plans.length]);

  const handleNotificationClick = () => {
    toast.success("You're all caught up! No new notifications.");
  };

  const handleGoPremium = () => {
    navigate("/dashboard/subscriptions");
  };

  const handleViewAllApps = () => {
    navigate("/dashboard/applications");
  };

  const internshipJobs = useMemo(
    () => jobs.filter((job: any) => String(job.type || '').toLowerCase() === "internship"),
    [jobs]
  );

  const internshipCount = internshipJobs.length;
  const savedJobsCount = savedJobs.length;
  const internshipRecommendations = internshipJobs.slice(0, 3);

  const appsPageCount = Math.max(1, Math.ceil(recentApps.length / APPS_PAGE_SIZE));
  const pagedRecentApps = useMemo(() => {
    const start = (currentAppsPage - 1) * APPS_PAGE_SIZE;
    return recentApps.slice(start, start + APPS_PAGE_SIZE);
  }, [recentApps, currentAppsPage]);

  useEffect(() => {
    if (currentAppsPage > appsPageCount && appsPageCount > 0) {
      setCurrentAppsPage(appsPageCount);
    }
  }, [appsPageCount, currentAppsPage]);

  const statCards = [
    { label: "Total Jobs", value: stats?.totalJobs || jobs.length || "0", icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Applications", value: stats?.totalApplications || "0", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Hires", value: stats?.totalHires || "0", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Saved Jobs", value: savedJobsCount || "0", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  const currentPlanPermissions = plans.find(
    (plan) => normalizeStoredPlanCode(plan.id) === normalizeStoredPlanCode(user?.subscription)
  )?.permissions;

  return (
    <div className="space-y-6 sm:space-y-10 pb-32 lg:pb-8 px-4 sm:px-0 pt-4 sm:pt-0 overflow-x-hidden">
      {/* Header */}
      <div className="relative rounded-3xl p-3 sm:p-5 lg:p-0 lg:rounded-none bg-linear-to-br from-purple-100/70 via-white/80 to-indigo-100/70 lg:bg-transparent border border-purple-100/80 lg:border-none shadow-xl shadow-purple-100/50 lg:shadow-none backdrop-blur-md">
        <div className="absolute inset-0 rounded-3xl bg-white/25 lg:hidden" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 lg:max-w-7xl lg:mx-auto">
          <div className="flex items-start gap-2.5 sm:gap-4">
            <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-purple-600/90 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-200/70">
              <span className="text-base sm:text-lg font-bold">{user?.name?.charAt(0) || "C"}</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-purple-600">Good to see you</p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight">
                Welcome back, <span className="text-purple-600">{user?.name || "Captain"}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <p className="text-slate-500 text-xs sm:text-sm font-medium">Here is what is happening with your aviation career today.</p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                  user?.subscription === 'prime' ? "bg-slate-100 text-slate-700" :
                  user?.subscription === 'premium' ? "bg-purple-100 text-purple-700" :
                  user?.subscription === 'placement' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                )}>
                  {user?.subscription || 'Starter'} Plan
                </span>
              </div>

              <div className="mt-3 max-w-xs hidden sm:block">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500">Profile Strength</p>
                  <span className="text-[10px] sm:text-xs font-bold text-purple-700">{profileCompleteness}%</span>
                </div>
                <div className="h-2 w-full bg-white/80 rounded-full overflow-hidden border border-purple-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompleteness}%` }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="h-full bg-linear-to-r from-purple-500 to-purple-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto md:justify-end">
            <button
              aria-label="View notifications"
              onClick={handleNotificationClick}
              className="p-2.5 sm:p-3 bg-white/90 rounded-xl sm:rounded-2xl border border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
            >
              <Bell className="h-5 w-5" />
            </button>
            <Button
              variant="secondary"
              size="sm"
              className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl bg-white text-purple-700 border border-purple-100 hover:bg-purple-50 font-bold shadow-sm"
              onClick={() => navigate("/dashboard/profile")}
            >
              Complete Profile
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {hasPermission(user?.subscription, "resume_builder") ? (
              <Link to="/dashboard/resume" className="premium-button-primary hidden sm:flex px-4 sm:px-6 py-2 sm:py-3 items-center space-x-2 w-full sm:w-auto justify-center basis-full sm:basis-auto">
                <FileText className="h-4 w-4" />
                <span>Update Resume</span>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex px-4 sm:px-6 py-2 sm:py-3 items-center space-x-2 w-full sm:w-auto justify-center basis-full sm:basis-auto border-slate-200 text-slate-700"
                onClick={() => navigate("/dashboard/subscriptions")}
              >
                <Lock className="h-4 w-4" />
                <span>Unlock Resume Builder</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:max-w-7xl lg:mx-auto">
        {/* Profile Completeness Card */}
        <div className="col-span-2 lg:col-span-1 glass-card p-5 sm:p-6 rounded-3xl bg-linear-to-br from-purple-600 to-indigo-700 text-white border-none shadow-xl shadow-purple-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Profile Strength</h3>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">{profileCompleteness}%</span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${profileCompleteness}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white"
            />
          </div>
          <p className="text-xs text-purple-100 mb-4">Complete your profile to get 3x more recruiter views.</p>
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full bg-white text-purple-600 hover:bg-purple-50 border-none font-bold"
            onClick={() => navigate("/dashboard/profile")}
          >
            Complete Now
          </Button>
        </div>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl animate-pulse">
              <div className="h-12 w-12 bg-slate-100 rounded-2xl mb-4"></div>
              <div className="h-4 w-24 bg-slate-100 rounded-full mb-2"></div>
              <div className="h-8 w-12 bg-slate-100 rounded-full"></div>
            </div>
          ))
        ) : (
          statCards.slice(0, 3).map((stat, idx) => (
            <div
              key={idx}
              className="glass-card p-4 sm:p-6 rounded-3xl group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-lg"
            >
              <div className={`h-10 w-10 sm:h-14 sm:w-14 ${stat.bg} ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
            </div>
          ))
        )}
      </div>

      {/* Plan Highlights */}
      <div className="space-y-4 lg:max-w-7xl lg:mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Plan Highlights</h2>
            <p className="text-sm text-slate-500">Your dashboard shows only the features your current plan unlocks.</p>
          </div>
          <span className={cn(
            "text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest",
            currentPlanCode === "prime" ? "bg-slate-100 text-slate-700" :
            currentPlanCode === "premium" ? "bg-purple-100 text-purple-700" :
            currentPlanCode === "placement" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
          )}>
            {user?.subscription || "Starter"} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {planFeatureCards.map((card) => {
            const Icon = card.icon;
            const isUnlocked = hasPermission(user?.subscription, card.permission);

            if (isUnlocked) {
              return (
                <Link
                  key={card.title}
                  to={card.href}
                  className="glass-card group rounded-3xl border border-purple-100/70 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200/60">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Unlocked
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{card.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-purple-600">
                    Open feature
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={card.title}
                className="glass-card rounded-3xl border border-slate-200 bg-slate-50/90 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    Locked
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{card.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full border-slate-200 text-slate-700"
                  onClick={() => navigate("/dashboard/subscriptions")}
                >
                  Upgrade to unlock
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <div className="lg:hidden glass-card rounded-3xl p-4 border border-purple-100/70 shadow-lg shadow-purple-100/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Quick Actions
          </h3>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Fast Access</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/dashboard/jobs")} className="min-h-15 rounded-2xl bg-purple-50 text-purple-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Briefcase className="h-4 w-4" /> Jobs
          </button>
          <button onClick={() => navigate("/dashboard/profile")} className="min-h-15 rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <User className="h-4 w-4" /> Profile
          </button>
          {canAccessRouteForPlan(user, "/dashboard/applications", currentPlanPermissions) ? (
            <button onClick={() => navigate("/dashboard/applications")} className="min-h-15 rounded-2xl bg-green-50 text-green-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <LineChart className="h-4 w-4" /> Track
            </button>
          ) : (
            <button onClick={() => navigate("/dashboard/subscriptions")} className="min-h-15 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Lock className="h-4 w-4" /> Track
            </button>
          )}
          {canAccessRouteForPlan(user, "/dashboard/interviews", currentPlanPermissions) ? (
            <button onClick={() => navigate("/dashboard/interviews")} className="min-h-15 rounded-2xl bg-orange-50 text-orange-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Send className="h-4 w-4" /> Interviews
            </button>
          ) : (
            <button onClick={() => navigate("/dashboard/subscriptions")} className="min-h-15 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Lock className="h-4 w-4" /> Interviews
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:max-w-7xl lg:mx-auto">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Market Trends Chart */}
          <div className="glass-card p-4 sm:p-8 rounded-3xl sm:rounded-4xl border-purple-50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">Aviation Job Trends</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Monthly hiring volume in your sector</p>
              </div>
              <div className="flex items-center w-fit space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold">+12.5%</span>
              </div>
            </div>
            
            {(stats?.jobTrends || []).length > 0 ? (
              <StableResponsiveContainer className="h-60 sm:h-75 w-full" minHeight={200}>
                <AreaChart data={stats?.jobTrends || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#9333ea" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </StableResponsiveContainer>
            ) : (
              <div className="h-60 sm:h-75 rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6">
                <div>
                  <p className="font-semibold text-slate-500">No job trend data yet</p>
                  <p className="mt-1 text-sm text-slate-400">Post jobs to populate the trend chart</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-600"
              onClick={handleViewAllApps}
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-5 flex items-center justify-between">
                  <div className="flex items-center space-x-4 grow">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 grow">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))
            ) : pagedRecentApps.length > 0 ? (
              pagedRecentApps.map((app: any, i: number) => (
                <div key={i} className="glass-card p-4 sm:p-5 rounded-2xl hover:shadow-md transition-shadow border border-slate-100">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
                        <Building2 className="h-4 w-4" />
                      </div>
                      {i !== pagedRecentApps.length - 1 && <div className="w-px h-9 bg-purple-100 mt-1" />}
                    </div>
                    <div className="grow">
                      <h4 className="font-bold text-slate-900">Job ID: {app.jobId}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <div className="mt-2">
                        <span className={cn(
                          "text-[11px] font-bold px-2.5 py-1 rounded-full",
                          app.status === "Interview Scheduled" ? "bg-green-100/50 text-green-700" :
                          app.status === "In Review" ? "bg-purple-100/50 text-purple-700" : "bg-slate-100/50 text-slate-700"
                        )}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-slate-500">No recent applications yet. Start applying to track progress here.</p>
              </div>
            )}

            {!isLoading && recentApps.length > APPS_PAGE_SIZE && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentAppsPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentAppsPage === 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500 font-medium">Page {currentAppsPage} of {appsPageCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentAppsPage((prev) => Math.min(appsPageCount, prev + 1))}
                  disabled={currentAppsPage === appsPageCount}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {isPlacementPlan && stats?.roadmap ? (
            <motion.div
              initial={{ opacity: 0.95, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-3xl border border-purple-100/70 bg-white p-2 shadow-sm"
            >
              <Suspense fallback={<div className="p-4"><Skeleton className="h-48 w-full rounded-2xl" /></div>}>
                <CareerRoadmap milestones={stats.roadmap} />
              </Suspense>
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Career Roadmap locked</h3>
              <p className="mt-2 text-sm text-slate-500">
                Upgrade to the Placement plan to unlock the full roadmap and guided milestones.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-slate-200 text-slate-700"
                onClick={() => navigate("/dashboard/subscriptions")}
              >
                View plans
              </Button>
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-900">Recommended for You</h2>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="glass-card p-4 sm:p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="space-y-2 grow">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))
            ) : internshipRecommendations.length > 0 ? (
              internshipRecommendations.map((job: any, idx: number) => (
                <div key={idx} className="glass-card p-4 sm:p-6 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{job.title}</h4>
                      <p className="text-xs text-slate-500">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <MapPin className="h-3 w-3 mr-1" /> {job.location}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    View Job
                  </Button>
                </div>
              ))
            ) : (
              <div className="glass-card p-6 text-center border border-purple-100/60">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Plane className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900">No recommendations yet</h4>
                <p className="mt-2 text-sm text-slate-500">
                  We&apos;ll show relevant internship opportunities here as soon as matching openings are available.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/dashboard/jobs')}
                >
                  Explore Jobs
                </Button>
              </div>
            )}
          </div>
          <div className="glass-card p-8 rounded-4xl border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 mb-2">Jobs & Internships</p>
                <h3 className="text-2xl font-bold text-slate-900">Your latest opportunities</h3>
                <p className="text-sm text-slate-500 mt-2">Track jobs, internships, and saved positions from your dashboard.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="bg-purple-600 text-white" onClick={() => navigate('/dashboard/jobs')}>View Jobs</Button>
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-700" onClick={() => navigate('/dashboard/applications')}>View Applications</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-400">Open Roles</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{jobs.length}</p>
                <p className="mt-2 text-sm text-slate-500">Aviation jobs and internships available</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-400">Internships</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{internshipCount}</p>
                <p className="mt-2 text-sm text-slate-500">Early-career aviation opportunities</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-400">Saved Jobs</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{savedJobsCount}</p>
                <p className="mt-2 text-sm text-slate-500">Positions you've bookmarked</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50/40 backdrop-blur-sm p-6 rounded-2xl border border-purple-100">
            <h4 className="font-bold text-purple-900 mb-2">Upgrade to Pro</h4>
            <p className="text-xs text-purple-700 mb-4">Get featured in recruiter searches and priority application status.</p>
            <Button 
              size="sm" 
              className="w-full bg-purple-600 text-white"
              onClick={handleGoPremium}
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
