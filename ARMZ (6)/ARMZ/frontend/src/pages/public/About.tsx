import React from "react";
import { Linkedin } from "lucide-react";
import aviationImage from "../../assets/about.jpeg";

// Replace these imports with your own local team portrait images in frontend/src/assets
// Avoid logos; use face/team photos for best results.
import team1 from "../../assets/ceo.jpeg";
import team2 from "../../assets/operation.jpeg";
import team3 from "../../assets/vicky.jpeg";
import team4 from "../../assets/fai.jpeg";
import team5 from "../../assets/mohan.jpeg";
import team6 from "../../assets/suraj.jpeg";
import team7 from "../../assets/nive.jpeg";
// import team8 from "../../assets/airbus.jpeg";
// import team9 from "../../assets/boeing.jpeg";
// import team10 from "../../assets/indigo.jpeg";

export default function About() {
  const teamMembers = [
    { name: "Mrs. Nitya Ramakrishnan", role: "Founder & CEO", image: team1, linkedin: "https://linkedin.com" },
    { name: "Mrs. Nithiyapriya Manisekar", role: "Chief Operations Officer", image: team2, linkedin: "https://linkedin.com" },
    { name: "Mr. Vigneshwar R", role: "Chief Product Officer", image: team3, linkedin: "https://linkedin.com" },
    {
      name: "Mr. Faimuddin M",
      role: "Chief Aviation Officer",
      image: team4,
      linkedin: "https://linkedin.com",
      imageStyle: { objectPosition: "50% 30%", transform: "scale(0.94)" },
    },
    {
      name: "Mr. Mohanakrishnan Pandurangan",
      role: "Chief Administrative Officer",
      image: team5,
      linkedin: "https://linkedin.com",
      imageStyle: { objectPosition: "50% 38%", transform: "scale(0.98)" },
    },
    {
      name: "Mr. Suraj E",
      role: "Technical Support",
      image: team6,
      linkedin: "https://linkedin.com",
      imageStyle: { objectPosition: "50% 32%", transform: "scale(0.94)" },
    },
    { name: "Ms. Nivedhitha R", role: "Intern Aviation", image: team7, linkedin: "https://linkedin.com" },
  ];

  const TeamCard = ({ member }: { member: { name: string; role: string; image: string; linkedin?: string; imageStyle?: React.CSSProperties } }) => (
    <div className="group h-full w-full">
      <div className="h-full overflow-hidden rounded-[32px] border border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 shadow-[0_24px_80px_rgba(124,58,237,0.08)] transition-transform duration-300 ease-out transform-gpu hover:-translate-y-3 hover:scale-105 hover:shadow-[0_24px_48px_rgba(15,23,42,0.18)] hover:bg-white/100 dark:hover:bg-slate-900/95 hover:ring-1 hover:ring-purple-300/20 hover:ring-offset-2 dark:hover:ring-offset-slate-900">
        <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-purple-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-purple-500/20 to-transparent" />
          <div className="relative flex h-52 items-end justify-center px-6 pb-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_20px_40px_rgba(15,23,42,0.15)] dark:border-slate-950 transition-transform duration-300 ease-out group-hover:scale-105">
              <img
                src={member.image}
                alt={member.name}
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 will-change-transform"
                style={member.imageStyle}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent dark:from-slate-950" />
        </div>
        <div className="p-6 pt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{member.name}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{member.role}</p>
            </div>
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors duration-300 ease-out group-hover:bg-purple-600 group-hover:text-white dark:bg-slate-900 dark:text-slate-200 dark:group-hover:bg-purple-700 transform transition-transform duration-300 hover:scale-110"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-12">
      {/* Hero Section */}
      <section className="py-12 bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 
            className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white"
          >
            WHO WE ARE at <span className="text-purple-600 dark:text-purple-400">ARMZ AVIATION</span>
          </h1>
          <p 
            className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto"
          >
            ARMZ AVIATION is a next-generation aviation recruitment and training company built on industry expertise, innovation, and real-world execution.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div 
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                We do not just train candidates. We transform them into job-ready aviation professionals equipped to succeed in global markets.
              </p>
              <div className="pt-4 grid grid-cols-2 gap-6">
                <div className="space-y-2 group p-4 rounded-xl transition transform-gpu hover:-translate-y-2 hover:shadow-lg hover:bg-purple-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                  <h4 className="text-4xl font-bold text-purple-600 transition-colors duration-300 group-hover:text-purple-700 dark:text-purple-300 dark:group-hover:text-purple-200">100%</h4>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Placement Support</p>
                </div>
                <div className="space-y-2 group p-4 rounded-xl transition transform-gpu hover:-translate-y-2 hover:shadow-lg hover:bg-purple-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                  <h4 className="text-4xl font-bold text-purple-600 transition-colors duration-300 group-hover:text-purple-700 dark:text-purple-300 dark:group-hover:text-purple-200">2-15 LPA+</h4>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Salary Potential</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src={aviationImage}
                alt="Aviation Excellence"
                className="rounded-3xl shadow-2xl w-full h-full object-cover transition-transform duration-500 transform-gpu hover:scale-105 hover:-translate-y-1 hover:shadow-2xl"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400">Our Crew</p>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">Meet Our Team</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-700 dark:text-slate-300">A modern aviation team built for training, talent, and career lift-off.</p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 justify-items-center">
              {teamMembers.slice(0, 1).map((member) => (
                <div key={member.name} className="w-full max-w-md">
                  <TeamCard member={member} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.slice(1, 4).map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.slice(4, 7).map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Experience & Leadership */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="glass-card p-8 space-y-4 transition-transform duration-300 transform-gpu hover:-translate-y-2 hover:shadow-xl hover:backdrop-blur-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Experience</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">At ARMZ, candidates do not just study aviation. They live real-world aviation scenarios through workshops, seminars, live events, and direct interaction with aviation leaders.</p>
              <ul className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed list-disc pl-5 space-y-1">
                <li>Industry-level training environment</li>
                <li>Real-world aviation scenarios</li>
                <li>Workshops, seminars, and live events</li>
                <li>Direct interaction with aviation leaders</li>
              </ul>
            </div>
            <div className="glass-card p-8 space-y-4 transition-transform duration-300 transform-gpu hover:-translate-y-2 hover:shadow-xl hover:backdrop-blur-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Leadership</h3>
              <p className="text-purple-600 dark:text-purple-400 font-bold">Sri Nitya Ramakrishnan, CEO - ARMZ AVIATION</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">A visionary aviation leader with international airport experience, flight operations management expertise, and over a decade in aviation and academic leadership.</p>
              <ul className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed list-disc pl-5 space-y-1">
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