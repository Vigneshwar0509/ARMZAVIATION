import { useCallback, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { Input } from "../../components/ui/Input";
import { Plane, Lock, Mail, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SEO from "../../components/common/SEO";
import GoogleLogin from "../../components/auth/GoogleLogin";
import ForgetPassword from "../../components/auth/ForgetPassword";
import { getDefaultRouteForUser, ONBOARDING_ROUTE } from "@/src/lib/subscription";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, setLoading, error, setError } = useAuthStore();
  const [showForgetPassword, setShowForgetPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues, requestedRole: 'student' | 'employer' = 'student') => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(
        {
          email: data.email,
          password: data.password,
        },
        requestedRole
      );

      const userData = response.user as typeof response.user & { status?: string };

      if (userData.role === "employer" && userData.status === "pending") {
        setError("Your employer account is still pending verification by our admin team.");
        return;
      }

      login(userData);

      const defaultRoute = getDefaultRouteForUser(userData);
      if (defaultRoute === ONBOARDING_ROUTE) {
        setError("Please select a plan and complete payment before accessing your dashboard.");
      }

      if (
        from &&
        from !== '/login' &&
        from !== '/admin-login' &&
        from !== '/register' &&
        from !== defaultRoute
      ) {
        navigate(from);
      } else {
        navigate(defaultRoute);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const message = err.response?.data?.message || "Invalid email or password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback((response: any) => {
    const userData = response.user as typeof response.user & { status?: string };

    if (userData.role === "employer" && userData.status === "pending") {
      setError("Your employer account is still pending verification by our admin team.");
      return;
    }

    login(userData);

    const defaultRoute = getDefaultRouteForUser(userData);
    if (defaultRoute === ONBOARDING_ROUTE) {
      setError("Please select a plan and complete payment before accessing your dashboard.");
    }
    if (
      from &&
      from !== '/login' &&
      from !== '/admin-login' &&
      from !== '/register' &&
      from !== defaultRoute
    ) {
      navigate(from);
    } else {
      navigate(defaultRoute);
    }
  }, [from, login, navigate]);

  const handleGoogleError = useCallback((error: any) => {
    const message = error instanceof Error ? error.message : String(error || '');
    if (message.includes('Missing VITE_GOOGLE_CLIENT_ID')) {
      return;
    }
    console.error('Google login error:', error);
    setError(message || 'Google login failed. Please try again.');
  }, [setError]);

  const handleForgetPasswordSuccess = () => {
    setShowForgetPassword(false);
    setError(null);
  };

  if (showForgetPassword) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <SEO title="Reset Password" description="Reset your password" />
        <div className="max-w-md w-full glass-card p-8 rounded-3xl shadow-2xl border-white/50">
          <ForgetPassword
            onBack={() => setShowForgetPassword(false)}
            onSuccess={handleForgetPasswordSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <SEO title="Login" description="Access your aviation career portal" />
      <div className="max-w-md w-full glass-card p-6 sm:p-8 rounded-3xl shadow-2xl border-white/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-purple-600 p-3 rounded-2xl mb-4 -rotate-45">
            <Plane className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Welcome Back</h1>
          <p className="text-slate-600 mt-2">Access your aviation career portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="Continue with Google"
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or use your credentials</span>
          </div>
        </div>

        <form autoComplete="off" onSubmit={handleSubmit((data) => onSubmit(data, 'student'))} className="space-y-6">
          <input type="text" name="fakeusernameremembered" autoComplete="username" className="hidden" title="Autocomplete prevention" placeholder="" />
          <input type="password" name="fakepasswordremembered" autoComplete="new-password" className="hidden" title="Autocomplete prevention" placeholder="" />
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              <Input
                id="login-email"
                type="email"
                autoComplete="off"
                title="Enter your email address"
                placeholder="name@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`pl-14 h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500 focus:bg-white transition-all ${errors.email ? 'border-red-300 ring-1 ring-red-500' : ''}`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="text-xs text-red-500 font-bold ml-4">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <label htmlFor="login-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <button
                type="button"
                onClick={() => setShowForgetPassword(true)}
                className="text-[10px] font-bold text-purple-600 uppercase tracking-widest hover:text-purple-700"
              >
                Forgot?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              <Input
                id="login-password"
                type="password"
                autoComplete="new-password"
                title="Enter your password"
                placeholder="********"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className={`pl-14 h-14 rounded-2xl bg-white/50 border-slate-200/60 focus:ring-purple-500 focus:bg-white transition-all ${errors.password ? 'border-red-300 ring-1 ring-red-500' : ''}`}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-xs text-red-500 font-bold ml-4">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-4">
            <button
              type="submit"
              className="premium-button-primary w-full h-14 text-lg group"
              disabled={isLoading}
            >
              <span className="flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Login as Candidate <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>

            <button
              type="button"
              className="premium-button-outline w-full h-14 text-sm"
              onClick={handleSubmit((data) => onSubmit(data, 'employer'))}
              disabled={isLoading}
            >
              Login as Employer
            </button>
          </div>
        </form>


        <p className="text-center mt-6 text-sm text-slate-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-600 font-bold hover:underline">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}
