import React, { useState } from "react";
import { User, Building2, Mail, Phone, MapPin, Globe, ShieldCheck, CheckCircle2, AlertCircle, Edit2, Save, X, Users, Lock, Eye, EyeOff, BadgeCheck, Award, Calendar, FileText } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/src/lib/utils";
import { authService } from "@/src/services/authService";

export default function EmployerProfile() {
  const { user, login } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    jobTitle: user?.hr_name || "",
    companyName: user?.company_name || "",
    companyWebsite: "https://aviationcorp.com",
    aboutCompany: user?.company_details || "",
    companySize: "50-100",
    industry: "Aviation & Aerospace",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await authService.updateProfile({
        name: formData.fullName,
        phone: formData.phone,
        company_name: formData.companyName,
        hr_name: formData.jobTitle,
        company_details: formData.aboutCompany,
      });
      login(updatedUser);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const profileCompleteness = Math.min(
    100,
    Math.round(
      ([formData.fullName, formData.email, formData.phone, formData.companyName, formData.aboutCompany]
        .filter((value) => value && value.trim().length > 0).length /
        5) *
        100
    )
  );
  const verificationStatus = [
    { label: "Email Verified", status: "verified", icon: Mail },
    { label: "Phone Verified", status: "pending", icon: Phone },
    { label: "Company Verified", status: "verified", icon: Building2 },
  ];

  const teamMembers = [
    { id: 1, name: "Sarah Johnson", role: "HR Lead", email: "sarah@aviationcorp.com", status: "active" },
    { id: 2, name: "Ahmed Ali", role: "Recruiter", email: "ahmed@aviationcorp.com", status: "active" },
    { id: 3, name: "Maria Garcia", role: "Talent Manager", email: "maria@aviationcorp.com", status: "inactive" },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900">Company Profile</h1>
          <p className="text-slate-500 mt-2 text-sm">Manage your company information, team, and account security.</p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold",
            isEditing
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-purple-600 text-white hover:bg-purple-700"
          )}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </motion.div>

      {/* Profile Completeness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 rounded-4xl border border-slate-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-600 font-semibold">Profile completeness</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{profileCompleteness}% Complete</h3>
          </div>
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="4" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#9333ea"
                strokeWidth="4"
                strokeDasharray={`${profileCompleteness * 2.83} ${100 * 2.83}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-slate-900">{profileCompleteness}%</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600">Complete your profile by adding team members and verifying your company documents to unlock premium features.</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-10 rounded-4xl border border-slate-200"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={true}
                  className="h-12 rounded-xl opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Title</label>
                <Input
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </motion.div>

          {/* Company Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-10 rounded-4xl border border-slate-200"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              Company Details
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                <Input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Size</label>
                  <select
                    name="companySize"
                    title="Select company size"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 outline-none transition-all disabled:opacity-50"
                  >
                    <option>10-50</option>
                    <option>50-100</option>
                    <option>100-500</option>
                    <option>500+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Industry</label>
                  <Input
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Website</label>
                <Input
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Company</label>
                <textarea
                  name="aboutCompany"
                  title="Tell us about your company"
                  placeholder="Tell us about your company..."
                  value={formData.aboutCompany}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 outline-none transition-all disabled:opacity-50 min-h-30 text-sm"
                />
              </div>
            </div>
            {isEditing && (
              <div className="mt-8 flex justify-end gap-3">
                <Button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 rounded-4xl border border-slate-200 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold mx-auto mb-4 border-2 border-purple-200">
              {user?.name?.charAt(0)}
            </div>
            <h4 className="text-lg font-bold text-slate-900">{user?.name}</h4>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Verified Recruiter</span>
              <BadgeCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{formData.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>Dubai, UAE</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Since Apr 2024</span>
              </div>
            </div>
          </motion.div>

          {/* Subscription Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-8 rounded-4xl bg-linear-to-br from-purple-600 to-indigo-600 text-white border border-purple-500/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-purple-200" />
              <h4 className="font-bold text-sm">Current Subscription</h4>
            </div>
            <p className="text-2xl font-bold">{user?.subscription || "Recruiter Starter"}</p>
            <p className="text-purple-100 text-xs mt-2">₹19,999/month • Auto-renews May 12, 2026</p>
            <Button className="w-full mt-6 bg-white text-purple-600 hover:bg-purple-50 font-bold rounded-lg">
              Manage Subscription
            </Button>
          </motion.div>

          {/* Verification Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-4xl border border-slate-200"
          >
            <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-purple-600" />
              Verification Status
            </h4>
            <div className="space-y-3">
              {verificationStatus.map((item) => (
                <div key={item.label} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <item.icon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                  {item.status === "verified" ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Verified</span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-10 rounded-4xl border border-slate-200"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            Team Members
          </h3>
          <Button className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-sm font-bold">
            Add Team Member
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-4 text-left font-semibold">Name</th>
                <th className="py-4 text-left font-semibold">Role</th>
                <th className="py-4 text-left font-semibold">Email</th>
                <th className="py-4 text-left font-semibold">Status</th>
                <th className="py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 font-semibold text-slate-900">{member.name}</td>
                  <td className="py-4 text-slate-600">{member.role}</td>
                  <td className="py-4 text-slate-600">{member.email}</td>
                  <td className="py-4">
                    <span className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full",
                      member.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {member.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-purple-600 font-semibold hover:text-purple-800 text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-10 rounded-4xl border border-slate-200"
      >
        <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
            <Lock className="h-5 w-5" />
          </div>
          Account Security
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-bold text-slate-900">Change Password</h4>
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 mb-4">Update your password to keep your account secure.</p>
            <Button className="w-full py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-bold">
              Update Password
            </Button>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-bold text-slate-900">Two-Factor Auth</h4>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 mb-4">Add an extra layer of security to your account.</p>
            <Button className="w-full py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-bold">
              Enabled
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
