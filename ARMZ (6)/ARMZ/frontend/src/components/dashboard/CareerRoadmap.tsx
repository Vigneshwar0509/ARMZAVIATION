import React from "react";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Milestone {
  id: number;
  title: string;
  status: string;
  date: string;
}

interface CareerRoadmapProps {
  milestones: Milestone[];
}

export default function CareerRoadmap({ milestones }: CareerRoadmapProps) {
  return (
    <div className="glass-card p-8 rounded-4xl border-purple-50 shadow-2xl shadow-purple-100/10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900">Career Roadmap</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Your journey to becoming a Captain</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-display font-bold text-purple-600">40%</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
        </div>
      </div>

      <div className="space-y-0 relative">
        {/* Vertical Line */}
        <div className="absolute left-3.75 top-2 bottom-2 w-0.5 bg-slate-100" />

        {milestones.map((milestone, idx) => (
          <div 
            key={milestone.id}
            className="relative pl-12 pb-8 last:pb-0 group"
          >
            {/* Indicator */}
            <div className={cn(
              "absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500",
              milestone.status === 'completed' ? "bg-purple-600 text-white shadow-lg shadow-purple-200" :
              milestone.status === 'in-progress' ? "bg-white border-2 border-purple-600 text-purple-600 animate-pulse" :
              "bg-white border-2 border-slate-200 text-slate-300"
            )}>
              {milestone.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : milestone.status === 'in-progress' ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>

            <div className={cn(
              "p-4 rounded-2xl transition-all duration-300",
              milestone.status === 'in-progress' ? "bg-purple-50/50 border border-purple-100" : "hover:bg-slate-50/50"
            )}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={cn(
                    "font-bold text-sm",
                    milestone.status === 'completed' ? "text-slate-900" :
                    milestone.status === 'in-progress' ? "text-purple-900" :
                    "text-slate-400"
                  )}>
                    {milestone.title}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {milestone.date}
                  </p>
                </div>
                {milestone.status === 'in-progress' && (
                  <button className="text-purple-600 hover:text-purple-700 transition-colors" aria-label="Continue to next milestone">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
        View Full Career Path
      </button>
    </div>
  );
}

