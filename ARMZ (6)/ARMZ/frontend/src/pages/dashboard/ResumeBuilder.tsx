import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResumeStore } from "@/src/store/resumeStore";
import { useAuthStore } from "@/src/store/authStore";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { apiService } from "@/src/services/api";
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Loader2, 
  Layout, 
  Palette, 
  Globe, 
  Linkedin, 
  Github, 
  Award, 
  Languages as LangIcon,
  Briefcase,
  GraduationCap,
  User,
  Settings2,
  ChevronDown,
  ChevronUp,
  Download,
  Plane,
  Clock,
  Stethoscope,
  Type,
  Target,
  Trophy,
  Cpu,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import ResumePreview from "./ResumePreview";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { cn } from "@/src/lib/utils";

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Invalid phone number"),
  location: z.string().min(2, "Location is required"),
  summary: z.string().min(10, "Summary should be more descriptive"),
  title: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

const templates = [
  { id: "modern", name: "Modern Professional", description: "Subtle colors, icons, section highlights" },
  { id: "professional", name: "Corporate ATS", description: "Clean, minimal, black & white" },
  { id: "creative", name: "Creative Premium", description: "Stylish layout, strong visual hierarchy" },
  { id: "minimalist", name: "Minimalist", description: "Simple and elegant, focusing on content" },
  { id: "executive", name: "Executive", description: "Sophisticated layout for senior positions" },
];

const themeColors = [
  { name: "Purple", value: "#9333ea" },
  { name: "Blue", value: "#2563eb" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#e11d48" },
  { name: "Slate", value: "#475569" },
  { name: "Amber", value: "#d97706" },
];

const fontFamilies = [
  { name: "Inter", value: "Inter" },
  { name: "Serif", value: "Playfair Display" },
  { name: "Mono", value: "JetBrains Mono" },
  { name: "Outfit", value: "Outfit" },
  { name: "Space", value: "Space Grotesk" },
];

const fontPreviewClass: Record<string, string> = {
  Inter: "font-sans",
  "Playfair Display": "font-serif",
  "JetBrains Mono": "font-mono",
  Outfit: "font-display",
  "Space Grotesk": "font-sans",
};

const colorSwatchClass: Record<string, string> = {
  "#9333ea": "bg-purple-600",
  "#2563eb": "bg-blue-600",
  "#059669": "bg-emerald-600",
  "#e11d48": "bg-rose-600",
  "#475569": "bg-slate-600",
  "#d97706": "bg-amber-600",
};

export default function ResumeBuilder() {
  const { 
    data, 
    updatePersonalInfo, 
    addExperience, 
    removeExperience, 
    updateExperience,
    addEducation, 
    removeEducation, 
    updateEducation,
    addSkill, 
    removeSkill,
    addProject,
    removeProject,
    updateProject,
    addCertification,
    updateCertification,
    removeCertification,
    addLanguage,
    updateLanguage,
    removeLanguage,
    updateAviationData,
    setTemplate,
    setThemeColor,
    setFontFamily,
    setTargetRole,
    addAchievement,
    removeAchievement,
    addTool,
    removeTool,
    setFullData
  } = useResumeStore();
  const { user } = useAuthStore();

  const [isSavingResume, setIsSavingResume] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [showTemplates, setShowTemplates] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data.personalInfo,
  });

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updatePersonalInfo({ [e.target.name]: e.target.value });
  };

  const calculateProfileCompletion = () => {
    const completionChecks = [
      data.personalInfo.fullName,
      data.personalInfo.email,
      data.personalInfo.phone,
      data.personalInfo.location,
      data.personalInfo.summary,
      data.experience.length > 0,
      data.education.length > 0,
      data.skills.length > 0,
      data.projects.length > 0,
      data.certifications.length > 0,
      data.languages.length > 0,
      data.achievements.length > 0,
      data.tools.length > 0,
    ];

    return Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);
  };

  const handleSaveResume = async () => {
    if (!user?.email) {
      toast.error("Please login to save your resume");
      return;
    }

    setIsSavingResume(true);
    try {
      const response = await apiService.getStudents();
      const students = response.data || [];
      const normalizedEmail = user.email.toLowerCase();
      const existingStudent = students.find((student: any) => String(student.email || "").toLowerCase() === normalizedEmail);
      const nameParts = String(data.personalInfo.fullName || user.name || "Student").trim().split(/\s+/);
      const firstName = nameParts.shift() || user.first_name || user.name || "Student";
      const lastName = nameParts.join(" ");
      const profileCompletion = calculateProfileCompletion();
      const savedResume = {
        ...data,
        savedAt: new Date().toISOString(),
        savedBy: user.email,
      };

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: data.personalInfo.email || user.email,
        phone: data.personalInfo.phone || user.phone || "",
        institution: existingStudent?.institution || "",
        major: existingStudent?.major || data.targetRole || "",
        enrollment_date: existingStudent?.enrollment_date || new Date().toISOString().slice(0, 10),
        status: existingStudent?.status || "Active",
        courses: Number(existingStudent?.courses || 0),
        assessments: Number(existingStudent?.assessments || 0),
        profile_completion: profileCompletion,
        location: data.personalInfo.location || "",
        gpa: existingStudent?.gpa || "",
        resume_data: savedResume,
      };

      if (existingStudent?.id) {
        await apiService.updateStudent(String(existingStudent.id), payload);
      } else {
        await apiService.createStudent(payload);
      }

      setLastSavedAt(new Date().toISOString());
      toast.success("Resume saved to your student profile");
    } catch (error) {
      console.error("Failed to save resume:", error);
      toast.error("Unable to save resume right now");
    } finally {
      setIsSavingResume(false);
    }
  };


  const SectionHeader = ({ id, title, icon: Icon, count }: { id: string, title: string, icon: any, count?: number }) => (
    <button
      onClick={() => setActiveSection(activeSection === id ? "" : id)}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl transition-all mb-2",
        activeSection === id ? "bg-purple-600 text-white shadow-lg" : "bg-white/50 hover:bg-white text-slate-700 border border-white/40"
      )}
    >
      <div className="flex items-center">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mr-3",
          activeSection === id ? "bg-white/20" : "bg-purple-100 text-purple-600"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-bold uppercase tracking-widest text-[10px]">{title}</span>
        {count !== undefined && (
          <span className={cn(
            "ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold",
            activeSection === id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          )}>
            {count}
          </span>
        )}
      </div>
      {activeSection === id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );

  return (
    <>
      <div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 border border-slate-200 shadow-lg shadow-slate-100 bg-white/95">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-600 mb-3">Resume Builder</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Build a polished resume in minutes</h1>
            <p className="text-sm text-slate-500 leading-7">A professional builder experience with smart guidance, clean sections, and export-ready formatting.</p>
            {lastSavedAt && (
              <p className="mt-3 text-xs font-semibold text-emerald-600">
                Saved to your profile at {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button className="w-full sm:w-auto premium-button-primary py-4" onClick={handleSaveResume} disabled={isSavingResume}>
              {isSavingResume ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSavingResume ? "Saving..." : "Save Resume"}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-600 py-4" onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 pb-20 print:block print:p-0">
        {/* Left Sidebar - Controls */}
        <div className="w-full xl:w-80 space-y-4 print:hidden">
          <div className="rounded-2xl sm:rounded-3xl sticky top-28 border border-slate-200 bg-slate-50/80 shadow-sm p-4 sm:p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Customization</h3>
            <div className="space-y-6">
              <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Template</label>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                      "flex items-center p-3 rounded-xl border transition-all text-left",
                      data.template === t.id 
                        ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600" 
                        : "border-slate-100 bg-slate-50/50 hover:border-purple-200"
                    )}
                  >
                    <Layout className={cn("h-4 w-4 mr-3", data.template === t.id ? "text-purple-600" : "text-slate-400")} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase">{t.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {fontFamilies.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontFamily(f.value)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-xl border transition-all text-[10px] font-bold uppercase",
                      fontPreviewClass[f.value] || "font-sans",
                      data.fontFamily === f.value 
                        ? "border-purple-600 bg-purple-50 text-purple-600" 
                        : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-purple-200"
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Theme Color</label>
              <div className="flex flex-wrap gap-2">
                {themeColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setThemeColor(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      colorSwatchClass[c.value] || "bg-slate-600",
                      data.themeColor === c.value ? "border-slate-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <Button 
              className="w-full premium-button-primary py-4"
              onClick={handleSaveResume}
              disabled={isSavingResume}
            >
              {isSavingResume ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSavingResume ? "Saving..." : "Save Resume"}
            </Button>

            <Button 
              variant="outline"
              className="w-full border-slate-200 text-slate-600 py-4"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Form Sections */}
      <div className="flex-1 space-y-4 print:hidden">
        {/* Resume Upload Section */}
        <div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-4xl mb-6 sm:mb-8 border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px] items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Upload or start from scratch</h3>
              <p className="text-sm text-slate-500 mt-2">Upload your existing resume, then refine it with the builder for a stronger career profile.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-50 text-purple-600 mb-4">
                <Download className="h-6 w-6" />
              </div>
              <input type="file" className="hidden" id="resume-upload" accept=".pdf,.doc,.docx" />
              <label htmlFor="resume-upload" className="cursor-pointer block rounded-3xl border border-dashed border-slate-300 px-4 py-6 hover:border-purple-200 transition-colors">
                <Plus className="h-6 w-6 mx-auto text-purple-600 mb-3" />
                <p className="text-sm font-semibold text-slate-900">Upload resume</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX · Max 5MB</p>
              </label>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <SectionHeader id="personal" title="Personal Info" icon={User} />
        <AnimatePresence>
          {activeSection === "personal" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                    <Input {...register("fullName")} onChange={handlePersonalInfoChange} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Target Job Role (ATS Focus)</label>
                    <Input 
                      value={data.targetRole} 
                      onChange={(e) => setTargetRole(e.target.value)} 
                      placeholder="e.g. Senior Frontend Engineer" 
                      className="border-amber-200 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Professional Title</label>
                    <Input {...register("title")} onChange={handlePersonalInfoChange} placeholder="Senior Captain / Flight Attendant" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email</label>
                    <Input {...register("email")} onChange={handlePersonalInfoChange} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Phone</label>
                    <Input {...register("phone")} onChange={handlePersonalInfoChange} placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Location</label>
                    <Input {...register("location")} onChange={handlePersonalInfoChange} placeholder="Mumbai, India" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Website / Portfolio</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...register("website")} onChange={handlePersonalInfoChange} className="pl-12" placeholder="https://portfolio.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">LinkedIn</label>
                    <div className="relative">
                      <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...register("linkedin")} onChange={handlePersonalInfoChange} className="pl-12" placeholder="linkedin.com/in/username" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">GitHub</label>
                    <div className="relative">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...register("github")} onChange={handlePersonalInfoChange} className="pl-12" placeholder="github.com/username" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center px-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Summary</label>
                    </div>
                    <textarea
                      {...register("summary")}
                      onChange={handlePersonalInfoChange}
                      className="w-full h-32 rounded-2xl border border-slate-200 bg-white/50 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Briefly describe your career goals and expertise..."
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aviation Data */}
        <SectionHeader id="aviation" title="Aviation Data" icon={Plane} />
        <AnimatePresence>
          {activeSection === "aviation" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-8">
                {/* Flight Hours */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <Clock className="h-3 w-3 mr-2" /> Flight Hours
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(data.aviationData?.flightHours || {}).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">{key}</label>
                        <Input 
                          value={value} 
                          onChange={(e) => updateAviationData({ 
                            flightHours: { ...data.aviationData?.flightHours, [key]: e.target.value } as any 
                          })} 
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <Stethoscope className="h-3 w-3 mr-2" /> Medical Info
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Medical Class</label>
                      <Input 
                        value={data.aviationData?.medical.class} 
                        onChange={(e) => updateAviationData({ 
                          medical: { ...data.aviationData?.medical, class: e.target.value } as any 
                        })} 
                        placeholder="Class 1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Expiry Date</label>
                      <Input 
                        type="date"
                        value={data.aviationData?.medical.expiry} 
                        onChange={(e) => updateAviationData({ 
                          medical: { ...data.aviationData?.medical, expiry: e.target.value } as any 
                        })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Licenses & Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Licenses</h4>
                    <div className="space-y-3">
                      {data.aviationData?.licenses.map((lic) => (
                        <div key={lic.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 relative group">
                          <button 
                            aria-label="Remove License"
                            onClick={() => {
                              const updated = data.aviationData?.licenses.filter(l => l.id !== lic.id);
                              updateAviationData({ licenses: updated });
                            }} 
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="space-y-2">
                            <Input 
                              className="h-8 text-xs" 
                              value={lic.name} 
                              onChange={(e) => {
                                const updated = data.aviationData?.licenses.map(l => l.id === lic.id ? { ...l, name: e.target.value } : l);
                                updateAviationData({ licenses: updated });
                              }} 
                              placeholder="License Name (e.g. ATPL)" 
                            />
                            <Input 
                              className="h-8 text-xs" 
                              value={lic.number} 
                              onChange={(e) => {
                                const updated = data.aviationData?.licenses.map(l => l.id === lic.id ? { ...l, number: e.target.value } : l);
                                updateAviationData({ licenses: updated });
                              }} 
                              placeholder="License Number" 
                            />
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-8"
                        onClick={() => {
                          const newLic = { id: Math.random().toString(36).substr(2, 9), name: "", number: "", expiry: "", issuer: "" };
                          updateAviationData({ licenses: [...(data.aviationData?.licenses || []), newLic] });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add License
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ratings</h4>
                    <div className="space-y-3">
                      {data.aviationData?.ratings.map((rat) => (
                        <div key={rat.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 relative group">
                          <button 
                            aria-label="Remove Rating"
                            onClick={() => {
                              const updated = data.aviationData?.ratings.filter(r => r.id !== rat.id);
                              updateAviationData({ ratings: updated });
                            }} 
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="space-y-2">
                            <Input 
                              className="h-8 text-xs" 
                              value={rat.name} 
                              onChange={(e) => {
                                const updated = data.aviationData?.ratings.map(r => r.id === rat.id ? { ...r, name: e.target.value } : r);
                                updateAviationData({ ratings: updated });
                              }} 
                              placeholder="Rating (e.g. Type Rating)" 
                            />
                            <Input 
                              className="h-8 text-xs" 
                              value={rat.aircraftType} 
                              onChange={(e) => {
                                const updated = data.aviationData?.ratings.map(r => r.id === rat.id ? { ...r, aircraftType: e.target.value } : r);
                                updateAviationData({ ratings: updated });
                              }} 
                              placeholder="Aircraft Type" 
                            />
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-8"
                        onClick={() => {
                          const newRat = { id: Math.random().toString(36).substr(2, 9), name: "", aircraftType: "" };
                          updateAviationData({ ratings: [...(data.aviationData?.ratings || []), newRat] });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Rating
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Experience */}
        <SectionHeader id="experience" title="Experience" icon={Briefcase} count={data.experience.length} />
        <AnimatePresence>
          {activeSection === "experience" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-6">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative group">
                    <button aria-label="Remove Experience" onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input value={exp.position} onChange={(e) => updateExperience(exp.id, { position: e.target.value })} placeholder="Position" />
                      <Input value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} placeholder="Company" />
                      <Input value={exp.startDate} onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })} placeholder="Start Date" />
                      <Input value={exp.endDate} onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })} placeholder="End Date" />
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                        className="md:col-span-2 w-full h-24 rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Key responsibilities and achievements..."
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200" onClick={() => addExperience({ id: Math.random().toString(36).substr(2, 9), company: "", position: "", startDate: "", endDate: "", description: "" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Experience
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Education */}
        <SectionHeader id="education" title="Education" icon={GraduationCap} count={data.education.length} />
        <AnimatePresence>
          {activeSection === "education" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-4">
                {data.education.map((edu) => (
                  <div key={edu.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative group">
                    <button aria-label="Remove Education" onClick={() => removeEducation(edu.id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} placeholder="Degree" />
                      <Input value={edu.school} onChange={(e) => updateEducation(edu.id, { school: e.target.value })} placeholder="University" />
                      <Input value={edu.year} onChange={(e) => updateEducation(edu.id, { year: e.target.value })} placeholder="Year" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200" onClick={() => addEducation({ id: Math.random().toString(36).substr(2, 9), school: "", degree: "", year: "" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Education
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skills */}
        <SectionHeader id="skills" title="Skills" icon={Sparkles} count={data.skills.length} />
        <AnimatePresence>
          {activeSection === "skills" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-xs text-slate-500">Add your technical and soft skills</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center border border-purple-100">
                      {skill}
                      <button aria-label="Remove Skill" onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="new-skill"
                    placeholder="Add a skill (e.g. Flight Safety)" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val) {
                          addSkill(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button onClick={() => {
                    const input = document.getElementById('new-skill') as HTMLInputElement;
                    if (input.value) {
                      addSkill(input.value);
                      input.value = '';
                    }
                  }}>Add</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects */}
        <SectionHeader id="projects" title="Projects" icon={Globe} count={data.projects.length} />
        <AnimatePresence>
          {activeSection === "projects" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-4">
                {data.projects.map((proj) => (
                  <div key={proj.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative group">
                    <button aria-label="Remove Project" onClick={() => removeProject(proj.id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 gap-4">
                      <Input value={proj.name} onChange={(e) => updateProject(proj.id, { name: e.target.value })} placeholder="Project Name" />
                      <Input value={proj.link} onChange={(e) => updateProject(proj.id, { link: e.target.value })} placeholder="Project Link (Optional)" />
                      <textarea
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                        className="w-full h-24 rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Project description and your role..."
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200" onClick={() => addProject({ id: Math.random().toString(36).substr(2, 9), name: "", description: "", link: "" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Project
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Certifications */}
        <SectionHeader id="certifications" title="Certifications" icon={Award} count={data.certifications.length} />
        <AnimatePresence>
          {activeSection === "certifications" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-4">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative group">
                    <button aria-label="Remove Certification" onClick={() => removeCertification(cert.id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input value={cert.name} onChange={(e) => updateCertification(cert.id, { name: e.target.value })} placeholder="Certification Name" />
                      <Input value={cert.issuer} onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })} placeholder="Issuer" />
                      <Input value={cert.date} onChange={(e) => updateCertification(cert.id, { date: e.target.value })} placeholder="Date" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200" onClick={() => addCertification({ id: Math.random().toString(36).substr(2, 9), name: "", issuer: "", date: "" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Certification
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Languages */}
        <SectionHeader id="languages" title="Languages" icon={LangIcon} count={data.languages.length} />
        <AnimatePresence>
          {activeSection === "languages" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-4">
                {data.languages.map((lang) => (
                  <div key={lang.id} className="flex gap-4 items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative group">
                    <Input className="flex-1" value={lang.name} onChange={(e) => updateLanguage(lang.id, { name: e.target.value })} placeholder="Language" />
                    <select 
                      aria-label="Language Level"
                      value={lang.level} 
                      onChange={(e) => updateLanguage(lang.id, { level: e.target.value })}
                      className="h-12 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Professional">Professional</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Basic">Basic</option>
                    </select>
                    <button aria-label="Remove Language" onClick={() => removeLanguage(lang.id)} className="p-2 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200" onClick={() => addLanguage({ id: Math.random().toString(36).substr(2, 9), name: "", level: "Fluent" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Language
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elite Achievements */}
        <SectionHeader id="achievements" title="Key Achievements" icon={Trophy} count={data.achievements.length} />
        <AnimatePresence>
          {activeSection === "achievements" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {data.achievements.map((ach, i) => (
                    <div key={i} className="w-full flex gap-2 items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
                      <Input 
                        value={ach} 
                        onChange={(e) => {
                          const updated = [...data.achievements];
                          updated[i] = e.target.value;
                          useResumeStore.setState({ data: { ...data, achievements: updated } });
                        }}
                        className="bg-transparent border-none focus:ring-0 text-sm"
                      />
                      <button aria-label="Remove Achievement" onClick={() => removeAchievement(ach)} className="p-1 text-amber-400 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full border-dashed border-2 py-4 rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => addAchievement("New achievement impact statement...")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Achievement
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tech Stack Matrix */}
        <SectionHeader id="tools" title="Tech Stack Matrix" icon={Cpu} count={data.tools.length} />
        <AnimatePresence>
          {activeSection === "tools" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-8 rounded-3xl mb-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {data.tools.map((tool, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center border border-slate-200">
                      {tool}
                      <button aria-label="Remove Tool" onClick={() => removeTool(tool)} className="ml-2 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="new-tool"
                    placeholder="Add a tool/tech (e.g. Docker, AWS)" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val) {
                          addTool(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button onClick={() => {
                    const input = document.getElementById('new-tool') as HTMLInputElement;
                    if (input.value) {
                      addTool(input.value);
                      input.value = '';
                    }
                  }}>Add</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ATS Insights */}
        {data.atsScore !== undefined && (
          <div className="glass-card p-8 rounded-3xl border-2 border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">ATS Score Estimate</h3>
                  <p className="text-xs text-slate-500">Based on elite hiring criteria</p>
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-600">{data.atsScore}/100</div>
            </div>
            
            {data.improvementSuggestions && data.improvementSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <AlertCircle className="h-3 w-3 mr-2" /> Improvement Suggestions
                </h4>
                <ul className="space-y-2">
                  {data.improvementSuggestions.map((s, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 mr-3 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar - Live Preview */}
      <div className="hidden xl:block w-150 sticky top-28 h-[calc(100vh-140px)] overflow-y-auto pr-4 custom-scrollbar print:block print:static print:w-full print:h-auto print:overflow-visible print:p-0">
        <div className="scale-[0.75] origin-top-left print:scale-100 print:origin-top print:static">
          <ResumePreview />
        </div>
      </div>
    </div>
    </>
  );
}
