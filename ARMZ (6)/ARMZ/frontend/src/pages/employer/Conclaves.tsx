import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Building2,
  Download,
  X,
  Ticket,
  Share2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/src/store/authStore";
import { useLeadCapture } from "@/src/hooks/useLeadCapture";
import { getSubscriptionRouteForRole, hasActiveSubscription } from "@/src/lib/subscription";
import apiService from "@/src/services/api";

type EventRecord = {
  id: number | string;
  title: string;
  date?: string;
  location?: string;
  attendees?: number;
  status?: string;
  type?: string;
};

type RegistrationRecord = {
  id: number | string;
  eventId: number | string;
  registrationCode: string;
  registeredAt?: string;
};

type Conclave = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  description: string;
  attendees: number;
  maxAttendees: number;
  type: "career-fair" | "networking" | "workshop" | "conclave";
  status: "upcoming" | "ongoing" | "completed";
  image: string;
  highlights: string[];
  isRegistered: boolean;
  registrationId?: string;
};

const typeImages: Record<string, string> = {
  webinar: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
  workshop: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80",
  conclave: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
  "career-fair": "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&q=80",
  networking: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200&q=80",
  event: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
};

const eventTypeToConclaveType = (value?: string): Conclave["type"] => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("workshop")) return "workshop";
  if (normalized.includes("network")) return "networking";
  if (normalized.includes("fair")) return "career-fair";
  if (normalized.includes("conclave")) return "conclave";
  return "conclave";
};

const eventStatusToConclaveStatus = (value?: string): Conclave["status"] => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("live") || normalized.includes("ongoing")) return "ongoing";
  if (normalized.includes("completed")) return "completed";
  return "upcoming";
};

const buildHighlights = (type: Conclave["type"]) => {
  switch (type) {
    case "career-fair":
      return ["Live recruiter access", "Priority interview slots", "Employer networking"];
    case "networking":
      return ["Industry introductions", "Hiring partnerships", "Leadership roundtables"];
    case "workshop":
      return ["Skill-focused sessions", "Interactive Q&A", "Practical recruitment insights"];
    default:
      return ["Aviation talent access", "Recruitment meetings", "Brand visibility"];
  }
};

const buildDescription = (event: EventRecord, type: Conclave["type"]) => {
  const location = event.location || "your selected city";
  if (type === "career-fair") {
    return `Meet aviation candidates and hiring partners in ${location} through a live employer-focused recruitment fair.`;
  }
  if (type === "networking") {
    return `Join a focused networking session in ${location} to connect with aviation HR leaders and recruitment teams.`;
  }
  if (type === "workshop") {
    return `Attend a live workshop in ${location} covering practical hiring and employer branding strategies for aviation roles.`;
  }
  return `Participate in this live aviation conclave in ${location} to meet talent and expand your hiring pipeline.`;
};

export default function Conclaves() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { captureConclaveRegistration } = useLeadCapture();
  const [conclaves, setConclaves] = useState<Conclave[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "registered" | "completed">("all");
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedConclave, setSelectedConclave] = useState<Conclave | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const loadConclaves = async () => {
    if (!user?.id) {
      setConclaves([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [eventsResponse, registrationsResponse] = await Promise.all([
        apiService.getEvents(),
        apiService.getEventRegistrations(String(user.id)),
      ]);

      const events: EventRecord[] = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      const registrations: RegistrationRecord[] = Array.isArray(registrationsResponse.data)
        ? registrationsResponse.data
        : [];
      const registrationMap = new Map(
        registrations.map((registration) => [String(registration.eventId), registration])
      );

      const mappedConclaves = events.map((event) => {
        const type = eventTypeToConclaveType(event.type);
        const registration = registrationMap.get(String(event.id));
        const attendeeBase = Number(event.attendees ?? 0);
        const maxAttendees = Math.max(attendeeBase + 10, 50);

        return {
          id: String(event.id),
          title: event.title,
          date: event.date || "",
          time: "10:00 AM onwards",
          location: event.location || "Location to be announced",
          venue: event.location || "Venue to be announced",
          description: buildDescription(event, type),
          attendees: attendeeBase + (registration ? 1 : 0),
          maxAttendees,
          type,
          status: eventStatusToConclaveStatus(event.status),
          image: typeImages[String(event.type || "").toLowerCase()] || typeImages[type] || typeImages.event,
          highlights: buildHighlights(type),
          isRegistered: Boolean(registration),
          registrationId: registration?.registrationCode,
        } satisfies Conclave;
      });

      setConclaves(mappedConclaves);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
        sessionStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return;
      }
      toast.error("Unable to load events right now");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConclaves();
  }, [user?.id]);

  const filteredConclaves = useMemo(() => {
    return conclaves.filter((conclave) => {
      if (filter === "all") return true;
      if (filter === "registered") return conclave.isRegistered;
      if (filter === "upcoming") return conclave.status === "upcoming" || conclave.status === "ongoing";
      if (filter === "completed") return conclave.status === "completed";
      return true;
    });
  }, [conclaves, filter]);

  const handleRegister = (conclave: Conclave) => {
    if (!hasActiveSubscription(user as any)) {
      toast.error("Event slot booking requires an active employer plan.");
      navigate(getSubscriptionRouteForRole("employer"));
      return;
    }

    captureConclaveRegistration(conclave.title);
    setSelectedConclave(conclave);
    setShowRegisterModal(true);
  };

  const submitRegistration = async () => {
    if (!selectedConclave || !user?.id) return;

    setIsRegistering(true);
    try {
      const response = await apiService.registerForEvent(selectedConclave.id, String(user.id));
      const registrationCode = response.data?.registration?.registration_code ?? response.data?.registration?.registrationCode;

      toast.success("Successfully registered. Your employer pass is ready.");
      setShowRegisterModal(false);
      await loadConclaves();
      setSelectedConclave((current) =>
        current
          ? {
              ...current,
              isRegistered: true,
              registrationId: registrationCode,
            }
          : current
      );
      setShowPassModal(true);
    } catch (error) {
      toast.error("Registration could not be completed");
    } finally {
      setIsRegistering(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "conclave":
        return "bg-purple-100 text-purple-700";
      case "career-fair":
        return "bg-blue-100 text-blue-700";
      case "workshop":
        return "bg-amber-100 text-amber-700";
      case "networking":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Upcoming</span>;
      case "ongoing":
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full animate-pulse">Ongoing</span>;
      case "completed":
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showPassModal && selectedConclave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPassModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="glass-card w-full max-w-md p-8 rounded-4xl text-center"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-green-500 to-emerald-500 rounded-t-4xl" />

              <button
                onClick={() => setShowPassModal(false)}
                aria-label="Close registration confirmation"
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>

              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Confirmed</h2>
              <p className="text-slate-500 mb-6">{selectedConclave.title}</p>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 inline-block mb-6">
                <div className="h-48 w-48 bg-slate-100 rounded-xl flex items-center justify-center relative">
                  <QrCode className="h-32 w-32 text-slate-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="text-xs text-slate-500 mb-1">Registration ID</div>
                <div className="font-mono font-bold text-slate-900">{selectedConclave.registrationId || "Pending"}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedConclave.registrationId || "");
                    toast.success("Registration ID copied");
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Copy ID
                </button>
                <button
                  onClick={() => toast.success("Employer pass download will be enabled in a follow-up pass.")}
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRegisterModal && selectedConclave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="glass-card w-full max-w-lg p-8 rounded-4xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-purple-500 to-indigo-500 rounded-t-4xl" />

              <button
                onClick={() => setShowRegisterModal(false)}
                aria-label="Close event registration"
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Register for Event</h2>
              <p className="text-slate-500 mb-6">{selectedConclave.title}</p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="font-medium text-slate-900">
                      {selectedConclave.date
                        ? new Date(selectedConclave.date).toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "To be announced"}{" "}
                      | {selectedConclave.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Venue</div>
                    <div className="font-medium text-slate-900">{selectedConclave.venue}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Users className="h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Availability</div>
                    <div className="font-medium text-slate-900">
                      {Math.max(0, selectedConclave.maxAttendees - selectedConclave.attendees)} spots remaining
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-slate-900 mb-2">Registration includes:</h4>
                <ul className="space-y-1.5">
                  {selectedConclave.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => void submitRegistration()}
                disabled={isRegistering}
                className="w-full py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isRegistering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ticket className="h-5 w-5" />}
                {isRegistering ? "Processing..." : "Confirm Registration"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Conclaves & Events</h1>
        <p className="text-slate-500 mt-1">Browse live event listings and register employers through the backend.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "upcoming", "registered", "completed"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              filter === value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {value === "all" ? "All Events" : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading live employer events...</p>
        </div>
      ) : filteredConclaves.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No events found</h3>
          <p className="text-slate-500">Check back later for upcoming conclaves and employer events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredConclaves.map((conclave, index) => (
            <motion.div
              key={conclave.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="relative h-48">
                <img src={conclave.image} alt={conclave.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(conclave.type)}`}>
                    {conclave.type.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </span>
                  {getStatusBadge(conclave.status)}
                </div>
                {conclave.isRegistered && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Registered
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white line-clamp-2">{conclave.title}</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {conclave.date
                      ? new Date(conclave.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "TBA"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {conclave.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {conclave.location}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{conclave.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {conclave.highlights.slice(0, 3).map((highlight, highlightIndex) => (
                    <span key={highlightIndex} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {conclave.attendees}/{conclave.maxAttendees} employers
                    </span>
                    {conclave.attendees >= conclave.maxAttendees && (
                      <span className="text-xs text-red-600 font-medium">Full</span>
                    )}
                  </div>

                  {conclave.isRegistered ? (
                    <button
                      onClick={() => {
                        setSelectedConclave(conclave);
                        setShowPassModal(true);
                      }}
                      className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      View Pass
                    </button>
                  ) : conclave.status === "completed" ? (
                    <span className="text-sm text-slate-400">Event ended</span>
                  ) : conclave.attendees >= conclave.maxAttendees ? (
                    <span className="text-sm text-red-600 font-medium">Sold Out</span>
                  ) : (
                    <button
                      onClick={() => handleRegister(conclave)}
                      className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      Register <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
