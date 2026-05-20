import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { apiService } from "@/src/services/api";
import { GlassCard } from "@/src/components/common/GlassCard";
import { Button } from "@/src/components/ui/Button";
import toast from "react-hot-toast";

interface WebinarRegistration {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  registeredAt?: string;
  user_full_name?: string;
  user_email?: string;
}

export default function AdminWebinarRegistrations() {
  const navigate = useNavigate();
  const { webinarId } = useParams<{ webinarId: string }>();
  const [registrations, setRegistrations] = useState<WebinarRegistration[]>([]);
  const [webinarTitle, setWebinarTitle] = useState("Webinar");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!webinarId) {
      setError("No webinar selected.");
      setIsLoading(false);
      return;
    }

    const loadRegistrations = async () => {
      try {
        setIsLoading(true);
        const [webinarsRes, registrationsRes] = await Promise.all([
          apiService.getWebinars(),
          apiService.getWebinarRegistrationList(webinarId),
        ]);

        const webinars = Array.isArray(webinarsRes.data?.webinars) ? webinarsRes.data.webinars : [];
        const webinar = webinars.find((item) => String(item.id) === webinarId);
        if (webinar) {
          setWebinarTitle(webinar.title || "Webinar");
        }

        const registrationsData = Array.isArray(registrationsRes.data) ? registrationsRes.data : [];
        setRegistrations(registrationsData.map((item: any) => ({
          id: String(item.id),
          userId: item.user_id ? String(item.user_id) : item.userId,
          userName: item.user_full_name || item.userName || item.user_name,
          userEmail: item.user_email || item.userEmail || item.email,
          registeredAt: item.registered_at || item.registeredAt,
        })));
      } catch (fetchError) {
        console.error("Failed to load webinar registrations:", fetchError);
        setError("Could not load webinar registrations.");
        toast.error("Unable to load webinar registrations.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRegistrations();
  }, [webinarId]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-600 font-bold">Admin webinar management</p>
          <h1 className="mt-2 text-4xl font-display font-bold text-slate-900 tracking-tight">{webinarTitle} registrations</h1>
          <p className="mt-3 max-w-2xl text-slate-500">Review all students registered for the webinar and export or manage attendance.</p>
        </div>
        <Button variant="secondary" type="button" onClick={() => navigate("/admin/events")}> 
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.65fr_0.35fr] gap-6">
        <GlassCard className="rounded-4xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400 font-bold">Registrations</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{registrations.length} registered</h2>
            </div>
            <div className="rounded-3xl bg-purple-50 px-4 py-3 text-purple-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Students who have signed up for this webinar are listed below. Use the list to confirm attendance or contact registrants.</p>
        </GlassCard>

        <GlassCard className="rounded-4xl p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400 font-bold">Webinar details</p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Webinar</p>
              <p className="mt-2 text-slate-900 font-semibold">{webinarTitle}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Registrations</p>
              <p className="mt-2 text-slate-900 font-semibold">{registrations.length}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="rounded-4xl p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p>Loading registrations...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : registrations.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No students have registered for this webinar yet.</div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <div key={registration.id} className="rounded-[32px] border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{registration.userName || registration.userEmail || "Student"}</p>
                    <p className="text-sm text-slate-500">{registration.userEmail || "No email provided"}</p>
                  </div>
                  <p className="text-sm text-slate-500">Registered on {registration.registeredAt ? new Date(registration.registeredAt).toLocaleString() : "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
