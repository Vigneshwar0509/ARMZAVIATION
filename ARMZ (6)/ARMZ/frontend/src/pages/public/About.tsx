import React from "react";
import { Award, Users, Globe, ShieldCheck } from "lucide-react";
import aviationImage from "../../assets/about.jpeg";

export default function About() {
  return (
    <div className="pt-12">
      {/* Hero Section */}
      <section className="py-12 bg-transparent text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Who We Are at <span className="text-purple-600">ARMZ AVIATION</span>
          </h1>
          <p 
            className="text-xl text-slate-600 max-w-3xl mx-auto"
          >
            ARMZ AVIATION is a next-generation aviation recruitment and training company built on industry expertise, innovation, and real-world execution.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div 
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900">Our Mission</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                We do not just train candidates. We transform them into job-ready aviation professionals equipped to succeed in global markets.
              </p>
              <div className="pt-4 grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-4xl font-bold text-purple-600">100%</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Placement Support</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-4xl font-bold text-purple-600">2-15 LPA+</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Salary Potential</p>
                </div>
              </div>
            </div>
            <div 
              className="relative"
            >
              <img 
                src={aviationImage} 
                alt="Aviation Excellence" 
                className="rounded-3xl shadow-2xl w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">What Makes Us Different</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Industry-led Training", desc: "Programs designed and reviewed by experienced aviation professionals." },
              { icon: Award, title: "Global Exposure", desc: "Learning pathways connected to international aviation practices and standards." },
              { icon: Users, title: "Skill-based Recruitment", desc: "Selection process focused on practical competency, readiness, and fit." },
              { icon: Globe, title: "Direct Placements", desc: "Structured access to airline, airport, and aeronautical opportunity pipelines." }
            ].map((value, idx) => (
              <div 
                key={idx}
                className="glass-card p-8 text-center space-y-4"
              >
                <div className="inline-flex p-3 bg-purple-50 rounded-xl text-purple-600">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{value.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Candidate Experience & Leadership */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="glass-card p-8 space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">Candidate Experience</h3>
              <p className="text-slate-600 leading-relaxed">At ARMZ, candidates do not just study aviation. They live real-world aviation scenarios through workshops, seminars, live events, and direct interaction with aviation leaders.</p>
              <ul className="text-slate-600 text-sm leading-relaxed list-disc pl-5 space-y-1">
                <li>Industry-level training environment</li>
                <li>Real-world aviation scenarios</li>
                <li>Workshops, seminars, and live events</li>
                <li>Direct interaction with aviation leaders</li>
              </ul>
            </div>
            <div className="glass-card p-8 space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">Leadership</h3>
              <p className="text-purple-600 font-bold">Sri Nitya Ramakrishnan, CEO - ARMZ AVIATION</p>
              <p className="text-slate-600 leading-relaxed">A visionary aviation leader with international airport experience, flight operations management expertise, and over a decade in aviation and academic leadership.</p>
              <ul className="text-slate-600 text-sm leading-relaxed list-disc pl-5 space-y-1">
                <li>International airport exposure (including Heathrow, UK)</li>
                <li>Flight operations and charter management expertise</li>
                <li>Mission-driven focus to bridge education and aviation careers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
