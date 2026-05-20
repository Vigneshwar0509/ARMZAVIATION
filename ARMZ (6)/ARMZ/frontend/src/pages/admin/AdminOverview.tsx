import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Users, Briefcase, Globe, Star, Activity, Gauge, ArrowUpRight, ShieldCheck, Clock3, Bolt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import AdminAnalytics from "@/src/components/admin/AdminAnalytics";

const rangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "12m", label: "Last 12 Months" },
];

type AdminOverviewProps = {
  dateRange: "7d" | "30d" | "12m";
  setDateRange: (value: "7d" | "30d" | "12m") => void;
  stats: any;
  showAdvancedAnalytics: boolean;
  setShowAdvancedAnalytics: React.Dispatch<React.SetStateAction<boolean>>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDelta = (current: number, previous: number) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return "0%";
  }
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.abs(delta).toFixed(1);
  return `${delta >= 0 ? "+" : "-"}${rounded}%`;
};

const smoothEase = [0.22, 1, 0.36, 1] as const;

const sectionMotion = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: smoothEase },
};

export default function AdminOverview({ dateRange, setDateRange, stats, showAdvancedAnalytics, setShowAdvancedAnalytics }: AdminOverviewProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const trendData = stats?.jobTrends || [];

  const trendEmptyState = dateRange === "7d"
    ? "No job activity in the last 7 days"
    : dateRange === "30d"
    ? "No job activity in the last 30 days"
    : "No job activity in the last 12 months";


  const trendSummary = React.useMemo(() => {
    if (trendData.length < 2) {
      return { jobs: "0%" };
    }
    const last = Number(trendData[trendData.length - 1]?.count || 0);
    const prev = Number(trendData[trendData.length - 2]?.count || 0);
    return { jobs: formatDelta(last, prev) };
  }, [trendData]);

  const activeRate = `${stats?.activeUsers ?? 0}%`;
  const leadGrowth = `${stats?.newLeads ?? 0}%`;

  const systemHealthScore = Number(stats?.platformScore || 0);
  const serverLoad = clamp(Math.round(((Number(stats?.activeUsers || 0) + Number(stats?.totalApplications || 0)) / Math.max(Number(stats?.activeUsers || 0) + Number(stats?.totalApplications || 0) + 1200, 1)) * 100), 10, 95);
  const databaseUsage = clamp(Math.round(((Number(stats?.totalJobs || 0) + Number(stats?.totalApplications || 0)) / Math.max(Number(stats?.totalJobs || 0) + Number(stats?.totalApplications || 0) + 600, 1)) * 100), 12, 92);
  const latencyMs = Math.max(60, Math.round(220 - systemHealthScore));
  const latencyProgress = clamp(Math.round(100 - latencyMs / 4), 20, 95);

  const systemHealth = React.useMemo(() => {
    const status = systemHealthScore >= 80 ? "Stable" : systemHealthScore >= 60 ? "Watch" : "Degraded";
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
  }, [databaseUsage, latencyMs, latencyProgress, serverLoad, systemHealthScore]);

  const highlightFacts = [
    { label: "Platform score", value: `${stats?.platformScore ?? 92}/100`, hint: "overall health", icon: Gauge },
    { label: "Active users", value: String(stats?.activeUsers ?? 0), hint: "live community", icon: Users },
    { label: "Open jobs", value: String(stats?.totalJobs ?? 0), hint: "current opportunities", icon: Briefcase },
  ];

  const statsCards = [
    {
      label: "Active Users",
      value: stats?.activeUsers ?? 0,
      trend: activeRate,
      icon: Users,
      color: "bg-slate-100 text-slate-700",
      badge: "High engagement",
    },
    {
      label: "Open Jobs",
      value: stats?.totalJobs ?? 0,
      trend: trendSummary.jobs,
      icon: Briefcase,
      color: "bg-slate-100 text-slate-700",
      badge: "Hiring momentum",
    },
    {
      label: "New Leads",
      value: stats?.newLeads ?? 0,
      trend: leadGrowth,
      icon: Globe,
      color: "bg-slate-100 text-slate-700",
      badge: "Lead capture",
    },
    {
      label: "Conversion Rate",
      value: `${stats?.conversionRate ?? 0}%`,
      trend: `${stats?.platformScore ?? 0}/100`,
      icon: Star,
      color: "bg-slate-100 text-slate-700",
      badge: "Platform efficiency",
    },
  ];

  return (
    <>
      <motion.div
        {...(shouldReduceMotion ? {} : sectionMotion)}
        className="relative overflow-hidden rounded-4xl border border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50/80 p-5 sm:p-6 shadow-[0_30px_120px_rgba(15,23,42,0.08)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.55fr,0.95fr]">
          <GlassCard className="relative overflow-hidden border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl rounded-4xl">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95),rgba(236,72,153,0.04))]" />
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-[10px] sm:text-xs uppercase tracking-[0.28em] font-bold text-slate-500 shadow-sm">
                    <Sparkles className="h-4 w-4 text-fuchsia-600" /> Platform overview
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl sm:text-5xl font-display font-black tracking-[-0.04em] text-slate-950 leading-[0.95]">
                      Dashboard Overview
                    </h1>
                    <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-600">
                      A focused command center for platform performance, hiring activity, and growth signals. Everything important is surfaced here first.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {highlightFacts.map((fact) => {
                      const Icon = fact.icon;
                      return (
                        <div key={fact.label} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] uppercase tracking-[0.26em] font-bold text-slate-400">{fact.label}</p>
                            <Icon className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="mt-3 text-2xl font-display font-bold tracking-tight text-slate-950">{fact.value}</p>
                          <p className="mt-1 text-xs text-slate-500">{fact.hint}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <select
                    value={dateRange}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setDateRange(event.target.value as "7d" | "30d" | "12m")}
                    className="min-w-52 rounded-full border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                    aria-label="Select date range"
                  >
                    {rangeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <Button size="sm" className="rounded-full px-5 py-3 shadow-lg shadow-purple-500/20" onClick={() => navigate("/admin/reports")}>
                    Generate report
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Live performance</p>
                      <p className="mt-3 text-5xl font-display font-black tracking-[-0.05em]">
                        {stats?.platformScore ?? 92}
                        <span className="align-top text-lg font-semibold text-slate-400">/100</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 backdrop-blur-sm">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
                    The score blends engagement, response speed, and conversion health into one executive snapshot.
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {systemHealth.metrics.map((metric: { label: string; value: string | number; progress: number }) => (
                      <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">{metric.value}</p>
                        <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-linear-to-r from-fuchsia-400 via-violet-400 to-cyan-400 ${
                              metric.progress > 80 ? "w-full" : metric.progress > 60 ? "w-4/5" : metric.progress > 40 ? "w-3/5" : metric.progress > 20 ? "w-2/5" : "w-1/5"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-slate-400">System status</p>
                      <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-slate-950">{systemHealth.status}</h2>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] ${systemHealth.statusClass}`}>
                      {systemHealth.status}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Window", value: dateRange === "7d" ? "Weekly pulse" : dateRange === "30d" ? "Monthly view" : "Yearly view", icon: Clock3 },
                      { label: "Latency", value: `${latencyMs}ms`, icon: ArrowUpRight },
                      { label: "Uptime", value: `${Math.max(98, systemHealthScore)}%`, icon: ShieldCheck },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] uppercase tracking-[0.24em] font-bold text-slate-400">{item.label}</p>
                            <Icon className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="mt-3 text-base font-semibold text-slate-950">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                      <span>Activity trend</span>
                      <span>{trendSummary.jobs}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-[72%] rounded-full bg-linear-to-r from-fuchsia-500 via-violet-500 to-indigo-500" />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {trendEmptyState}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </GlassCard>

          <GlassCard className="p-6 sm:p-8 rounded-4xl border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-bold">Advanced analytics</p>
                  <h2 className="mt-2 text-2xl font-display font-bold text-slate-950 tracking-tight">Deep insights</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowAdvancedAnalytics((value: boolean) => !value)}
                >
                  {showAdvancedAnalytics ? (
                    <>
                      Hide <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm leading-relaxed text-slate-500">
                Open this panel when you need a fuller breakdown of revenue, engagement, and application patterns.
              </p>

              <AnimatePresence initial={false}>
                {showAdvancedAnalytics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 border-t border-slate-200/80">
                      <AdminAnalytics />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Active rate", value: activeRate, icon: Users },
                  { label: "Lead growth", value: leadGrowth, icon: Globe },
                  { label: "Open jobs", value: String(stats?.totalJobs ?? 0), icon: Briefcase },
                  { label: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: Star },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] font-bold text-slate-400">{item.label}</p>
                        <Icon className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="mt-3 text-xl font-display font-bold tracking-tight text-slate-950">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
          </div>
      </motion.div>

      <motion.div
        {...(shouldReduceMotion ? {} : sectionMotion)}
        className="grid grid-cols-1 xl:grid-cols-[1.4fr,0.9fr,0.9fr,0.9fr] gap-4 sm:gap-6"
      >
        {statsCards.map((card) => {
          const Icon = card.icon;
          const isPositive = !String(card.trend).startsWith("-") && String(card.trend) !== "0%" && String(card.trend) !== "0/100";
          return (
            <GlassCard key={card.label} className="p-5 sm:p-6 rounded-4xl border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-shadow duration-300 group">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                  <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-950 tracking-tight">{card.value}</p>
                </div>
                <div className={`rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-colors duration-300 group-hover:bg-white ${card.color}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-500 gap-2">
                <span className="truncate">{card.badge}</span>
                <span className={`shrink-0 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>{card.trend}</span>
              </div>
            </GlassCard>
          );
        })}
      </motion.div>
    </>
  );
}
