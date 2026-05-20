import React, { useEffect, useMemo, useState, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Users, DollarSign, Download, CalendarDays, ArrowUpRight, Share2, Layers } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useDashboardStats, useUsers } from "@/src/hooks/useQueries";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";

// Utility to safely parse and format dates
const safeFormatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "Recently";
  try {
    const date = new Date(dateInput);
    if (!Number.isFinite(date.getTime())) return "Recently";
    // Validate date is not too old (before 2020) or in far future
    const year = date.getFullYear();
    if (year < 2020 || year > new Date().getFullYear() + 1) return "Recently";
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "Recently";
  }
};

// Type definitions for report data
interface ReportEntry {
  id: string | number;
  title: string;
  type: string;
  status: string;
  updated: string;
}

interface DashboardUser {
  role?: string;
  subscription?: string;
  [key: string]: any;
}

const timelineOptions = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "Last 12 Months"];

const toNumber = (value: string | number | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const compact = value.replace(/,/g, "").trim();
  const match = compact.match(/([0-9]+(?:\.[0-9]+)?)([KMB])?/i);
  if (!match) {
    return 0;
  }

  const numeric = Number(match[1]);
  const suffix = (match[2] || "").toUpperCase();
  const multiplier = suffix === "B" ? 1_000_000_000 : suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1;
  return numeric * multiplier;
};

function statusStyles(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
    case "Processing":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
    case "Queued":
      return "bg-slate-50 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400";
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400";
  }
}

type TrendPoint = { period: string; revenue: number; users: number };
type TimelineKey = (typeof timelineOptions)[number];

const mapPeriodToRange = (period: TimelineKey): "7d" | "30d" | "90d" | "12m" => {
  switch (period) {
    case "Last 7 Days":
      return "7d";
    case "Last 30 Days":
      return "30d";
    case "Last 90 Days":
      return "90d";
    default:
      return "12m";
  }
};

export default function Reports() {
  const { data: users } = useUsers();
  const [selectedPeriod, setSelectedPeriod] = useState<TimelineKey>("Last 30 Days");
  const [reportExports, setReportExports] = useState<any[]>([]);
  const statsRange = mapPeriodToRange(selectedPeriod);
  const { data: stats } = useDashboardStats(statsRange);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const loadReportExports = async () => {
      try {
        const response = await apiService.getReportExports();
        setReportExports(response.data);
      } catch {
        // Keep the page usable even if export history fails to load.
      }
    };

    void loadReportExports();
  }, []);

  const trendData = useMemo<TrendPoint[]>(() => {
    const source: Array<{ month: string; count: number }> = Array.isArray(stats?.jobTrends) ? stats.jobTrends : [];
    if (!source.length) {
      return [];
    }

    const totalCount = source.reduce((sum: number, item: { month: string; count: number }) => sum + Number(item.count || 0), 0);
    const totalRevenue = toNumber(stats?.revenue);

    return source.map((item: { month: string; count: number }, idx: number) => {
      const usersCount = Number(item.count || 0);
      const distributedRevenue = totalCount > 0 ? Math.round((usersCount / totalCount) * totalRevenue) : 0;
      return {
        period: item.month || `P${idx + 1}`,
        users: usersCount,
        revenue: distributedRevenue,
      };
    });
  }, [selectedPeriod, stats]);

  const subscriptionMix = useMemo(() => {
    const roster = Array.isArray(users) ? (users as DashboardUser[]) : [];
    const subscriptionCounts = roster.reduce<Record<string, number>>((acc, user: DashboardUser) => {
      const tier = user.subscription || "Unassigned";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    const palette = [
      { fill: "#6366f1", dotClass: "bg-blue-600" },
      { fill: "#e879f9", dotClass: "bg-fuchsia-500" },
      { fill: "#f59e0b", dotClass: "bg-amber-500" },
      { fill: "#10b981", dotClass: "bg-emerald-500" },
      { fill: "#64748b", dotClass: "bg-slate-500" },
    ];

    const total = Object.values(subscriptionCounts).reduce((sum, count) => sum + count, 0);
    return Object.entries(subscriptionCounts).map(([name, count], index) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      fill: palette[index % palette.length].fill,
      dotClass: palette[index % palette.length].dotClass,
    }));
  }, [users]);

  const reportLog = useMemo(() => {
    const entries: ReportEntry[] = [];
    
    // Add report exports if available
    if (Array.isArray(reportExports) && reportExports.length > 0) {
      const validExports = reportExports
        .filter(entry => entry?.id && entry?.updated)
        .slice(0, 6)
        .map((entry: any, index: number): ReportEntry => ({
          id: entry.id || index,
          title: entry.title || "Report export",
          type: String(entry.type || "pdf").toUpperCase(),
          status: String(entry.status || "completed").replace(/^./, (value: string) => value.toUpperCase()),
          updated: safeFormatDate(entry.updated),
        }));
      entries.push(...validExports);
    }
    
    // Add user activities if no exports or need more entries
    if (entries.length < 6 && Array.isArray(stats?.userActivity)) {
      const activities = stats.userActivity as any[];
      const remainingSlots = 6 - entries.length;
      const validActivities = activities
        .slice(0, remainingSlots)
        .map((entry: any, index: number): ReportEntry => {
          const actionText = String(entry.action || "");
          const lower = actionText.toLowerCase();
          const type = lower.includes("export") ? "Export" : lower.includes("report") ? "Report" : "System";
          const status = lower.includes("fail") ? "Queued" : lower.includes("pending") ? "Processing" : "Completed";
          return {
            id: entry.id || `activity-${index}`,
            title: actionText || "Activity event",
            type,
            status,
            updated: safeFormatDate(entry.time || entry.created_at),
          };
        });
      entries.push(...validActivities);
    }
    
    return entries;
  }, [reportExports, stats]);

  const premiumMetrics = useMemo(
    () => {
      const adminCount = Array.isArray(users) 
        ? (users as DashboardUser[]).filter((user: DashboardUser) => user.role === "admin").length 
        : 0;
      return [
        { label: "Monthly revenue", value: stats?.revenue || "₹ 0", change: "Live", icon: DollarSign, accent: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" },
        { label: "Admin users", value: String(adminCount), change: "Live", icon: Users, accent: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
        { label: "Conversion rate", value: `${stats?.conversionRate || 0}%`, change: "Live", icon: TrendingUp, accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
        { label: "Report events", value: String(reportLog.length), change: "Live", icon: BarChart3, accent: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" },
      ];
    },
    [reportLog.length, stats, users]
  );

  const insights = useMemo(
    () => [
      { label: "Top-performing channel", value: `${stats?.totalJobs || 0} active jobs`, delta: "Live", icon: Share2 },
      { label: "Highest retention", value: `${stats?.activeUsers || 0} active users`, delta: "Live", icon: Layers },
      { label: "Growth signal", value: `${stats?.newLeads || 0} new leads`, delta: "Live", icon: ArrowUpRight },
    ],
    [stats]
  );

  const totalRevenue = useMemo(
    () => trendData.reduce((sum: number, item: TrendPoint) => sum + item.revenue, 0),
    [trendData]
  );

  const totalUsers = useMemo(
    () => trendData.reduce((sum: number, item: TrendPoint) => sum + item.users, 0),
    [trendData]
  );

  const revenueChange = useMemo(() => {
    if (trendData.length < 2) {
      return "0.0%";
    }
    const first = trendData[0].revenue;
    const last = trendData[trendData.length - 1].revenue;
    if (first <= 0) {
      return "0.0%";
    }
    return `${(((last - first) / first) * 100).toFixed(1)}%`;
  }, [trendData]);

  const createExport = useCallback(async (format: "pdf" | "csv" | "xlsx") => {
    try {
      const response = await apiService.createReportExport({
        reportName: "Operations Report",
        format,
        period: selectedPeriod,
        metadata: {
          totalRevenue,
          totalUsers,
          generatedFrom: "admin-reports",
        },
      });
      setReportExports((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to create report export:", error);
    }
  }, [selectedPeriod, totalRevenue, totalUsers]);

  const handleExportPdf = useCallback(async () => {
    await createExport("pdf");
    toast.success("Report export recorded");
  }, [createExport]);

  const handleShareInsights = useCallback(async () => {
    await createExport("pdf");
    toast.success("Share-ready report recorded");
  }, [createExport]);

  const handleQuickExport = useCallback(async (format: "csv" | "xlsx" | "pdf") => {
    await createExport(format);
    toast.success(`${format.toUpperCase()} export recorded`);
  }, [createExport]);

  return (
    <motion.div className="space-y-10 pb-10 min-h-screen bg-transparent transition-colors duration-300" initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4"
      >
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.24em] text-purple-600 dark:text-purple-400 font-bold">Admin reports</p>
          <h1 className="mt-2 text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Operations & insights</h1>
          <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400 leading-relaxed">Review the latest platform analytics, export in one click, and track performance across users, revenue, and subscription mix.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.02 }} whileTap={shouldReduceMotion ? {} : { scale: 0.98 }} onClick={() => void handleExportPdf()} className="premium-button-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl shadow-lg shadow-purple-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            <Download className="h-4 w-4" />
            Export PDF
          </motion.button>
          <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.02 }} whileTap={shouldReduceMotion ? {} : { scale: 0.98 }} onClick={() => void handleShareInsights()} className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl px-6 py-3.5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Share insights
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-8">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
          >
            {premiumMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className={`inline-flex items-center justify-center rounded-2xl p-3 ${metric.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 font-bold">{metric.label}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{metric.value}</p>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">{metric.change}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Revenue & user momentum</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Track growth across your selected reporting window and spot trends instantly.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">{selectedPeriod}</div>
                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(event.target.value as TimelineKey)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer appearance-none"
                  aria-label="Select report time range"
                >
                  {timelineOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 font-bold">Total revenue</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">₹ {totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-600">{totalUsers.toLocaleString()} users</div>
                </div>

                <div className="h-80">
                  {trendData.length > 0 ? (
                    <StableResponsiveContainer className="w-full" minHeight={320}>
                      <AreaChart data={trendData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="reportTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: 'rgba(15,23,42,0.85)',
                          backdropFilter: 'blur(12px)',
                          color: '#f8fafc',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                          padding: '12px 16px',
                        }}
                        itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                        cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} fill="url(#reportTrend)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </StableResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex items-center justify-center text-center px-6">
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400">No report trend data yet</p>
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Generate activity to populate this report window</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 rounded-[28px] bg-white dark:bg-slate-900/50 p-5 shadow-sm border border-slate-200 dark:border-slate-700/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Growth pulse</p>
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 font-bold">{selectedPeriod}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs uppercase tracking-[0.24em] font-bold">Revenue change</div>
                    <div className="mt-3 flex items-center gap-3 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {revenueChange} <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 font-bold">User adoption</p>
                    <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalUsers.toLocaleString()}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 font-bold">Export volume</p>
                    <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{reportLog.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Subscription mix</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">View user plan distribution across your platform.</p>
              </div>
            </div>

            <div className="h-80">
              <StableResponsiveContainer className="w-full" minHeight={320}>
                <PieChart>
                  <Pie data={subscriptionMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} stroke="none">
                    {subscriptionMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(15,23,42,0.85)',
                      backdropFilter: 'blur(12px)',
                      color: '#f8fafc',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                      padding: '12px 16px',
                    }}
                    itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  />
                </PieChart>
              </StableResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
              {subscriptionMix.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border border-slate-100 dark:border-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Operational insights</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Actionable highlights for your next leadership review.</p>
            <div className="mt-6 space-y-4">
              {insights.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.label} className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-100 dark:border-slate-700/50 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 transition-colors group-hover:bg-purple-100 dark:group-hover:bg-purple-500/30">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{insight.label}</p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{insight.value}</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{insight.delta}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.85fr] gap-8">
        <div className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recent report activity</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Track generated exports and download statuses.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} onClick={() => void handleQuickExport("csv")} className="glass-card dark:bg-slate-800/80 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">CSV</motion.button>
              <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} onClick={() => void handleQuickExport("xlsx")} className="glass-card dark:bg-slate-800/80 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">XLSX</motion.button>
              <motion.button whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} onClick={() => void handleQuickExport("pdf")} className="glass-card dark:bg-slate-800/80 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">PDF</motion.button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="min-w-full border-separate border-spacing-y-3 text-left">
              <thead>
                <tr className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 font-bold">
                  <th className="px-4 py-3 whitespace-nowrap">Report</th>
                  <th className="px-4 py-3 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Updated</th>
                </tr>
              </thead>
              <tbody>
                {reportLog.length > 0 ? (
                  reportLog.map((entry: { id: string | number; title: string; type: string; status: string; updated: string }) => (
                    <tr key={entry.id} className="bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap rounded-l-2xl">{entry.title}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{entry.type}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${statusStyles(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap rounded-r-2xl">{entry.updated}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-sm">
                    <td className="px-4 py-8 text-sm font-medium text-slate-500 dark:text-slate-400 text-center rounded-2xl" colSpan={4}>No report activity available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card dark:bg-slate-900/60 dark:border-slate-700/50 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Report checklist</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ensure every report is ready for leadership review.</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "Verify revenue numbers against CRM",
              "Confirm user adoption lift across cohorts",
              "Review subscription mix before board update",
              "Approve next quarter reporting templates",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-600 dark:bg-purple-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
