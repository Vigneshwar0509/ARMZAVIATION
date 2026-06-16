import React, { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, ArrowRight, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiService } from "@/src/services/api";

type PublicEvent = {
  id: string | number;
  title: string;
  date?: string;
  location?: string;
  type?: string;
  attendees?: number;
  status?: string;
  image?: string;
};

const eventImages: Record<string, string> = {
  webinar: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
  workshop: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200",
  event: "https://images.unsplash.com/photo-1540575861501-7ad058df3283?auto=format&fit=crop&q=80&w=1200",
};

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await apiService.getEvents();
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, []);

  const upcomingEvents = useMemo(() => {
    const sorted = [...events].sort((left, right) => {
      const leftTime = left.date ? new Date(left.date).getTime() : 0;
      const rightTime = right.date ? new Date(right.date).getTime() : 0;
      return leftTime - rightTime;
    });
    return sorted.filter((event) => String(event.status || "Upcoming").toLowerCase() !== "completed");
  }, [events]);

  return (
    <div className="pt-20">
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
              Upcoming <span className="text-purple-600">Events</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Explore live aviation programs, hiring events, webinars, and workshops from the backend schedule.
            </p>
          </div>

          {loading ? (
            <div className="glass-card rounded-4xl p-16 text-center">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading live events...</p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="glass-card rounded-4xl p-16 text-center">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No upcoming events right now</h2>
              <p className="text-slate-500">New events added by the admin team will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => {
                const type = String(event.type || "Event");
                const normalizedType = type.toLowerCase();
                const image = event.image
                  ? event.image
                  : eventImages[normalizedType] || eventImages.event;

                return (
                  <div key={event.id} className="glass-card overflow-hidden group">
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                        {type}
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <h3 className="text-2xl font-bold text-slate-900">{event.title}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-slate-600 font-medium">
                          <Calendar className="h-4 w-4 text-purple-600 mr-3" />
                          {event.date
                            ? new Date(event.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Date to be announced"}
                        </div>
                        <div className="flex items-center text-slate-600 font-medium">
                          <MapPin className="h-4 w-4 text-purple-600 mr-3" />
                          {event.location || "Location to be announced"}
                        </div>
                        <div className="flex items-center text-slate-600 font-medium">
                          <Users className="h-4 w-4 text-purple-600 mr-3" />
                          {Number(event.attendees || 0)} attendees expected
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/register")}
                        className="premium-button-outline w-full py-4 flex items-center justify-center space-x-2"
                      >
                        <span>Register Interest</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
