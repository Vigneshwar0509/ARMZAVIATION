import React, { useState, useEffect, useMemo } from "react";
import { Video, Calendar, Users, Clock, ArrowRight, Search, Loader2, MapPin, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiService } from "@/src/services/api";
import { useAuthStore } from "@/src/store/authStore";

interface Webinar {
  id: string;
  title: string;
  description: string;
  speaker: string;
  speakerRole: string;
  speakerImage: string;
  date: string;
  time: string;
  duration: string;
  timezone: string;
  status: string;
  registeredCount: number;
  maxAttendees: number;
  topics: string[];
  requirements: string;
  language: string;
  image: string;
  meetingLink: string;
  category: string;
  isRegistered?: boolean;
  availableSeats?: number;
}

const getTimelineStatus = (date: string, status: string) => {
  const webinarDate = new Date(date);
  const today = new Date();
  const daysUntil = Math.ceil((webinarDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return "Completed";
  if (daysUntil === 0) return "Today";
  if (daysUntil <= 3) return `In ${daysUntil} days`;
  return status;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Webinars() {
  const { user, logout } = useAuthStore();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState<Record<string, boolean>>({});
  const currentUserId = user?.id;

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        setLoading(true);
        const [webinarsResponse, registrationsResponse] = await Promise.all([
          apiService.getWebinars(currentUserId),
          currentUserId ? apiService.getWebinarRegistrations(currentUserId) : Promise.resolve({ data: [] }),
        ]);

        const registrations = Array.isArray(registrationsResponse.data) ? registrationsResponse.data : [];
        const registeredIds = new Set(registrations.map((item: any) => String(item.webinarId)));
        const mappedWebinars = (webinarsResponse.data.webinars ?? []).map((item: any) => {
          const startTime = item.start_time || item.startTime || item.date || "";
          const parsedDate = startTime ? new Date(startTime) : null;
          const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
          const registeredCount = Number(item.registeredCount ?? item.registrations_count ?? 0);
          const maxAttendees = Number(item.maxAttendees ?? 100);

          return {
            id: String(item.id),
            title: item.title,
            description: item.description || "Join this live aviation webinar session.",
            speaker: item.speaker || "ARMZ Expert Panel",
            speakerRole: item.speakerRole || "Industry Speaker",
            speakerImage: item.speakerImage || "",
            date: validDate ? validDate.toISOString() : new Date().toISOString(),
            time: validDate
              ? validDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "TBA",
            duration: item.duration || "60 mins",
            timezone: item.timezone || "IST",
            status: item.status || "Upcoming",
            registeredCount,
            maxAttendees,
            topics: Array.isArray(item.topics) ? item.topics : item.category ? [item.category] : ["Aviation"],
            requirements: item.requirements || "Open to all registered learners",
            language: item.language || "English",
            image:
              item.image ||
              "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
            meetingLink: item.meeting_link || item.meetingLink || "",
            category: item.category || "General",
            isRegistered: registeredIds.has(String(item.id)),
            availableSeats: Math.max(0, maxAttendees - registeredCount),
          } satisfies Webinar;
        });

        setWebinars(mappedWebinars);
        setCategories(["All", ...Array.from(new Set<string>((webinarsResponse.data.categories ?? []) as string[]))]);
      } catch (error: any) {
        console.error("Error fetching webinars:", error);
        if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
          sessionStorage.removeItem('auth-storage');
          window.location.href = '/login';
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchWebinars();
  }, [currentUserId]);

  const filteredWebinars = useMemo(() => {
    return webinars.filter((w) => {
      const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.speaker.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "All" || w.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [webinars, searchTerm, filterCategory]);

  const stats = useMemo(
    () => ({
      total: webinars.length,
      registered: webinars.filter((w) => w.isRegistered).length,
      categories: Math.max(0, categories.length - 1),
    }),
    [webinars, categories]
  );

  const handleRegister = async (webinarId: string) => {
    if (!currentUserId) {
      return;
    }

    try {
      setRegistrationLoading((prev) => ({ ...prev, [webinarId]: true }));
      const webinar = webinars.find((w) => w.id === webinarId);

      if (webinar?.isRegistered) {
        await apiService.unregisterFromWebinar(webinarId, currentUserId);
        setWebinars((prev) => prev.map((w) =>
          w.id === webinarId
            ? {
                ...w,
                isRegistered: false,
                registeredCount: Math.max(0, w.registeredCount - 1),
                availableSeats: Math.min(w.maxAttendees, (w.availableSeats ?? 0) + 1),
              }
            : w
        ));
      } else {
        await apiService.registerForWebinar(webinarId, currentUserId);
        setWebinars((prev) => prev.map((w) =>
          w.id === webinarId
            ? {
                ...w,
                isRegistered: true,
                registeredCount: w.registeredCount + 1,
                availableSeats: Math.max(0, (w.availableSeats ?? w.maxAttendees) - 1),
              }
            : w
        ));
      }
    } catch (error) {
      console.error("Error toggling registration:", error);
    } finally {
      setRegistrationLoading((prev) => ({ ...prev, [webinarId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-slate-500">Loading webinars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-600 font-bold">Webinars & sessions</p>
          <h1 className="mt-2 text-4xl font-display font-bold text-slate-900 tracking-tight">Live learning center</h1>
          <p className="mt-3 max-w-2xl text-slate-500">Discover expert sessions and reserve seats for upcoming webinars with one click.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:auto-cols-max">
          <button className="glass-card inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Tag className="h-4 w-4 text-purple-600" />
            Browse categories
          </button>
          <button className="premium-button-primary inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm">
            <ArrowRight className="h-4 w-4" />
            Export calendar
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="glass-card rounded-4xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Search & filter sessions</h2>
              <p className="mt-1 text-sm text-slate-500">Find the webinar that matches your team’s learning goals.</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title or speaker"
                  className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </label>
              <select
                aria-label="Filter webinars by category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                {categories.map((category, index) => (
                  <option key={`${category}-${index}`} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { label: 'Total webinars', value: stats.total, icon: Video },
            { label: 'Your registrations', value: stats.registered, icon: Users },
            { label: 'Topics covered', value: stats.categories, icon: Tag },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-4xl p-5 border border-white/40"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">{stat.label}</p>
                  <p className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-purple-400 opacity-70" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredWebinars.length > 0 ? (
          <motion.div
            key="webinars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 xl:grid-cols-2"
          >
            {filteredWebinars.map((w, index) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.08 }}
                className="glass-card rounded-4xl overflow-hidden hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={w.image}
                    alt={w.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent" />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-purple-600/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.20em] text-white">
                    <Video className="h-3 w-3" />
                    {w.category}
                  </div>
                  <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-sm">
                    {getTimelineStatus(w.date, w.status)}
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 line-clamp-2">{w.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500 line-clamp-3">{w.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span>{formatDate(w.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{w.time} ({w.timezone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{w.registeredCount} registered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{w.availableSeats} seats left</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {w.topics.slice(0, 3).map((topic, index) => (
                      <span key={`${topic}-${index}`} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">{topic}</span>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRegister(w.id)}
                    disabled={registrationLoading[w.id]}
                    className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold text-white transition ${
                      w.isRegistered
                        ? 'bg-linear-to-r from-emerald-600 to-teal-500 hover:shadow-lg'
                        : 'bg-linear-to-r from-purple-600 to-blue-600 hover:shadow-lg'
                    } disabled:opacity-60`}
                  >
                    {registrationLoading[w.id] ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span>{w.isRegistered ? '✓ Registered' : 'Register now'}</span>
                        {!w.isRegistered && <ArrowRight className="h-4 w-4" />}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-4xl p-12 text-center"
          >
            <Video className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No webinars match your search</h3>
            <p className="mt-2 text-slate-500">Try broadening the search term or select another category.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
