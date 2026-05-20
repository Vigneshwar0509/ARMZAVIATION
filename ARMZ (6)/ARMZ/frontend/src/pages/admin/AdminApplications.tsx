import { useState, useMemo } from "react";
import {
  Search,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Download,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useApplications, useApplicationManagement } from "@/src/hooks/useQueries";
import SEO from "@/src/components/common/SEO";
import EmptyState from "@/src/components/common/EmptyState";
import { cn } from "@/src/lib/utils";
import toast from "react-hot-toast";

const statusOptions = [
  "All",
  "Applied",
  "Under Review",
  "Interview Scheduled",
  "Offer Extended",
  "Rejected",
];

// Map display names to backend status values
const displayStatusToBackendStatus: Record<string, string> = {
  "Applied": "pending",
  "Under Review": "reviewed",
  "Interview Scheduled": "interview_scheduled",
  "Offer Extended": "offer_extended",
  "Rejected": "rejected",
};

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

export default function AdminApplications() {
  const { data: applications = [], isLoading, isError, error, refetch } = useApplications(undefined, {
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { updateStatus } = useApplicationManagement();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleExport = () => {
    if (filteredApplications.length === 0) {
      toast.error("No applications to export");
      return;
    }

    const headers = [
      "Candidate",
      "Email",
      "Phone",
      "Opportunity",
      "Company",
      "Location",
      "Type",
      "Status",
      "Applied At",
    ];

    const rows = filteredApplications.map((app: any) => [
      app.userName || "",
      app.userEmail || "",
      app.userPhone || "",
      app.job_details?.title || `Job #${app.jobId}`,
      app.job_details?.company || "",
      app.job_details?.location || "",
      app.applicationType || "Job",
      app.status || "",
      app.appliedAt ? new Date(app.appliedAt).toISOString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `admin-applications-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Applications exported");
  };

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app: any) => {
        const query = searchQuery.toLowerCase().trim();
        const matchText = [
          app.job_details?.title || '',
          app.job_details?.company || '',
          app.userName || '',
          app.userEmail || '',
          app.userPhone || '',
          String(app.jobId || ''),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || matchText.includes(query);
        const matchesStatus = statusFilter === "All" || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "newest") {
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        }
        return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      });
  }, [applications, searchQuery, statusFilter, sortBy]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const backendStatus = displayStatusToBackendStatus[status] || status;
      await updateStatus({ id, status: backendStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <SEO title="Admin Applications" description="Review student applications across the platform." />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 mt-1">View all student job applications and track application progress from the admin panel.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2" onClick={() => refetch()}>
            <ArrowRight className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl border border-slate-200 p-6">
          <p className="text-sm uppercase tracking-widest text-slate-400">Total Applications</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{applications.length}</p>
        </div>
        <div className="glass-card rounded-3xl border border-slate-200 p-6">
          <p className="text-sm uppercase tracking-widest text-slate-400">Under Review</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{applications.filter((app: any) => app.status === "Under Review").length}</p>
        </div>
        <div className="glass-card rounded-3xl border border-slate-200 p-6">
          <p className="text-sm uppercase tracking-widest text-slate-400">Interviews</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{applications.filter((app: any) => app.status === "Interview Scheduled").length}</p>
        </div>
        <div className="glass-card rounded-3xl border border-slate-200 p-6">
          <p className="text-sm uppercase tracking-widest text-slate-400">Offers</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{applications.filter((app: any) => app.status === "Offer Extended").length}</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by student, job title, company, or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 rounded-2xl"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:border-purple-500"
              >
                {statusOptions.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:border-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-card p-6 rounded-3xl">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="glass-card rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-red-800">Unable to load applications</h2>
          <p className="mt-2 text-sm text-red-700">
            {(error as any)?.message || 'Please sign in again or refresh the page.'}
          </p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={searchQuery || statusFilter !== "All" ? "No matching applications" : "No applications found"}
          description={
            searchQuery || statusFilter !== "All"
              ? "Try updating your search or filter to find applications."
              : "There are no applications available yet."
          }
          actionLabel="View Jobs"
          actionPath="/admin/jobs"
        />
      ) : (
        <div className="glass-card overflow-hidden rounded-4xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Candidate</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Opportunity</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Company</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Location</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Type</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Applied</th>
                  <th className="px-4 py-4 text-xs uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app: any) => {
                  const StatusIcon = getStatusIcon(app.status);
                  const jobTitle = app.job_details?.title || `Job #${app.jobId}`;
                  const company = app.job_details?.company || "Unknown Company";
                  const location = app.job_details?.location || "Not specified";
                  
                  return (
                    <tr key={app.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-5 align-top">
                        <div className="font-semibold text-slate-900">{app.userName || "Student"}</div>
                        <div className="text-xs text-slate-500">ID {app.userId}</div>
                        {app.userEmail && <div className="text-xs text-slate-500">{app.userEmail}</div>}
                        {app.userPhone && <div className="text-xs text-slate-500">{app.userPhone}</div>}
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className="font-semibold text-slate-900">{jobTitle}</div>
                        <div className="text-xs text-slate-500">Ref {app.jobId}</div>
                      </td>
                      <td className="px-4 py-5 align-top text-slate-700">{company}</td>
                      <td className="px-4 py-5 align-top text-slate-700 text-sm">{location}</td>
                      <td className="px-4 py-5 align-top text-slate-700 uppercase text-xs font-semibold tracking-[0.18em] text-slate-500">
                        {app.applicationType || "Job"}
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", getStatusColor(app.status))}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{app.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {new Date(app.appliedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-500">{new Date(app.appliedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className="flex items-center gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            disabled={updatingId === app.id}
                            className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-purple-300 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {statusOptions.map((option) => (
                              <option value={option} key={option}>{option}</option>
                            ))}
                          </select>
                          {updatingId === app.id && <div className="animate-spin"><Activity className="h-4 w-4 text-purple-600" /></div>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
