import React, { useState, useEffect, useMemo } from "react";
import { Plus, Megaphone, Target, Users, BarChart, Loader2, X, Trash, Edit, Search, Filter, TrendingUp, Calendar, Eye, Play, Pause, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  name: string;
  target: string;
  reach: string | number;
  status: "Active" | "Completed" | "Draft" | "Paused" | string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  createdAt?: string;
}

interface CampaignForm {
  name: string;
  target: string;
  reach: string;
  status: Campaign['status'];
  budget?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "draft" | "paused">("all");
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    name: '',
    target: '',
    reach: '',
    status: 'Draft',
    budget: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getCampaigns();
      setCampaigns(res.data ?? []);
      toast.success('Campaign data refreshed', { id: 'campaign-data-refreshed' });
    } catch (error) {
      console.error("Fetch campaigns error:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openCampaignModal = (campaign?: Campaign) => {
    setEditingCampaign(campaign ?? null);
    setCampaignForm({
      name: campaign?.name ?? '',
      target: campaign?.target ?? '',
      reach: campaign?.reach?.toString() ?? '',
      status: campaign?.status ?? 'Draft',
      budget: campaign?.budget?.toString() ?? '',
      startDate: campaign?.startDate ?? '',
      endDate: campaign?.endDate ?? '',
      description: campaign?.description ?? ''
    });
    setIsModalOpen(true);
  };

  const closeCampaignModal = () => {
    setEditingCampaign(null);
    setCampaignForm({
      name: '',
      target: '',
      reach: '',
      status: 'Draft',
      budget: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      name: campaignForm.name,
      target: campaignForm.target,
      reach: campaignForm.reach,
      status: campaignForm.status,
      budget: campaignForm.budget ? parseFloat(campaignForm.budget) : undefined,
      startDate: campaignForm.startDate || undefined,
      endDate: campaignForm.endDate || undefined,
      description: campaignForm.description || undefined,
    };

    try {
      if (editingCampaign) {
        await apiService.updateCampaign(editingCampaign.id, data);
        toast.success("Campaign updated successfully!");
      } else {
        await apiService.createCampaign(data);
        toast.success("Campaign created successfully!");
      }
      closeCampaignModal();
      fetchCampaigns();
    } catch (error) {
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await apiService.deleteCampaign(id);
      toast.success("Campaign deleted successfully!");
      fetchCampaigns();
    } catch (error) {
      toast.error("Failed to delete campaign.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: Campaign['status']) => {
    try {
      await apiService.updateCampaign(id, { status: newStatus });
      toast.success(`Campaign ${newStatus.toLowerCase()}`);
      fetchCampaigns();
    } catch (error) {
      toast.error("Failed to update campaign status");
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.target.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || campaign.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'Active').length,
    completed: campaigns.filter(c => c.status === 'Completed').length,
    totalReach: campaigns.reduce((sum, c) => sum + (typeof c.reach === 'number' ? c.reach : parseInt(c.reach.toString()) || 0), 0),
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
  }), [campaigns]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100/50 text-green-700 border-green-200/50';
      case 'completed': return 'bg-blue-100/50 text-blue-700 border-blue-200/50';
      case 'draft': return 'bg-slate-100/50 text-slate-600 border-slate-200/50';
      case 'paused': return 'bg-orange-100/50 text-orange-700 border-orange-200/50';
      default: return 'bg-slate-100/50 text-slate-600 border-slate-200/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'draft': return <Clock className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-slate-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-600 font-bold">Campaign management</p>
          <h1 className="mt-2 text-4xl font-display font-bold text-slate-900 tracking-tight">Marketing campaigns</h1>
          <p className="mt-3 max-w-2xl text-slate-500">Create, track, and optimize your marketing and recruitment campaigns for maximum reach and engagement.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:auto-cols-max">
          <button className="glass-card inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <BarChart className="h-4 w-4 text-purple-600" />
            View analytics
          </button>
          <button
            onClick={() => openCampaignModal()}
            className="premium-button-primary inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            New campaign
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="glass-card rounded-4xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Search & filter campaigns</h2>
              <p className="mt-1 text-sm text-slate-500">Find and manage your marketing campaigns efficiently.</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns"
                  className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </label>
              <select
                aria-label="Filter campaigns by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { label: 'Total campaigns', value: stats.total, icon: Megaphone },
            { label: 'Active campaigns', value: stats.active, icon: TrendingUp },
            { label: 'Total reach', value: stats.totalReach.toLocaleString(), icon: Users },
            { label: 'Total budget', value: `₹${stats.totalBudget.toLocaleString()}`, icon: Target },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-4xl p-5 border border-white/40"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">{stat.label}</p>
                  <p className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-purple-400 opacity-70" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredCampaigns.length > 0 ? (
          <motion.div
            key="campaigns"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 xl:grid-cols-2"
          >
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.08 }}
                className="glass-card rounded-4xl overflow-hidden hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-linear-to-br from-purple-50 to-blue-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Megaphone className="h-16 w-16 text-purple-400 opacity-50" />
                  </div>
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-sm">
                    {getStatusIcon(campaign.status)}
                    {campaign.status}
                  </div>
                  <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-sm">
                    {typeof campaign.reach === 'number' ? campaign.reach.toLocaleString() : campaign.reach} reach
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 line-clamp-2">{campaign.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">
                      {campaign.description || `Target audience: ${campaign.target}`}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span>{campaign.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{typeof campaign.reach === 'number' ? campaign.reach.toLocaleString() : campaign.reach}</span>
                    </div>
                    {campaign.budget && (
                      <div className="flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-green-500" />
                        <span>₹{campaign.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {campaign.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => openCampaignModal(campaign)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    {campaign.status === 'Active' ? (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'Paused')}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </button>
                    ) : campaign.status === 'Paused' ? (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'Active')}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100"
                      >
                        <Play className="h-4 w-4" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-4xl p-12 text-center"
          >
            <Megaphone className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No campaigns match your search</h3>
            <p className="mt-2 text-slate-500">Try broadening the search term or select another status filter.</p>
            <button
              onClick={() => openCampaignModal()}
              className="mt-6 inline-flex items-center gap-2 rounded-3xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Create your first campaign
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-8 space-y-8 relative shadow-2xl shadow-slate-200/50 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeCampaignModal}
              title="Close form"
              aria-label="Close form"
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-purple-600 font-bold">Campaign form</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {editingCampaign ? "Update campaign" : "Create new campaign"}
              </h2>
              <p className="mt-1 text-slate-500">Set up your marketing campaign details and targeting.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="campaign-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign name</label>
                <input
                  id="campaign-name"
                  name="name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder="e.g. Summer Internship Drive 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="campaign-target" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target audience</label>
                  <input
                    id="campaign-target"
                    name="target"
                    value={campaignForm.target}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, target: e.target.value }))}
                    required
                    className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    placeholder="e.g. Final Year Students"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="campaign-reach" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reach goal</label>
                  <input
                    id="campaign-reach"
                    name="reach"
                    value={campaignForm.reach}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, reach: e.target.value }))}
                    required
                    className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    placeholder="e.g. 15,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="campaign-status" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    id="campaign-status"
                    name="status"
                    aria-label="Campaign status"
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, status: e.target.value as Campaign['status'] }))}
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="campaign-budget" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget (₹)</label>
                  <input
                    id="campaign-budget"
                    name="budget"
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                    type="number"
                    className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="campaign-start-date" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start date</label>
                  <input
                    id="campaign-start-date"
                    name="startDate"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                    type="date"
                    title="Campaign start date"
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="campaign-description" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description (optional)</label>
                <textarea
                  id="campaign-description"
                  name="description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 resize-none"
                  placeholder="Describe your campaign goals and strategy..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-purple-600 text-white font-bold transition hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingCampaign ? "Save changes" : "Create campaign"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

