import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Search, Filter, BarChart3, TrendingUp, Users, DollarSign, Activity, MapPin, Settings2, Briefcase, Clock } from "lucide-react";
import { apiService } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  description: string;
  department: string;
  skills: string[];
  requirements: string[];
  applications: number;
  views: number;
  status: string;
  postedAt: string;
  createdAt: string;
}

interface InternshipStats {
  totalInternships: number;
  activeInternships: number;
  totalApplications: number;
  averageApplicationsPerInternship: number;
  totalViews: number;
  internshipsByDepartment: { name: string; value: number; color: string }[];
}

export default function AdminInternships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [stats, setStats] = useState<InternshipStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "internships" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [creatingInternship, setCreatingInternship] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminInternships();
      setInternships(res.data.internships);
      setStats(res.data.stats);
      toast.success('Internship data refreshed', { id: 'internship-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch internships:", error);
      toast.error("Failed to load internship data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInternships();
  }, [fetchInternships]);

  const filteredInternships = useMemo(() => {
    return internships.filter(internship => {
      const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) || internship.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === "all" || internship.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [internships, searchTerm, filterDepartment]);

  const handleEdit = (internship: Internship) => {
    setEditingInternship({ ...internship });
    setCreatingInternship(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const newInternship: Internship = { id: "", title: "", company: "", location: "", duration: "3-6 months", stipend: "Unpaid", description: "", department: "Engineering", skills: [], requirements: [], applications: 0, views: 0, status: "Active", postedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    setEditingInternship(newInternship);
    setCreatingInternship(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingInternship) return;

    const errors = [];
    if (!editingInternship.title?.trim()) errors.push("Internship title is required");
    if (!editingInternship.company?.trim()) errors.push("Company name is required");
    if (!editingInternship.location?.trim()) errors.push("Location is required");
    if (!editingInternship.description?.trim()) errors.push("Description is required");

    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }

    try {
      if (creatingInternship) {
        await apiService.createAdminInternship(editingInternship);
        toast.success("Internship posted successfully!");
      } else {
        await apiService.updateAdminInternship(editingInternship.id, editingInternship);
        toast.success(`${editingInternship.title} updated!`);
      }
      setIsModalOpen(false);
      fetchInternships();
    } catch (error: any) {
      console.error("Failed to save internship:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save internship";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (internshipId: string) => {
    if (!confirm("Delete this internship posting?")) return;
    try {
      await apiService.deleteAdminInternship(internshipId);
      toast.success("Internship deleted");
      fetchInternships();
    } catch (error) {
      toast.error("Failed to delete internship");
    }
  };

  const handleStatusToggle = async (internshipId: string, status: string) => {
    try {
      const newStatus = status === "Active" ? "Closed" : "Active";
      await apiService.updateAdminInternship(internshipId, { status: newStatus });
      toast.success(`Internship ${newStatus}`);
      fetchInternships();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getDepartmentDotClass = (department: string) => {
    switch (department.toLowerCase()) {
      case 'engineering':
        return 'bg-cyan-500';
      case 'operations':
        return 'bg-emerald-500';
      case 'finance':
        return 'bg-amber-500';
      case 'marketing':
        return 'bg-pink-500';
      default:
        return 'bg-slate-400';
    }
  };

  const chartTooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  };

  const barChartTooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
  };

  const viewsData = useMemo(() => {
    if (!stats?.internshipsByDepartment) return [];
    return stats.internshipsByDepartment.map((dept, index) => ({
      department: dept.name,
      views: Math.floor(stats.totalViews * (dept.value / stats.totalInternships)),
      fill: dept.color
    }));
  }, [stats]);

  const applicationsData = useMemo(() => {
    if (!stats?.internshipsByDepartment) return [];
    return stats.internshipsByDepartment.map((dept, index) => ({
      department: dept.name,
      applications: Math.floor(stats.totalApplications * (dept.value / stats.totalInternships)),
      fill: dept.color
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Internship Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage internship programs and track applications</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (<GlassCard key={i} className="space-y-4" hoverEffect={false}><div className="h-12 w-12 bg-slate-100 rounded-2xl animate-pulse" /><div className="space-y-2"><div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" /><div className="h-8 w-1/4 bg-slate-100 rounded animate-pulse" /></div></GlassCard>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Internship Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage internship programs and track applications</p></div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchInternships} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" className="rounded-xl" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />New Internship</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit">
        {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "internships", label: "Internships", icon: Briefcase }, { id: "analytics", label: "Analytics", icon: TrendingUp }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
            {activeTab === tab.id && (
              <motion.div
                layoutId="admin-internships-tabs"
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
            {[{ label: "Total Internships", value: stats?.totalInternships || 0, trend: "+2", up: true, icon: Briefcase, color: "text-cyan-500", bg: "bg-cyan-50" }, { label: "Active", value: stats?.activeInternships || 0, trend: "+1", up: true, icon: Check, color: "text-emerald-500", bg: "bg-emerald-50" }, { label: "Total Applications", value: stats?.totalApplications || 0, trend: "+16%", up: true, icon: Users, color: "text-purple-500", bg: "bg-purple-50" }, { label: "Total Views", value: stats?.totalViews || 0, trend: "+12%", up: true, icon: Activity, color: "text-rose-500", bg: "bg-rose-50" }].map((stat, i) => (
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
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Views by Department</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Current distribution</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <BarChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="department" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="views" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </StableResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">By Department</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Distribution</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <RechartsPieChart>
                  <Pie data={stats?.internshipsByDepartment || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {(stats?.internshipsByDepartment || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </RechartsPieChart>
              </StableResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {(stats?.internshipsByDepartment || []).map((dept) => (<div key={dept.name} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${getDepartmentDotClass(dept.name)}`} /><span className="text-sm text-slate-600">{dept.name}</span></div>))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === "internships" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search internships..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-600" aria-label="Filter by department">
                  <option value="all">All Departments</option><option value="Engineering">Engineering</option><option value="Operations">Operations</option><option value="Finance">Finance</option><option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-3">
            {filteredInternships.map((internship) => (
              <motion.div key={internship.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600"><Briefcase size={24} /></div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-slate-900">{internship.title}</h3>
                          <p className="text-sm text-slate-500">{internship.company}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-xs text-slate-600">
                          <MapPin size={14} className="mr-2 text-slate-400" />{internship.location}
                        </div>
                        <div className="flex items-center text-xs text-slate-600">
                          <Clock size={14} className="mr-2 text-slate-400" />{internship.duration}
                        </div>
                        <div className="flex items-center text-xs text-slate-600">
                          <Users size={14} className="mr-2 text-slate-400" />{internship.applications} apps
                        </div>
                        <div className="flex items-center text-xs text-slate-600">
                          <DollarSign size={14} className="mr-2 text-slate-400" />{internship.stipend}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{internship.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">{internship.department}</span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${internship.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}>{internship.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-cyan-50 hover:text-cyan-600 h-8 w-8" onClick={() => handleEdit(internship)}><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-purple-50 hover:text-purple-600 h-8 w-8" onClick={() => handleStatusToggle(internship.id, internship.status)}>
                        {internship.status === "Active" ? <X size={16} /> : <Check size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 h-8 w-8" onClick={() => handleDelete(internship.id)}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {filteredInternships.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No internships found</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          <GlassCard className="p-8" hoverEffect={false}>
            <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Applications by Department</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Current distribution</p></div></div>
            <StableResponsiveContainer className="w-full" minHeight={400}>
              <BarChart data={applicationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="department" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={barChartTooltipStyle} /><Bar dataKey="applications" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </StableResponsiveContainer>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl"><TrendingUp className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Apps</p><p className="text-2xl font-display font-bold text-slate-900">{stats?.averageApplicationsPerInternship.toFixed(1) || '0'}</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Activity className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Views</p><p className="text-2xl font-display font-bold text-slate-900">{stats && stats.totalInternships ? (stats.totalViews / stats.totalInternships).toFixed(0) : '0'}</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Users className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Conversion</p><p className="text-2xl font-display font-bold text-slate-900">{stats && stats.totalViews ? ((stats.totalApplications / stats.totalViews) * 100).toFixed(1) : '0'}%</p></div></div></GlassCard>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && editingInternship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[40px] shadow-2xl flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600"><Settings2 size={24} /></div>
                  <div><h2 className="text-2xl font-display font-bold text-slate-900">{creatingInternship ? 'Create Internship' : `Edit: ${editingInternship.title}`}</h2><p className="text-sm text-slate-500 font-medium">Configure internship details and requirements.</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full"><X size={20} /></Button>
              </div>

              <div className="grow overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Internship Title *</label>
                    <Input value={editingInternship.title} onChange={(e) => setEditingInternship({ ...editingInternship, title: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Software Engineering Intern" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Company *</label>
                    <Input value={editingInternship.company} onChange={(e) => setEditingInternship({ ...editingInternship, company: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Tech Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
                    <Input value={editingInternship.location} onChange={(e) => setEditingInternship({ ...editingInternship, location: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. San Francisco, USA" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Duration</label>
                    <Input value={editingInternship.duration} onChange={(e) => setEditingInternship({ ...editingInternship, duration: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. 3-6 months" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                    <Input value={editingInternship.department} onChange={(e) => setEditingInternship({ ...editingInternship, department: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Engineering" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Stipend</label>
                    <Input value={editingInternship.stipend} onChange={(e) => setEditingInternship({ ...editingInternship, stipend: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. $1,500/month" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                    <textarea value={editingInternship.description} onChange={(e) => setEditingInternship({ ...editingInternship, description: e.target.value })} className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-600 outline-none text-slate-700" placeholder="Describe the internship..." />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/50">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 shadow-lg shadow-cyan-100">{creatingInternship ? 'Create' : 'Save'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
