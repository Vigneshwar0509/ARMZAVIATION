import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useCallback, memo } from "react";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/store/authStore";
import toast from "react-hot-toast";
import ThemeToggle from "@/src/components/common/ThemeToggle";
import { ROUTE_PATHS } from "@/src/routes/paths";
import primaryLogo from "@/src/assets/newlogo.png";
import { getSafeAvatarUrl } from "@/src/utils/media";

export default memo(function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const safeAvatarUrl = getSafeAvatarUrl(user?.photoURL, user?.name);

  const navLinks = [
    { name: "HOME", path: ROUTE_PATHS.home, hasDropdown: false },
    { name: "WHO WE ARE", path: ROUTE_PATHS.about, hasDropdown: false },
    { name: "CLIENT", path: ROUTE_PATHS.jobs, hasDropdown: false },
    { name: "Candidates", path: ROUTE_PATHS.collaboration, hasDropdown: false },
    { name: "EVENTS", path: ROUTE_PATHS.events, hasDropdown: false },
    { name: "REQUEST CREW", path: ROUTE_PATHS.contact, hasDropdown: false },
  ];

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
      setIsProfileOpen(false);
    } catch (error) {
      toast.error("Logout failed");
    }
  }, [logout, navigate]);

  return (
    <nav className="glass-navbar">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-14 sm:h-16 lg:h-20 items-center">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="navbar-logo bg-transparent p-0">
                <img
                  src={primaryLogo}
                  alt="ARMZ Aviation"
                  loading="eager"
                  decoding="async"
                  className="bg-transparent"
                />
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "navbar-link px-3 xl:px-4 py-2",
                    location.pathname === link.path && "active text-purple-600"
                  )}
                >
                  <span>{link.name}</span>
                  {link.hasDropdown && <ChevronDown className="h-3 w-3 opacity-50" />}
                </Link>
              ))}

              <div className="flex items-center gap-3 ml-4 xl:ml-6">
                <ThemeToggle />
                {isAuthenticated ? (
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      aria-label="Open user menu"
                      className="h-12 flex items-center gap-2 px-3 pr-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-200 hover:bg-slate-100 transition-all duration-300"
                    >
                      <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                        {user?.photoURL ? (
                          <img src={safeAvatarUrl} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user?.name?.charAt(0) || "U"
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider hidden xl:inline">{user?.name?.split(' ')[0]}</span>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden">
                        <Link 
                          to={user?.role === 'admin' ? '/admin' : user?.role === 'employer' ? '/employer' : '/dashboard'}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wide">Dashboard</span>
                        </Link>
                        <Link 
                          to={user?.role === 'admin' ? '/admin/settings' : user?.role === 'employer' ? '/employer/profile' : '/dashboard/profile'}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wide">Profile</span>
                        </Link>
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wide">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="premium-button-primary px-5 lg:px-6 py-2.5 text-xs tracking-wider uppercase inline-flex items-center justify-center h-12">
                      Login
                    </Link>
                    <Link to="/register" className="premium-button-outline px-5 lg:px-6 py-2.5 text-xs tracking-wider uppercase inline-flex items-center justify-center h-12">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close mobile menu" : "Open mobile menu"}
                className="h-12 w-12 inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-purple-600 hover:bg-slate-100 transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 sm:top-16 lg:top-20 bg-white/70 backdrop-blur-xl border-b border-purple-200/30 overflow-hidden z-50">
          <div className="w-full px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 sm:py-4 text-sm font-semibold rounded-xl transition-all duration-300",
                    location.pathname === link.path
                      ? "bg-purple-100 text-purple-700"
                      : "text-slate-700 hover:bg-purple-50"
                  )}
                >
                  <span>{link.name}</span>
                  {link.hasDropdown && <ChevronDown className="h-4 w-4 opacity-50" />}
                </Link>
              ))}
              <div className="pt-4 space-y-3">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-xl">
                      <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                        {user?.photoURL ? (
                          <img src={safeAvatarUrl} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user?.name?.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
                      </div>
                    </div>
                    <Link 
                      to={user?.role === 'admin' ? '/admin' : user?.role === 'employer' ? '/employer' : '/dashboard'} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                      <span>Dashboard</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors w-full"
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                      <span className="premium-button-primary w-full py-4 text-sm tracking-wide uppercase inline-flex items-center justify-center h-12 rounded-xl">
                        Login
                      </span>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="block">
                      <span className="premium-button-outline w-full py-4 text-sm tracking-wide uppercase inline-flex items-center justify-center h-12 rounded-xl">
                        Register
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
});
