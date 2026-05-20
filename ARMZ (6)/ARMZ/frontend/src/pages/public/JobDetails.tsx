import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiService } from "@/src/services/api";
import { Job } from "@/src/types";
import { useAuthStore } from "@/src/store/authStore";
import { useJobStore } from "@/src/store/jobStore";
import { useApplications, useSavedJobs } from "@/src/hooks/useQueries";
import { 
  Building2, 
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle2
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import SEO from "@/src/components/common/SEO";
import { JobApplyModal } from "@/src/components/jobs/JobApplyModal";
import toast from "react-hot-toast";

export default function JobDetails() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const { saveJob, removeJob, isJobSaved, setSavedJobs, clearSavedJobs } = useJobStore();

  const { user } = useAuthStore();
  const { data: applications = [] } = useApplications(user?.id);
  const { data: savedJobs = [] } = useSavedJobs(user?.id);
  const isSaved = id ? isJobSaved(String(id)) : false;
  const isInternship = job?.type?.toLowerCase() === "internship";

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await apiService.getJobById(id);
        if (!response.data) {
          throw new Error('Job not found');
        }
        setJob(response.data);
      } catch (error) {
        console.error("Failed to fetch job details:", error);
        toast.error("Failed to load job details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!user) {
      clearSavedJobs();
      return;
    }
    setSavedJobs(savedJobs.map((job: any) => String(job.id)));
  }, [savedJobs, user]);

  useEffect(() => {
    if (!job) {
      setIsApplied(false);
      return;
    }
    const type = String(job.type).toLowerCase() === 'internship' ? 'Internship' : 'Job';
    setIsApplied(
      applications.some((app: any) =>
        app.applicationType === type && String(app.jobId) === String(job.id)
      )
    );
  }, [applications, job?.id, job?.type]);

  const handleApplyClick = () => {
    if (!user) {
      toast.error("Please login to apply for this job.");
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySuccess = () => {
    setIsApplied(true);
  };

  const handleSave = async () => {
    if (isInternship) {
      toast.error("Saving internships is not supported yet.");
      return;
    }

    if (!id || !user) return;
    const stringId = String(id);
    try {
      if (isSaved) {
        await apiService.removeSavedJob(stringId, user.id);
        removeJob(stringId);
        toast.success("Job removed from saved");
      } else {
        await apiService.saveJob(stringId, user.id);
        saveJob(stringId);
        toast.success("Job saved successfully!");
      }
    } catch (error) {
      toast.error("Unable to update saved jobs.");
      console.error("Save job detail failed:", error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const companyInitials = job?.company
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SEO title="Loading Job Details" />
        <div className="space-y-4">
          <div className="h-8 w-48 mx-auto bg-slate-100 rounded-full animate-pulse" />
          <p className="text-slate-500">Loading job details, please wait...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SEO title="Job Not Found" />
        <h2 className="text-2xl font-bold">Job not found</h2>
        <Link to="/jobs" className="text-purple-600 hover:underline mt-4 inline-block">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <SEO title={job ? `${job.title} at ${job.company}` : "Job Details"} description={job?.description} />
      <Link to="/jobs" className="flex items-center text-slate-400 hover:text-[#6b21a8] mb-12 transition-colors group font-mono text-[10px] uppercase tracking-[0.2em]">
        <ArrowLeft className="h-3 w-3 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-3xl">
            {isLoading ? (
              <div className="space-y-8">
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                  <div className="space-y-3 grow">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-6 bg-slate-50 rounded-2xl">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white border border-purple-50 shadow-sm">
                      {job.logo ? (
                        <img
                          src={job.logo}
                          alt={job.company}
                          className="h-full w-full object-contain p-3"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-50 to-indigo-50 text-lg font-bold text-purple-700">
                          {companyInitials || "CO"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-purple-900">{job.title}</h1>
                      <div className="flex items-center text-slate-400 mt-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                        <Building2 className="h-3 w-3 mr-2 text-[#d4af37]" />
                        <span>{job.company}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSave}
                      disabled={isInternship}
                      className={`premium-button-outline px-6 py-2 text-[10px] transition-all active:scale-95 ${isSaved ? "bg-indigo-50 border-indigo-200 text-indigo-600" : ""} ${isInternship ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="flex items-center">
                        <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} /> 
                        {isInternship ? "Save unavailable" : isSaved ? "Saved" : "Save"}
                      </span>
                    </button>
                    <button 
                      onClick={handleShare}
                      className="premium-button-outline px-6 py-2 text-[10px] active:scale-95"
                    >
                      <span className="flex items-center">
                        <Share2 className="h-4 w-4 mr-2" /> Share
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-brand-50/30 rounded-4xl border border-purple-50">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-300 uppercase font-mono tracking-widest">Salary</p>
                    <p className="text-sm font-bold text-[#6b21a8]">{job.salary}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-300 uppercase font-mono tracking-widest">Location</p>
                    <p className="text-sm font-bold text-[#6b21a8]">{job.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-300 uppercase font-mono tracking-widest">Job Type</p>
                    <p className="text-sm font-bold text-[#6b21a8]">{job.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-300 uppercase font-mono tracking-widest">Posted</p>
                    <p className="text-sm font-bold text-[#6b21a8]">{job.postedAt}</p>
                  </div>
                </div>

                <div className="mt-12 space-y-8">
                  <h3 className="text-2xl font-display font-bold text-purple-900">Job Description</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {job.description}
                  </p>
                  
                  {job.requirements && (
                    <>
                      <h3 className="text-2xl font-display font-bold text-purple-900">Requirements</h3>
                      <ul className="space-y-4">
                        {job.requirements.map((item, i) => (
                          <li key={i} className="flex items-start space-x-4 text-slate-500">
                            <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {job.responsibilities && (
                    <>
                      <h3 className="text-2xl font-display font-bold text-purple-900">Responsibilities</h3>
                      <ul className="space-y-4">
                        {job.responsibilities.map((item, i) => (
                          <li key={i} className="flex items-start space-x-4 text-slate-500">
                            <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-4xl border-purple-50 shadow-2xl shadow-purple-100/20">
            <h3 className="text-xl font-display font-bold text-purple-900 mb-8">Apply for this position</h3>
            <div className="space-y-6">
              <button 
                className={`w-full h-14 flex items-center justify-center rounded-full font-bold text-lg transition-all shadow-xl uppercase tracking-widest active:scale-95 ${
                  isLoading
                    ? "bg-slate-300 text-slate-700 cursor-not-allowed"
                    : isInternship
                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                    : isApplied 
                    ? "bg-green-500 text-white cursor-default" 
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100"
                }`} 
                disabled={isLoading || isApplied || isInternship}
                onClick={handleApplyClick}
              >
                {isLoading ? "Loading..." : isApplied ? "Applied Successfully" : "Apply Now"}
              </button>
              
              <p className="text-[10px] text-center text-slate-300 font-mono uppercase tracking-widest">
                By clicking apply, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <h3 className="text-lg font-bold mb-6">About the Company</h3>
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-slate-100">
                    {job.logo ? (
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="h-full w-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-50 to-indigo-50 text-xs font-bold text-purple-700">
                        {companyInitials || "CO"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold">{job.company}</h4>
                    <p className="text-xs text-slate-500">Aviation & Aerospace</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  Company profile information is not available for this listing yet.
                </p>
                <button 
                  className="premium-button-outline w-full py-3 text-[10px] active:scale-95"
                >
                  View Company Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <JobApplyModal
        job={job}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
