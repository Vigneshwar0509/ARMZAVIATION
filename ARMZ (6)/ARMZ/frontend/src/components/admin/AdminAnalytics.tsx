import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, DollarSign, Trophy, ArrowUpRight, ArrowDownLeft, Sparkles, ShieldCheck, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { GlassCard } from '@/src/components/common/GlassCard';
import StableResponsiveContainer from '@/src/components/common/StableResponsiveContainer';

const chartData = {
  revenue: [
    { month: 'Jan', amount: 3200 },
    { month: 'Feb', amount: 4100 },
    { month: 'Mar', amount: 5400 },
    { month: 'Apr', amount: 6200 },
    { month: 'May', amount: 7100 },
    { month: 'Jun', amount: 8600 },
  ],
  engagement: [
    { day: 'Mon', value: 54 },
    { day: 'Tue', value: 62 },
    { day: 'Wed', value: 73 },
    { day: 'Thu', value: 80 },
    { day: 'Fri', value: 90 },
    { day: 'Sat', value: 78 },
    { day: 'Sun', value: 65 },
  ],
  applications: [
    { day: 'Mon', value: 35 },
    { day: 'Tue', value: 58 },
    { day: 'Wed', value: 48 },
    { day: 'Thu', value: 72 },
    { day: 'Fri', value: 88 },
    { day: 'Sat', value: 64 },
    { day: 'Sun', value: 52 },
  ],
  subscription: [
    { name: 'Prime', value: 42, color: '#8b5cf6' },
    { name: 'Premium', value: 33, color: '#3b82f6' },
    { name: 'Standard', value: 25, color: '#f59e0b' },
  ],
};

const performanceCards = [
  {
    title: 'Total Users',
    value: '12,847',
    change: '+12.5%',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    positive: true,
  },
  {
    title: 'Active Jobs',
    value: '1,243',
    change: '+8.2%',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-600',
    positive: true,
  },
  {
    title: 'Revenue',
    value: '₹24.5L',
    change: '+23.1%',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600',
    positive: true,
  },
  {
    title: 'Conversions',
    value: '3,847',
    change: '+5.9%',
    icon: TrendingUp,
    color: 'bg-amber-100 text-amber-600',
    positive: true,
  },
];

const metricCards = [
  { label: 'Approval Rate', value: '92%', icon: ShieldCheck, color: 'bg-purple-50 text-purple-600' },
  { label: 'Response Time', value: '1.8d', icon: Activity, color: 'bg-cyan-50 text-cyan-600' },
  { label: 'Quality Score', value: '87', icon: Trophy, color: 'bg-amber-50 text-amber-600' },
];

const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b'];
const chartHeightClass = 'h-80';
const pieHeightClass = 'h-[310px]';

const subscriptionDotClass = (color: string) => {
  switch (color) {
    case '#8b5cf6':
      return 'bg-violet-500';
    case '#3b82f6':
      return 'bg-blue-500';
    case '#f59e0b':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
};

export default function AdminAnalytics() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {performanceCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{card.title}</p>
                    <p className="mt-4 text-3xl font-display font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em]">
                  <span className={card.positive ? 'text-emerald-600' : 'text-rose-600'}>{card.change}</span>
                  <span className="text-slate-400">Compared to last week</span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr,1fr] gap-6">
        <GlassCard className="p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Revenue & Engagement</h2>
              <p className="text-slate-500 text-sm mt-1">A combined view of revenue performance and user engagement trends.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <Sparkles className="h-4 w-4 text-purple-500" /> Live metrics
            </div>
          </div>

          <div className={`mt-8 ${chartHeightClass} w-full`}>
            <StableResponsiveContainer className="w-full" minHeight={320}>
              <LineChart data={chartData.revenue} margin={{ top: 0, right: 0, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 15px 40px rgba(15, 23, 42, 0.08)' }} />
                <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </StableResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{metric.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">Subscription Mix</h3>
              <p className="text-slate-500 text-sm mt-1">Breakdown by plan type across the admin audience.</p>
            </div>
          </div>
          <div className={pieHeightClass}>
            <StableResponsiveContainer className="w-full" minHeight={310}>
              <PieChart>
                <Pie data={chartData.subscription} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={6}>
                  {chartData.subscription.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </StableResponsiveContainer>
            <div className="mt-6 space-y-3">
              {chartData.subscription.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${subscriptionDotClass(item.color)}`} />
                    <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">Weekly Applications</h3>
            <p className="text-slate-500 text-sm mt-1">Current application activity captured by source and timing.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            <span>Updated hourly</span>
          </div>
        </div>
        <div className={`mt-8 ${chartHeightClass} w-full`}>
          <StableResponsiveContainer className="w-full" minHeight={320}>
            <BarChart data={chartData.applications} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </StableResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
