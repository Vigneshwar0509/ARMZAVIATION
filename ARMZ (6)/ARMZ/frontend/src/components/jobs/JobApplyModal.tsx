import { useState, useEffect } from "react";
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle, User, Mail, Phone, Briefcase, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Job } from "@/src/types";
import { useAuthStore } from "@/src/store/authStore";
import { useApplicationActions } from "@/src/hooks/useQueries";
import { useLeadCapture } from "@/src/hooks/useLeadCapture";
import toast from "react-hot-toast";
import { hasActiveSubscription } from "@/src/lib/subscription";

const applySchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  experience: z.string().min(1, "Please select your experience level"),
  coverLetter: z.string().min(50, "Cover letter must be at least 50 characters"),
  resumeConfirm: z.boolean().refine(val => val === true, {
    message: "Please confirm you have uploaded your resume"
  })
});

type ApplyFormValues = z.infer<typeof applySchema>;

interface JobApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JobApplyModal({ job, isOpen, onClose, onSuccess }: JobApplyModalProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { captureJobApplyLead } = useLeadCapture();
  const { apply } = useApplicationActions();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: "",
      experience: "",
      coverLetter: "",
      resumeConfirm: false,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSuccess(false);
      reset({
        fullName: user?.name || "",
        email: user?.email || "",
        phone: "",
        experience: "",
        coverLetter: "",
        resumeConfirm: false,
      });
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: ApplyFormValues) => {
    if (!job || !user) return;
    
    // Check subscription
    if (!hasActiveSubscription(user)) {
      captureJobApplyLead(job.title, job.company);
      toast('Please subscribe to apply for jobs', {
        icon: <Lock className="h-5 w-5 text-orange-600" />,
      });
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apply({ id: String(job.id), userId: user.id, type: job.type });
      
      // Capture lead for successful application
      captureJobApplyLead(job.title, job.company);
      
      setIsSuccess(true);
      setStep(3);
      onSuccess();
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  if (!isOpen || !job) return null;

  const experienceLevels = [
    { value: "0-1", label: "0-1 Years (Fresher)" },
    { value: "1-3", label: "1-3 Years" },
    { value: "3-5", label: "3-5 Years" },
    { value: "5-10", label: "5-10 Years" },
    { value: "10+", label: "10+ Years" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-4xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Apply for Position</h2>
              <p className="text-sm text-slate-500">{job.title} at {job.company}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close application modal"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Progress Steps */}
          {!isSuccess && (
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between mb-8">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      step >= s ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                    </div>
                    <span className={cn(
                      "ml-3 text-xs font-bold uppercase tracking-widest",
                      step >= s ? "text-purple-600" : "text-slate-400"
                    )}>
                      {s === 1 ? "Personal Info" : "Application"}
                    </span>
                    {s < 2 && (
                      <div className={cn(
                        "flex-1 h-1 mx-4 rounded-full",
                        step > s ? "bg-purple-600" : "bg-slate-100"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-6"
              >
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Application Submitted!</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Your application for {job.title} at {job.company} has been successfully submitted. 
                    The employer will review your profile and get back to you soon.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <button
                    onClick={onClose}
                    className="premium-button-primary px-8 py-3"
                  >
                    Done
                  </button>
                  <p className="text-xs text-slate-400">
                    You can track your application status in your dashboard.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          className={cn(
                            "w-full h-14 pl-14 pr-6 bg-slate-50 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all",
                            errors.fullName ? "border-red-300" : "border-slate-200"
                          )}
                          {...register("fullName")}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-red-500 ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="email"
                          placeholder="john@example.com"
                          className={cn(
                            "w-full h-14 pl-14 pr-6 bg-slate-50 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all",
                            errors.email ? "border-red-300" : "border-slate-200"
                          )}
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-500 ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          className={cn(
                            "w-full h-14 pl-14 pr-6 bg-slate-50 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all",
                            errors.phone ? "border-red-300" : "border-slate-200"
                          )}
                          {...register("phone")}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-red-500 ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                    <label htmlFor="experienceLevel" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Experience Level <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <select
                          id="experienceLevel"
                          aria-label="Experience level"
                          className={cn(
                            "w-full h-14 pl-14 pr-6 bg-slate-50 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all appearance-none",
                            errors.experience ? "border-red-300" : "border-slate-200"
                          )}
                          {...register("experience")}
                        >
                          <option value="">Select experience level</option>
                          {experienceLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.experience && (
                        <p className="text-xs text-red-500 ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.experience.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="premium-button-primary w-full h-14"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Cover Letter <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Tell us why you're a great fit for this role..."
                        className={cn(
                          "w-full p-6 bg-slate-50 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all resize-none",
                          errors.coverLetter ? "border-red-300" : "border-slate-200"
                        )}
                        {...register("coverLetter")}
                      />
                      {errors.coverLetter && (
                        <p className="text-xs text-red-500 ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.coverLetter.message}
                        </p>
                      )}
                    </div>

                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">Resume</p>
                          <p className="text-xs text-slate-500">Your profile resume will be attached</p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload New</span>
                        </button>
                      </div>
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="resumeConfirm"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          {...register("resumeConfirm")}
                        />
                        <label htmlFor="resumeConfirm" className="text-sm text-slate-600">
                          I confirm my resume is up-to-date and I want to submit it with this application
                        </label>
                      </div>
                      {errors.resumeConfirm && (
                        <p className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.resumeConfirm.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 h-14 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 premium-button-primary h-14 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Submitting...
                          </span>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

