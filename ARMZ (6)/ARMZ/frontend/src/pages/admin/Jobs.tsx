import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Search, Filter, BarChart3, TrendingUp, Users, DollarSign, Activity, Eye, MapPin, Settings2, Briefcase, Clock } from "lucide-react";
import { apiService } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  category: string;
  experience: string;
  requirements: string[];
  applications: number;
  views: number;
  status: string;
  postedAt: string;
  createdAt: string;
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  averageApplicationsPerJob: number;
  totalViews: number;
  jobsByCategory: { name: string; value: number; color: string }[];
  applicationsByStatus: { status: string; count: number }[];
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "full-time" | "internship" | "contract">("all");
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminJobs();
      setJobs(res.data.jobs);
      setStats(res.data.stats);
      toast.success('Job data refreshed', { id: 'job-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      toast.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase()) || job.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || job.type.toLowerCase().replace(" ", "-") === filterType;
      return matchesSearch && matchesType;
    });
  }, [jobs, searchTerm, filterType]);

  const handleEdit = (job: Job) => {
    setEditingJob({ ...job });
    setCreatingJob(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const newJob: Job = { id: "", title: "", company: "", location: "", type: "Full-time", salary: "", description: "", category: "", experience: "0-1 Years", requirements: [], applications: 0, views: 0, status: "Active", postedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    setEditingJob(newJob);
    setCreatingJob(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingJob || !editingJob.title || !editingJob.company) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      if (creatingJob) {
        await apiService.createAdminJob(editingJob);
        toast.success("Job posted successfully!");
      } else {
        await apiService.updateAdminJob(editingJob.id, editingJob);
        toast.success(`${editingJob.title} updated!`);
      }
      setIsModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error("Failed to save job:", error);
      toast.error("Failed to save job");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this job posting?")) return;
    try {
      await apiService.deleteAdminJob(jobId);
      toast.success("Job deleted");
      fetchJobs();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const handleStatusToggle = async (jobId: string, status: string) => {
    try {
      const newStatus = status === "Active" ? "Closed" : "Active";
      await apiService.updateAdminJob(jobId, { status: newStatus });
      toast.success(`Job ${newStatus}`);
      fetchJobs();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const viewsData = [{ month: 'Week 1', views: 450 }, { month: 'Week 2', views: 620 }, { month: 'Week 3', views: 580 }, { month: 'Week 4', views: 780 }, { month: 'Week 5', views: 920 }];
  const applicationsData = [{ month: 'Week 1', applications: 25 }, { month: 'Week 2', applications: 38 }, { month: 'Week 3', applications: 32 }, { month: 'Week 4', applications: 48 }, { month: 'Week 5', applications: 55 }];

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Job Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage job postings and track applications</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (<GlassCard key={i} className="space-y-4" hoverEffect={false}><div className="h-12 w-12 bg-slate-100 rounded-2xl animate-pulse" /><div className="space-y-2"><div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" /><div className="h-8 w-1/4 bg-slate-100 rounded animate-pulse" /></div></GlassCard>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Job Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage job postings and track applications</p></div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchJobs} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" className="rounded-xl" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Post Job</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit">
        {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "jobs", label: "Jobs", icon: Briefcase }, { id: "analytics", label: "Analytics", icon: TrendingUp }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
            {activeTab === tab.id && (
              <motion.div
                layoutId="admin-jobs-tabs"
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
            {[{ label: "Total Jobs", value: stats?.totalJobs || 0, trend: "+3", up: true, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50" }, { label: "Active Jobs", value: stats?.activeJobs || 0, trend: "+2", up: true, icon: Check, color: "text-emerald-500", bg: "bg-emerald-50" }, { label: "Total Applications", value: stats?.totalApplications || 0, trend: "+24%", up: true, icon: Users, color: "text-purple-500", bg: "bg-purple-50" }, { label: "Total Views", value: stats?.totalViews || 0, trend: "+18%", up: true, icon: Eye, color: "text-orange-500", bg: "bg-orange-50" }].map((stat, i) => (
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
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Job Views</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Weekly trends</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <AreaChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} /><Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#viewsGradient)" strokeWidth={2} /><defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/></linearGradient></defs>
                </AreaChart>
              </StableResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Jobs by Category</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Distribution</p></div></div>
              <StableResponsiveContainer className="w-full" minHeight={300}>
                <RechartsPieChart>
                  <Pie data={stats?.jobsByCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {(stats?.jobsByCategory || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </RechartsPieChart>
              </StableResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {(stats?.jobsByCategory || []).map((cat, index) => (<div key={`${cat.name}-${index}`} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" data-color={cat.color} /><span className="text-sm text-slate-600">{cat.name}</span></div>))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select aria-label="Filter jobs by type" value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600">
                  <option value="all">All Types</option><option value="full-time">Full-time</option><option value="internship">Internship</option><option value="contract">Contract</option>
                </select>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Briefcase size={24} /></div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-slate-900">{job.title}</h3>
                          <p className="text-sm text-slate-500">{job.company}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-xs text-slate-600"><MapPin size={14} className="mr-2 text-slate-400" />{job.location}</div>
                        <div className="flex items-center text-xs text-slate-600"><Clock size={14} className="mr-2 text-slate-400" />{job.type}</div>
                        <div className="flex items-center text-xs text-slate-600"><Users size={14} className="mr-2 text-slate-400" />{job.applications} apps</div>
                        <div className="flex items-center text-xs text-slate-600"><Eye size={14} className="mr-2 text-slate-400" />{job.views} views</div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">{job.category}</span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${job.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}>{job.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-blue-50 hover:text-blue-600 h-8 w-8" onClick={() => handleEdit(job)}><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-purple-50 hover:text-purple-600 h-8 w-8" onClick={() => handleStatusToggle(job.id, job.status)}>{job.status === "Active" ? "Close" : "Open"}</Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 h-8 w-8" onClick={() => handleDelete(job.id)}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No jobs found</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          <GlassCard className="p-8" hoverEffect={false}>
            <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Applications</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Weekly received</p></div></div>
            <StableResponsiveContainer className="w-full" minHeight={400}>
              <BarChart data={applicationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} /><Bar dataKey="applications" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </StableResponsiveContainer>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Apps/Job</p><p className="text-2xl font-display font-bold text-slate-900">{stats?.averageApplicationsPerJob.toFixed(1) || '0'}</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Activity className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Views/Job</p><p className="text-2xl font-display font-bold text-slate-900">{stats && stats.totalJobs ? (stats.totalViews / stats.totalJobs).toFixed(0) : '0'}</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Users className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Conversion</p><p className="text-2xl font-display font-bold text-slate-900">{stats && stats.totalViews ? ((stats.totalApplications / stats.totalViews) * 100).toFixed(1) : '0'}%</p></div></div></GlassCard>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && editingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[40px] shadow-2xl flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Settings2 size={24} /></div>
                  <div><h2 className="text-2xl font-display font-bold text-slate-900">{creatingJob ? 'Post New Job' : `Edit: ${editingJob.title}`}</h2><p className="text-sm text-slate-500 font-medium">Configure job details and requirements.</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full"><X size={20} /></Button>
              </div>

              <div className="grow overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Job Title *</label>
                    <Input value={editingJob.title} onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Senior Pilot" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Company *</label>
                    <Input value={editingJob.company} onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Emirates" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
                    <Input value={editingJob.location} onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Dubai, UAE" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Job Type</label>
                    <select aria-label="Job type" value={editingJob.type} onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700">
                      <option value="Full-time">Full-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                    <Input value={editingJob.category} onChange={(e) => setEditingJob({ ...editingJob, category: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Pilot" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Salary Range</label>
                    <Input value={editingJob.salary} onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. $80,000 - $120,000" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                    <textarea value={editingJob.description} onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })} className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700" placeholder="Describe the role..." />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/50">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 shadow-lg shadow-blue-100">{creatingJob ? 'Post Job' : 'Save'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
