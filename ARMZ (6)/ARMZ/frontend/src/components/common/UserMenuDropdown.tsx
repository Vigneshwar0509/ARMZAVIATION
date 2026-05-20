import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface UserMenuDropdownProps {
  name?: string;
  subtitle?: string;
  initial?: string;
  onLogout: () => void | Promise<void>;
  className?: string;
}

export default function UserMenuDropdown({
  name,
  subtitle,
  initial,
  onLogout,
  className,
}: UserMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogoutClick = async () => {
    try {
      setLoggingOut(true);
      await onLogout();
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        className="flex items-center gap-3"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900">{name || "User"}</p>
          <p className="text-xs text-slate-500 uppercase tracking-widest">{subtitle || "Member"}</p>
        </div>
        <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm lg:text-base">
          {initial || "U"}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50"
        >
          <button
            role="menuitem"
            onClick={handleLogoutClick}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
