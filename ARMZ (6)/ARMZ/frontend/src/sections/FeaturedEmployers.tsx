import React from "react";
import { motion, Variants } from "framer-motion";
import airbusLogo from "@/src/assets/airbus.jpeg";
import boeingLogo from "@/src/assets/boeing.jpeg";
import indigoLogo from "@/src/assets/indigo.jpeg";
import nasaLogo from "@/src/assets/nasa.jpeg";
import vistaraLogo from "@/src/assets/vistara.jpeg";

const partners = [
  { name: "Airbus", logo: airbusLogo },
  { name: "Boeing", logo: boeingLogo },
  { name: "IndiGo", logo: indigoLogo },
  { name: "Vistara", logo: vistaraLogo },
  { name: "NASA", logo: nasaLogo },
  { name: "Airbus", logo: airbusLogo },
  { name: "Boeing", logo: boeingLogo },
  { name: "IndiGo", logo: indigoLogo },
  { name: "Vistara", logo: vistaraLogo },
  { name: "NASA", logo: nasaLogo },
];

const marqueeVariants: Variants = {
  animate: {
    x: [0, "-50%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 40, // Adjust duration for speed
        ease: "linear",
      },
    },
  },
};

export default function FeaturedEmployers() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-linear-to-b from-white to-purple-50/50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/60 to-transparent" />
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
            <h3 className="text-xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
              Powering Careers at Top Companies
            </h3>
            <p className="text-gray-500 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
              Trusted hiring partnerships across airlines, aerospace leaders, and global aviation brands.
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Trusted by Industry Leaders
            </p>
          </div>
          <div className="relative h-20 sm:h-[104px] overflow-x-hidden rounded-2xl sm:rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-2">
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-20 bg-linear-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-20 bg-linear-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />
            <motion.div
              className="absolute left-0 flex gap-8 sm:gap-16 lg:gap-20 items-center h-full"
              variants={marqueeVariants}
              animate="animate"
            >
              {[...partners, ...partners].map((partner, i) => (
                <div key={i} className="shrink-0 w-32 sm:w-40 lg:w-52 h-16 sm:h-20 lg:h-24 flex items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-300">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-8 sm:max-h-10 lg:max-h-12 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}