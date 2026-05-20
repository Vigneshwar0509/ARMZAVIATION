import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Building2,
  ClipboardCheck,
  GraduationCap, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Settings2,
  LogOut,
  Bell,
  Search,
  Megaphone,
  School,
  Video,
  ShieldCheck,
  DollarSign,
  ChevronLeft,
  X,
  Menu,
  MessageSquare,
  Bolt,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { useAdminStore } from "@/src/store/adminStore";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Tooltip } from "@/src/components/ui/Tooltip";
import UserMenuDropdown from "@/src/components/common/UserMenuDropdown";
import primaryLogo from "@/src/assets/newlogo.png";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { searchQuery, setSearchQuery } = useAdminStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard, desc: "System performance & stats" },
    { name: "Students", path: "/admin/students", icon: Users, desc: "Manage member directory" },
    { name: "Applications", path: "/admin/applications", icon: ClipboardCheck, desc: "Review student job applications" },
    { name: "Jobs", path: "/admin/jobs", icon: Briefcase, desc: "Post & moderate listings" },
    { name: "Internships", path: "/admin/internships", icon: ClipboardCheck, desc: "Manage internship programs" },
    { name: "Interviews", path: "/admin/interviews", icon: Calendar, desc: "Interview scheduling & management" },
    { name: "Plan Management", path: "/admin/plans", icon: Settings2, desc: "Configure pricing tiers" },
    { name: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard, desc: "Track revenue & billing" },
    { name: "Payments", path: "/admin/payments", icon: DollarSign, desc: "Transactions and invoicing" },
    { name: "Campaigns", path: "/admin/campaigns", icon: Megaphone, desc: "Marketing & notifications" },
    { name: "Colleges", path: "/admin/colleges", icon: School, desc: "Partner institutions" },
    { name: "Events & Webinars", path: "/admin/events", icon: Video, desc: "Live sessions & meetings" },
    { name: "Leads", path: "/admin/leads", icon: Users, desc: "Lead funnel and conversion" },
    { name: "Employers", path: "/admin/employers", icon: Building2, desc: "Recruiter accounts and companies" },
    { name: "Enquiries", path: "/admin/enquiries", icon: MessageSquare, desc: "User enquiries and contact messages" },
    { name: "Courses", path: "/admin/courses", icon: GraduationCap, desc: "Manage learning tracks" },
    { name: "Reports", path: "/admin/reports", icon: BarChart3, desc: "Analytics & data export" },
    { name: "Settings", path: "/admin/settings", icon: Settings, desc: "Portal configurations" },
  ];

  if (user?.isPrime) {
    menuItems.splice(1, 0, { name: "Admin Management", path: "/admin/management", icon: ShieldCheck, desc: "Staff roles & security" });
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-dvh bg-transparent overflow-x-hidden text-slate-600">
      {isMobileSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
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
            <Link to="/admin" className="flex items-center" onClick={() => setIsMobileSidebarOpen(false)}>
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
              const isActive = location.pathname === item.path ||
                (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all group",
                    isActive
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

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 88 : 288 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col min-w-[88px] max-w-[288px] bg-white/50 backdrop-blur-xl border-r border-slate-200 relative z-50"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center"
              >
                <img
                  src={primaryLogo}
                  alt="ARMZ Aviation"
                  className="h-12 sm:h-14 w-auto max-w-64 object-contain object-left"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto"
              >
                <img
                  src={primaryLogo}
                  alt="ARMZ Aviation"
                  className="h-10 w-auto max-w-20 object-contain object-left"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="grow px-4 space-y-2 overflow-y-auto pb-8 scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== "/admin" && location.pathname.startsWith(item.path));

            const navLink = (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200",
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-purple-700"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-400"
                )} />
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );

            return isCollapsed ? (
              <Tooltip
                key={item.path}
                content={item.name}
                subtitle={item.desc}
                side="right"
              >
                {navLink}
              </Tooltip>
            ) : (
              navLink
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Tooltip content="Logout" side="right" className={!isCollapsed ? "hidden" : ""}>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all",
                isCollapsed && "justify-center px-0"
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </Tooltip>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand side navigation" : "Collapse side navigation"}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-200 shadow-sm transition-all z-50"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-500", isCollapsed && "rotate-180")} />
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="grow flex flex-col overflow-x-hidden bg-transparent">
        {/* Header */}
        <header className="h-20 bg-transparent border-b border-slate-200 px-3 sm:px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center grow max-w-md">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label={isMobileSidebarOpen ? "Close menu" : "Open menu"}
              className="lg:hidden h-11 w-11 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white/70"
            >
              {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="hidden sm:block relative w-full group">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                searchQuery ? "text-purple-600" : "text-slate-400 group-focus-within:text-purple-600"
              )} />
              <Input 
                placeholder="Search across admin panel..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white/50 border-slate-200 text-slate-700 focus:ring-purple-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button aria-label="View notifications" className="relative h-11 w-11 inline-flex items-center justify-center text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-purple-600 rounded-full border-2 border-white" />
            </button>
            <div className="pl-3 sm:pl-6 border-l border-slate-200">
              <UserMenuDropdown
                name={user?.name || "Admin"}
                subtitle={user?.isPrime ? "Prime Admin" : "Staff Admin"}
                initial={user?.name?.charAt(0) || "A"}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="grow p-4 lg:p-8 pb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-400 mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
