import React from "react";
import { School, Users, GraduationCap } from "lucide-react";

export default function CollegeCollaboration() {
  return (
    <div className="pt-20">
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                <School className="h-3 w-3" />
                <span>Academic Partnerships</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
                Empowering the Next Generation of <span className="text-indigo-600">SKY LEADERS</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
               India's aviation sector is growing at record pace.For freshers entering aviation, upskilling is not optional — it is the entry ticket. ARMZ Aviation provides structured pathways to bridge the gap between education and employment, ensuring every candidate is industry-ready before stepping into interviews.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: GraduationCap, title: "Curriculum Design", desc: "Industry-aligned course modules for students." },
                  { icon: Users, title: "Campus Drives", desc: "Exclusive placement opportunities for partners." }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 glass-card space-y-3">
                    <item.icon className="h-6 w-6 text-indigo-600" />
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
              <button className="premium-button-primary px-10 py-4">
                Partner with Us
              </button>
            </div>
            <div 
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800" 
                alt="College Collaboration" 
                className="rounded-[40px] shadow-2xl w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
