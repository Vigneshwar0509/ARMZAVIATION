import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";
import { GlassCard } from "@/src/components/common/GlassCard";
import { Button } from "@/src/components/ui/Button";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Subscription {
  id: string | number;
  userId: string | number | null;
  userName: string;
  userEmail: string;
  planId: string | number | null;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'free';
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  amount: number;
  amountFormatted: string;
  paymentMethod: string;
  autoRenew: boolean;
  createdAt: string | null;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  pendingSubscriptions: number;
  freeSubscriptions?: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  monthlyRecurringRevenue: number;
  monthlyRecurringRevenueFormatted: string;
  churnRate: number;
  averageSubscriptionValue: number;
  averageSubscriptionValueFormatted: string;
}

interface PlanDistribution {
  name: string;
  value: number;
  color: string;
}

export default function Subscriptions() {
  const PAGE_SIZE = 8;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "cancelled" | "pending">("all");
  const [sortBy, setSortBy] = useState<"userName" | "planName" | "status" | "amount" | "renewalDate">("renewalDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "analytics">("overview");
  const [showNewSubscriptionModal, setShowNewSubscriptionModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const normalizeSearchValue = (value: unknown) => String(value ?? "").toLowerCase();

  const planDotClass = (color: string) => {
    switch (color.toLowerCase()) {
      case "#8b5cf6":
        return "bg-violet-500";
      case "#3b82f6":
        return "bg-blue-500";
      case "#10b981":
        return "bg-emerald-500";
      case "#f59e0b":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminSubscriptions();
      if (res?.data) {
        setSubscriptions(res.data.subscriptions || []);
        setStats(res.data.stats || null);
      }
      toast.success('Subscription data refreshed', { id: 'subscription-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const normalizedSearchTerm = normalizeSearchValue(searchTerm);
      const matchesSearch = normalizeSearchValue(sub.userName).includes(normalizedSearchTerm) ||
                           normalizeSearchValue(sub.userEmail).includes(normalizedSearchTerm) ||
                           normalizeSearchValue(sub.planName).includes(normalizedSearchTerm);
      const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchTerm, filterStatus]);

  const sortedSubscriptions = useMemo(() => {
    const list = [...filteredSubscriptions];
    list.sort((a, b) => {
      let left: number | string = '';
      let right: number | string = '';

      if (sortBy === 'amount') {
        left = Number(a.amount || 0);
        right = Number(b.amount || 0);
      } else if (sortBy === 'renewalDate') {
        left = new Date(a.renewalDate || a.endDate || 0).getTime();
        right = new Date(b.renewalDate || b.endDate || 0).getTime();
      } else {
        left = String((a as any)[sortBy] || '').toLowerCase();
        right = String((b as any)[sortBy] || '').toLowerCase();
      }

      if (left < right) return sortDirection === 'asc' ? -1 : 1;
      if (left > right) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredSubscriptions, sortBy, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedSubscriptions.length / PAGE_SIZE));
  const pagedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSubscriptions.slice(start, start + PAGE_SIZE);
  }, [sortedSubscriptions, currentPage]);

  const currentPageSubscriptionIds = pagedSubscriptions.map((item) => String(item.id));
  const areAllCurrentPageSelected =
    currentPageSubscriptionIds.length > 0 && currentPageSubscriptionIds.every((id) => selectedSubscriptionIds.includes(id));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy, sortDirection]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const handleStatusChange = async (subscriptionId: string | number, newStatus: Subscription['status']) => {
    const targetId = String(subscriptionId);
    try {
      await apiService.updateSubscriptionStatus(targetId, newStatus);
      setSubscriptions(prev => prev.map(sub =>
        String(sub.id) === targetId ? { ...sub, status: newStatus } : sub
      ));
      toast.success(`Subscription ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update subscription status");
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      await apiService.deleteSubscription(subscriptionId);
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      toast.success("Subscription deleted");
    } catch (error) {
      toast.error("Failed to delete subscription");
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleSelectSubscription = (subscriptionId: string | number) => {
    const idKey = String(subscriptionId);
    setSelectedSubscriptionIds((prev) =>
      prev.includes(idKey) ? prev.filter((id) => id !== idKey) : [...prev, idKey]
    );
  };

  const toggleSelectCurrentPage = () => {
    if (areAllCurrentPageSelected) {
      setSelectedSubscriptionIds((prev) => prev.filter((id) => !currentPageSubscriptionIds.includes(id)));
      return;
    }
    setSelectedSubscriptionIds((prev) => Array.from(new Set([...prev, ...currentPageSubscriptionIds])));
  };

  const handleBulkStatusChange = async (status: Subscription['status']) => {
    const selected = subscriptions.filter((item) => selectedSubscriptionIds.includes(String(item.id)));
    if (selected.length === 0) {
      toast.error('No subscriptions selected');
      return;
    }

    try {
      await Promise.all(selected.map((item) => apiService.updateSubscriptionStatus(item.id, status)));
      toast.success(`Updated ${selected.length} subscriptions`);
      setSelectedSubscriptionIds([]);
      fetchSubscriptions();
    } catch {
      toast.error('Failed bulk status update');
    }
  };

  const handleBulkDelete = async () => {
    const selected = subscriptions.filter((item) => selectedSubscriptionIds.includes(String(item.id)));
    if (selected.length === 0) {
      toast.error('No subscriptions selected');
      return;
    }

    if (!confirm(`Delete ${selected.length} selected subscriptions?`)) return;

    try {
      await Promise.all(selected.map((item) => apiService.deleteSubscription(item.id)));
      toast.success(`Deleted ${selected.length} subscriptions`);
      setSelectedSubscriptionIds([]);
      fetchSubscriptions();
    } catch {
      toast.error('Failed bulk delete');
    }
  };

  const handleExportSubscriptions = () => {
    const headers = ['User', 'Email', 'Plan', 'Status', 'Amount', 'Renewal Date', 'Payment Method', 'Created At'];
    const rows = sortedSubscriptions.map((item) => [
      item.userName,
      item.userEmail,
      item.planName,
      item.status,
      item.amountFormatted,
      item.renewalDate,
      item.paymentMethod,
      item.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Subscriptions exported');
  };

  const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'expired': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cancelled': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'free': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: Subscription['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'free': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const planDistribution: PlanDistribution[] = useMemo(() => {
    if (stats && Array.isArray((stats as any).planDistribution)) {
      return (stats as any).planDistribution;
    }

    const counts = subscriptions.reduce<Record<string, number>>((acc, sub) => {
      acc[sub.planName] = (acc[sub.planName] || 0) + 1;
      return acc;
    }, {});

    const palette = ['#64748b', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: palette[idx % palette.length],
    }));
  }, [stats, subscriptions]);

  const getPlanDotClass = (planName: string) => {
    switch (planName) {
      case 'Starter':
        return 'bg-slate-500';
      case 'Professional':
        return 'bg-purple-500';
      case 'Elite':
        return 'bg-cyan-500';
      case 'Placement':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  };

  const revenueData = useMemo(() => {
    const monthly = new Map<string, number>();

    subscriptions.forEach((sub) => {
      const d = new Date(sub.createdAt || sub.startDate);
      if (Number.isNaN(d.getTime())) return;
      const month = d.toLocaleDateString('en-IN', { month: 'short' });
      monthly.set(month, (monthly.get(month) || 0) + Number(sub.amount || 0));
    });

    return Array.from(monthly.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [subscriptions]);

  const subscriptionGrowthData = useMemo(() => {
    const monthly = new Map<string, number>();

    subscriptions.forEach((sub) => {
      const d = new Date(sub.createdAt || sub.startDate);
      if (Number.isNaN(d.getTime())) return;
      const month = d.toLocaleDateString('en-IN', { month: 'short' });
      monthly.set(month, (monthly.get(month) || 0) + 1);
    });

    let running = 0;
    return Array.from(monthly.entries()).map(([month, count]) => {
      running += count;
      return { month, subscriptions: running };
    });
  }, [subscriptions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Subscription Management</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Monitor and manage user subscriptions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="space-y-4" hoverEffect={false}>
              <div className="h-12 w-12 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-1/4 bg-slate-100 rounded animate-pulse" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Subscription Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Monitor and manage user subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSubscriptions}
            className="rounded-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscriptions}
            className="rounded-xl"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "subscriptions", label: "Subscriptions", icon: Users },
          { id: "analytics", label: "Analytics", icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="admin-subscriptions-tabs"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2"><tab.icon className="h-4 w-4" />{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Subscriptions",
                value: stats?.totalSubscriptions || 0,
                trend: "+12%",
                up: true,
                icon: Users,
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              {
                label: "Active Subscriptions",
                value: stats?.activeSubscriptions || 0,
                trend: "+8%",
                up: true,
                icon: CheckCircle,
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              },
              {
                label: "Monthly Recurring Revenue",
                value: stats?.monthlyRecurringRevenueFormatted || "₹0",
                trend: "+15%",
                up: true,
                icon: TrendingUp,
                color: "text-purple-500",
                bg: "bg-purple-50"
              },
              {
                label: "Churn Rate",
                value: `${stats?.churnRate || 0}%`,
                trend: "-2%",
                up: true,
                icon: Activity,
                color: "text-rose-500",
                bg: "bg-rose-50"
              }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${
                      stat.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900 mt-2">{stat.value}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900">Revenue Trends</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly recurring revenue</p>
                </div>
              </div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </StableResponsiveContainer>
                {/* single responsive revenue chart above */}
            </GlassCard>

            {/* Plan Distribution */}
            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900">Plan Distribution</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Subscription breakdown</p>
                </div>
              </div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <RechartsPieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </StableResponsiveContainer>
                {/* single responsive pie chart above */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${planDotClass(plan.color)}`} />
                    <span className="text-sm text-slate-600">{plan.name}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          {/* Filters */}
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  aria-label="Filter by status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                  <option value="free">Free / No Subscription</option>
                </select>
                <select
                  aria-label="Sort subscriptions"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="renewalDate">Sort: Renewal Date</option>
                  <option value="userName">Sort: User</option>
                  <option value="planName">Sort: Plan</option>
                  <option value="status">Sort: Status</option>
                  <option value="amount">Sort: Amount</option>
                </select>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={toggleSortDirection}>
                  {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </div>
          </GlassCard>

          {selectedSubscriptionIds.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-slate-600 font-medium">{selectedSubscriptionIds.length} selected</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange('active')}>Set Active</Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange('cancelled')}>Set Cancelled</Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-rose-600 hover:text-rose-700" onClick={handleBulkDelete}>Delete Selected</Button>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Subscriptions Table */}
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/60">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <input
                  type="checkbox"
                  checked={areAllCurrentPageSelected}
                  onChange={toggleSelectCurrentPage}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Select Page
              </label>
              <span className="text-xs text-slate-500">Showing {pagedSubscriptions.length} of {sortedSubscriptions.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Select</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Renewal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedSubscriptions.map((subscription) => (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedSubscriptionIds.includes(String(subscription.id))}
                          onChange={() => toggleSelectSubscription(subscription.id)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          aria-label={`Select ${subscription.userName}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{subscription.userName}</p>
                          <p className="text-sm text-slate-500">{subscription.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">{subscription.planName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(subscription.status)}`}>
                          {getStatusIcon(subscription.status)}
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">{subscription.amountFormatted || '₹0'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSubscription(subscription)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <select
                            aria-label="Change subscription status"
                            value={subscription.status}
                            onChange={(e) => handleStatusChange(subscription.id, e.target.value as Subscription['status'])}
                            className="text-xs bg-white border border-slate-200 rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedSubscriptions.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No subscriptions found</p>
              </div>
            )}

            {sortedSubscriptions.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 font-medium">Page {currentPage} of {pageCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                  disabled={currentPage === pageCount}
                >
                  Next
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          {/* Growth Chart */}
          <GlassCard className="p-8" hoverEffect={false}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">Subscription Growth</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly subscription trends</p>
              </div>
            </div>
            <StableResponsiveContainer className="w-full" minHeight={400}>
              <LineChart data={subscriptionGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="subscriptions"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </StableResponsiveContainer>
            {/* single responsive growth chart above */}
          </GlassCard>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Average Lifespan</p>
                  <p className="text-2xl font-display font-bold text-slate-900">8.5 months</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Conversion Rate</p>
                  <p className="text-2xl font-display font-bold text-slate-900">24.8%</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Avg. Revenue/User</p>
                  <p className="text-2xl font-display font-bold text-slate-900">₹2,450</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
