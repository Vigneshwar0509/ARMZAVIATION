import React, { useState, useEffect, useRef, Suspense } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  User, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Plus,
  Check,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/store/authStore";
import { usePlanStore } from "@/src/store/planStore";
import { EMPLOYER_NAV_ITEMS } from "@/src/lib/planFeatures";
import toast from "react-hot-toast";
import UserMenuDropdown from "@/src/components/common/UserMenuDropdown";
import primaryLogo from "@/src/assets/newlogo.png";
import { apiService } from "@/src/services/api";
import { canAccessRouteForPlan, getSubscriptionRouteForRole, normalizePlanReference } from '@/src/lib/subscription';

const minHeightViewportClass = "min-h-dvh";
const pageBackgroundClass = "bg-brand-50";
const contentMaxWidthClass = "max-w-400";

export default function EmployerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();

  const attemptedPlanRefreshRef = useRef<string | null>(null);
  const [isRefreshingPlans, setIsRefreshingPlans] = useState(false);

  // Force refresh plans
  const refreshPlans = async () => {
    setIsRefreshingPlans(true);
    try {
      await fetchPlans();
      toast.success("Plans updated!");
    } catch (error) {
      toast.error("Failed to refresh plans");
    } finally {
      setIsRefreshingPlans(false);
    }
  };

  useEffect(() => {
    // Always fetch plans on component mount
    void fetchPlans();

    const currentPlanCode = normalizePlanReference(user?.subscription);
    const hasCurrentPlan = plans.some(
      (plan) => normalizePlanReference(plan.id) === currentPlanCode
    );

    // If plan not found in cached list, refresh
    if (user?.subscription && !hasCurrentPlan && attemptedPlanRefreshRef.current !== currentPlanCode) {
      attemptedPlanRefreshRef.current = currentPlanCode;
      void fetchPlans();
    }

    // Optional: Refresh plans every 30 seconds to catch admin updates
    const planRefreshInterval = setInterval(() => {
      void fetchPlans();
    }, 30000);

    return () => clearInterval(planRefreshInterval);
  }, [fetchPlans, user?.subscription]);

  // Debug: Log current state
  useEffect(() => {
    if (user?.subscription) {
      const currentPlan = plans.find(
        (plan) => normalizePlanReference(plan.id) === normalizePlanReference(user?.subscription)
      );
      console.log("🔍 PLAN DEBUG:", {
        userSubscription: user?.subscription,
        normalizedSubscription: normalizePlanReference(user?.subscription),
        availablePlans: plans.map(p => ({ id: p.id, normalizedId: normalizePlanReference(p.id), name: p.name, permissions: p.permissions })),
        matchedPlan: currentPlan ? { id: currentPlan.id, name: currentPlan.name, permissions: currentPlan.permissions } : "NOT FOUND",
      });
    }
  }, [plans, user?.subscription]);

  const currentPlan = plans.find(
    (plan) => normalizePlanReference(plan.id) === normalizePlanReference(user?.subscription)
  );

  // Get permissions - ensure it's an array
  const currentPlanPermissions = currentPlan?.permissions;
  
  // Normalize permissions to lowercase for comparison
  const normalizedPermissions = Array.isArray(currentPlanPermissions)
    ? currentPlanPermissions.map((p) => String(p).trim().toLowerCase()).filter(Boolean)
    : [];

  // Show ALL nav items, but track which ones are locked
  const allMenuItems = EMPLOYER_NAV_ITEMS.map((item) => ({
    ...item,
    isLocked: item.requiredPermission
      ? !normalizedPermissions.includes(item.requiredPermission.toLowerCase())
      : false,
  }));
  
  // Debug: Log item lock status
  useEffect(() => {
    console.log("🔐 NAV ITEMS STATUS:", {
      currentPlan: currentPlan?.name,
      permissions: normalizedPermissions,
      items: allMenuItems.map(i => ({ label: i.label, requiredPermission: i.requiredPermission, isLocked: i.isLocked })),
    });
  }, [normalizedPermissions]);

  const handleLockedItemClick = () => {
    toast.error("Please upgrade your plan to access this feature");
    navigate("/employer/subscription");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const markAsRead = async (id: number) => {
    setNotifications((current) => current.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      await apiService.markNotificationAsRead(String(id));
    } catch (error) {
      toast.error("Unable to update notification");
    }
  };

  const deleteNotification = async (id: number) => {
    const previous = notifications;
    setNotifications((current) => current.filter((n) => n.id !== id));
    try {
      await apiService.deleteNotification(String(id));
    } catch (error) {
      setNotifications(previous);
      toast.error("Unable to delete notification");
    }
  };

  const markAllAsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    if (!user?.id) return;
    try {
      await apiService.markAllNotificationsAsRead(user.id);
    } catch (error) {
      toast.error("Unable to update notifications");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      setIsNotificationsLoading(true);
      try {
        const response = await apiService.getNotifications(user.id);
        setNotifications(response.data.notifications || []);
      } catch (error) {
        toast.error("Unable to load notifications");
      } finally {
        setIsNotificationsLoading(false);
      }
    };

    void loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  return (
    <div className={`${minHeightViewportClass} ${pageBackgroundClass} flex overflow-x-hidden`}>
      {isSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6">
            <Link to="/" className="flex items-center group">
              <img
                src={primaryLogo}
                alt="ARMZ Aviation"
                className="h-12 sm:h-14 w-auto max-w-64 object-contain object-left"
                loading="eager"
                decoding="async"
              />
            </Link>
          </div>

          <nav className="grow px-4 space-y-2">
            {allMenuItems.map((item) => (
              <React.Fragment key={item.path}>
                {item.isLocked ? (
                  <button
                    onClick={() => {
                      handleLockedItemClick();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all text-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer relative group"
                    title={`Upgrade your plan to access ${item.label}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    <Lock className="h-4 w-4 ml-auto" />
                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-2 hidden group-hover:block z-50 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Upgrade plan to unlock
                    </div>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                      location.pathname === item.path
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                        : "text-slate-500 hover:bg-purple-50 hover:text-purple-600"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="p-4 mt-auto">
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

      {/* Main Content */}
      <main className="grow flex flex-col min-w-0">
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              className="lg:hidden h-11 w-11 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white/70"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicants, jobs..."
                className="pl-10 pr-4 py-2.5 bg-slate-100/50 border-transparent focus:bg-white focus:border-purple-200 rounded-xl text-sm w-64 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div ref={notificationsRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="View notifications" 
                className="h-11 w-11 inline-flex items-center justify-center text-slate-500 hover:text-purple-600 bg-white border border-slate-200 rounded-xl transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white">{unreadCount}</span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    className="absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-slate-100 sticky top-0 bg-white">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <p className="text-xs text-slate-500 mt-1">{unreadCount} unread</p>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {isNotificationsLoading ? (
                        <div className="p-8 text-center text-slate-400">
                          Loading notifications...
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${!notif.read ? 'bg-purple-50/30' : ''}`}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notif.read ? 'bg-slate-300' : 'bg-purple-600'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-slate-900">{notif.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{notif.desc || notif.description}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                  {notif.time || (notif.timestamp ? new Date(notif.timestamp).toLocaleString() : "")}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                aria-label={`Delete notification: ${notif.title}`}
                                className="p-1 hover:bg-slate-200 rounded transition shrink-0"
                              >
                                <Trash2 className="h-3 w-3 text-slate-400" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400">
                          No notifications
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
                        <button onClick={markAllAsRead} className="w-full text-sm font-semibold text-purple-600 hover:text-purple-700 transition">
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="pl-4 border-l border-slate-200">
              <UserMenuDropdown
                name={user?.name || "Employer"}
                subtitle="Employer"
                initial={user?.name?.charAt(0) || "E"}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`w-full ${contentMaxWidthClass} mx-auto`}
            >
              <Suspense 
                fallback={
                  <div className="flex h-[50vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
