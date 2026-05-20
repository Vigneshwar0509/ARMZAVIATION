import React, { useMemo, useState, useEffect } from "react";
import { Search, Filter, Briefcase, MapPin, ArrowRight, ChevronDown, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import JobCard from "@/src/components/common/JobCard";
import { Job } from "@/src/types";
import EmptyState from "@/src/components/common/EmptyState";
import { JobQuickView } from "@/src/components/jobs/JobQuickView";
import { apiService } from "@/src/services/api";
import { useAuthStore } from "@/src/store/authStore";
import { useJobStore } from "@/src/store/jobStore";
import { useApplications, useApplicationActions, useJobs, useSavedJobs } from "@/src/hooks/useQueries";
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getSubscriptionRouteForRole, hasActiveSubscription } from "@/src/lib/subscription";

export default function Jobs() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading: isJobsLoading } = useJobs();
  const { data: applications = [], isLoading: isAppsLoading, refetch: refetchApplications } = useApplications(user?.id);
  const { data: savedJobs = [], isLoading: isSavedLoading } = useSavedJobs(user?.id);
  const { saveJob, removeJob, isJobSaved, setSavedJobs, clearSavedJobs } = useJobStore();
  const { apply: applyForJob, isApplying: isQuickApplying } = useApplicationActions();
  const [activeTab, setActiveTab] = useState("applications");
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("All");
  const [location, setLocation] = useState("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [selectedHasApplied, setSelectedHasApplied] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const isLoading = isJobsLoading || isAppsLoading || isSavedLoading;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job: any) => {
      const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase()) || job.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = jobType === "All" || job.type === jobType;
      const matchesLocation = location === "All" || job.location === location || job.location.toLowerCase().includes(location.toLowerCase());
      return matchesSearch && matchesType && matchesLocation;
    });
  }, [jobs, search, jobType, location]);

  const internshipCount = jobs.filter((job: any) => job.type === "Internship").length;
  const jobCount = jobs.filter((job: any) => job.type !== "Internship").length;

  const hasAppliedForOpportunity = (job: Job) => {
    if (!job || !job.id) return false;
    
    const jobId = String(job.id).trim();
    const jobType = String(job.type).toLowerCase().trim();
    
    // Determine expected application type
    const expectedType = jobType === 'internship' ? 'Internship' : 'Job';
    
    // Check applications for a match
    return applications.some((app: any) => {
      if (!app) return false;
      
      const appJobId = String(app.jobId || app.job_id || app.internship_id || '').trim();
      const appType = String(app.applicationType || '').trim();
      
      // Match both type and ID
      return appJobId === jobId && appType === expectedType;
    });
  };

  const handleQuickView = (job: Job) => {
    setSelectedJob(job);
    setSelectedHasApplied(hasAppliedForOpportunity(job));
    setIsQuickViewOpen(true);
  };

  // Ensure applications are refreshed on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      // Force refetch on mount to get latest data
      void refetchApplications();
    }
  }, [user?.id, refetchApplications]);

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setSelectedJob(null);
    setIsQuickSaving(false);
    setIsQuickApplying(false);
  };

  const handleQuickSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedJob || !user) return;

    setIsQuickSaving(true);
    try {
      const jobId = String(selectedJob.id);
      const userId = user.id;
      if (isJobSaved(jobId)) {
        await apiService.removeSavedJob(jobId, userId);
        removeJob(jobId);
      } else {
        await apiService.saveJob(jobId, userId);
        saveJob(jobId);
      }
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', userId] });
    } catch (error) {
      console.error("Quick save failed:", error);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleQuickApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedJob || !user) return;

    if (!hasActiveSubscription(user)) {
      toast.error("Subscription required to apply. Please activate your plan.");
      navigate(getSubscriptionRouteForRole(user.role));
      return;
    }

    try {
      await applyForJob({ id: String(selectedJob.id), userId: user.id, type: selectedJob.type });
      // Immediately update local state
      setSelectedHasApplied(true);
      // Refetch all applications to sync with backend
      await refetchApplications();
    } catch (error) {
      console.error("Quick apply failed:", error);
      setSelectedHasApplied(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Jobs & Internships</h1>
          <p className="text-slate-500">Track your applications, saved positions, and discover new aviation opportunities.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search roles, airlines, or locations"
              className="h-12 pl-12 pr-6 bg-white/90 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none w-full sm:w-64 text-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="h-12 px-6 bg-white border border-slate-200 rounded-xl flex items-center justify-center space-x-2 text-slate-600 hover:border-purple-200 transition"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 sm:p-8 rounded-3xl sm:rounded-4xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Advanced Filters</h3>
              <button onClick={() => setShowFilterPanel(false)} aria-label="Close filter panel" className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  aria-label="Filter jobs by type"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
                >
                  {['All', 'Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Location</label>
                <input
                  value={location === 'All' ? '' : location}
                  onChange={(e) => setLocation(e.target.value || 'All')}
                  placeholder="Any location"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Search</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Role, company..."
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setSearch("");
                  setJobType("All");
                  setLocation("All");
                  setShowFilterPanel(false);
                }}
                className="flex-1 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 font-bold transition"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="flex-1 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 font-bold transition"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit no-scrollbar">
        {[
          { key: "applications", label: "Applications" },
          { key: "saved", label: "Saved Jobs" },
          { key: "browse", label: "Browse Opportunities" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "relative whitespace-nowrap px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-colors",
              activeTab === tab.key ? "text-purple-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="dashboard-jobs-tabs"
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "applications" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: "Total Applied", value: applications.length.toString(), color: "text-purple-600" },
            { label: "Interviews", value: applications.filter((a: any) => a.status === "Interview Scheduled").length.toString(), color: "text-purple-600" },
            { label: "Offers", value: applications.filter((a: any) => a.status === "Offer Extended").length.toString(), color: "text-green-600" },
            { label: "Rejected", value: applications.filter((a: any) => a.status === "Rejected").length.toString(), color: "text-red-600" }
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-4 sm:p-6 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "browse" && (
        <div className="grid grid-cols-1 xl:grid-cols-[0.75fr_0.25fr] gap-6 sm:gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-5 sm:p-6">
                <p className="text-sm text-slate-500">Available Jobs</p>
                <p className="text-3xl font-bold text-slate-900">{jobCount}</p>
              </div>
              <div className="glass-card p-5 sm:p-6">
                <p className="text-sm text-slate-500">Internship Openings</p>
                <p className="text-3xl font-bold text-slate-900">{internshipCount}</p>
              </div>
              <div className="glass-card p-5 sm:p-6">
                <p className="text-sm text-slate-500">Total Opportunities</p>
                <p className="text-3xl font-bold text-slate-900">{jobs.length}</p>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 rounded-3xl sm:rounded-4xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="jobTypeFilter" className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Type</label>
                  <select
                    id="jobTypeFilter"
                    aria-label="Filter jobs by type"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {['All', 'Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Location</label>
                  <input
                    value={location === 'All' ? '' : location}
                    onChange={(e) => setLocation(e.target.value || 'All')}
                    placeholder="Any location"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearch("");
                      setJobType("All");
                      setLocation("All");
                    }}
                    className="w-full rounded-2xl bg-purple-600 text-white px-4 py-3 text-sm font-bold hover:bg-purple-700 transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="glass-card p-8 animate-pulse rounded-4xl"></div>
                ))
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job: any) => (
                  <JobCard
                    key={`${job.type}-${job.id}`}
                    job={job}
                    hasApplied={hasAppliedForOpportunity(job)}
                    onQuickView={handleQuickView}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={Search}
                    title="No matching opportunities"
                    description="Update your search criteria to explore more jobs and internships."
                    actionLabel="Clear Filters"
                    onAction={() => {
                      setSearch("");
                      setJobType("All");
                      setLocation("All");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-card p-8 rounded-4xl border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Why Apply Here?</h2>
              <ul className="mt-6 space-y-3 text-slate-600">
                <li>• Exclusive aviation roles curated for students.</li>
                <li>• Real-time saved jobs and application tracking.</li>
                <li>• Internship filters that highlight early-career openings.</li>
              </ul>
            </div>
            <div className="glass-card p-8 rounded-4xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Ready for your next role?</h3>
              <p className="mt-3 text-slate-500">Use the resume builder and LinkedIn tools to strengthen your application before applying.</p>
              <Link to="/dashboard/resume" className="mt-5 inline-flex items-center justify-center w-full rounded-2xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700 transition-all">
                Build Your Resume
              </Link>
            </div>
          </aside>
        </div>
      )}

      {activeTab === "saved" && (
        !isLoading && savedJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No saved jobs"
            description="Save jobs you're interested in to apply later."
            actionLabel="Browse Opportunities"
            actionPath="/dashboard/jobs"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedJobs.map((job: any) => (
              <JobCard
                key={`${job.type}-${job.id}`}
                job={job}
                hasApplied={hasAppliedForOpportunity(job)}
                isApplicationStatusLoading={isAppsLoading}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )
      )}

      <JobQuickView
        job={selectedJob}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
        isSaved={selectedJob ? isJobSaved(String(selectedJob.id)) : false}
        isSaving={isQuickSaving}
        onSave={handleQuickSave}
        hasApplied={selectedHasApplied}
        isApplying={isQuickApplying}
        onApply={handleQuickApply}
      />
    </div>
  );
}
