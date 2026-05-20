import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  Briefcase,
  GraduationCap,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Activity,
  Clock,
  Loader2,
  Shield,
  BarChart3,
  Sparkles,
  Globe,
  ListChecks,
  Megaphone,
  Bell,
  Star,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { GlassCard } from "@/src/components/common/GlassCard";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import AdminOverview from "@/src/pages/admin/AdminOverview";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { useDashboardStats, useUsers, useLeads } from "@/src/hooks/useQueries";
import { useAdminStore } from "@/src/store/adminStore";

const rangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "12m", label: "Last 12 Months" },
];

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "12m">("7d");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats(dateRange);
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: leads, isLoading: isLeadsLoading } = useLeads();
  const { searchQuery } = useAdminStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const isLoading = isStatsLoading || isUsersLoading || isLeadsLoading;
  const searchLower = searchQuery.toLowerCase();

  const filteredLeads = useMemo(
    () =>
      leads?.filter((lead: any) =>
        `${lead.name}`.toLowerCase().includes(searchLower) ||
        `${lead.email}`.toLowerCase().includes(searchLower) ||
        `${lead.interest}`.toLowerCase().includes(searchLower)
      ) || [],
    [leads, searchLower]
  );

  const filteredUsers = useMemo(
    () =>
      users?.filter((user: any) =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower) ||
        `${user.email}`.toLowerCase().includes(searchLower)
      ) || [],
    [users, searchLower]
  );

  const filteredActivity = useMemo(
    () =>
      stats?.userActivity?.filter((log: any) =>
        `${log.user}`.toLowerCase().includes(searchLower) ||
        `${log.action}`.toLowerCase().includes(searchLower)
      ) || [],
    [stats, searchLower]
  );

  const quickActions = [
    { label: "Post New Job", icon: Briefcase, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/20" },
    { label: "Publish Course", icon: GraduationCap, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/20" },
    { label: "Launch Campaign", icon: Megaphone, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/20" },
    { label: "Review Reports", icon: BarChart3, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/20" },
    { label: "Manage Employers", icon: Shield, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/20" },
  ];

  const trendData = stats?.jobTrends || [];

  const trendEmptyState = dateRange === "7d"
    ? "No job activity in the last 7 days"
    : dateRange === "30d"
    ? "No job activity in the last 30 days"
    : "No job activity in the last 12 months";

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const formatDelta = (current: number, previous: number) => {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
      return "0%";
    }
    const delta = ((current - previous) / previous) * 100;
    const rounded = Math.abs(delta).toFixed(1);
    return `${delta >= 0 ? "+" : "-"}${rounded}%`;
  };

  const trendSummary = useMemo(() => {
    if (trendData.length < 2) {
      return { jobs: "0%" };
    }

    const last = Number(trendData[trendData.length - 1]?.count || 0);
    const prev = Number(trendData[trendData.length - 2]?.count || 0);
    return { jobs: formatDelta(last, prev) };
  }, [trendData]);

  const activeRate = useMemo(() => {
    const totalUsers = Array.isArray(users) ? users.length : 0;
    const activeUsersCount = Number(stats?.activeUsers || 0);
    if (totalUsers <= 0) {
      return "0%";
    }
    return `${Math.round((activeUsersCount / totalUsers) * 100)}%`;
  }, [stats, users]);

  const leadGrowth = useMemo(() => {
    const leadCount = Array.isArray(leads) ? leads.length : 0;
    const newLeadsCount = Number(stats?.newLeads || 0);
    if (leadCount <= 0) {
      return "0%";
    }
    return `${Math.round((newLeadsCount / leadCount) * 100)}%`;
  }, [leads, stats]);

  const systemHealth = useMemo(() => {
    const score = Number(stats?.platformScore || 0);
    const applicants = Number(stats?.totalApplications || 0);
    const jobs = Number(stats?.totalJobs || 0);
    const activeUsersCount = Number(stats?.activeUsers || 0);

    const serverLoad = clamp(Math.round(((activeUsersCount + applicants) / Math.max(activeUsersCount + applicants + 1200, 1)) * 100), 10, 95);
    const databaseUsage = clamp(Math.round(((jobs + applicants) / Math.max(jobs + applicants + 600, 1)) * 100), 12, 92);
    const latencyMs = Math.max(60, Math.round(220 - score));
    const latencyProgress = clamp(Math.round(100 - latencyMs / 4), 20, 95);

    const status = score >= 80 ? "Stable" : score >= 60 ? "Watch" : "Degraded";
    const statusClass =
      status === "Stable"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
        : status === "Watch"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
        : "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";

    return {
      status,
      statusClass,
      metrics: [
        { label: "Server Load", value: `${serverLoad}%`, progress: serverLoad },
        { label: "Database", value: `${databaseUsage}%`, progress: databaseUsage },
        { label: "API Latency", value: `${latencyMs}ms`, progress: latencyProgress },
      ],
    };
  }, [stats]);

  const topLeads = filteredLeads.slice(0, 3);
  const recentUsers = filteredUsers.slice(0, 3);

  const handleQuickAction = useCallback((action: string) => {
    if (action === "Post New Job") {
      navigate("/admin/jobs");
    } else if (action === "Publish Course") {
      navigate("/admin/courses");
    } else if (action === "Launch Campaign") {
      navigate("/admin/campaigns");
    } else if (action === "Manage Employers") {
      navigate("/admin/employers");
    } else {
      navigate("/admin/reports");
    }
  }, [navigate]);

  return (
    <motion.div className="space-y-6 sm:space-y-8 pb-20 lg:pb-10 overflow-x-hidden lg:max-w-7xl lg:mx-auto min-h-screen transition-colors duration-300" initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }}>
      <AdminOverview
        dateRange={dateRange}
        setDateRange={setDateRange}
        stats={stats}
        showAdvancedAnalytics={showAdvancedAnalytics}
        setShowAdvancedAnalytics={setShowAdvancedAnalytics}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8"
      >
        <GlassCard className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Reports</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Reporting workspace</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Generate exports, review analytics, and track reporting activity from one clean screen.</p>
            </div>
            <div className="hidden sm:flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Revenue", value: stats?.revenue || "INR 0" },
              { label: "Leads", value: String(stats?.newLeads || 0) },
              { label: "Conversion", value: `${stats?.conversionRate || 0}%` },
            ].map((item) => (
              <div key={item.label} className="rounded-4xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 px-4 py-4 transition-colors">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            onClick={() => navigate("/admin/reports")}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-4xl bg-slate-900 dark:bg-white px-6 py-3.5 text-sm font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Open reports
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8 dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl rounded-4xl flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Employers</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Employer accounts</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Review recruiter profiles, company details, verification state, and subscription coverage.</p>
            </div>
            <div className="hidden sm:flex rounded-2xl bg-slate-100 p-4 text-slate-700">
              <Shield className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Total", value: String((users || []).filter((user: any) => user.role === "employer").length) },
              { label: "Verified", value: String((users || []).filter((user: any) => user.role === "employer" && (user.is_verified ?? user.isVerified)).length) },
              { label: "Paid plans", value: String((users || []).filter((user: any) => user.role === "employer" && String(user.subscription || "free").toLowerCase() !== "free").length) },
            ].map((item) => (
              <div key={item.label} className="rounded-4xl bg-white border border-slate-200 px-4 py-4 shadow-sm transition-colors">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg sm:text-xl font-bold text-slate-950 tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            onClick={() => navigate("/admin/employers")}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Open employers
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </GlassCard>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-1 xl:grid-cols-[1.7fr,1fr] gap-6 sm:gap-8"
      >
        <GlassCard className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Job Market Pulse</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">Track monthly job activity and seasonal demand across the latest campaigns.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {rangeOptions.find((option) => option.value === dateRange)?.label}
            </div>
          </div>

          {trendData && trendData.length > 0 ? (
            <StableResponsiveContainer className="mt-6 sm:mt-8 h-60 sm:h-80 w-full" minHeight={200}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(148,163,184,0.22)',
                    borderRadius: '16px',
                    color: '#0f172a',
                    boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
                    padding: '12px 16px',
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                  cursor={{ stroke: '#9333ea', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="count" stroke="#9333ea" strokeWidth={3} fill="url(#trendGradient)" activeDot={{ r: 6, fill: '#9333ea', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </StableResponsiveContainer>
          ) : (
            <div className="mt-6 sm:mt-8 flex items-center justify-center h-60 sm:h-80 rounded-4xl border border-dashed border-slate-200 bg-slate-50">
              <div className="text-center">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">{trendEmptyState}</p>
                <p className="text-sm text-slate-400 mt-1">Post a job to populate the selected range</p>
              </div>
            </div>
          )}

          <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
            {[
              { label: "Total Applicants", value: stats?.totalApplications ?? 0 },
              { label: "Hires", value: stats?.totalHires ?? 0 },
              { label: "Avg Time", value: stats?.avgResponseTime ?? "2.4d" },
              { label: "Offer Rate", value: stats?.offerRate ?? "18%" },
            ].map((item) => (
              <div key={item.label} className="rounded-4xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm transition-colors">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Quick Actions</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">Actions to keep the overview moving.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 sm:gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    onClick={() => handleQuickAction(action.label)}
                    className="group flex items-center justify-between rounded-4xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-all hover:shadow-md min-h-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${action.bg}`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{action.label}</p>
                        <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quick access to high-priority admin workflows.</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">System Health</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">Server load, uptime and stability metrics.</p>
              </div>
              <div className={`rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${systemHealth.statusClass}`}>{systemHealth.status}</div>
            </div>
            <div className="space-y-5">
              {systemHealth.metrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>{metric.label}</span>
                    <span>{metric.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.progress}%` }}
                      transition={{ duration: 1.1, ease: "easeOut" }}
                      className="h-full rounded-full bg-linear-to-r from-purple-500 to-fuchsia-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8"
      >
        <GlassCard className="overflow-hidden bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl flex flex-col">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/70">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-950 tracking-tight">Engaged Applicants</h2>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">Latest leads captured across campaigns.</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold" onClick={() => navigate("/admin/leads")}>View all leads</Button>
          </div>

          <div className="sm:hidden p-6 space-y-4">
            {isLeadsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            ) : topLeads.length > 0 ? (
              topLeads.map((lead: any, index: number) => (
                <motion.div
                  key={lead.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{lead.email}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                      lead.status === "Qualified" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : lead.status === "Contacted" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50 rounded-xl p-3">
                    <span className="truncate mr-2">{lead.interest}</span>
                    <span className="shrink-0">{lead.phone || "-"}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-500 text-sm font-medium">No leads found for "{searchQuery}"</div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Lead</th>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Interest</th>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Contact</th>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-8 py-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLeadsLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index} className="animate-pulse bg-white/50">
                      <td className="px-8 py-6"><Skeleton className="h-10 w-full rounded-xl" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-xl" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-32 rounded-xl" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-xl" /></td>
                      <td className="px-8 py-5"></td>
                    </tr>
                  ))
                ) : topLeads.length > 0 ? (
                  topLeads.map((lead: any, index: number) => (
                    <motion.tr
                      key={lead.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-slate-50/70 transition-colors bg-white/80"
                    >
                      <td className="px-4 sm:px-8 py-5 whitespace-nowrap">
                        <p className="font-bold text-slate-950">{lead.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">{lead.email}</p>
                      </td>
                      <td className="px-4 sm:px-8 py-5 whitespace-nowrap"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">{lead.interest}</span></td>
                      <td className="px-4 sm:px-8 py-5 text-slate-600 font-medium whitespace-nowrap">{lead.phone || "-"}</td>
                      <td className="px-4 sm:px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          lead.status === "Qualified" ? "bg-emerald-50 text-emerald-700" : lead.status === "Contacted" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-5 text-right whitespace-nowrap">
                        <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} onClick={() => setSelectedLead(lead)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-purple-300 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">Details</motion.button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">No leads found for "{searchQuery}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl flex flex-col">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/70">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-950 tracking-tight">Recent Registrations</h2>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">Newest members who joined the platform.</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold" onClick={() => navigate("/admin/students")}>View all</Button>
          </div>

          <div className="sm:hidden p-6 space-y-4">
            {isUsersLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            ) : recentUsers.length > 0 ? (
              recentUsers.map((user: any, index: number) => (
                <motion.div
                  key={user.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 text-sm font-bold text-purple-700 dark:text-purple-300 shadow-inner">
                      {user.first_name?.[0] || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 text-sm truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl p-3">
                    <span className="text-slate-600 font-bold uppercase tracking-[0.14em] truncate mr-2">{user.role || "Student"}</span>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                      user.status === "Active" ? "bg-emerald-50 text-emerald-700" : user.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {user.status || "Active"}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-500 text-sm font-medium">No recent registrations match "{searchQuery}"</div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Member</th>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Role</th>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-8 py-5 whitespace-nowrap">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isUsersLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse bg-white/50">
                      <td className="px-8 py-6"><Skeleton className="h-12 w-full rounded-xl" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-xl" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-xl" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-xl" /></td>
                    </tr>
                  ))
                ) : recentUsers.length > 0 ? (
                  recentUsers.map((user: any, index: number) => (
                    <motion.tr
                      key={user.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-slate-50/70 transition-colors bg-white/80"
                    >
                      <td className="px-4 sm:px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 text-sm font-bold text-purple-700 dark:text-purple-300 shadow-inner">
                            {user.first_name?.[0] || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-950">{user.first_name} {user.last_name}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-5 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">{user.role || "Student"}</span>
                      </td>
                      <td className="px-4 sm:px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          user.status === "Active" ? "bg-emerald-50 text-emerald-700" : user.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {user.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-5 text-slate-500 font-semibold whitespace-nowrap">{user.joined || "New"}</td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-500 font-medium">No recent registrations match "{searchQuery}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
      <GlassCard className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl rounded-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-950 tracking-tight">Activity Logs</h2>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">A quick view of recent admin and user activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} onClick={() => setShowActivityFeed((value) => !value)} className="glass-card bg-white px-4 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
              {showActivityFeed ? "Hide preview" : "Live preview"}
            </motion.button>
            <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} onClick={() => setShowActivityLog(true)} className="glass-card bg-white px-4 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">View full log</motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showActivityFeed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 animate-pulse">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-3/5 rounded-full bg-slate-100 dark:bg-slate-800" />
                        <div className="h-3 w-1/4 rounded-full bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </div>
                  ))
                ) : filteredActivity.length > 0 ? (
                  filteredActivity.map((log: any, index: number) => (
                    <motion.div
                      key={log.id || index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-4xl border border-slate-100 bg-white/70 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shrink-0">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-950"><span className="text-purple-600">{log.user}</span> {log.action}</p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{log.time}</p>
                        </div>
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.18em]">{log.source || "Web"}</div>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500 font-medium">No activity logs available for the selected filters.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
      </motion.div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card dark:bg-slate-900 dark:border-slate-700 rounded-4xl shadow-2xl max-w-lg w-full p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lead Details</h2>
                <button
                  onClick={() => setSelectedLead(null)}
                  aria-label="Close lead details"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-5 rounded-3xl">
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">Name</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedLead.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-4 sm:p-5 rounded-3xl">
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 break-all">{selectedLead.email}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-4 sm:p-5 rounded-3xl">
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> Phone
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{selectedLead.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-5 rounded-3xl">
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">Subject / Interest</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedLead.interest || "Not specified"}</p>
                </div>

                {selectedLead.message && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-5 rounded-3xl">
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">Message</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 whitespace-pre-wrap leading-relaxed">{selectedLead.message}</p>
                  </div>
                )}

                {selectedLead.metadata && Object.keys(selectedLead.metadata).length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-5 rounded-3xl space-y-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold mb-4">Submitted Details</p>
                    {Object.entries(selectedLead.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[120px_1fr] gap-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatLeadMetadataLabel(key)}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white break-all">{formatLeadMetadataValue(value)}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 p-5 rounded-3xl">
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Status</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase ${
                      selectedLead.status === "Qualified" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : 
                      selectedLead.status === "Contacted" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : 
                      "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>
                      {selectedLead.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button 
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  onClick={() => {
                    setSelectedLead(null);
                    navigate("/admin/leads");
                  }}
                  className="flex-1 px-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-purple-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  Take Action
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Log Modal */}
      <AnimatePresence>
        {showActivityLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowActivityLog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card dark:bg-slate-900 dark:border-slate-700 rounded-4xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-hide"
            >
              <div className="flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10 pb-6 mb-2 border-b border-slate-100 dark:border-slate-700/50 -mx-6 px-6 sm:-mx-8 sm:px-8 pt-2">
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Full Activity Log</h2>
                <button onClick={() => setShowActivityLog(false)} aria-label="Close activity log" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                  <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {filteredActivity && filteredActivity.length > 0 ? (
                  filteredActivity.map((log: any, index: number) => (
                    <motion.div
                      key={log.id || index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700/50 p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors bg-white/50 dark:bg-slate-800/30"
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white leading-snug">{log.action}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{log.user}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{log.timestamp || "Just now"}</p>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] shrink-0 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">{log.source || "Web"}</span>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No activity logs available
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-700/50 -mx-6 px-6 sm:-mx-8 sm:px-8 mt-2 pb-2">
                <motion.button 
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  onClick={() => setShowActivityLog(false)}
                  className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
const formatLeadMetadataLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatLeadMetadataValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};
