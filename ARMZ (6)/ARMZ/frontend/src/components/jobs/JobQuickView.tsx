import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Building2, Sparkles, Target, CheckCircle2, Bookmark, Loader2, ArrowRight } from "lucide-react";
import { Job } from "@/src/types";
import { Button } from "@/src/components/ui/Button";
import { Link } from "react-router-dom";

interface JobQuickViewProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  isSaving: boolean;
  onSave: (e: React.MouseEvent) => void;
  hasApplied: boolean;
  isApplying: boolean;
  onApply: (e: React.MouseEvent) => void;
}

export const JobQuickView: React.FC<JobQuickViewProps> = ({
  job,
  isOpen,
  onClose,
  isSaved,
  isSaving,
  onSave,
  hasApplied,
  isApplying,
  onApply
}) => {
  if (!job) return null;

  const isInternship = String(job.type).toLowerCase() === "internship";
  const companyInitials = job.company
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8 bg-slate-900/40 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-[32px] sm:rounded-[40px] w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] relative flex flex-col border border-white/20 mt-auto sm:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section */}
            <div className="relative p-8 md:p-12 border-b border-slate-100 bg-slate-50/30">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 hover:bg-slate-200/50 rounded-full transition-colors z-10"
                aria-label="Close job details"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>

              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="h-24 w-24 rounded-4xl overflow-hidden bg-white border border-slate-100 shadow-xl shadow-purple-500/5 shrink-0">
                  {job.logo ? (
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="h-full w-full object-contain p-4"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 text-2xl font-bold text-purple-700">
                      {companyInitials || "CO"}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-widest">
                      {job.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                      {job.type}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 leading-tight">
                    {job.title}
                  </h2>
                  <div className="flex items-center text-slate-500 font-medium">
                    <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                    <span className="text-lg">{job.company}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-6 md:p-8 bg-white rounded-3xl md:rounded-4xl border border-slate-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Salary Range</p>
                  <p className="text-base font-bold text-slate-900">{job.salary || "Competitive"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Location</p>
                  <p className="text-base font-bold text-slate-900">{job.location}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Job Type</p>
                  <p className="text-base font-bold text-slate-900">{job.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Date Posted</p>
                  <p className="text-base font-bold text-slate-900">{job.postedAt || "Recently"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-6">
                <h3 className="text-xl font-display font-bold text-slate-900 flex items-center">
                  <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                  Role Overview
                </h3>
                <div className="text-slate-600 leading-relaxed text-lg space-y-4">
                  {job.description.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center">
                    <Target className="h-6 w-6 mr-3 text-purple-600" />
                    Key Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.requirements.map((req, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 md:p-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/30">
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={onSave}
                  disabled={isSaving || isInternship}
                  className={`p-4 rounded-2xl transition-all duration-300 flex-1 sm:flex-none flex items-center justify-center ${
                    isInternship
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isSaved 
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-200" 
                      : "bg-white text-slate-400 border border-slate-200 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
                      <span className="ml-2 sm:hidden font-bold text-xs uppercase tracking-widest">
                        {isInternship ? "Save unsupported" : isSaved ? "Saved" : "Save Job"}
                      </span>
                    </>
                  )}
                </motion.button>
                <Link 
                  to={`/jobs/${job.id}`}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-colors flex-1 sm:flex-none text-center"
                >
                  Full Details
                </Link>
              </div>
              
              <Button 
                onClick={onApply}
                disabled={isApplying || hasApplied}
                className={`w-full sm:w-auto px-12 h-14 rounded-2xl font-bold text-base transition-all duration-500 group ${
                  hasApplied ? "bg-green-500 hover:bg-green-600" : ""
                }`}
              >
                {isApplying ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : hasApplied ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>Application Submitted</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Apply for this Position</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
