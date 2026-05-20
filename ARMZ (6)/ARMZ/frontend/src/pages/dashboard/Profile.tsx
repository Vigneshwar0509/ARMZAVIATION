import React, { useState } from "react";
import { User, Mail, Phone, Camera, Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/src/store/authStore";
import { authService } from "@/src/services/authService";
import SEO from "@/src/components/common/SEO";
import { motion } from "motion/react";
import toast from "react-hot-toast";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, login } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const avatarInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    const loadingToast = toast.loading("Updating profile...");
    try {
      const updatedUser = await authService.updateProfile({
        name: data.fullName,
        phone: data.phone,
      });

      login({
        ...user,
        ...updatedUser,
        email: data.email,
      });

      toast.success("Profile updated successfully!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to update profile. Please try again.", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <SEO title="Profile Management" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile Management</h1>
          <p className="text-slate-500">Update your personal information and preferences.</p>
        </div>
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          className="premium-button-primary px-8 py-3 flex items-center space-x-2 w-full sm:w-auto min-w-40 justify-center"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6 sm:space-y-8">
          <div className="glass-card p-6 sm:p-8 text-center space-y-6">
            <div className="relative inline-block">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-100 to-indigo-100 text-4xl font-bold text-purple-700 shadow-lg overflow-hidden">
                {avatarInitial}
              </div>
              <button aria-label="Change profile picture" className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{user?.name || "Your Profile"}</h3>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-mono text-[10px]">
                {user?.role === "admin" ? "Administrator" : "Aviation Student"}
              </p>
            </div>

            {/* Profile Completeness */}
            <div className="pt-6 border-t border-white/10 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profile Strength</span>
                <span className="text-xs font-bold text-purple-600">85%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  className="h-full bg-purple-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Complete your work experience to reach 100%.</p>
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-around">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">85%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Strength</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">12</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Info Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 sm:p-8 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    {...register("fullName")}
                    type="text" 
                    className={`w-full h-14 bg-white/50 rounded-xl border-none ring-1 focus:ring-2 pl-14 pr-6 text-slate-700 font-medium backdrop-blur-sm transition-all ${
                      errors.fullName ? "ring-red-500 focus:ring-red-500" : "ring-white/20 focus:ring-purple-600"
                    }`} 
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-500 ml-4">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    {...register("email")}
                    type="email" 
                    className={`w-full h-14 bg-white/50 rounded-xl border-none ring-1 focus:ring-2 pl-14 pr-6 text-slate-700 font-medium backdrop-blur-sm transition-all ${
                      errors.email ? "ring-red-500 focus:ring-red-500" : "ring-white/20 focus:ring-purple-600"
                    }`} 
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 ml-4">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    {...register("phone")}
                    type="text" 
                    className={`w-full h-14 bg-white/50 rounded-xl border-none ring-1 focus:ring-2 pl-14 pr-6 text-slate-700 font-medium backdrop-blur-sm transition-all ${
                      errors.phone ? "ring-red-500 focus:ring-red-500" : "ring-white/20 focus:ring-purple-600"
                    }`} 
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 ml-4">{errors.phone.message}</p>}
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
