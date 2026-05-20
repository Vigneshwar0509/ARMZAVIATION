import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Search, Filter, BarChart3, TrendingUp, Building2, Activity, Eye, MapPin, Settings2, UserCheck, UserX, Mail, Phone, Calendar, Briefcase, Award, Zap, Download, Building } from "lucide-react";
import { useEmployerStore, type Employer } from "@/src/store/employerStore";
import { apiService } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import SEO from "@/src/components/common/SEO";

interface EmployerStats {
  totalEmployers: number;
  activeEmployers: number;
  pendingEmployers: number;
  verifiedEmployers: number;
  averageProfileCompletion: number;
  totalJobsPosted: number;
  totalApplications: number;
  employersByStatus: { status: string; count: number; color: string }[];
  registrationTrend: { month: string; employers: number }[];
}

export default function Employers() {
  const PAGE_SIZE = 8;
  const { employers, isLoading, fetchEmployers, updateEmployer, deleteEmployer } = useEmployerStore();

  const [activeTab, setActiveTab] = useState<"overview" | "employers" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [sortBy, setSortBy] = useState<"firstName" | "lastName" | "status" | "jobsPosted" | "profileCompletion" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedEmployerIds, setSelectedEmployerIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [employerFormData, setEmployerFormData] = useState<Partial<Employer> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const statusDotClass = (color: string) => {
    switch (color.toLowerCase()) {
      case "#10b981":
        return "bg-emerald-500";
      case "#f59e0b":
        return "bg-amber-500";
      case "#ef4444":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  const buildStats = useCallback((data: Employer[]): EmployerStats => {
    const totalEmployers = data.length;
    const activeEmployers = data.filter((e) => e.status === "Active").length;
    const pendingEmployers = data.filter((e) => e.status === "Pending").length;
    const verifiedEmployers = data.filter((e) => e.isVerified).length;
    const averageProfileCompletion = totalEmployers
      ? Math.round(data.reduce((sum, e) => sum + (e.profileCompletion || 0), 0) / totalEmployers)
      : 0;
    const totalJobsPosted = data.reduce((sum, e) => sum + (e.jobsPosted || 0), 0);
    const totalApplications = data.reduce((sum, e) => sum + (e.applicationsReceived || 0), 0);

    const employersByStatus = [
      { status: "Active", count: activeEmployers, color: "#10b981" },
      { status: "Pending", count: pendingEmployers, color: "#f59e0b" },
      { status: "Inactive", count: data.filter((e) => e.status === "Inactive").length, color: "#ef4444" },
    ];

    // Mock registration trend data - in real app, this would come from analytics
    const registrationTrend = [
      { month: "Jan", employers: Math.floor(totalEmployers * 0.1) },
      { month: "Feb", employers: Math.floor(totalEmployers * 0.15) },
      { month: "Mar", employers: Math.floor(totalEmployers * 0.2) },
      { month: "Apr", employers: Math.floor(totalEmployers * 0.25) },
      { month: "May", employers: Math.floor(totalEmployers * 0.3) },
    ];

    return {
      totalEmployers,
      activeEmployers,
      pendingEmployers,
      verifiedEmployers,
      averageProfileCompletion,
      totalJobsPosted,
      totalApplications,
      employersByStatus,
      registrationTrend,
    };
  }, []);

  const stats = useMemo(() => buildStats(employers), [employers, buildStats]);

  const filteredAndSortedEmployers = useMemo(() => {
    let filtered = employers.filter((employer) => {
      const matchesSearch =
        employer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.hrName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || employer.status.toLowerCase() === filterStatus;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "firstName":
          aValue = a.firstName?.toLowerCase() || "";
          bValue = b.firstName?.toLowerCase() || "";
          break;
        case "lastName":
          aValue = a.lastName?.toLowerCase() || "";
          bValue = b.lastName?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "jobsPosted":
          aValue = a.jobsPosted || 0;
          bValue = b.jobsPosted || 0;
          break;
        case "profileCompletion":
          aValue = a.profileCompletion || 0;
          bValue = b.profileCompletion || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employers, searchTerm, filterStatus, sortBy, sortDirection]);

  const paginatedEmployers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedEmployers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedEmployers, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedEmployers.length / PAGE_SIZE);

  const handleBulkStatusUpdate = async (status: Employer["status"]) => {
    if (selectedEmployerIds.length === 0) return;

    try {
      const updates = selectedEmployerIds.map((id) =>
        updateEmployer(id, { status, isVerified: status === "Active" })
      );
      await Promise.all(updates);
      setSelectedEmployerIds([]);
      toast.success(`Updated ${selectedEmployerIds.length} employers`);
      fetchEmployers(); // Refresh data after bulk update
    } catch (error) {
      toast.error("Failed to update employers");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployerIds.length === 0) return;

    if (!confirm(`Delete ${selectedEmployerIds.length} employers? This action cannot be undone.`)) return;

    try {
      const deletes = selectedEmployerIds.map((id) => deleteEmployer(id));
      await Promise.all(deletes);
      setSelectedEmployerIds([]);
      toast.success(`Deleted ${selectedEmployerIds.length} employers`);
      fetchEmployers(); // Refresh data after bulk delete
    } catch (error) {
      toast.error("Failed to delete employers");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployerIds(paginatedEmployers.map((e) => e.id));
    } else {
      setSelectedEmployerIds([]);
    }
  };

  const handleSelectEmployer = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployerIds((prev) => [...prev, id]);
    } else {
      setSelectedEmployerIds((prev) => prev.filter((empId) => empId !== id));
    }
  };

  const handleEditEmployer = (employer: Employer) => {
    setEditingEmployer(employer);
    // Ensure all relevant fields are copied, handling potential null/undefined with defaults
    setEmployerFormData({
      id: employer.id,
      firstName: employer.firstName || "",
      lastName: employer.lastName || "",
      email: employer.email || "",
      phone: employer.phone || "",
      companyName: employer.companyName || "",
      hrName: employer.hrName || "",
      status: employer.status || "Pending", // Default to Pending if not set
      isVerified: employer.isVerified !== undefined ? employer.isVerified : false, // Default to false if not set
      profileCompletion: employer.profileCompletion || 0, // Default to 0 if not set
      // Add any other fields from Employer type that are editable or displayed
    });
    setIsModalOpen(true);
  };

  const handleSaveEmployer = async (data: Partial<Employer>) => {
    if (!editingEmployer) return; // Safety check, though modal condition should prevent this

    try {
      // If only verification status is being changed, use the dedicated endpoint
      if (Object.prototype.hasOwnProperty.call(data, "isVerified")) {
        await apiService.verifyUser(editingEmployer.id, Boolean((data as any).isVerified));
      } else {
        await updateEmployer(editingEmployer.id, data);
      }
      setIsModalOpen(false);
      setEditingEmployer(null);
      setEmployerFormData(null);
      toast.success("Employer updated successfully.");
      fetchEmployers(); // Refresh data after save
    } catch (error) {
      toast.error("Failed to update employer.");
      // Error already handled in store, but can add specific UI feedback if needed
    }
  };

  const handleDeleteEmployer = async (id: string) => {
    if (!confirm("Delete this employer? This action cannot be undone.")) return;

    try {
      await deleteEmployer(id);
      toast.success("Employer deleted successfully.");
      fetchEmployers(); // Refresh data after delete
    } catch (error) {
      toast.error("Failed to delete employer.");
    }
  };

  const exportEmployers = () => {
    const csvData = filteredAndSortedEmployers.map((emp) => ({
      "First Name": emp.firstName || "", // Ensure empty string for missing values
      "Last Name": emp.lastName || "",
      Email: emp.email || "",
      Phone: emp.phone || "",
      "Company Name": emp.companyName || "",
      "HR Name": emp.hrName || "",
      Status: emp.status || "",
      "Jobs Posted": emp.jobsPosted || 0,
      "Profile Completion": emp.profileCompletion || 0,
      "Created At": emp.createdAt || "",
    }));

    if (csvData.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employers.csv");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Helper function for rendering the full name in the modal, ensuring robustness
  const renderFullName = useCallback(() => {
    if (!employerFormData) return "Not available"; // Fallback, though modal should not render if null

    const nameParts: string[] = [];
    if (employerFormData.firstName) {
      nameParts.push(employerFormData.firstName);
    }
    if (employerFormData.lastName) {
      nameParts.push(employerFormData.lastName);
    }

    return nameParts.length > 0 ? nameParts.join(" ") : "Not available";
  }, [employerFormData]);


  if (isLoading && employers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Employer Management | Admin" description="Manage platform employers" />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="h-6 w-6 text-purple-600" />
            Employers Management
          </h1>
          <p className="text-slate-500">View and manage registered employers and their verification status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEmployers()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportEmployers}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "employers", label: "Employers", icon: Building2 },
          { id: "analytics", label: "Analytics", icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-label={`Go to ${tab.label} tab`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Employers</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalEmployers}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Employers</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.activeEmployers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-emerald-600" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Profile Completion</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.averageProfileCompletion}%</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Jobs Posted</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.totalJobsPosted}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-orange-600" />
                </div>
              </GlassCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Employer Registrations</h3>
                <StableResponsiveContainer height={300}>
                  <AreaChart data={stats.registrationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="employers" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                  </AreaChart>
                </StableResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Employers by Status</h3>
                <StableResponsiveContainer height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={stats.employersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {stats.employersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </StableResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {stats.employersByStatus.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusDotClass(item.color)}`} />
                      <span className="text-sm text-slate-600">{item.status}: {item.count}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {activeTab === "employers" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search and Filter Bar */}
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search employers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      aria-label="Search employers by name, email, or company"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={`${sortBy}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split("-");
                      setSortBy(field as any);
                      setSortDirection(direction as any);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                    aria-label="Sort employers by"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="firstName-asc">Name A-Z</option>
                    <option value="firstName-desc">Name Z-A</option>
                    <option value="jobsPosted-desc">Most Jobs</option>
                    <option value="profileCompletion-desc">Highest Completion</option>
                  </select>
                </div>
              </div>
            </GlassCard>

            {/* Bulk Actions */}
            {selectedEmployerIds.length > 0 && (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {selectedEmployerIds.length} employer{selectedEmployerIds.length > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate("Active")}
                      className="flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Set Active
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate("Pending")}
                      className="flex items-center gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Set Pending
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate("Inactive")}
                      className="flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Set Inactive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Employers List */}
            <GlassCard className="overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedEmployers.length > 0 && selectedEmployerIds.length === paginatedEmployers.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300"
                          aria-label="Select all employers on the current page"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jobs</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Profile</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedEmployers.map((employer) => (
                      <tr key={employer.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEmployerIds.includes(employer.id)}
                            onChange={(e) => handleSelectEmployer(employer.id, e.target.checked)}
                            className="rounded border-slate-300"
                            aria-label={`Select employer ${employer.firstName || ""} ${employer.lastName || ""}`.trim()}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Building className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">
                                {employer.firstName} {employer.lastName}
                              </div>
                              <div className="text-sm text-slate-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {employer.email}
                              </div>
                              {employer.phone && (
                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {employer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-900">{employer.companyName || "Not specified"}</div>
                          <div className="text-sm text-slate-500">{employer.hrName || "No HR contact"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employer.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : employer.status === "Pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {employer.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">{employer.jobsPosted || 0}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <progress
                              value={employer.profileCompletion || 0}
                              max={100}
                              className="w-16 h-2 mr-2 appearance-none rounded-full bg-slate-200 [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-blue-600 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-blue-600 [&::-moz-progress-bar]:rounded-full"
                              aria-label={`Profile completion for ${employer.firstName || ""} ${employer.lastName || ""}`.trim()}
                            />
                            <span className="text-sm text-slate-600">{employer.profileCompletion || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditEmployer(employer)}
                              className="text-indigo-600 hover:text-indigo-900"
                              aria-label={`Edit employer ${employer.firstName || ""} ${employer.lastName || ""}`.trim()}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployer(employer.id)}
                              className="text-rose-600 hover:text-rose-900"
                              aria-label={`Delete employer ${employer.firstName || ""} ${employer.lastName || ""}`.trim()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ultra-Premium Mobile View */}
              <div className="lg:hidden divide-y divide-slate-100/50">
                {paginatedEmployers.map((employer) => (
                  <div key={employer.id} className="p-5 hover:bg-slate-50/50 transition-colors will-change-transform">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployerIds.includes(employer.id)}
                          onChange={(e) => handleSelectEmployer(employer.id, e.target.checked)}
                          className="rounded border-slate-300 mt-1 text-purple-600 focus:ring-purple-500"
                          aria-label={`Select employer ${employer.firstName || ""} ${employer.lastName || ""}`.trim()}
                        />
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                          <Building className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-display font-bold text-slate-900">{employer.firstName} {employer.lastName}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{employer.companyName || "No Company"}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        employer.status === "Active" ? "bg-emerald-50 text-emerald-700" : employer.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {employer.status}
                      </span>
                    </div>
                    <div className="pl-14 space-y-3">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {employer.email}</p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <Briefcase className="h-3.5 w-3.5" /> {employer.jobsPosted || 0} Jobs
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditEmployer(employer)} aria-label={`Edit employer ${employer.firstName || ""} ${employer.lastName || ""}`.trim()} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteEmployer(employer.id)} aria-label={`Delete employer ${employer.firstName || ""} ${employer.lastName || ""}`.trim()} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-700">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredAndSortedEmployers.length)} of {filteredAndSortedEmployers.length} employers
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Verified Employers</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.verifiedEmployers}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {stats.totalEmployers > 0 ? Math.round((stats.verifiedEmployers / stats.totalEmployers) * 100) : 0}% of total
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-emerald-600" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Applications</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalApplications}</p>
                    <p className="text-sm text-slate-500 mt-1">Across all jobs</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Jobs per Employer</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.totalEmployers > 0 ? Math.round(stats.totalJobsPosted / stats.totalEmployers) : 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Active engagement</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
              </GlassCard>
            </div>

            {/* Profile Completion Chart */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Completion Distribution</h3>
              <StableResponsiveContainer height={300}>
                <BarChart data={[
                  { range: "0-25%", count: employers.filter(e => (e.profileCompletion || 0) <= 25).length },
                  { range: "26-50%", count: employers.filter(e => (e.profileCompletion || 0) > 25 && (e.profileCompletion || 0) <= 50).length },
                  { range: "51-75%", count: employers.filter(e => (e.profileCompletion || 0) > 50 && (e.profileCompletion || 0) <= 75).length },
                  { range: "76-100%", count: employers.filter(e => (e.profileCompletion || 0) > 75).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </StableResponsiveContainer>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && editingEmployer && employerFormData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[28px] p-5 w-full max-w-md mx-4 max-h-[86vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold text-slate-900 mb-1">Employer details</h3>
              <p className="text-sm text-slate-500 mb-3">
                Review the registration data below, then activate the employer account if everything looks correct.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
                    {renderFullName()} {/* Use the helper function for robust name display */}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
                    {employerFormData.email || "Not available"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
                    {employerFormData.phone || "Not available"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
                    {employerFormData.companyName || "Not available"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">HR Name</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
                    {employerFormData.hrName || "Not available"}
                  </div>
                </div>
                <div>
                  <label htmlFor="employerStatus" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    id="employerStatus"
                    value={employerFormData.status}
                    onChange={(e) => setEmployerFormData((prev) => ({ ...prev, status: e.target.value as Employer["status"] }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    aria-label="Update employer status"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">
                <Button variant="ghost" className="rounded-xl h-11 px-5" onClick={() => setIsModalOpen(false)} aria-label="Cancel editing employer details">
                  Cancel
                </Button>
                <Button
                  className="rounded-xl h-11 px-5 shadow-lg shadow-purple-100"
                  onClick={() => handleSaveEmployer({
                    ...employerFormData,
                    // Ensure isVerified is set correctly based on the status chosen
                    isVerified: employerFormData.status === "Active",
                    // Preserve profileCompletion if it exists, otherwise fallback to editingEmployer's value
                    // Using non-null assertion here as editingEmployer should be present due to modal condition
                    profileCompletion: employerFormData.profileCompletion ?? editingEmployer!.profileCompletion,
                  })}
                  aria-label={
                    employerFormData.status === "Pending"
                      ? "Activate employer account"
                      : "Save changes to employer details"
                  }
                >
                  {employerFormData.status === "Pending" ? "Activate Employer" : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}