import React, { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Award, MapPin, Users, GraduationCap } from "lucide-react";

// 1. Animated Counter Component
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(Math.floor(latest)) + suffix;
      }
    });
  }, [springValue, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const statsData = [
  { id: 1, label: "Active Students", value: 5000, suffix: "+", icon: Users },
  { id: 2, label: "Hiring Partners", value: 50, suffix: "+", icon: MapPin },
  { id: 3, label: "Placement Assistance", value: 100, suffix: "%", icon: Award },
  { id: 4, label: "Training Programs", value: 15, suffix: "+", icon: GraduationCap },
];

export default function Stats() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/60 to-transparent" />
      <div className="absolute -top-16 sm:-top-28 right-0 w-20 sm:w-30 h-20 sm:h-30 rounded-full bg-purple-300/10 blur-[80px] sm:blur-[110px] pointer-events-none" />
      
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">Platform Impact</h2>
            <p className="mt-2 sm:mt-4 text-slate-500 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
              Empowering the next generation of aviation professionals with real-world opportunities and expert training.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {statsData.map((stat, i) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-white/70 backdrop-blur-xl rounded-lg sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95"
              >
                {/* Subtle background glow on hover */}
                <div className="absolute inset-0 bg-linear-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 text-center">
                  <div className="h-12 sm:h-14 lg:h-16 w-12 sm:w-14 lg:w-16 bg-linear-to-r from-purple-600 to-indigo-500 rounded-lg sm:rounded-2xl flex items-center justify-center text-white mb-3 sm:mb-4 lg:mb-6 mx-auto shadow-[0_10px_40px_rgba(0,0,0,0.08)] group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="h-5 sm:h-6 lg:h-8 w-5 sm:w-6 lg:w-8" />
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-display font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </h3>
                  
                  <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider leading-relaxed">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
