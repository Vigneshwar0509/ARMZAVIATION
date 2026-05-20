import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { Briefcase, MapPin, DollarSign, FileText, Send, Sparkles, Loader2, Eye, Edit2, Check, AlertCircle, Users, Clock, TrendingUp, Zap, Target, Award, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { apiService } from "@/src/services/api";

const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  company: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  salary: z.string().min(2, "Salary range is required"),
  category: z.string().min(2, "Category is required"),
  type: z.string().min(2, "Job type is required"),
  experience: z.string().min(1, "Experience level is required"),
  skills: z.string().min(5, "Skills are required"),
  description: z.string().min(20, "Description should be more detailed"),
  requirements: z.string().min(20, "Requirements are required"),
  benefits: z.string().optional(),
  applyMethod: z.string().min(1, "Apply method is required"),
  visibility: z.string().min(1, "Visibility is required"),
});

export default function PostJob() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [preview, setPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      visibility: "All Students",
      applyMethod: "Email",
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    const savedDraft = localStorage.getItem("postJobDraft");
    if (!savedDraft) {
      return;
    }

    try {
      reset({
        visibility: "All Students",
        applyMethod: "Email",
        ...JSON.parse(savedDraft),
      });
      setLastSavedTime(new Date());
    } catch {
      localStorage.removeItem("postJobDraft");
    }
  }, [reset]);

  const serializedValues = JSON.stringify(watchedValues);

  // Auto-save functionality
  useEffect(() => {
    const valuesToSave = JSON.parse(serializedValues);
    const autoSaveTimer = setTimeout(() => {
      if (valuesToSave && Object.keys(valuesToSave).length > 0 && Object.values(valuesToSave).some(v => v)) {
        setAutoSaveStatus('saving');
        // Simulate auto-save to local storage or backend
        setTimeout(() => {
          localStorage.setItem('postJobDraft', serializedValues);
          setAutoSaveStatus('saved');
          setLastSavedTime(new Date());
          // Clear saved status after 3 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }, 600);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [serializedValues]);

  const tabs = [
    { id: 0, label: "Job Details", icon: Briefcase },
    { id: 1, label: "Requirements", icon: Target },
    { id: 2, label: "Publishing", icon: Send },
  ];

  const benefits = [
    { label: "Highly Visible", value: "✓ Featured on homepage" },
    { label: "Quick Process", value: "✓ AI-assisted posting" },
    { label: "Bulk Reach", value: "✓ WhatsApp & Email blast" },
  ];

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        company_name: data.company,
        location: data.location,
        description: data.description,
        salary: data.salary,
        category: data.category,
        type: data.type,
        experience: data.experience,
        skills: data.skills
          ? data.skills
              .split(/[,\n;]/)
              .map((item: string) => item.replace(/^[\s\u2022\-]+/, "").trim())
              .filter(Boolean)
          : [],
        requirements: data.requirements
          .split("\n")
          .map((item: string) => item.replace(/^[\s\u2022\-]+/, "").trim())
          .filter(Boolean),
        responsibilities: data.benefits
          ? data.benefits
              .split("\n")
              .map((item: string) => item.replace(/^[\s\u2022\-]+/, "").trim())
              .filter(Boolean)
          : [],
        status: "Active",
      };

      await apiService.createJob(payload);
      toast.success("Job posted successfully!");
      reset();
      localStorage.removeItem("postJobDraft");
      setLastSavedTime(null);
      setAutoSaveStatus("idle");
      setActiveTab(0);
      navigate("/employer");
    } catch (error: any) {
      console.error('Failed to post job', error);
      toast.error(error?.message || 'Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900">Post a New Job</h1>
          <p className="text-slate-500 mt-2 text-sm">Share your opportunity with thousands of aviation professionals worldwide.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save Status Badge */}
          <motion.div
            animate={{ opacity: autoSaveStatus === 'idle' ? 0.5 : 1 }}
            className={cn(
              "px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
              autoSaveStatus === 'saving' && "bg-blue-50 border-blue-200 text-blue-700",
              autoSaveStatus === 'saved' && "bg-emerald-50 border-emerald-200 text-emerald-700",
              autoSaveStatus === 'idle' && "bg-slate-50 border-slate-200 text-slate-600"
            )}
          >
            {autoSaveStatus === 'saving' && (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-blue-300 border-t-blue-700 rounded-full" />
                Saving Draft...
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <Check className="h-3.5 w-3.5" />
                Draft Saved
              </>
            )}
            {autoSaveStatus === 'idle' && (
              <>
                <Clock className="h-3.5 w-3.5" />
                {lastSavedTime ? `Last saved ${Math.floor((Date.now() - lastSavedTime.getTime()) / 60000)}m ago` : 'Ready'}
              </>
            )}
          </motion.div>
          <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 flex items-center gap-2 w-fit">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">AI Assisted</span>
          </div>
        </div>
      </motion.div>

      {/* Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {benefits.map((benefit, idx) => (
          <div key={idx} className="glass-card p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 text-sm">{benefit.label}</p>
              <p className="text-xs text-slate-600">{benefit.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 border-b border-slate-200"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-purple-600 text-purple-600 bg-purple-50"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Tab 0: Job Details */}
        {activeTab === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl border border-slate-200 space-y-8"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-purple-600" />
                Job Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("title")}
                      className="pl-11"
                      placeholder="e.g. Senior Captain - A320"
                    />
                  </div>
                  {errors.title && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.title.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name *</label>
                  <Input
                    {...register("company")}
                    placeholder="e.g. Emirates Airlines"
                  />
                  {errors.company && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.company.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("location")}
                      className="pl-11"
                      placeholder="e.g. Dubai, UAE"
                    />
                  </div>
                  {errors.location && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.location.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salary Range *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...register("salary")}
                      className="pl-11"
                      placeholder="e.g. $15,000 - $20,000/month"
                    />
                  </div>
                  {errors.salary && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.salary.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                  <select
                    title="Select job category"
                    {...register("category")}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all"
                  >
                    <option value="">Select Category</option>
                    <option value="Commercial Aviation">Commercial Aviation</option>
                    <option value="MRO & Technical">MRO & Technical</option>
                    <option value="Ground Services">Ground Services</option>
                    <option value="Cabin Crew">Cabin Crew</option>
                  </select>
                  {errors.category && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.category.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Type *</label>
                  <select
                    title="Select job type"
                    {...register("type")}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all"
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                  {errors.type && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.type.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Level *</label>
                  <select
                    title="Select experience level"
                    {...register("experience")}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all"
                  >
                    <option value="">Select Level</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level (2-5 years)</option>
                    <option value="Senior">Senior (5+ years)</option>
                    <option value="Expert">Expert (10+ years)</option>
                  </select>
                  {errors.experience && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.experience.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Skills *</label>
                  <Input
                    {...register("skills")}
                    placeholder="e.g. Communication, Safety, A320 Type Rating"
                  />
                  {errors.skills && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.skills.message as string}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Description *</label>
              <textarea
                {...register("description")}
                title="Job description"
                placeholder="Describe the role, responsibilities, and what success looks like..."
                className="w-full h-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all resize-none"
              />
              {errors.description && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description.message as string}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Benefits & Perks</label>
              <textarea
                {...register("benefits")}
                title="Benefits"
                placeholder="e.g. Competitive salary, Health insurance, Free accommodation, Annual leave..."
                className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all resize-none"
              />
            </div>
          </motion.section>
        )}

        {/* Tab 1: Requirements */}
        {activeTab === 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl border border-slate-200 space-y-8"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Target className="h-5 w-5 text-purple-600" />
                Requirements & Qualifications
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requirements & Qualifications *</label>
                  <textarea
                    {...register("requirements")}
                    title="Requirements"
                    placeholder="List qualifications, certifications, licenses, and skills required...&#10;• Bachelor's degree or equivalent experience&#10;• ATPL or CPL certification&#10;• 3000+ flight hours&#10;• Current medical certificate"
                    className="w-full h-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all resize-none font-mono"
                  />
                  {errors.requirements && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.requirements.message as string}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6 p-6 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Ideal Candidate Profile
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                      <li>Team player with strong communication</li>
                      <li>Quality and safety-focused mindset</li>
                      <li>Ready to work in dynamic environment</li>
                      <li>Open to continuous learning</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      What We Offer
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                      <li>Competitive compensation package</li>
                      <li>Career advancement opportunities</li>
                      <li>Professional development programs</li>
                      <li>Supportive work culture</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Tab 2: Publishing */}
        {activeTab === 2 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl border border-slate-200 space-y-8"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Send className="h-5 w-5 text-purple-600" />
                Publishing & Distribution
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">How to Apply *</label>
                  <select
                    title="Select apply method"
                    {...register("applyMethod")}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all"
                  >
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Both">Both Email & WhatsApp</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visibility *</label>
                  <select
                    title="Select visibility"
                    {...register("visibility")}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-purple-300 outline-none transition-all"
                  >
                    <option value="All Students">All Students</option>
                    <option value="Premium Members Only">Premium Members Only</option>
                    <option value="Verified Only">Verified Profiles Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
              <h4 className="font-bold text-blue-900 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Distribution Details
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Posted on FlightDeck homepage for 30 days</li>
                <li>✓ Shared via WhatsApp broadcast to {watchedValues.visibility === "All Students" ? "5000+" : "2000+"} professionals</li>
                <li>✓ Email announcement to relevant candidates</li>
                <li>✓ Featured in weekly newsletter</li>
                <li>✓ Searchable in advanced job filters</li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
              <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Expected Reach & Outcomes
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-emerald-800 mt-3">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">500+</span>
                  <span>Average Views</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">50-100</span>
                  <span>Applications</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">30 days</span>
                  <span>Post Duration</span>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-3">
            {activeTab > 0 && (
              <Button
                type="button"
                onClick={() => setActiveTab(activeTab - 1)}
                className="px-6 py-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold"
              >
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {activeTab < tabs.length - 1 ? (
              <Button
                type="button"
                onClick={() => setActiveTab(activeTab + 1)}
                className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold"
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    reset();
                    setActiveTab(0);
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold"
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post Job
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
