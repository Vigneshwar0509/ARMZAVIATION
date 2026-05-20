import { useState } from "react";
import { Search, Filter, Briefcase, Calendar, MapPin, Building2, Clock, Eye, ChevronDown, ArrowRight, CheckCircle2, AlertCircle, Mail, MessageSquare, Download, Share2, Trash2, TrendingUp, Users, Award, DollarSign } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { Link } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import SEO from "@/src/components/common/SEO";
import EmptyState from "@/src/components/common/EmptyState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useApplications } from "@/src/hooks/useQueries";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function Applications() {
  const { user } = useAuthStore();
  const { data: applications = [], isLoading } = useApplications(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApp, setSelectedApp] = useState<number | null>(null);

  const statuses = ["All", "Applied", "Under Review", "Interview Scheduled", "Offer Extended", "Rejected"];

  const filteredApplications = applications
    .filter((app: any) => {
      const matchesSearch = 
        app.job_details?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job_details?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobId?.toString().includes(searchQuery);
      const matchesStatus = statusFilter === "All" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "newest") {
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      }
      return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-blue-100 text-blue-700";
      case "Under Review":
        return "bg-purple-100 text-purple-700";
      case "Interview Scheduled":
        return "bg-emerald-100 text-emerald-700";
      case "Offer Extended":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Applied":
      case "Under Review":
        return AlertCircle;
      case "Interview Scheduled":
      case "Offer Extended":
        return CheckCircle2;
      case "Rejected":
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const stats = [
    { label: "Total Applied", value: applications.length, color: "from-purple-600 to-pink-600", icon: Briefcase },
    { label: "In Review", value: applications.filter((a: any) => a.status === "Under Review").length, color: "from-blue-600 to-cyan-600", icon: Clock },
    { label: "Interviews", value: applications.filter((a: any) => a.status === "Interview Scheduled").length, color: "from-emerald-600 to-teal-600", icon: Users },
    { label: "Offers", value: applications.filter((a: any) => a.status === "Offer Extended").length, color: "from-green-600 to-emerald-600", icon: Award },
  ];

  const handleWithdraw = (appId: number) => {
    toast.success("Application withdrawn successfully");
  };

  const handleShare = (appId: number) => {
    toast.success("Application link copied to clipboard");
  };

  const handleMessage = () => {
    toast.success("Opening messaging app...");
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-20 px-4 sm:px-0 pt-4 sm:pt-0">
      <SEO title="My Applications" description="Track your job applications" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">My Applications</h1>
          <p className="text-slate-500 mt-2 text-sm">Track, manage, and monitor your job applications in one place.</p>
        </div>
        <Link 
          to="/jobs" 
          className="w-full sm:w-auto justify-center px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold flex items-center gap-2"
        >
          <Briefcase className="h-4 w-4" />
          Browse Jobs
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`glass-card p-4 sm:p-6 rounded-2xl border border-slate-200 bg-linear-to-br ${stat.color}/10 flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1 sm:mb-2">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-linear-to-br ${stat.color} text-white hidden sm:block`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job title, company, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-300 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                title="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-300 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                title="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-300 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        {(searchQuery || statusFilter !== "All") && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Found <span className="font-bold text-slate-900">{filteredApplications.length}</span> {filteredApplications.length === 1 ? "application" : "applications"}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={searchQuery || statusFilter !== "All" ? "No matching applications" : "No applications yet"}
          description={
            searchQuery || statusFilter !== "All"
              ? "Try adjusting your filters to find what you're looking for."
              : "Start applying to jobs to track your progress here."
          }
          actionLabel="Browse Jobs"
          actionPath="/jobs"
        />
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app: any, idx: number) => {
            const StatusIcon = getStatusIcon(app.status);
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                onClick={() => setSelectedApp(selectedApp === app.id ? null : app.id)}
                className="glass-card p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all cursor-pointer space-y-4"
              >
                {/* Main Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 text-2xl shrink-0">
                      🏢
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {app.job_details?.title || `Job #${app.jobId}`}
                        </h3>
                        <StatusIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{app.job_details?.company || "Company Name"}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                        {app.job_details?.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {app.job_details.location}
                          </div>
                        )}
                        {app.score && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Match Score: {app.score}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                      getStatusColor(app.status)
                    )}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedApp === app.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-slate-200 space-y-4"
                  >
                    {/* Job Info Grid */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {app.job_details?.salary && (
                        <div className="p-3 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Salary</p>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-slate-900">{app.job_details.salary}</span>
                          </div>
                        </div>
                      )}
                      {app.job_details?.location && (
                        <div className="p-3 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Location</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-slate-900 truncate">{app.job_details.location}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Application ID</p>
                        <p className="font-semibold text-slate-900">#{app.id}</p>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    {["Applied", "Under Review", "Interview Scheduled", "Offer Extended"].includes(app.status) && (
                      <div className="p-4 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Application Timeline</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mb-2" />
                            <span className="text-slate-600">Applied</span>
                          </div>
                          <div className="flex-1 h-px bg-slate-300 mx-2 mb-4" />
                          <div className={cn("flex flex-col items-center", app.status !== "Applied" ? "opacity-100" : "opacity-50")}>
                            <div className={cn("h-2 w-2 rounded-full mb-2", app.status !== "Applied" ? "bg-emerald-500" : "bg-slate-300")} />
                            <span className="text-slate-600">Review</span>
                          </div>
                          <div className="flex-1 h-px bg-slate-300 mx-2 mb-4" />
                          <div className={cn("flex flex-col items-center", ["Interview Scheduled", "Offer Extended"].includes(app.status) ? "opacity-100" : "opacity-50")}>
                            <div className={cn("h-2 w-2 rounded-full mb-2", ["Interview Scheduled", "Offer Extended"].includes(app.status) ? "bg-emerald-500" : "bg-slate-300")} />
                            <span className="text-slate-600">Interview</span>
                          </div>
                          <div className="flex-1 h-px bg-slate-300 mx-2 mb-4" />
                          <div className={cn("flex flex-col items-center", app.status === "Offer Extended" ? "opacity-100" : "opacity-50")}>
                            <div className={cn("h-2 w-2 rounded-full mb-2", app.status === "Offer Extended" ? "bg-emerald-500" : "bg-slate-300")} />
                            <span className="text-slate-600">Offer</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Button
                        onClick={() => handleMessage()}
                        className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                      </Button>
                      <Link
                        to={`/jobs/${app.jobId}`}
                        className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View Job</span>
                      </Link>
                      <Button
                        onClick={() => handleShare(app.id)}
                        className="px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                      <Button
                        onClick={() => handleWithdraw(app.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Withdraw</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
