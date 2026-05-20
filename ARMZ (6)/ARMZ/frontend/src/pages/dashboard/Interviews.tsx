import React, { useState, useMemo } from "react";
import { Calendar, Clock, Video, MapPin, User, Phone, MessageSquare, CheckCircle2, AlertCircle, GraduationCap, Zap, BookOpen, Eye, EyeOff, Send, FileText, Award, TrendingUp, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/src/lib/utils";
import { useApplications } from "@/src/hooks/useQueries";
import { useAuthStore } from "@/src/store/authStore";

export default function Interviews() {
  const { user } = useAuthStore();
  const { data: applications = [], isLoading } = useApplications(user?.id ? String(user.id) : undefined, {
    enabled: Boolean(user?.id),
  });

  const [rescheduling, setRescheduling] = useState<number | null>(null);
  const [joinLoading, setJoinLoading] = useState<number | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const interviewApplications = useMemo(
    () => applications.filter((app: any) => {
      const status = String(app.status || app.statusLabel || "").toLowerCase();
      return status === "interview scheduled" || status === "shortlisted";
    }),
    [applications]
  );

  const upcomingInterviews = interviewApplications.map((app: any, idx: number) => ({
    id: Number(app.id) || idx,
    title: app.job_details?.title || "Interview Scheduled",
    company: app.job_details?.company || "Your Company",
    companyLogo: (app.job_details?.company || "").charAt(0) || "✈️",
    date: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "TBA",
    time: app.appliedAt ? new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBA",
    daysLeft: app.appliedAt ? Math.max(0, Math.ceil((new Date(app.appliedAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
    type: "Virtual",
    interviewer: "Recruitment Team",
    role: app.job_details?.title || "Candidate Interview",
    meetingLink: app.meetingLink || "",
    phone: app.userEmail || app.user_email || "",
    status: app.status,
    description: app.job_details?.title ? `Interview scheduled for ${app.job_details.title}` : "Interview scheduled.",
    duration: "60 mins",
    difficulty: "Intermediate",
  }));

  const completedInterviews = applications
    .filter((app: any) => app.status === "Offer Extended")
    .map((app: any, idx: number) => ({
      id: Number(app.id) || idx,
      title: app.job_details?.title || "Offer Extended",
      company: app.job_details?.company || "Your Company",
      date: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "TBA",
      type: "Virtual",
      status: app.status,
      result: "Offer Received",
      feedback: app.job_details?.company ? `Offer from ${app.job_details.company}` : "Offer extended.",
    }));

  const stats = [
    { label: "Upcoming", value: String(upcomingInterviews.length), color: "from-blue-600 to-cyan-600", icon: Calendar },
    { label: "Offers", value: String(completedInterviews.length), color: "from-emerald-600 to-teal-600", icon: CheckCircle2 },
    { label: "Success Rate", value: upcomingInterviews.length ? `${Math.round((completedInterviews.length / upcomingInterviews.length) * 100)}%` : "0%", color: "from-purple-600 to-pink-600", icon: TrendingUp },
  ];

  const handleJoinMeeting = async (interview: any) => {
    if (interview.type === "Virtual" && interview.meetingLink) {
      setJoinLoading(interview.id);
      setTimeout(() => {
        window.open(interview.meetingLink, "_blank");
        toast.success("Opening meeting link...");
        setJoinLoading(null);
      }, 800);
    } else {
      toast("Meeting details will be shared closer to the date");
    }
  };

  const handleReschedule = (interviewId: number) => {
    setRescheduling(interviewId);
    toast.success("Reschedule request sent to HR");
    setTimeout(() => setRescheduling(null), 2000);
  };

  const handleCallInterviewer = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleSaveNotes = (interviewId: number) => {
    toast.success("Notes saved successfully!");
  };

  const handleCancelInterview = (interviewId: number) => {
    setShowCancelConfirm(interviewId);
  };

  const confirmCancelInterview = async () => {
    if (showCancelConfirm === null) return;
    setIsCanceling(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Interview cancelled successfully");
      setShowCancelConfirm(null);
    } catch (error) {
      toast.error("Failed to cancel interview");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-slate-100">Interview Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Manage your upcoming interviews, preparation, and track your progress.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] font-semibold text-slate-500 dark:text-slate-400 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.color} text-white`}> 
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Upcoming Interviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-500" />
          Upcoming Interviews
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {upcomingInterviews.map((interview, idx) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{interview.companyLogo}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{interview.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{interview.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">{interview.daysLeft}</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">days left</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200 text-xs font-semibold uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {interview.status}
                </span>
                <span className={cn(
                  "px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] rounded-full",
                  interview.type === "Virtual"
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200"
                    : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200"
                )}>
                  {interview.type}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-200">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Date & Time</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{interview.date} at {interview.time}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Duration</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{interview.duration}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Interviewer</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{interview.interviewer}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Difficulty</p>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{interview.difficulty}</span>
                  </div>
                </div>
                {interview.type === "Virtual" && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Meeting Link</p>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-slate-400" />
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 truncate">
                        Join Meeting
                      </a>
                    </div>
                  </div>
                )}
                {interview.type === "In-Person" && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-900">{interview.location}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400">{interview.description}</p>

              {/* Interview Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preparation Notes</label>
                <textarea
                  placeholder="Add notes about this interview..."
                  title="Interview notes"
                  value={notes[interview.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [interview.id]: e.target.value })}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-purple-300 outline-none transition-all text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {interview.type === "Virtual" ? (
                  <Button
                    onClick={() => handleJoinMeeting(interview)}
                    disabled={joinLoading === interview.id}
                    className="px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {joinLoading === interview.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Join Meeting
                      </>
                    )}
                  </Button>
                ) : (
                  <Button className="px-4 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    View Location
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => handleReschedule(interview.id)}
                  disabled={rescheduling === interview.id}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-sm"
                >
                  {rescheduling === interview.id ? "Requesting..." : "Reschedule"}
                </Button>
                <Button
                  onClick={() => handleCancelInterview(interview.id)}
                  className="px-4 py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel
                </Button>
              </div>

              {/* Contact Options */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => handleCallInterviewer(interview.phone)}
                  className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toast.success("Opening message app...")}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              </div>

              {/* Save Notes */}
              <Button
                variant="ghost"
                onClick={() => handleSaveNotes(interview.id)}
                className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Save Interview Notes
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Interview Preparation Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-10 rounded-4xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900/90"
      >
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-cyan-600" />
          Interview Preparation Tips
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-slate-800 dark:border-slate-700">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Technical Preparation
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Review core technical concepts relevant to the role</li>
              <li>Practice common aviation industry scenarios</li>
              <li>Study company-specific procedures and standards</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-slate-800 dark:border-slate-700">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Behavioral Preparation
            </h4>
            <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1 list-disc list-inside">
              <li>Prepare STAR method responses for common questions</li>
              <li>Research the company and interviewer background</li>
              <li>Prepare thoughtful questions to ask interviewers</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Completed Interviews */}
      {completedInterviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Completed Interviews
          </h2>

          <div className="space-y-4">
            {completedInterviews.map((interview) => (
              <div key={interview.id} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{interview.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{interview.company} • {interview.date}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200 text-xs font-bold rounded-full">
                    {interview.result}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">Feedback: {interview.feedback}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cancel Interview Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isCanceling && setShowCancelConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6"
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cancel Interview?</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  {upcomingInterviews.find(i => i.id === showCancelConfirm)?.company} - {upcomingInterviews.find(i => i.id === showCancelConfirm)?.title}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200"><strong>Warning:</strong> Cancelling this interview will notify the employer. This action may affect your candidacy.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  disabled={isCanceling}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 rounded-lg font-semibold transition"
                >
                  Keep Interview
                </button>
                <button
                  onClick={confirmCancelInterview}
                  disabled={isCanceling}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {isCanceling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Cancel Interview</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
