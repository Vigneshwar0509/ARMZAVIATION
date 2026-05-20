import React from "react";
import { Plane, Quote, Star } from "lucide-react";

interface Testimonial {
  quote: string;
  outcome: string;
  region: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "At ARMZ, I learned to perform under time pressure while balancing exams and OJT. The environment felt exactly like the real aviation floor.",
    outcome: "Job-ready confidence",
    region: "Airport Operations"
  },
  {
    quote: "Workshops, seminars, and live sessions with aviation leaders gave me practical clarity beyond classroom learning.",
    outcome: "Industry-level readiness",
    region: "Training Experience"
  },
  {
    quote: "From profile and logbook building to interview preparation, every step was guided. I entered interviews with clear direction.",
    outcome: "Interview-ready profile",
    region: "Career Acceleration"
  },
  {
    quote: "ARMZ transformed me from a fresher into an industry-ready aviation professional before my first job offer.",
    outcome: "Career transformation",
    region: "Placement Journey"
  }
];

export default function VoicesFromFlightDeck() {
  return (
    <section className="relative py-24 bg-transparent overflow-hidden">

      {/* PREMIUM LIGHT GRADIENT ORBS (NO IMAGE) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-31.25 h-31.25 bg-purple-400/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-12.5 w-31.25 h-31.25 bg-indigo-400/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* HEADER */}
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Voices From the{" "}
            <span className="bg-linear-to-r from-purple-600 to-indigo-500 text-transparent bg-clip-text">
              Flight Deck
            </span>
          </h2>

          <p className="mt-6 text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
            At ARMZ, candidates do not just study aviation. They live it through practical training, real scenarios, and direct industry exposure.
          </p>

          {/* PREMIUM RATING */}
          <div className="flex items-center justify-center mt-8 gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-transparent fill-current bg-linear-to-r from-purple-600 to-indigo-500 bg-clip-text drop-shadow-sm" />
            ))}
            <span className="text-sm text-gray-500 font-semibold ml-2 tracking-wide">
              Real candidate transformation stories
            </span>
          </div>
        </div>

        {/* REVIEWS LANE */}
        <div className="relative py-4 overflow-hidden">
          <div className="flex gap-8 w-max animate-marquee hover:[animation-play-state:paused] pb-6">

            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="group w-90 md:w-115 shrink-0 p-px rounded-3xl bg-linear-to-br from-purple-500/30 via-indigo-500/20 to-transparent transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="relative h-full rounded-3xl p-8 backdrop-blur-2xl bg-white/70 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col justify-between overflow-hidden">

                  {/* subtle hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-linear-to-br from-purple-500/10 via-transparent to-indigo-500/10" />

                  {/* TOP */}
                  <div className="space-y-6 relative z-10">

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Plane className="w-4 h-4 text-purple-600" />
                        Client Review
                      </div>

                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50/80 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                        ✔ Verified
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-purple-100/60 flex items-center justify-center shrink-0">
                        <Quote className="w-6 h-6 text-purple-300" />
                      </div>
                      <p className="text-gray-800 text-lg font-semibold leading-relaxed tracking-tight">
                        “{t.quote}”
                      </p>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="mt-10 pt-6 border-t border-gray-200/60 flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        Outcome
                      </p>
                      <p className="text-purple-700 font-bold text-base mt-1">
                        {t.outcome}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        Region
                      </p>
                      <p className="text-gray-900 font-bold text-base mt-1">
                        {t.region}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}