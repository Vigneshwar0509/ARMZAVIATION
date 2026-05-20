import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, Edit2, Trash2, Check, X, RefreshCw, Shield, Zap, Crown, Globe, Settings2, Lock, Unlock, Search, Filter, BarChart3, TrendingUp, Users, DollarSign, Activity, Copy, Briefcase } from "lucide-react";
import { apiService } from "@/src/services/api";
import { AVAILABLE_PERMISSIONS } from "@/src/lib/planFeatures";
import { usePlanStore } from "@/src/store/planStore";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import { Skeleton } from "@/src/components/ui/Skeleton";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, BarChart, Bar } from 'recharts';

interface Plan {
  id: string;
  name: string;
  price: number;
  razorpay_fee?: number;
  gst_amount?: number;
  final_price?: number;
  razorpay_fee_percentage?: number;
  gst_percentage?: number;
  tier: number;
  period: string;
  description: string;
  features: string[];
  permissions: string[];
  tabs: Array<{ name: string; content: string }>;
  razorpay_plan_id: string | null;
  isActive: boolean;
  subscriberCount: number;
  revenueGenerated: number;
  createdAt: string;
  type: 'student' | 'employer';
}

interface PlanStats {
  totalPlans: number;
  activePlans: number;
  totalSubscribers: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  averageRevenuePerUser: number;
  averageRevenuePerUserFormatted: string;
  mostPopularPlan: string;
  planDistribution: { name: string; value: number; color: string }[];
}



const PLAN_TYPE_OPTIONS = [
  { id: 'all', label: 'All Plans' },
  { id: 'student', label: 'Student Plans' },
  { id: 'employer', label: 'Employer Plans' },
] as const;

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<"all" | "student" | "employer">("all");
  const refreshPublicPlans = usePlanStore((state) => state.fetchPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminPlans();
      setPlans(res.data.plans);
      setStats(res.data.stats);
      toast.success('Plan data refreshed', { id: 'plan-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load plan data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || plan.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || (filterStatus === "active" && plan.isActive) || (filterStatus === "inactive" && !plan.isActive);
      const matchesType = filterType === 'all' || plan.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [plans, searchTerm, filterStatus, filterType]);

  const getColorClass = (color: string) => {
    switch (color.toLowerCase()) {
      case '#a855f7':
      case '#7c3aed':
      case 'purple':
        return 'bg-purple-500';
      case '#3b82f6':
      case 'blue':
        return 'bg-blue-500';
      case '#10b981':
      case 'emerald':
        return 'bg-emerald-500';
      case '#f97316':
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-slate-300';
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setCreatingPlan(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const newPlan: Plan = { id: "", name: "", price: 0, razorpay_fee_percentage: 2, gst_percentage: 18, tier: 0, period: "month", description: "", features: [], permissions: [], tabs: [], razorpay_plan_id: null, isActive: true, subscriberCount: 0, revenueGenerated: 0, createdAt: new Date().toISOString(), type: 'student' };
    setEditingPlan(newPlan);
    setCreatingPlan(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    try {
      if (creatingPlan) {
        await apiService.createAdminPlan(editingPlan);
        toast.success("Plan created successfully!");
      } else {
        await apiService.updateAdminPlan(editingPlan.id, editingPlan);
        toast.success(`${editingPlan.name} plan updated successfully!`);
      }
      setIsModalOpen(false);
      await fetchPlans();
      await refreshPublicPlans();
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error("Failed to save plan");
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await apiService.deleteAdminPlan(planId);
      toast.success("Plan deleted successfully");
      await fetchPlans();
      await refreshPublicPlans();
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Failed to delete plan";
      toast.error(message);
    }
  };

  const handleToggleStatus = async (planId: string, isActive: boolean) => {
    try {
      await apiService.toggleAdminPlanStatus(planId, isActive);
      toast.success(`Plan ${isActive ? 'activated' : 'deactivated'}`);
      await fetchPlans();
      await refreshPublicPlans();
    } catch (error) {
      toast.error("Failed to update plan status");
    }
  };

  const handleSync = async (planId: string) => {
    try {
      toast.loading("Syncing with Razorpay...", { id: "sync-toast" });
      await apiService.syncAdminPlan(planId);
      toast.success("Plan synced with Razorpay!", { id: "sync-toast" });
      await fetchPlans();
      await refreshPublicPlans();
    } catch (error) {
      console.error("Sync Error:", error);
      toast.error("Failed to sync plan.", { id: "sync-toast" });
    }
  };

  const handleDuplicate = (plan: Plan) => {
    const duplicatedPlan = { ...plan, id: "", name: `${plan.name} (Copy)`, razorpay_plan_id: null, subscriberCount: 0, revenueGenerated: 0, createdAt: new Date().toISOString() };
    setEditingPlan(duplicatedPlan);
    setCreatingPlan(true);
    setIsModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    if (!editingPlan) return;
    const newPermissions = editingPlan.permissions.includes(permissionId) ? editingPlan.permissions.filter(p => p !== permissionId) : [...editingPlan.permissions, permissionId];
    setEditingPlan({ ...editingPlan, permissions: newPermissions });
  };

  const getPlanIcon = (planKey: unknown) => {
    const normalizedKey = String(planKey ?? "").toLowerCase();
    switch (normalizedKey) {
      case "prime": return Globe;
      case "premium": return Zap;
      case "placement": return Crown;
      case "recruiter_starter": return Shield;
      case "recruiter_growth": return Zap;
      case "recruiter_enterprise": return Crown;
      default: return CreditCard;
    }
  };

  const getPlanDotClass = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'prime':
        return 'bg-blue-500';
      case 'premium':
        return 'bg-purple-500';
      case 'placement':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  };

  const revenueData = [{ month: 'Jan', revenue: 45000 }, { month: 'Feb', revenue: 52000 }, { month: 'Mar', revenue: 48000 }, { month: 'Apr', revenue: 61000 }, { month: 'May', revenue: 55000 }, { month: 'Jun', revenue: 67000 }];
  const subscriberGrowthData = [{ month: 'Jan', subscribers: 120 }, { month: 'Feb', subscribers: 145 }, { month: 'Mar', subscribers: 168 }, { month: 'Apr', subscribers: 192 }, { month: 'May', subscribers: 215 }, { month: 'Jun', subscribers: 238 }];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Plan Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage subscription plans and pricing</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (<GlassCard key={i} className="space-y-4" hoverEffect={false}><div className="h-12 w-12 bg-slate-100 rounded-2xl animate-pulse" /><div className="space-y-2"><div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" /><div className="h-8 w-1/4 bg-slate-100 rounded animate-pulse" /></div></GlassCard>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Plan Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage subscription plans and pricing</p></div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchPlans} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" className="rounded-xl" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />New Plan</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit">
        {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "plans", label: "Plans", icon: CreditCard }, { id: "analytics", label: "Analytics", icon: TrendingUp }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
            {activeTab === tab.id && (
              <motion.div
                layoutId="admin-plans-tabs"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ label: "Total Plans", value: stats?.totalPlans || 0, trend: "+2", up: true, icon: CreditCard, color: "text-blue-500", bg: "bg-blue-50" }, { label: "Active Plans", value: stats?.activePlans || 0, trend: "+1", up: true, icon: Check, color: "text-emerald-500", bg: "bg-emerald-50" }, { label: "Total Subscribers", value: stats?.totalSubscribers || 0, trend: "+12%", up: true, icon: Users, color: "text-purple-500", bg: "bg-purple-50" }, { label: "Total Revenue", value: stats?.totalRevenueFormatted || "₹0", trend: "+18%", up: true, icon: DollarSign, color: "text-green-500", bg: "bg-green-50" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${stat.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{stat.trend}</div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900 mt-2">{stat.value}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Revenue Trends</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly plan revenue</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} /><Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#revenueGradient)" strokeWidth={2} /><defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/></linearGradient></defs>
                </AreaChart>
              </StableResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Plan Distribution</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Subscriber breakdown</p></div></div>
              <div className="h-75">
                <StableResponsiveContainer className="w-full" minHeight={300}>
                  <RechartsPieChart>
                    <RechartsPie data={stats?.planDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {(stats?.planDistribution || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </RechartsPie>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  </RechartsPieChart>
                </StableResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {(stats?.planDistribution || []).map((plan) => (<div key={plan.name} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${getPlanDotClass(plan.name)}`} /><span className="text-sm text-slate-600">{plan.name}</span></div>))}
              </div>
            </GlassCard>
          </div>
        </div>

      )}

      {activeTab === "plans" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search plans..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select aria-label="Filter plans by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600">
                  <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
                <select aria-label="Filter plans by type" value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600">
                  <option value="all">All Types</option><option value="student">Student</option><option value="employer">Employer</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {PLAN_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilterType(option.id as any)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filterType === option.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const Icon = getPlanIcon(plan.name);
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className="p-6 h-full flex flex-col group">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl ${plan.isActive ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400'}`}><Icon size={24} /></div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-purple-50 hover:text-purple-600 h-8 w-8" onClick={() => handleEdit(plan)} aria-label={`Edit ${plan.name}`} title={`Edit ${plan.name}`}><Edit2 size={16} /></Button>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-purple-50 hover:text-purple-600 h-8 w-8" onClick={() => handleDuplicate(plan)} aria-label={`Duplicate ${plan.name}`} title={`Duplicate ${plan.name}`}><Copy size={16} /></Button>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 h-8 w-8" onClick={() => handleDelete(plan.id)} aria-label={`Delete ${plan.name}`} title={`Delete ${plan.name}`}><Trash2 size={16} /></Button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-display font-bold text-slate-900">{plan.name}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{plan.isActive ? 'Active' : 'Inactive'}</div>
                      </div>
                      <div className="mb-3 inline-flex rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {plan.type === 'student' ? 'Student' : 'Employer'}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-display font-bold text-slate-900">₹{(plan.final_price ?? plan.price).toLocaleString()}</span>
                          <span className="text-slate-400 font-bold ml-1">/{plan.period}</span>
                        </div>
                        {plan.final_price !== undefined && plan.final_price !== plan.price && (
                          <p className="text-xs text-slate-500 mt-1">Base: ₹{plan.price.toLocaleString()} + Tax: ₹{((plan.razorpay_fee ?? 0) + (plan.gst_amount ?? 0)).toLocaleString()}</p>
                        )}
                    </div>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Subscribers</span>
                        <span className="font-bold text-slate-900">{plan.subscriberCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                        <span className="font-bold text-slate-900">₹{plan.revenueGenerated.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Razorpay Status</p>
                      {plan.razorpay_plan_id ? (
                        <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100"><Check size={14} className="mr-1.5" />Synced</div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full h-8 rounded-xl text-[10px] border-purple-100 text-purple-600 hover:bg-purple-50" onClick={() => handleSync(plan.id)}><RefreshCw size={12} className="mr-1.5" />Sync</Button>
                      )}
                    </div>

                    <div className="space-y-4 grow">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.permissions.slice(0, 3).map(pId => {
                          const perm = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId);
                          return <span key={pId} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">{perm?.name || pId}</span>;
                        })}
                        {plan.permissions.length > 3 && <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">+{plan.permissions.length - 3}</span>}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Razorpay Fee</span>
                        <span>₹{(plan.razorpay_fee ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>GST</span>
                        <span>₹{(plan.gst_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-purple-600">
                        <span>Total Tax</span>
                        <span>₹{((plan.razorpay_fee ?? 0) + (plan.gst_amount ?? 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>Total Price</span>
                        <span>₹{(plan.final_price ?? plan.price).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(plan.id, !plan.isActive)} className={`text-xs font-bold ${plan.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>{plan.isActive ? 'Deactivate' : 'Activate'}</Button>
                      <div className="flex items-center text-xs font-bold text-slate-400"><Shield size={12} className="mr-1" />{plan.permissions.length}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {filteredPlans.length === 0 && (
            <GlassCard className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No plans found</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          <GlassCard className="p-8" hoverEffect={false}>
            <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Subscriber Growth</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly trends</p></div></div>
            <StableResponsiveContainer className="w-full" minHeight={400}>
              <BarChart data={subscriberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} /><Bar dataKey="subscribers" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </StableResponsiveContainer>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Conversion</p><p className="text-2xl font-display font-bold text-slate-900">24.8%</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Activity className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Value</p><p className="text-2xl font-display font-bold text-slate-900">₹2,450</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Users className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Popular</p><p className="text-2xl font-display font-bold text-slate-900">{stats?.mostPopularPlan || 'Pro'}</p></div></div></GlassCard>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[40px] shadow-2xl flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600"><Settings2 size={24} /></div>
                  <div><h2 className="text-2xl font-display font-bold text-slate-900">{creatingPlan ? 'Create New Plan' : `Edit: ${editingPlan.name}`}</h2><p className="text-sm text-slate-500 font-medium">Configure pricing and permissions.</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full" aria-label="Close plan editor" title="Close plan editor"><X size={20} /></Button>
              </div>

              <div className="grow overflow-y-auto p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Plan Name</label>
                    <Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Price (INR)</label>
                    <Input type="number" value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Tier Level (for comparison)</label>
                    <Input type="number" value={editingPlan.tier} onChange={(e) => setEditingPlan({ ...editingPlan, tier: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl border-slate-200" placeholder="Higher tier = premium plan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Billing Period</label>
                    <select aria-label="Select billing period" value={editingPlan.period} onChange={(e) => setEditingPlan({ ...editingPlan, period: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700">
                      <option value="month">Monthly</option><option value="year">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Razorpay Fee %</label>
                    <Input type="number" step="0.01" value={editingPlan.razorpay_fee_percentage ?? 2} onChange={(e) => setEditingPlan({ ...editingPlan, razorpay_fee_percentage: parseFloat(e.target.value) || 0 })} className="h-12 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">GST %</label>
                    <Input type="number" step="0.01" value={editingPlan.gst_percentage ?? 18} onChange={(e) => setEditingPlan({ ...editingPlan, gst_percentage: parseFloat(e.target.value) || 0 })} className="h-12 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Plan Type</label>
                    <select aria-label="Select plan type" value={editingPlan.type} onChange={(e) => setEditingPlan({ ...editingPlan, type: e.target.value as 'student' | 'employer' })} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700">
                      <option value="student">Student</option>
                      <option value="employer">Employer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                    <div className="flex items-center space-x-4 h-12">
                      <label className="flex items-center"><input type="radio" name="status" checked={editingPlan.isActive} onChange={() => setEditingPlan({ ...editingPlan, isActive: true })} className="mr-2" /><span className="text-sm text-slate-700">Active</span></label>
                      <label className="flex items-center"><input type="radio" name="status" checked={!editingPlan.isActive} onChange={() => setEditingPlan({ ...editingPlan, isActive: false })} className="mr-2" /><span className="text-sm text-slate-700">Inactive</span></label>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                    <textarea value={editingPlan.description} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700" placeholder="Enter plan description..." />
                  </div>
                  <div className="space-y-2 md:col-span-2 p-4 rounded-3xl bg-slate-50 border border-slate-200">
                    <p className="text-sm font-bold text-slate-800">Tax & Total Summary</p>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">Razorpay Fee</p>
                        <p>₹{(((editingPlan.price || 0) * (editingPlan.razorpay_fee_percentage ?? 2)) / 100).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">GST</p>
                        <p>₹{(((editingPlan.price || 0) * (editingPlan.gst_percentage ?? 18)) / 100).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="font-semibold text-slate-900">Total Tax</p>
                        <p>₹{((((editingPlan.price || 0) * (editingPlan.razorpay_fee_percentage ?? 2)) / 100) + (((editingPlan.price || 0) * (editingPlan.gst_percentage ?? 18)) / 100)).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1 col-span-2 border-t border-slate-200 pt-3">
                        <p className="font-semibold text-slate-900">Final Price</p>
                        <p>₹{(((editingPlan.price || 0) + ((editingPlan.price || 0) * (editingPlan.razorpay_fee_percentage ?? 2)) / 100 + ((editingPlan.price || 0) * (editingPlan.gst_percentage ?? 18)) / 100)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Plan Tabs</h3>
                    <button onClick={() => setEditingPlan({ ...editingPlan, tabs: [...editingPlan.tabs, { name: '', content: '' }] })} className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1 rounded-full hover:bg-purple-50"><Plus size={14} className="inline mr-1" />Add Tab</button>
                  </div>
                  <div className="space-y-3">
                    {editingPlan.tabs.map((tab, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input value={tab.name} onChange={(e) => { const updated = [...editingPlan.tabs]; updated[idx].name = e.target.value; setEditingPlan({ ...editingPlan, tabs: updated }); }} placeholder="Tab name (e.g., Features)" className="h-10 rounded-lg border-slate-200 flex-1" />
                          <button onClick={() => setEditingPlan({ ...editingPlan, tabs: editingPlan.tabs.filter((_, i) => i !== idx) })} className="ml-2 text-rose-600 hover:bg-rose-50 p-2 rounded-lg" aria-label="Remove this tab" title="Remove this tab"><Trash2 size={14} /></button>
                        </div>
                        <textarea value={tab.content} onChange={(e) => { const updated = [...editingPlan.tabs]; updated[idx].content = e.target.value; setEditingPlan({ ...editingPlan, tabs: updated }); }} placeholder="Tab content" className="w-full h-16 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700 text-sm" />
                      </div>
                    ))}
                    {editingPlan.tabs.length === 0 && <p className="text-sm text-slate-400 italic">No tabs configured. Click "Add Tab" to add content.</p>}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center"><Shield size={20} className="mr-2 text-purple-600" />Permissions</h3>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{editingPlan.permissions.length}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                        <Users size={16} />
                      </div>

                      <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                        Student Features
                      </h4>

                      <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      {AVAILABLE_PERMISSIONS.filter((p) => p.type === "student").map((perm) => {
                        const isActive = editingPlan.permissions.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-start p-4 rounded-xl border transition-all text-left group ${
                              isActive
                                ? "bg-white border-blue-300 shadow-sm"
                                : "bg-white border-blue-100 hover:border-blue-200"
                            }`}
                          >
                            <div
                              className={`mt-0.5 mr-3 p-2 rounded-lg ${
                                isActive
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-100 text-blue-400"
                              }`}
                            >
                              {isActive ? <Unlock size={14} /> : <Lock size={14} />}
                            </div>

                            <div className="flex-1">
                              <p className={`text-sm font-bold mb-0.5 ${isActive ? "text-blue-900" : "text-slate-700"}`}>
                                {perm.name}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {perm.description}
                              </p>
                            </div>

                            {isActive && (
                              <div className="ml-2 self-start text-blue-600 flex-shrink-0">
                                <Check size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                        <Briefcase size={16} />
                      </div>

                      <h4 className="text-sm font-bold text-orange-900 uppercase tracking-wider">
                        Employer Features
                      </h4>

                      <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                      {AVAILABLE_PERMISSIONS.filter((p) => p.type === "employer").map((perm) => {
                        const isActive = editingPlan.permissions.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-start p-4 rounded-xl border transition-all text-left group ${
                              isActive
                                ? "bg-white border-orange-300 shadow-sm"
                                : "bg-white border-orange-100 hover:border-orange-200"
                            }`}
                          >
                            <div
                              className={`mt-0.5 mr-3 p-2 rounded-lg ${
                                isActive
                                  ? "bg-orange-600 text-white"
                                  : "bg-orange-100 text-orange-400"
                              }`}
                            >
                              {isActive ? <Unlock size={14} /> : <Lock size={14} />}
                            </div>

                            <div className="flex-1">
                              <p className={`text-sm font-bold mb-0.5 ${isActive ? "text-orange-900" : "text-slate-700"}`}>
                                {perm.name}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {perm.description}
                              </p>
                            </div>

                            {isActive && (
                              <div className="ml-2 self-start text-orange-600 flex-shrink-0">
                                <Check size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/50">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-12 px-6" aria-label="Close plan editor" title="Close plan editor">Cancel</Button>
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 shadow-lg shadow-purple-100">{creatingPlan ? 'Create' : 'Save'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
