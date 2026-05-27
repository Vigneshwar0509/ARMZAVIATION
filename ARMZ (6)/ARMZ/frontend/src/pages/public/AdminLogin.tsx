import { } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, Loader2, Plane, Sparkles } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { authService } from "@/src/services/authService";
import { motion } from "motion/react";
import toast from "react-hot-toast";
// OTP verification removed for VPS deployment (server-side OTP disabled)

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, setLoading, setError } = useAuthStore();
  // OTP flow disabled: admin login will navigate directly to dashboard

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const from = (location.state as any)?.from?.pathname || "/admin";

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.adminLogin(data.email, data.password);
      // Always treat admin login as successful (OTP disabled server-side)
      login(response.user);
      navigate(from);
    } catch (err: any) {
      const message = err.message || "Invalid admin credentials";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
 

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-purple-50/20 relative overflow-hidden pt-20 pb-20">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[200px] h-[200px] bg-fuchsia-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[180px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mb-4"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm border border-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Sparkles size={14} className="mr-2 animate-pulse" />
              Admin Access Portal
            </span>
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Admin Login</h1>
          <p className="text-slate-600 font-medium">Secure access for authorized administrators only</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card border border-white/60 bg-white/70 backdrop-blur-xl rounded-4xl p-8 shadow-lg"
        >
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="text" name="fakeusernameremembered" autoComplete="username" className="hidden" title="Autocomplete prevention" placeholder="" />
            <input type="password" name="fakepasswordremembered" autoComplete="new-password" className="hidden" title="Autocomplete prevention" placeholder="" />
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-linear-to-br from-purple-600 to-fuchsia-600 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-login-email" className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Admin Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="admin-login-email"
                  {...register("email")}
                  type="email"
                  autoComplete="off"
                  title="Enter your admin email address"
                  {...(errors.email ? { "aria-invalid": true } : {})}
                  aria-describedby={errors.email ? "admin-login-email-error" : undefined}
                  className="w-full bg-white/50 border-2 border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all outline-none placeholder:text-slate-400 font-medium"
                  placeholder="admin@example.com"
                />
              </div>
              {errors.email && (
                <p id="admin-login-email-error" className="text-xs text-red-500 mt-1 ml-1 font-semibold">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-login-password" className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Security Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="admin-login-password"
                  {...register("password")}
                  type="password"
                  autoComplete="new-password"
                  title="Enter your admin password"
                  {...(errors.password ? { "aria-invalid": true } : {})}
                  aria-describedby={errors.password ? "admin-login-password-error" : undefined}
                  className="w-full bg-white/50 border-2 border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all outline-none placeholder:text-slate-400 font-medium"
                  placeholder="********"
                />
              </div>
              {errors.password && (
                <p id="admin-login-password-error" className="text-xs text-red-500 mt-1 ml-1 font-semibold">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 disabled:from-slate-300 disabled:to-slate-300 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98] hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <span>Authorize Access</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

          </form>

          <div className="mt-6 pt-6 border-t border-slate-200/50">
            <Link
              to="/"
              className="text-slate-600 hover:text-purple-600 transition-colors text-sm font-semibold flex items-center justify-center gap-2 group"
            >
              <Plane className="h-4 w-4 -rotate-45 group-hover:-rotate-12 transition-transform" />
              Return to Main Site
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 text-xs mt-8 font-medium"
        >
          Authorized personnel only. All access attempts are logged and monitored.
        </motion.p>
      </motion.div>
    </div>
  );
}
