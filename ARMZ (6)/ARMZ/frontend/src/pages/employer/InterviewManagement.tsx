import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  User, 
  ChevronRight, 
  Plus,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import toast from "react-hot-toast";

const interviews = [
  { 
    id: 1, 
    candidate: "Alex Johnson", 
    position: "Senior Captain - A320", 
    date: "2024-03-20", 
    time: "10:00 AM", 
    type: "Online", 
    status: "Upcoming" 
  },
  { 
    id: 2, 
    candidate: "Sarah Williams", 
    position: "Aircraft Engineer", 
    date: "2024-03-20", 
    time: "02:30 PM", 
    type: "Offline", 
    location: "Dubai Office",
    status: "Upcoming" 
  },
  { 
    id: 3, 
    candidate: "Michael Chen", 
    position: "Cabin Crew", 
    date: "2024-03-18", 
    time: "11:00 AM", 
    type: "Online", 
    status: "Completed" 
  },
];

export default function InterviewManagement() {
  const [activeTab, setActiveTab] = useState("Upcoming");

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Interview Schedule</h1>
          <p className="text-slate-500 font-medium">Manage and track your candidate interviews.</p>
        </div>
        <Button className="premium-button-primary px-8 py-6 rounded-2xl">
          <Plus className="h-5 w-5 mr-2" /> Schedule Interview
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Calendar Sidebar (Simplified) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-4xl border-purple-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">March 2024</h3>
              <div className="flex space-x-2">
                <button title="Previous month" aria-label="Previous month" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <button title="Next month" aria-label="Next month" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[18rem]">
                <div className="grid grid-cols-7 gap-2 text-center mb-4">
                  {["S", "M", "T", "W", "T", "F", "S"].map(day => (
                    <span key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {Array.from({ length: 31 }).map((_, i) => (
                    <button 
                      key={i} 
                      className={cn(
                        "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                        i + 1 === 20 ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "hover:bg-purple-50 text-slate-600"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-4xl text-white">
            <h4 className="font-bold mb-4">Interview Tips</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400">Review candidate's flight certifications before the call.</p>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400">Prepare technical questions for A320 systems.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Interviews List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center space-x-4 border-b border-slate-200 pb-4">
            {["Upcoming", "Completed", "Cancelled"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold uppercase tracking-widest pb-2 transition-all relative",
                  activeTab === tab ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {activeTab === tab && <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-purple-600" />}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {interviews.filter(i => i.status === activeTab).map((interview) => (
              <div key={interview.id} className="glass-card p-6 rounded-4xl hover:shadow-xl transition-all duration-500 group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{interview.candidate}</h4>
                      <p className="text-xs text-slate-500 font-medium">{interview.position}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{interview.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{interview.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {interview.type === "Online" ? (
                        <Video className="h-4 w-4 text-purple-600" />
                      ) : (
                        <MapPin className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="text-xs font-bold text-slate-600">{interview.type}</span>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

