import React, { useEffect, useState } from "react";
import { Plane, GraduationCap, Building2, ArrowRight } from "lucide-react";
import { apiService } from "@/src/services/api";

export default function Ticker() {
  const [latestJob, setLatestJob] = useState<any>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await apiService.getJobs();
        if (res.data && res.data.length > 0) {
          setLatestJob(res.data[0]);
        }
      } catch (error) {
        // Keep fallback ticker text without polluting the console in frontend-only mode.
      }
    };
    fetchLatest();
  }, []);

  const tickerItems = [
    {
      icon: <Plane className="h-4 w-4 text-purple-100" />,
      badge: "Latest Job",
      text: latestJob ? `${latestJob.title} - ${latestJob.company}` : "Chief Manager - IOCC - Apply Now",
      link: latestJob ? `/jobs/${latestJob.id}` : "/jobs"
    },
    {
      icon: <GraduationCap className="h-4 w-4 text-purple-100" />,
      badge: "OJT & Internship",
      text: "On-the-Job Training and Internship support now open across aviation streams",
      link: "/programs"
    },
    {
      icon: <Building2 className="h-4 w-4 text-purple-100" />,
      badge: "Market Insight",
      text: "India is among the top 3 domestic aviation markets with accelerated hiring demand",
      link: "/contact"
    }
  ];

  return (
    <div className="bg-linear-to-r from-purple-900 via-purple-800 to-indigo-800 border-y border-purple-700/60 h-12 flex items-center overflow-hidden relative z-10">
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-linear-to-r from-purple-900 to-transparent pointer-events-none z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-linear-to-l from-indigo-800 to-transparent pointer-events-none z-20" />
      <div className="ticker-marquee flex whitespace-nowrap items-center animate-marquee transition-all duration-300 ease-in-out">
        {/* Duplicate items for seamless loop */}
        {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
          <div key={i} className="flex items-center mx-6 sm:mx-12 text-white/95 transition-opacity duration-300 hover:opacity-100">
            <span className="mr-2 sm:mr-3">{item.icon}</span>
            <span className="bg-white/15 px-2.5 sm:px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mr-2 sm:mr-3 backdrop-blur-sm border border-white/10">
              {item.badge}
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-tight flex items-center font-display transition-all duration-300 ease-in-out">
              {item.text} <ArrowRight className="ml-2 h-3 w-3 opacity-70" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
