import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, MapPin, Users, Edit, Trash, Loader2, X, Search, Download } from "lucide-react";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";
import { GlassCard } from "@/src/components/common/GlassCard";

interface AdminEvent {
  id: string;
  title: string;
  type: "Event" | "Webinar" | string;
  date: string;
  attendees: number;
  status: "Upcoming" | "Live" | "Completed" | string;
  description?: string;
  category?: string;
  meetingLink?: string;
}

const statusVariants = {
  Live: "bg-red-100 text-red-600 animate-pulse",
  Upcoming: "bg-blue-100 text-blue-600",
  Completed: "bg-slate-100 text-slate-600",
};

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [formType, setFormType] = useState<"Event" | "Webinar">("Event");

  const loadPrograms = async () => {
    try {
      setIsLoading(true);
      const [eventsRes, webinarsRes] = await Promise.all([apiService.getEvents(), apiService.getWebinars()]);
      const eventsData: AdminEvent[] = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const webinarsData: any[] = Array.isArray(webinarsRes.data?.webinars) ? webinarsRes.data.webinars : [];

      const webinarPrograms: AdminEvent[] = webinarsData.map((item) => ({
        id: String(item.id),
        title: item.title,
        type: "Webinar",
        date: item.start_time || item.date || "",
        attendees: Number(item.registrations_count ?? 0),
        status: item.status || "Upcoming",
      }));

      setEvents([...eventsData, ...webinarPrograms]);
    } catch (error) {
      console.error("Fetch programs error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const queryMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = selectedType === "All" || item.type === selectedType;
      const statusMatch = selectedStatus === "All" || item.status === selectedStatus;
      return queryMatch && typeMatch && statusMatch;
    });
  }, [events, searchQuery, selectedType, selectedStatus]);

  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((item) => item.status === "Upcoming").length,
      live: events.filter((item) => item.status === "Live").length,
      webinars: events.filter((item) => item.type === "Webinar").length,
    }),
    [events]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formElem = e.currentTarget;
    const formData = new FormData(formElem);
    // keep FormData for file upload for Events. For Webinars send JSON.
    let webinarJson: any = null;
    if (formType === "Webinar") {
      webinarJson = {
        title: formData.get("title") as string,
        type: formData.get("type") as string,
        date: formData.get("date") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        meeting_link: formData.get("meeting_link") as string,
        start_time: formData.get("date") as string,
      };
    } else {
      if (!formData.has("attendees")) formData.append("attendees", "0");
      if (!formData.has("status")) formData.append("status", "Upcoming");
    }

    try {
      if (formType === "Webinar") {
        if (editingEvent) {
          await apiService.updateWebinar(editingEvent.id, webinarJson);
          toast.success("Webinar updated successfully!");
        } else {
          await apiService.createWebinar(webinarJson);
          toast.success("Webinar created successfully!");
        }
      } else {
        if (editingEvent) {
          await apiService.updateEvent(editingEvent.id, formData);
          toast.success("Event updated successfully!");
        } else {
          await apiService.createEvent(formData);
          toast.success("Event created successfully!");
        }
      }
      setEditingEvent(null);
      setIsModalOpen(false);
      await loadPrograms();
    } catch (error) {
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) return;

    try {
      if (type === "Webinar") {
        await apiService.deleteWebinar(id);
        toast.success("Webinar deleted successfully!");
      } else {
        await apiService.deleteEvent(id);
        toast.success("Event deleted successfully!");
      }
      await loadPrograms();
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };


  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-600 font-bold">Events & webinars</p>
          <h1 className="mt-2 text-4xl font-display font-bold text-slate-900 tracking-tight">Program scheduler</h1>
          <p className="mt-3 max-w-2xl text-slate-500">Create, publish, and track every event or live session with a single dashboard.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setFormType("Event");
              setIsModalOpen(true);
            }}
            className="premium-button-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create event
          </button>
          <button className="glass-card inline-flex items-center gap-2 px-5 py-3 text-sm text-slate-700 border border-slate-200">
            <Download className="h-4 w-4 text-purple-600" />
            Export schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="rounded-4xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">Total programs</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{stats.total}</p>
        </GlassCard>
        <GlassCard className="rounded-4xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">Upcoming</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{stats.upcoming}</p>
        </GlassCard>
        <GlassCard className="rounded-4xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">Live now</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{stats.live}</p>
        </GlassCard>
        <GlassCard className="rounded-4xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">Webinars</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">{stats.webinars}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <GlassCard className="rounded-4xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">Search schedule</p>
              <h2 className="text-xl font-semibold text-slate-900">Filter by program or status</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, webinars..."
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <select
                aria-label="Filter programs by type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                {['All', 'Event', 'Webinar'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="rounded-4xl p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400 font-bold">Quick status</p>
          <div className="mt-5 grid gap-3">
            {['All', 'Upcoming', 'Live', 'Completed'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  selectedStatus === status
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}>
                {status}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <GlassCard className="rounded-4xl text-center py-20">
            <Calendar className="h-14 w-14 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No matching events found. Use filters to refine your schedule.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            <div className="hidden lg:block glass-card rounded-4xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-[0.24em]">
                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Title</th>
                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Type</th>
                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Attendees</th>
                    <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white">
                  {filteredEvents.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 sm:px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">{item.title}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 whitespace-nowrap">{item.type}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 whitespace-nowrap">{item.date}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 whitespace-nowrap">{item.attendees}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${statusVariants[item.status as keyof typeof statusVariants] ?? statusVariants.Completed}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(item);
                              setFormType(item.type as "Event" | "Webinar");
                              setIsModalOpen(true);
                            }}
                            title="Edit event"
                            aria-label="Edit event"
                            className="text-slate-400 hover:text-purple-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {item.type === "Webinar" && (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/webinars/${item.id}/registrations`)}
                              title="View registrations"
                              aria-label="View registrations"
                              className="text-slate-400 hover:text-slate-900"
                            >
                              <Users className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.type)}
                            title={`Delete ${item.type.toLowerCase()}`}
                            aria-label={`Delete ${item.type.toLowerCase()}`}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {filteredEvents.map((item) => (
                <GlassCard key={item.id} className="rounded-4xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-[0.18em]">{item.type}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.date}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${statusVariants[item.status as keyof typeof statusVariants] ?? statusVariants.Completed}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                    <div className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>{item.attendees} attendees</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{item.type}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(item);
                        setIsModalOpen(true);
                      }}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    {item.type === "Webinar" && (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/webinars/${item.id}/registrations`)}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Registrations
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.type)}
                      className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-8 space-y-8 relative shadow-2xl shadow-slate-200/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              title="Close form"
              aria-label="Close form"
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-purple-600 font-bold">Program form</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {editingEvent ? "Update schedule item" : `Create a new ${formType.toLowerCase()}`}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                <input
                  name="title"
                  defaultValue={editingEvent?.title}
                  required
                  className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder={formType === "Webinar" ? "Aviation Webinar Series" : "Aviation Leadership Summit"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image (optional)</label>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0] ?? null;
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  className="w-full text-sm text-slate-700"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover rounded-2xl border" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="event-type" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
                  <select
                    id="event-type"
                    name="type"
                    aria-label="Event type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "Event" | "Webinar")}
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="Event">Event</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="event-date" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {formType === "Webinar" ? "Start Date & Time" : "Date"}
                  </label>
                  <input
                    id="event-date"
                    name="date"
                    type={formType === "Webinar" ? "datetime-local" : "date"}
                    title={formType === "Webinar" ? "Webinar start date and time" : "Event date"}
                    defaultValue={editingEvent?.date}
                    required
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              {formType === "Webinar" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingEvent?.description || ""}
                      required
                      rows={3}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 resize-none"
                      placeholder="Detailed description of the webinar content and learning objectives"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                      <input
                        name="category"
                        defaultValue={editingEvent?.category || ""}
                        required
                        className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        placeholder="Aviation, Pilot Training, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Link</label>
                      <input
                        name="meeting_link"
                        type="url"
                        defaultValue={editingEvent?.meetingLink || ""}
                        required
                        className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendees</label>
                    <input
                      name="attendees"
                      type="number"
                      defaultValue={editingEvent?.attendees}
                      required
                      className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                      placeholder="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="event-status" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select
                      id="event-status"
                      name="status"
                      aria-label="Event status"
                      defaultValue={editingEvent?.status || "Upcoming"}
                      className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Live">Live</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-purple-600 text-white font-bold transition hover:bg-purple-700 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  editingEvent ? "Save changes" : `Create ${formType.toLowerCase()}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
