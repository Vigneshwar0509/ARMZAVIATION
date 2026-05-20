import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Lock, Unlock, X, RefreshCw, Search, Filter, BarChart3, TrendingUp, Shield, ShieldCheck, AlertCircle, Key, Clock, Activity, Zap, UserCheck, Download } from "lucide-react";
import { apiService } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuthStore } from "@/src/store/authStore";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'prime' | 'admin' | 'moderator';
  status: 'Active' | 'Inactive' | 'Suspended';
  permissions: string[];
  lastActive?: string;
  joinedAt: string;
  isPrime: boolean;
  password?: string;
}

interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  primeAdmins: number;
  suspendedAdmins: number;
  totalPermissions: number;
  adminsByRole: { role: string; count: number; color: string }[];
  activityTrend: { week: string; actions: number }[];
}

export default function AdminManagement() {
  const PAGE_SIZE = 6;
  const { user: currentUser } = useAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "prime" | "admin" | "moderator">("all");
  const [sortBy, setSortBy] = useState<"name" | "role" | "status" | "joinedAt">("joinedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.isPrime) {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [currentUser?.isPrime]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdmins();
      const adminData: AdminUser[] = response.data || [];

      const roleCounts = adminData.reduce(
        (acc, item) => {
          acc[item.role] = (acc[item.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const computedStats: AdminStats = {
        totalAdmins: adminData.length,
        activeAdmins: adminData.filter((a) => a.status === 'Active').length,
        primeAdmins: adminData.filter((a) => a.role === 'prime').length,
        suspendedAdmins: adminData.filter((a) => a.status === 'Suspended').length,
        totalPermissions: adminData.reduce((sum, a) => sum + (a.permissions?.length || 0), 0),
        adminsByRole: [
          { role: 'Prime', count: roleCounts.prime || 0, color: '#a855f7' },
          { role: 'Admin', count: roleCounts.admin || 0, color: '#3b82f6' },
          { role: 'Moderator', count: roleCounts.moderator || 0, color: '#10b981' },
        ],
        activityTrend: [
          { week: 'Week 1', actions: 0 },
          { week: 'Week 2', actions: 0 },
          { week: 'Week 3', actions: 0 },
          { week: 'Week 4', actions: 0 },
          { week: 'Week 5', actions: 0 },
        ],
      };

      setAdmins(adminData);
      setStats(computedStats);
      toast.success('Admin data refreshed', { id: 'admin-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || admin.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [admins, searchTerm, filterRole]);

  const sortedAdmins = useMemo(() => {
    const list = [...filteredAdmins];
    list.sort((a, b) => {
      let left = '';
      let right = '';

      if (sortBy === 'joinedAt') {
        left = String(new Date(a.joinedAt).getTime());
        right = String(new Date(b.joinedAt).getTime());
      } else {
        left = String((a as any)[sortBy] ?? '').toLowerCase();
        right = String((b as any)[sortBy] ?? '').toLowerCase();
      }

      if (left < right) return sortDirection === 'asc' ? -1 : 1;
      if (left > right) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredAdmins, sortBy, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedAdmins.length / PAGE_SIZE));
  const pagedAdmins = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedAdmins.slice(start, start + PAGE_SIZE);
  }, [sortedAdmins, currentPage]);

  const currentPageAdminIds = pagedAdmins.map((admin) => admin.id);
  const areAllCurrentPageSelected =
    currentPageAdminIds.length > 0 && currentPageAdminIds.every((id) => selectedAdminIds.includes(id));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, sortBy, sortDirection]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const getRoleDotClass = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'prime':
        return 'bg-purple-600';
      case 'admin':
        return 'bg-blue-600';
      case 'moderator':
        return 'bg-emerald-600';
      default:
        return 'bg-slate-400';
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin({ ...admin });
    setCreatingAdmin(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const newAdmin: AdminUser = { id: "", name: "", email: "", role: "admin", status: "Active", permissions: [], joinedAt: new Date().toISOString(), isPrime: false, password: "" };
    setEditingAdmin(newAdmin);
    setCreatingAdmin(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingAdmin || !editingAdmin.name || !editingAdmin.email) {
      toast.error("Please fill in required fields");
      return;
    }
    if (creatingAdmin && (!editingAdmin.password || editingAdmin.password.length < 8)) {
      toast.error("New admin password must be at least 8 characters");
      return;
    }
    try {
      if (creatingAdmin) {
        await apiService.createAdmin(editingAdmin);
        toast.success("Admin added successfully!");
      } else {
        await apiService.updateAdmin(editingAdmin.id, editingAdmin);
        toast.success(`${editingAdmin.name} updated!`);
      }
      setIsModalOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error("Failed to save admin:", error);
      toast.error("Failed to save admin");
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!confirm("Remove this admin account?")) return;
    try {
      await apiService.deleteAdmin(adminId);
      toast.success("Admin removed");
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to delete admin");
    }
  };

  const handleStatusToggle = async (adminId: string, status: string) => {
    try {
      const newStatus = status === "Active" ? "Inactive" : "Active";
      await apiService.updateAdmin(adminId, { status: newStatus });
      toast.success(`Admin ${newStatus}`);
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleSelectAdmin = (adminId: string) => {
    setSelectedAdminIds((prev) =>
      prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]
    );
  };

  const toggleSelectCurrentPage = () => {
    if (areAllCurrentPageSelected) {
      setSelectedAdminIds((prev) => prev.filter((id) => !currentPageAdminIds.includes(id)));
      return;
    }

    setSelectedAdminIds((prev) => Array.from(new Set([...prev, ...currentPageAdminIds])));
  };

  const handleBulkStatusChange = async (status: AdminUser['status']) => {
    const selected = admins.filter((admin) => selectedAdminIds.includes(admin.id) && !admin.isPrime);
    if (selected.length === 0) {
      toast.error('No editable admins selected');
      return;
    }

    try {
      await Promise.all(selected.map((admin) => apiService.updateAdmin(admin.id, { status })));
      toast.success(`Updated ${selected.length} admins`);
      setSelectedAdminIds([]);
      fetchAdmins();
    } catch {
      toast.error('Failed bulk status update');
    }
  };

  const handleBulkDelete = async () => {
    const selected = admins.filter((admin) => selectedAdminIds.includes(admin.id) && !admin.isPrime);
    if (selected.length === 0) {
      toast.error('No editable admins selected');
      return;
    }

    if (!confirm(`Delete ${selected.length} selected admins?`)) return;

    try {
      await Promise.all(selected.map((admin) => apiService.deleteAdmin(admin.id)));
      toast.success(`Deleted ${selected.length} admins`);
      setSelectedAdminIds([]);
      fetchAdmins();
    } catch {
      toast.error('Failed bulk delete');
    }
  };

  const handleExportAdmins = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Permissions', 'Last Active', 'Joined At'];
    const rows = sortedAdmins.map((admin) => [
      admin.name,
      admin.email,
      admin.role,
      admin.status,
      admin.permissions.join('|'),
      admin.lastActive || '',
      admin.joinedAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admins-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Admin list exported');
  };

  const activityData = stats?.activityTrend || [];
  const permissionData = useMemo(() => {
    const permissionCounts = admins.reduce<Record<string, number>>((acc, admin) => {
      admin.permissions.forEach((permission) => {
        acc[permission] = (acc[permission] || 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(permissionCounts).map(([name, count]) => ({ name, count }));
  }, [admins]);

  if (!currentUser?.isPrime) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-4 rounded-2xl bg-red-50"><AlertCircle className="h-12 w-12 text-red-600" /></div>
        <h2 className="text-2xl font-display font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500">Only Prime Admins can access this section.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Admin Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage administrators and their permissions</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (<GlassCard key={i} className="space-y-4" hoverEffect={false}><div className="h-12 w-12 bg-slate-100 rounded-2xl animate-pulse" /><div className="space-y-2"><div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" /><div className="h-8 w-1/4 bg-slate-100 rounded animate-pulse" /></div></GlassCard>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Admin Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage administrators and their permissions</p></div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAdmins} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={handleExportAdmins} className="rounded-xl"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button size="sm" className="rounded-xl" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Add Admin</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit">
        {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "admins", label: "Admins", icon: Shield }, { id: "analytics", label: "Analytics", icon: TrendingUp }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ label: "Total Admins", value: stats?.totalAdmins || 0, trend: "+2", up: true, icon: Shield, color: "text-blue-500", bg: "bg-blue-50" }, { label: "Active Now", value: stats?.activeAdmins || 0, trend: "+1", up: true, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50" }, { label: "Prime Status", value: stats?.primeAdmins || 0, trend: "0", up: false, icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-50" }, { label: "Permissions", value: stats?.totalPermissions || 0, trend: "+8", up: true, icon: Key, color: "text-orange-500", bg: "bg-orange-50" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${stat.up ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"}`}>{stat.trend}</div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900 mt-2">{stat.value}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Activity Trend</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Admin actions over time</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="week" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} /><Area type="monotone" dataKey="actions" stroke="#8b5cf6" fill="url(#activityGradient)" strokeWidth={2} /><defs><linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/></linearGradient></defs>
                </AreaChart>
              </StableResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Admin Distribution</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">By role</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <RechartsPieChart>
                  <Pie data={stats?.adminsByRole || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count">
                    {(stats?.adminsByRole || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </RechartsPieChart>
              </StableResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {(stats?.adminsByRole || []).map((role) => (<div key={role.role} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${getRoleDotClass(role.role)}`} /><span className="text-sm text-slate-600">{role.role}</span></div>))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === "admins" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search admins..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600" aria-label="Filter by role">
                  <option value="all">All Roles</option><option value="prime">Prime</option><option value="admin">Admin</option><option value="moderator">Moderator</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600" aria-label="Sort admins by">
                  <option value="joinedAt">Sort: Join Date</option>
                  <option value="name">Sort: Name</option>
                  <option value="role">Sort: Role</option>
                  <option value="status">Sort: Status</option>
                </select>
                <Button variant="outline" size="sm" onClick={toggleSortDirection} className="rounded-xl">
                  {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </div>
          </GlassCard>

          {selectedAdminIds.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-slate-600 font-medium">{selectedAdminIds.length} selected</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange('Active')}>Set Active</Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange('Inactive')}>Set Inactive</Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-rose-600 hover:text-rose-700" onClick={handleBulkDelete}>Delete Selected</Button>
                </div>
              </div>
            </GlassCard>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <input
                  type="checkbox"
                  checked={areAllCurrentPageSelected}
                  onChange={toggleSelectCurrentPage}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Select Page
              </label>
              <span className="text-xs text-slate-500">Showing {pagedAdmins.length} of {sortedAdmins.length}</span>
            </div>

            {pagedAdmins.map((admin) => (
              <motion.div key={admin.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedAdminIds.includes(admin.id)}
                          onChange={() => toggleSelectAdmin(admin.id)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          aria-label={`Select ${admin.name}`}
                        />
                        <div className={`p-3 rounded-2xl ${admin.isPrime ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}><Shield size={24} /></div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">{admin.name} {admin.isPrime && <ShieldCheck size={18} className="text-purple-600" />}</h3>
                          <p className="text-sm text-slate-500">{admin.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-xs text-slate-600"><Zap size={14} className="mr-2 text-slate-400" />{admin.role}</div>
                        <div className="flex items-center text-xs text-slate-600"><Clock size={14} className="mr-2 text-slate-400" />{admin.lastActive}</div>
                        <div className="flex items-center text-xs text-slate-600"><Key size={14} className="mr-2 text-slate-400" />{admin.permissions.length} perms</div>
                        <div className="flex items-center text-xs text-slate-600"><Activity size={14} className="mr-2 text-slate-400" />Joined {new Date(admin.joinedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {admin.permissions.slice(0, 3).map((perm) => (<span key={perm} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">{perm}</span>))}
                        {admin.permissions.length > 3 && <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">+{admin.permissions.length - 3} more</span>}
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${admin.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{admin.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-blue-50 hover:text-blue-600 h-8 w-8" onClick={() => handleEdit(admin)} disabled={admin.isPrime}><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-purple-50 hover:text-purple-600 h-8 w-8" onClick={() => handleStatusToggle(admin.id, admin.status)} disabled={admin.isPrime}>{admin.status === "Active" ? <Lock size={16} /> : <Unlock size={16} />}</Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 h-8 w-8" onClick={() => handleDelete(admin.id)} disabled={admin.isPrime}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {sortedAdmins.length > PAGE_SIZE && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 font-medium">
                  Page {currentPage} of {pageCount}
                </span>
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
            </GlassCard>
          )}

          {sortedAdmins.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No admins found</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          <GlassCard className="p-8" hoverEffect={false}>
            <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Permission Usage</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Distribution across admins</p></div></div>
            <StableResponsiveContainer className="w-full" minHeight={400}>
              <BarChart data={permissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} /><Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </StableResponsiveContainer>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><TrendingUp className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Permissions</p><p className="text-2xl font-display font-bold text-slate-900">{stats ? (stats.totalPermissions / stats.totalAdmins).toFixed(1) : '0'}</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Activity className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Active Rate</p><p className="text-2xl font-display font-bold text-slate-900">{stats ? ((stats.activeAdmins / stats.totalAdmins) * 100).toFixed(0) : '0'}%</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><AlertCircle className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Suspended</p><p className="text-2xl font-display font-bold text-slate-900">{stats?.suspendedAdmins || 0}</p></div></div></GlassCard>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && editingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[40px] shadow-2xl flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600"><Shield size={24} /></div>
                  <div><h2 className="text-2xl font-display font-bold text-slate-900">{creatingAdmin ? 'Add New Admin' : `Edit: ${editingAdmin.name}`}</h2><p className="text-sm text-slate-500 font-medium">Manage admin role and permissions.</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full"><X size={20} /></Button>
              </div>

              <div className="grow overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name *</label>
                    <Input value={editingAdmin.name} onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Rajesh Gupta" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email *</label>
                    <Input value={editingAdmin.email} onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })} type="email" className="h-12 rounded-xl border-slate-200" placeholder="admin@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
                    <select value={editingAdmin.role} onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value as any })} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700" aria-label="Role" disabled>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                    <select value={editingAdmin.status} onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value as any })} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700" aria-label="Status">
                      <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Permissions (comma-separated)</label>
                    <textarea value={editingAdmin.permissions.join(', ')} onChange={(e) => setEditingAdmin({ ...editingAdmin, permissions: e.target.value.split(',').map(p => p.trim()) })} className="w-full h-20 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700" placeholder="manage_jobs, manage_students, view_reports" />
                    <p className="text-[10px] text-slate-400">Available: manage_jobs, manage_students, manage_plans, manage_payments, view_reports, manage_admins</p>
                  </div>
                  {creatingAdmin && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Temporary Password *</label>
                      <Input value={editingAdmin.password || ""} onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })} type="password" className="h-12 rounded-xl border-slate-200" placeholder="Minimum 8 characters" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/50">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 shadow-lg shadow-purple-100">{creatingAdmin ? 'Add Admin' : 'Save'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
