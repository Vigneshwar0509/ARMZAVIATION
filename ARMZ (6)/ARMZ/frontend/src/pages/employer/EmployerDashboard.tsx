import React, { useEffect, useMemo, useState } from "react";
import { 
  Briefcase, 
  Users, 
  Calendar, 
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Target,
  Eye,
  MessageSquare,
  Activity,
  Award,
  Zap,
  BarChart3,
  PlusCircle,
  LogOut,
  Search,
  Download,
  Lock,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/src/store/authStore";
import { normalizePlanCode } from "@/src/lib/subscription";
import { usePlanStore } from "@/src/store/planStore";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";

const chartData = [
  { month: 'Jan', applications: 45, views: 120, hires: 12 },
  { month: 'Feb', applications: 52, views: 150, hires: 14 },
  { month: 'Mar', applications: 48, views: 140, hires: 11 },
  { month: 'Apr', applications: 70, views: 210, hires: 18 },
  { month: 'May', applications: 85, views: 250, hires: 22 },
  { month: 'Jun', applications: 92, views: 280, hires: 25 },
];

import { useDashboardStats, useApplications, useJobs } from "@/src/hooks/useQueries";
import { Skeleton } from "@/src/components/ui/Skeleton";

export default function EmployerDashboard() {
  const APPS_PAGE_SIZE = 6;
  const { user, logout } = useAuthStore();
  const { hasPermission, plans, fetchPlans } = usePlanStore();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: applicants = [], isLoading: isAppsLoading } = useApplications(undefined, {
    enabled: user?.role === "employer",
  });
  const { data: jobs = [], isLoading: isJobsLoading } = useJobs();
  const [activeChart, setActiveChart] = useState("applications");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [currentAppsPage, setCurrentAppsPage] = useState(1);
  const navigate = useNavigate();

  const isLoading = isStatsLoading || isAppsLoading || isJobsLoading;
  const currentPlanCode = normalizePlanCode(user?.subscription);
  const canManageInterviews = hasPermission(user?.subscription, "interviews.manage");
  const canRunCampaigns = hasPermission(user?.subscription, "custom.campaigns");

  useEffect(() => {
    if (plans.length === 0) {
      void fetchPlans();
    }
  }, [fetchPlans, plans.length]);

  const handleLogout = () => {
    try {
      logout();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const dashboardStats = [
    { label: "Active Jobs", value: stats?.totalJobs || "6", icon: Briefcase, color: "from-purple-600 to-pink-600", increase: "+2 this month" },
    { label: "Total Applicants", value: stats?.totalApplications || "287", icon: Users, color: "from-blue-600 to-cyan-600", increase: "+45 this month" },
    { label: "Hires", value: stats?.totalHires || "0", icon: Calendar, color: "from-emerald-600 to-teal-600", increase: "Closed successfully" },
    { label: "Hire Rate", value: "78%", icon: TrendingUp, color: "from-orange-600 to-red-600", increase: "↑ 12% vs last month" },
  ];

  const recentApplications = applicants.slice(0, 8).map((app: any) => ({
    id: app.id,
    name: app.userName || "Applicant",
    position: app.job_details?.title || `Job ID: ${app.jobId}`,
    status: app.status,
    time: new Date(app.appliedAt).toLocaleDateString(),
    matchScore: Math.floor(Math.random() * 40 + 60)
  }));

  const planHighlights = [
    {
      title: "Job Posting",
      description: "Post and manage job listings from the employer dashboard.",
      permission: "job_posting",
      icon: Briefcase,
    },
    {
      title: "Interview Management",
      description: "Schedule, coordinate, and track interview workflows.",
      permission: "interviews.manage",
      icon: Calendar,
    },
    {
      title: "Custom Campaigns",
      description: "Run targeted hiring campaigns and branded recruitment drives.",
      permission: "custom.campaigns",
      icon: Target,
    },
  ] as const;

  const activeJobs = useMemo(
    () =>
      jobs
        .filter((job: any) => String(job.posted_by_email || "").toLowerCase() === String(user?.email || "").toLowerCase())
        .filter((job: any) => String(job.status || "").toLowerCase() !== "closed")
        .slice(0, 4)
        .map((job: any) => ({
          id: String(job.id),
          title: job.title || "Untitled role",
          company: job.company || "ARMZ Aviation",
          applications: Number(job.applications || 0),
          views: Number(job.views || 0),
          status: job.status || "Active",
          salary: job.salary || job.salaryRange || "Not specified",
        })),
    [jobs, user?.email]
  );

  const filteredApplications = useMemo(() => {
    const needle = applicationSearch.trim().toLowerCase();
    if (!needle) return recentApplications;

    return recentApplications.filter((app: any) =>
      app.name.toLowerCase().includes(needle) ||
      app.position.toLowerCase().includes(needle) ||
      String(app.status || '').toLowerCase().includes(needle)
    );
  }, [recentApplications, applicationSearch]);

  const appsPageCount = Math.max(1, Math.ceil(filteredApplications.length / APPS_PAGE_SIZE));
  const pagedApplications = useMemo(() => {
    const start = (currentAppsPage - 1) * APPS_PAGE_SIZE;
    return filteredApplications.slice(start, start + APPS_PAGE_SIZE);
  }, [filteredApplications, currentAppsPage]);

  useEffect(() => {
    if (currentAppsPage > appsPageCount && appsPageCount > 0) {
      setCurrentAppsPage(appsPageCount);
    }
  }, [appsPageCount, currentAppsPage]);

  const handleExportApplications = () => {
    if (filteredApplications.length === 0) {
      toast.error("No applications to export");
      return;
    }

    const headers = ["Applicant", "Position", "Status", "Applied", "Match Score"];
    const rows = filteredApplications.map((app: any) => [
      app.name,
      app.position,
      app.status,
      app.time,
      `${app.matchScore}%`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employer-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Applications exported");
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-24 lg:pb-8 px-4 sm:px-0 pt-4 sm:pt-0 overflow-x-hidden lg:max-w-7xl lg:mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-purple-100 bg-linear-to-br from-purple-100/60 via-white/90 to-indigo-100/60 p-4 sm:p-6 lg:bg-transparent lg:border-none lg:p-0"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">Employer Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">Manage your aviation recruitment process and track your hiring pipeline.</p>
        </div>
        <Button onClick={() => navigate("/employer/post-job")} className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold flex items-center justify-center gap-2 w-full sm:w-fit">
          <PlusCircle className="h-4 w-4" />
          Post New Job
        </Button>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4 sm:p-6 rounded-2xl animate-pulse">
              <div className="h-12 w-12 bg-slate-100 rounded-lg mb-4"></div>
              <div className="h-3 w-24 bg-slate-100 rounded-full mb-3"></div>
              <div className="h-8 w-16 bg-slate-100 rounded-full"></div>
            </div>
          ))
        ) : (
          dashboardStats.map((stat, idx) => {
            const Icon = stat.icon;
            const displayValue = stat.label === "Hire Rate" ? `${stats?.conversionRate || 0}%` : stat.value;
            const displayIncrease = stat.label === "Hire Rate" ? "Improving month over month" : stat.increase;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-200 group hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className={`inline-flex w-fit p-2 sm:p-3 rounded-lg bg-linear-to-br ${stat.color} text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{displayValue}</h3>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-2 flex items-center gap-1 leading-tight">
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  {displayIncrease}
                </p>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Plan Highlights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Plan Highlights</h2>
            <p className="text-sm text-slate-500">Employer features below are shown according to your current subscription tier.</p>
          </div>
          <span className={cn(
            "text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest",
            currentPlanCode === "recruiter_starter" ? "bg-slate-100 text-slate-700" :
            currentPlanCode === "recruiter_growth" ? "bg-purple-100 text-purple-700" :
            currentPlanCode === "recruiter_enterprise" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
          )}>
            {user?.subscription || "Starter"} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planHighlights.map((card) => {
            const Icon = card.icon;
            const unlocked = hasPermission(user?.subscription, card.permission);

            return (
              <div
                key={card.title}
                className={cn(
                  "rounded-2xl border p-5 shadow-sm transition-all",
                  unlocked
                    ? "border-purple-100 bg-white hover:shadow-md"
                    : "border-slate-200 bg-slate-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={cn(
                    "h-11 w-11 rounded-2xl flex items-center justify-center",
                    unlocked ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
                    unlocked ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-400 border border-slate-200"
                  )}>
                    {unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{card.description}</p>
                {!unlocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full border-slate-200 text-slate-700"
                    onClick={() => navigate("/employer/subscription")}
                  >
                    Upgrade to unlock
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Analytics Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Recruitment Analytics</h3>
              <p className="text-sm text-slate-600 mt-1">6-month performance overview</p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              {["applications", "views", "hires"].map((chart) => (
                <button
                  key={chart}
                  onClick={() => setActiveChart(chart)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    activeChart === chart
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {chart}
                </button>
              ))}
            </div>
          </div>
          
          <StableResponsiveContainer className="h-64 sm:h-96 w-full" minHeight={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#1e293b' }}
                />
                {activeChart === "applications" && (
                  <Area type="monotone" dataKey="applications" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#colorGradient)" />
                )}
                {activeChart === "views" && (
                  <Area type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorGradient)" />
                )}
                {activeChart === "hires" && (
                  <Area type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGradient)" />
                )}
              </AreaChart>
          </StableResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">487</p>
              <p className="text-xs text-slate-600">Total Applications</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">1.2K</p>
              <p className="text-xs text-slate-600">Job Views</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">102</p>
              <p className="text-xs text-slate-600">Hires Made</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions & Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/employer/post-job")} className="min-h-15 w-full px-3 py-2.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
                Post New Job
              </button>
              <button onClick={() => navigate("/employer/applicants")} className="min-h-15 w-full px-3 py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
                Review Applications
              </button>
              {canManageInterviews ? (
                <button onClick={() => navigate("/employer/interviews")} className="min-h-15 w-full px-3 py-2.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
                  Schedule Interviews
                </button>
              ) : (
                <button
                  onClick={() => navigate("/employer/subscription")}
                  className="min-h-15 w-full px-3 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Schedule Interviews
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="min-h-15 w-full px-3 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                title="Logout from your account"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              This Month
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">New Applicants</span>
                <span className="font-bold text-slate-900">+45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Interviews Scheduled</span>
                <span className="font-bold text-slate-900">+12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Jobs Posted</span>
                <span className="font-bold text-slate-900">+2</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-600">Response Rate</span>
                <span className="font-bold text-emerald-600">78%</span>
              </div>
            </div>
          </div>

          {/* Premium Upgrade */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 text-white border border-purple-500/50 shadow-lg shadow-purple-200/50">
            <h4 className="font-bold mb-2">Grow Faster</h4>
            <p className="text-xs text-purple-100 mb-4">
              {canRunCampaigns
                ? "Your plan already includes advanced campaign and hiring tools."
                : "Upgrade to Growth or Enterprise for interview workflows and custom recruitment campaigns."}
            </p>
            <Button onClick={() => navigate("/employer/subscription")} className="w-full py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-bold">
              {canRunCampaigns ? "View Plan" : "Upgrade Now"}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Active Jobs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4 sm:p-8 rounded-2xl border border-slate-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-purple-600" />
            Active Job Postings
          </h3>
          <Button onClick={() => navigate("/employer/post-job")} className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-sm font-bold mt-4 sm:mt-0">
            View All Jobs
          </Button>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl bg-slate-50 border border-slate-200 animate-pulse h-28" />
            ))
          ) : activeJobs.length > 0 ? (
          activeJobs.map((job: any, idx: number) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
              className="p-4 sm:p-6 rounded-xl bg-slate-50 border border-slate-200 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 text-lg">{job.title}</h4>
                    <span className={cn(
                      "px-2 py-1 text-xs font-bold rounded-full",
                      job.status === "Hot" 
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{job.company}</p>
                  <p className="text-sm font-bold text-purple-600">{job.salary}</p>
                </div>
                <div className="flex flex-wrap gap-6 md:text-right">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Applications</p>
                    <p className="text-2xl font-bold text-slate-900">{job.applications}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Views</p>
                    <p className="text-2xl font-bold text-slate-900">{job.views}</p>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => navigate("/employer/post-job")} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-bold">
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
          ) : (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500">No active jobs found. Create a new posting to start receiving applications.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Applications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-4 sm:p-8 rounded-2xl border border-slate-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            Recent Applications
          </h3>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handleExportApplications} className="px-4 py-2 rounded-lg text-sm font-bold">
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button onClick={() => navigate("/employer/applicants")} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold">
              View All Applications
            </Button>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={applicationSearch}
            onChange={(e) => {
              setApplicationSearch(e.target.value);
              setCurrentAppsPage(1);
            }}
            placeholder="Search applications"
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-100 animate-pulse h-20" />
            ))
          ) : (
            pagedApplications.map((app: any, idx: number) => (
              <div key={app.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                      {app.name.charAt(0)}
                    </div>
                    {idx !== pagedApplications.length - 1 && <div className="w-px h-8 bg-purple-100 mt-1" />}
                  </div>
                  <div className="grow">
                    <p className="font-semibold text-slate-900 text-sm">{app.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{app.position}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-600">{app.time}</span>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-bold",
                        app.status === "Applied" ? "bg-blue-100 text-blue-700" :
                        app.status === "Under Review" ? "bg-purple-100 text-purple-700" :
                        app.status === "Interview Scheduled" ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 pr-4 text-left font-semibold text-slate-600 whitespace-nowrap">Applicant</th>
                <th className="py-4 pr-4 text-left font-semibold text-slate-600 whitespace-nowrap">Position</th>
                <th className="py-4 pr-4 text-left font-semibold text-slate-600 whitespace-nowrap">Match Score</th>
                <th className="py-4 pr-4 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                <th className="py-4 pr-4 text-left font-semibold text-slate-600 whitespace-nowrap">Applied</th>
                <th className="py-4 text-right font-semibold text-slate-600 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    <td colSpan={6} className="py-4 h-4 bg-slate-100 rounded-full"></td>
                  </tr>
                ))
              ) : (
                pagedApplications.map((app: any) => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                          {app.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{app.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-600 whitespace-nowrap">{app.position}</td>
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{app.matchScore}%</span>
                        <span className={cn(
                          "text-xs font-semibold",
                          app.matchScore > 80 ? "text-emerald-600" : "text-blue-600"
                        )}>
                          {app.matchScore > 80 ? "Excellent" : "Good"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        app.status === "Applied" ? "bg-blue-100 text-blue-700" :
                        app.status === "Under Review" ? "bg-purple-100 text-purple-700" :
                        app.status === "Interview Scheduled" ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-600 whitespace-nowrap">{app.time}</td>
                    <td className="py-4 text-right whitespace-nowrap">
                      <button onClick={() => navigate("/employer/applicants")} className="text-purple-600 hover:text-purple-700 font-semibold text-xs">Review</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredApplications.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No applications found for your current search.</p>
          </div>
        )}

        {!isLoading && filteredApplications.length > APPS_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
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
      </motion.div>
    </div>
  );
}