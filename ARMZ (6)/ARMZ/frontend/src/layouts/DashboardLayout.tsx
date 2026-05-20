import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  User,
  Linkedin,
  ClipboardCheck,
  CreditCard,
  Video,
  BookOpen,
  ClipboardList,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { usePlanStore } from "@/src/store/planStore";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import UserMenuDropdown from "@/src/components/common/UserMenuDropdown";
import primaryLogo from "@/src/assets/newlogo.png";
import toast from "react-hot-toast";
import { canAccessRouteForPlan, getSubscriptionRouteForRole, normalizeStoredPlanCode } from "@/src/lib/subscription";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (plans.length === 0) {
      void fetchPlans();
    }
  }, [fetchPlans, plans.length]);

  const currentPlanPermissions = plans.find(
    (plan) => normalizeStoredPlanCode(plan.id) === normalizeStoredPlanCode(user?.subscription)
  )?.permissions;

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", path: "/dashboard/profile", icon: User },
    { name: "Resume Builder", path: "/dashboard/resume", icon: FileText },
    { name: "LinkedIn Support", path: "/dashboard/linkedin", icon: Linkedin },
    { name: "Jobs & Internships", path: "/dashboard/jobs", icon: Briefcase },
    { name: "Interview Schedule", path: "/dashboard/interviews", icon: Calendar },
    { name: "Subscriptions", path: "/dashboard/subscriptions", icon: CreditCard },
    { name: "Notifications", path: "/dashboard/notifications", icon: Bell },
    { name: "Webinars", path: "/dashboard/webinars", icon: Video },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];
  const handleLockedNavigation = (path: string) => {
    setIsMobileSidebarOpen(false);
    toast.error("This feature is locked for your current plan.");
    navigate(getSubscriptionRouteForRole(user?.role), {
      state: { returnTo: path, reason: "plan_upgrade_required" },
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex layout-min-h-dvh bg-transparent overflow-x-hidden flex-col lg:flex-row">
      {isMobileSidebarOpen && (
        <button
          aria-label="Close menu overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        />
      )}

      {/* Sidebar - Mobile Drawer */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 transition-transform duration-300",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6">
            <Link to="/" className="flex items-center" onClick={() => setIsMobileSidebarOpen(false)}>
              <img
                src={primaryLogo}
                alt="ARMZ Aviation"
                className="h-12 sm:h-14 w-auto max-w-64 object-contain object-left"
                loading="eager"
                decoding="async"
              />
            </Link>
          </div>

          <nav className="grow px-4 space-y-2 overflow-y-auto pb-6">
            {menuItems.map((item) => {
              const isAccessible = canAccessRouteForPlan(user, item.path, currentPlanPermissions);

              if (!isAccessible) {
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleLockedNavigation(item.path)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-50/90 border border-slate-200/70 transition-all hover:bg-slate-100"
                  >
                    <span className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </span>
                    <Lock className="h-4 w-4 shrink-0" />
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                    location.pathname === item.path
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                      : "text-slate-500 hover:bg-purple-50 hover:text-purple-600"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-transparent border-r border-slate-200 print:hidden">
        <div className="p-6">
          <Link to="/" className="flex items-center">
            <img
              src={primaryLogo}
              alt="ARMZ Aviation"
              className="h-12 sm:h-14 w-auto max-w-64 object-contain object-left"
              loading="eager"
              decoding="async"
            />
          </Link>
        </div>

        <nav className="grow px-4 space-y-1 overflow-y-auto pb-8">
          {menuItems.map((item) => {
            const isAccessible = canAccessRouteForPlan(user, item.path, currentPlanPermissions);

            if (!isAccessible) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleLockedNavigation(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200/70 transition-all hover:bg-slate-100"
                >
                  <span className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </span>
                  <Lock className="h-4 w-4 shrink-0" />
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-purple-600"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="grow flex flex-col overflow-x-hidden">
        {/* Header */}
        <header className="h-20 bg-transparent border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label={isMobileSidebarOpen ? "Close menu" : "Open menu"}
              className="lg:hidden h-11 w-11 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white/70"
            >
              {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <div className="hidden md:block">
              <h2 className="text-lg lg:text-xl font-bold text-slate-800">
                {menuItems.find(item => item.path === location.pathname)?.name || "Dashboard"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link to="/dashboard/notifications" aria-label="View notifications" className="relative h-11 w-11 inline-flex items-center justify-center text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="h-5 w-5 lg:h-6 lg:w-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Link>
            <div className="pl-4 lg:pl-6 border-l border-slate-200">
              <UserMenuDropdown
                name={user?.name || "Candidate"}
                subtitle={user?.role || "Student"}
                initial={user?.name?.[0] || "C"}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="grow p-4 lg:p-8 pb-8 print:p-0 print:overflow-visible">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full layout-max-w-1600 mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
