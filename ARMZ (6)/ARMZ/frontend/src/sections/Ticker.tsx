import React, { useMemo, useRef } from "react";
import { Plane, GraduationCap, Building2, ArrowRight } from "lucide-react";
import useMarquee from "@/src/hooks/useMarquee";

export default function Ticker() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useMarquee(containerRef, { speed: 25, pauseOnHover: true }, []);

  const tickerItems = useMemo(
    () => [
      {
        icon: <Plane className="h-4 w-4 text-purple-100" />,
        badge: "Aviation News",
        text: "3 New Airlines Get NOCs: Shankh Air • AI Hind Air • FlyExpress launching 2026",
        link: "/contact"
      },
      {
        icon: <Plane className="h-4 w-4 text-purple-100" />,
        badge: "Route Expansion",
        text: "Star Air commits $3.06 Billion — 200+ new UDAN routes opening April–July 2026",
        link: "/contact"
      },
      {
        icon: <Building2 className="h-4 w-4 text-purple-100" />,
        badge: "Recruitment",
        text: "AAI Recruitment portal updated 14 May 2026 — ATC & engineering vacancies live",
        link: "/contact"
      },
      {
        icon: <Plane className="h-4 w-4 text-purple-100" />,
        badge: "Infrastructure",
        text: "200 new modern helipads approved under UDAN 2.0 for remote & hilly regions",
        link: "/contact"
      },
      {
        icon: <Plane className="h-4 w-4 text-purple-100" />,
        badge: "UDAN Update",
        text: "UDAN 2.0 Approved — ₹28,840 Crore for 100 New Airports across India",
        link: "/contact"
      },
      {
        icon: <Building2 className="h-4 w-4 text-purple-100" />,
        badge: "Hiring",
        text: "NIA Aviation Services: Ground Staff vacancies open — May 2026",
        link: "/contact"
      },
      {
        icon: <Plane className="h-4 w-4 text-purple-100" />,
        badge: "Pilot Hiring",
        text: "IndiGo, Air India & Akasa Air actively recruiting hundreds of pilots in 2026",
        link: "/contact"
      },
      {
        icon: <GraduationCap className="h-4 w-4 text-purple-100" />,
        badge: "Salaries",
        text: "First Officer salaries: ₹1.5L–₹2.8L/mo | Captain: ₹5L–₹10L/mo at major carriers",
        link: "/contact"
      },
      {
        icon: <Building2 className="h-4 w-4 text-purple-100" />,
        badge: "AME Demand",
        text: "AME demand surging — MRO expansion at IndiGo, Air India Engineering & GMR",
        link: "/contact"
      },
      {
        icon: <Plane className="h-4 w-4 text-purple-100" />,
        badge: "Vision 2047",
        text: "India to have 350–400 airports by 2047 — Viksit Bharat vision creating lakhs of jobs",
        link: "/contact"
      }
    ],
    []
  );

  return (
    <div className="bg-linear-to-r from-purple-900 via-purple-800 to-indigo-800 border-y border-purple-700/60 h-12 flex items-center overflow-hidden relative z-10">
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-linear-to-r from-purple-900 to-transparent pointer-events-none z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-linear-to-l from-indigo-800 to-transparent pointer-events-none z-20" />
      <div ref={containerRef} className="relative w-full overflow-hidden ticker-marquee">
        <div className="marquee-content flex items-center whitespace-nowrap" style={{ transform: "translate3d(0,0,0)" }}>
          {tickerItems.map((item, i) => (
            <a
              key={i}
              href={item.link}
              className="flex items-center mx-6 sm:mx-12 text-white/95"
            >
              <span className="mr-2 sm:mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90">
                {item.icon}
              </span>
              <span className="bg-white/15 px-2.5 sm:px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mr-2 sm:mr-3 border border-white/10">
                {item.badge}
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-tight flex items-center font-display">
                {item.text} <ArrowRight className="ml-2 h-3 w-3 opacity-70" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}


