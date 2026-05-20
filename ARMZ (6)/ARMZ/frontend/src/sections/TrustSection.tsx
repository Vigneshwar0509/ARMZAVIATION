import React from "react";
import { Shield, Globe, Users, ShieldCheck, Star } from "lucide-react";

const features = [
  {
    title: "Verified Aviation Jobs",
    description: "Direct hiring pathways, airport and airline drives tailored for fresh graduates and professionals.",
    icon: Shield,
  },
  {
    title: "Premium Training",
    description: "Industry-standard training, global internships, webinars, and certification programs led by experts.",
    icon: Globe,
  },
  {
    title: "Profile Building",
    description: "Comprehensive resume builder, LinkedIn profile optimization, and expert interview preparation.",
    icon: Users,
  },
  {
    title: "100% Placement Support",
    description: "End-to-end guidance from enrollment to stepping into your first aviation role with top employers.",
    icon: ShieldCheck,
  },
];

export default function TrustSection() {
  return (
    <section className="py-12 overflow-hidden relative bg-linear-to-b from-white to-purple-50/40">
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/60 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-stretch">
          
          {/* Left: Trust Score Card */}
          <div 
            className="lg:w-1/3 bg-white/70 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 relative transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl"
          >
            <h3 className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-[0.2em] mb-4">Platform Rating</h3>
            
            <div className="flex space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-[#d4af37] text-[#d4af37]" />
              ))}
            </div>
            
            <div className="text-4xl font-display font-bold bg-linear-to-r from-purple-600 to-indigo-500 text-transparent bg-clip-text mb-1 tracking-tight">4.9<span className="text-xl text-slate-300">/5</span></div>
            <div className="text-[10px] font-mono font-medium text-slate-400 mb-4 uppercase tracking-widest">Student Satisfaction</div>
            
            <div className="text-[10px] font-mono font-medium text-slate-300 uppercase tracking-[0.3em]">
              Trusted by 5000+ Students
            </div>
          </div>

          {/* Right: Features Grid */}
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 ease-in-out group hover:scale-[1.02] hover:shadow-xl hover:border-purple-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-linear-to-r from-purple-600 to-indigo-500 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out group-hover:shadow-xl">
                    <feature.icon className="h-5 w-5 text-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-semibold tracking-tight text-slate-900">{feature.title}</h4>
                    <p className="text-gray-500 leading-relaxed text-sm">
                      {feature.description}
                    </p>
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
