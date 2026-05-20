import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Briefcase, Clock, DollarSign, Building2, ArrowUpRight, Bookmark, Loader2, CheckCircle2, X, Sparkles, Target } from "lucide-react";
import { Job } from "@/src/types";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/src/services/api";
import { useAuthStore } from "@/src/store/authStore";
import { useJobStore } from "@/src/store/jobStore";
import { useApplicationActions } from "@/src/hooks/useQueries";
import toast from "react-hot-toast";
import { cn } from "@/src/lib/utils";
import { getSubscriptionRouteForRole, hasActiveSubscription } from "@/src/lib/subscription";

interface JobCardProps {
  job: Job;
  onQuickView: (job: Job) => void;
  hasApplied?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onQuickView, hasApplied = false }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { saveJob, removeJob, isJobSaved } = useJobStore();
  const { apply, isApplying } = useApplicationActions();
  const [localHasApplied, setLocalHasApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = isJobSaved(String(job.id));
  const hasAppliedState = hasApplied || localHasApplied;
  const isInternship = String(job.type ?? "Job").toLowerCase() === "internship";
  const rawJob = job as any;

  useEffect(() => {
    if (hasApplied) {
      setLocalHasApplied(true);
    }
  }, [hasApplied]);

  const handleApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user?.id) {
      toast.error("Please complete registration and choose a plan to apply.");
      navigate('/register');
      return;
    }

    if (!hasActiveSubscription(user)) {
      toast.error("Subscription required to apply. Please activate your plan.");
      navigate(getSubscriptionRouteForRole(user.role));
      return;
    }

    try {
      await apply({ id: String(job.id), userId: user.id, type: job.type });
      setLocalHasApplied(true);
    } catch (error) {
      console.error("Apply failed:", error);
      toast.error("Failed to apply.");
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInternship) {
      toast.error("Saving internships is not supported yet.");
      return;
    }
    
    if (!isAuthenticated || !user?.id) {
      toast.error("Please login to save jobs");
      return;
    }

    setIsSaving(true);
    const userId = user.id;
    try {
      if (isSaved) {
        await apiService.removeSavedJob(String(job.id), userId);
        removeJob(String(job.id));
      } else {
        await apiService.saveJob(String(job.id), userId);
        saveJob(String(job.id));
      }
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['saved-jobs', String(user.id)] });
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to update saved jobs.");
    } finally {
      setIsSaving(false);
    }
  };

  const companyName = String(rawJob.company ?? rawJob.company_name ?? job.title ?? "").trim();
  const categoryLabel = String(job.category ?? "General").trim();
  const postedAtLabel = String(job.postedAt ?? rawJob.posted_at ?? "").trim();

  const companyInitials = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onClick={() => onQuickView(job)}
      className="glass-card p-8 group relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(124,58,237,0.15)] cursor-pointer border-white/40"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-700"></div>

      <div className="flex flex-col h-full">
        {/* Top Section: Logo & Title */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center space-x-5">
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm group-hover:border-purple-200 group-hover:shadow-md transition-all duration-500">
              {job.logo ? (
                <img
                  src={job.logo}
                  alt={job.company}
                  className="h-full w-full object-contain p-3"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 text-sm font-bold text-purple-700">
                  {companyInitials || "CO"}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[9px] font-bold uppercase tracking-widest border border-purple-100/50">
                  {categoryLabel.split(' ')[0]}
                </span>
                {job.postedAt?.includes('h') && (
                  <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[9px] font-bold uppercase tracking-widest border border-green-100/50 flex items-center">
                    <Sparkles className="h-2 w-2 mr-1" /> New
                  </span>
                )}
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-purple-600 transition-colors duration-300 line-clamp-1">
                {job.title}
              </h3>
              <div className="flex items-center text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">
                <Building2 className="h-3 w-3 mr-1.5 text-purple-400" />
                {companyName || "Company"}
              </div>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            disabled={isSaving || isInternship}
            className={cn(
              "p-3 rounded-2xl transition-all duration-500",
              isInternship
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : isSaved 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200" 
                : "bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600 border border-transparent hover:border-purple-100"
            )}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />}
          </motion.button>
        </div>

        {/* Middle Section: Details Grid */}
        <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-8">
          <div className="flex items-center text-slate-500 text-xs font-semibold">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-purple-50 transition-colors">
              <MapPin className="h-4 w-4 text-purple-400" />
            </div>
            <span className="truncate">{job.location ?? ""}</span>
          </div>
          <div className="flex items-center text-slate-500 text-xs font-semibold">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-purple-50 transition-colors">
              <DollarSign className="h-4 w-4 text-purple-400" />
            </div>
            <span className="truncate">{job.salary ?? "Competitive"}</span>
          </div>
          <div className="flex items-center text-slate-500 text-xs font-semibold">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-purple-50 transition-colors">
              <Briefcase className="h-4 w-4 text-purple-400" />
            </div>
            <span className="truncate">{String(job.type ?? "Job")}</span>
          </div>
          <div className="flex items-center text-slate-500 text-xs font-semibold">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-purple-50 transition-colors">
              <Clock className="h-4 w-4 text-purple-400" />
            </div>
            <span className="truncate">{postedAtLabel || "Recently"}</span>
          </div>
        </div>

        {/* Bottom Section: Actions */}
        <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(job);
            }}
            className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-purple-600 transition-all flex items-center group/btn"
          >
            Quick View <ArrowUpRight className="ml-2 h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleApply}
            disabled={isApplying || hasAppliedState}
            className={cn(
              "px-7 py-3 rounded-2xl text-[10px] font-bold transition-all duration-500 flex items-center space-x-2 uppercase tracking-widest",
              hasAppliedState
                ? "bg-green-500 text-white shadow-lg shadow-green-200"
                : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200"
            )}
          >
            {isApplying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasAppliedState ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Applied</span>
              </>
            ) : (
              <span>Apply Now</span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
