import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, CalendarDays, ExternalLink, QrCode, X } from "lucide-react";

import { apiService } from "@/src/services/api";

type UpdateItem = {
  id: string;
  title: string;
  date?: string;
  status?: string;
  type?: string;
};

const parseDate = (value?: string) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  return parsed.getTime();
};

const formatDate = (value?: string) => {
  if (!value) return "Date TBA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isRelevantStatus = (status?: string, date?: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("upcoming") || normalized.includes("ongoing") || normalized.includes("live")) {
    return true;
  }

  const ts = parseDate(date);
  return Number.isFinite(ts) && ts >= Date.now();
};

export default function UpdatesQrWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const updatesUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/events";
    }
    return `${window.location.origin}/events`;
  }, []);

  const qrSrc = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(updatesUrl)}`,
    [updatesUrl]
  );

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["updates-qr-events"],
    queryFn: async () => {
      const res = await apiService.getEvents();
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const updates = useMemo(() => {
    return (events as UpdateItem[])
      .filter((event) => isRelevantStatus(event?.status, event?.date))
      .sort((a, b) => parseDate(a.date) - parseDate(b.date))
      .slice(0, 4);
  }, [events]);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed left-4 sm:left-8 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 bg-linear-to-r from-indigo-500 to-cyan-500 text-white hover:shadow-cyan-500/40"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        title="Open updates QR"
        aria-label="Open updates QR"
      >
        <motion.div animate={isOpen ? { rotate: 45 } : { rotate: 0 }} transition={{ duration: 0.25 }}>
          {isOpen ? <X className="h-6 w-6" /> : <QrCode className="h-6 w-6" />}
        </motion.div>

        {!isOpen && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold"
            aria-hidden="true"
          >
            <BellRing className="h-2.5 w-2.5" />
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-40 left-4 right-4 sm:left-8 sm:right-auto bottom-20 sm:bottom-24 w-auto sm:w-88 rounded-3xl border border-slate-200 bg-white/95 backdrop-blur p-4 sm:p-5 shadow-2xl"
            style={{ bottom: "max(5rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }}
            aria-label="Upcoming and ongoing updates"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 font-semibold">Live Updates</p>
                <h3 className="text-lg font-bold text-slate-900">Upcoming and Ongoing</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close updates QR panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4 items-start">
              <a
                href={updatesUrl}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-2 block"
                aria-label="Open updates page"
                title="Scan or click to open updates"
              >
                {!qrFailed ? (
                  <img
                    src={qrSrc}
                    alt="QR code to open updates page"
                    width={132}
                    height={132}
                    className="h-32 w-32 rounded-xl bg-white"
                    loading="lazy"
                    decoding="async"
                    onError={() => setQrFailed(true)}
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white text-slate-400">
                    <QrCode className="h-10 w-10" />
                  </div>
                )}
                <p className="mt-2 text-[11px] text-center font-semibold text-slate-600">Scan or tap</p>
              </a>

              <div className="space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                ) : updates.length > 0 ? (
                  updates.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-2.5">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(item.date)}
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-indigo-600">{item.status || "Upcoming"}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    No live updates right now. Scan or click to check the events page.
                  </div>
                )}

                <a
                  href={updatesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all updates
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
