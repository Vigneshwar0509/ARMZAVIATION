import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  FileText,
  Briefcase,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Phone,
  Calendar,
  Loader2
} from "lucide-react";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/Skeleton";
import toast from "react-hot-toast";

import { useApplications, useApplicationManagement } from "@/src/hooks/useQueries";

const statusFilterMap: Record<string, string | null> = {
  All: null,
  Pending: "Applied",
  Shortlisted: "Interview Scheduled",
  Interviewed: "Interview Scheduled",
  Hired: "Offer Extended",
  Rejected: "Rejected",
};

const statusUpdateMap: Record<string, string> = {
  Hired: "hired",
  Shortlisted: "shortlisted",
  Rejected: "rejected",
};

export default function ApplicantManagement() {
  const [filter, setFilter] = useState("All");
  const { data: applicants = [], isLoading } = useApplications(undefined, { enabled: true });
  const { updateStatus, isUpdating } = useApplicationManagement();
  const [searchQuery, setSearchQuery] = useState("");

  const handleAction = async (id: string, actionLabel: string) => {
    const status = statusUpdateMap[actionLabel];
    if (!status) return;

    try {
      await updateStatus({ id, status });
    } catch (error) {
      // Handled by mutation
    }
  };

  const filteredApplicants = applicants.filter((a: any) => {
    const mappedFilter = statusFilterMap[filter] ?? filter;
    const matchesFilter = filter === "All" || a.status === mappedFilter;
    const normalizedName = (a.name || a.userName || a.user_email || a.userEmail || "").toString().toLowerCase();
    const normalizedTitle = (a.job_details?.title || "").toString().toLowerCase();
    const matchesSearch = normalizedName.includes(searchQuery.toLowerCase()) || normalizedTitle.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportApplicants = () => {
    if (filteredApplicants.length === 0) {
      return;
    }

    const headers = ["Candidate", "Role", "Status", "Applied At", "Score"];
    const rows = filteredApplicants.map((applicant: any) => [
      applicant.name || applicant.userName || "Anonymous Candidate",
      applicant.job_details?.title || "",
      applicant.status || "",
      applicant.appliedAt ? new Date(applicant.appliedAt).toLocaleDateString() : "",
      applicant.score != null ? `${applicant.score}%` : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applicants-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEmailCandidate = (email?: string) => {
    if (!email) {
      toast.error("Candidate email not available.");
      return;
    }
    window.location.href = `mailto:${email}`;
  };

  const scoreWidthClass = (scoreValue: number) => {
    if (scoreValue <= 10) return "w-1/12";
    if (scoreValue <= 20) return "w-2/12";
    if (scoreValue <= 30) return "w-3/12";
    if (scoreValue <= 40) return "w-4/12";
    if (scoreValue <= 50) return "w-5/12";
    if (scoreValue <= 60) return "w-6/12";
    if (scoreValue <= 70) return "w-7/12";
    if (scoreValue <= 80) return "w-8/12";
    if (scoreValue <= 90) return "w-9/12";
    return "w-full";
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Applicant Management</h1>
          <p className="text-slate-500 mt-1">Review and manage candidates for your active job postings.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center space-x-2" onClick={exportApplicants}>
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            className="pl-12 h-14 rounded-2xl" 
            placeholder="Search by name, role or skills..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {["All", "Pending", "Shortlisted", "Interview Scheduled", "Hired", "Rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-100" 
                  : "bg-white text-slate-500 border border-slate-200 hover:border-purple-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Applicants List */}
      <div className="glass-card overflow-hidden rounded-4xl border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Candidate</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Role & Exp</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">AI Match</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6"><Skeleton className="h-12 w-48 rounded-xl" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-10 w-32 rounded-xl" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-16 mx-auto rounded-xl" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-xl" /></td>
                    <td className="px-8 py-6"></td>
                  </tr>
                ))
              ) : filteredApplicants.map((applicant: any) => (
                <tr key={applicant.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-4 sm:px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                        {(applicant.name || applicant.userName || applicant.job_details?.title || "A")[0] || "A"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{applicant.name || applicant.userName || "Anonymous Candidate"}</h4>
                        <p className="text-xs text-slate-500">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6 whitespace-nowrap">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700">{applicant.job_details?.title || "Aviation Role"}</h4>
                      <p className="text-xs text-slate-500">{applicant.experience || "5+"} Years Exp</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "text-sm font-bold",
                        (applicant.score || 85) >= 80 ? "text-green-600" : (applicant.score || 85) >= 60 ? "text-orange-600" : "text-red-600"
                      )}>
                        {applicant.score || 85}%
                      </span>
                      <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            scoreWidthClass(applicant.score || 85),
                            (applicant.score || 85) >= 80 ? "bg-green-500" : (applicant.score || 85) >= 60 ? "bg-orange-500" : "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6 whitespace-nowrap">
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                      applicant.status === "Offer Extended" ? "bg-emerald-100 text-emerald-700" :
                      applicant.status === "Interview Scheduled" ? "bg-blue-100 text-blue-700" :
                      applicant.status === "Rejected" ? "bg-red-100 text-red-700" :
                      applicant.status === "Applied" ? "bg-slate-100 text-slate-600" :
                      applicant.status === "Under Review" ? "bg-slate-100 text-slate-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {applicant.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {applicant.status !== "Offer Extended" && (
                        <button 
                          onClick={() => handleAction(applicant.id, "Hired")}
                          disabled={isUpdating}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                          title="Hire Candidate"
                        >
                          <TrendingUp className="h-5 w-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleAction(applicant.id, "Shortlisted")}
                        disabled={isUpdating}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Shortlist"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleAction(applicant.id, "Rejected")}
                        disabled={isUpdating}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Reject"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleEmailCandidate(applicant.userEmail || applicant.user_email)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" 
                        title="Email Candidate"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
