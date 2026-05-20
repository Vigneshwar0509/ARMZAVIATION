import { useResumeStore } from "@/src/store/resumeStore";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Award, Languages as LangIcon, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import "@/src/styles/resume-themes.css";

export default function ResumePreview() {
  const { data } = useResumeStore();
  const { personalInfo, experience, education, skills, projects, certifications, languages, template, themeColor, fontFamily, aviationData, achievements, tools } = data;

  const renderTemplate = () => {
    switch (template) {
      case "international":
        return <InternationalTemplate data={data} fontFamily={fontFamily} />;
      case "indian-aviation":
        return <IndianAviationTemplate data={data} fontFamily={fontFamily} />;
      case "professional":
        return <ProfessionalTemplate data={data} fontFamily={fontFamily} />;
      case "creative":
        return <CreativeTemplate data={data} fontFamily={fontFamily} />;
      case "minimalist":
        return <MinimalistTemplate data={data} fontFamily={fontFamily} />;
      case "executive":
        return <ExecutiveTemplate data={data} fontFamily={fontFamily} />;
      case "modern":
      default:
        return <ModernTemplate data={data} fontFamily={fontFamily} />;
    }
  };

  return (
    <div 
      className={cn(
        "resume-theme bg-white shadow-2xl rounded-sm min-h-[820px] w-[760px] text-slate-800 border border-slate-100 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:min-h-0"
      )}
      style={{ '--theme-color': themeColor } as React.CSSProperties} // eslint-disable-line react/style-prop-object
    >
      {renderTemplate()}
    </div>
  );
}

// --- Modern Template ---
const ModernTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, skills, projects, certifications, languages, themeColor, aviationData, achievements, tools } = data;
  
  return (
    <div className="p-12" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <div className="border-b-4 pb-8 mb-8 theme-border-b-4">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">{personalInfo.fullName || "Your Name"}</h1>
        <p className="text-xl font-medium mb-4 theme-text">{personalInfo.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-500 font-medium">
          {personalInfo.email && <div className="flex items-center"><Mail className="h-3 w-3 mr-1.5" /> {personalInfo.email}</div>}
          {personalInfo.phone && <div className="flex items-center"><Phone className="h-3 w-3 mr-1.5" /> {personalInfo.phone}</div>}
          {personalInfo.location && <div className="flex items-center"><MapPin className="h-3 w-3 mr-1.5" /> {personalInfo.location}</div>}
          {personalInfo.linkedin && <div className="flex items-center"><Linkedin className="h-3 w-3 mr-1.5" /> {personalInfo.linkedin}</div>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 space-y-10">
          <Section title="Professional Summary" themeColor={themeColor}>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">{personalInfo.summary}</p>
          </Section>

          {achievements && achievements.length > 0 && (
            <Section title="Key Achievements" themeColor={themeColor}>
              <ul className="space-y-3">
                {achievements.map((ach: string, i: number) => (
                  <li key={i} className="text-[12px] text-slate-600 flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 mr-3 shrink-0" />
                    {ach}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {aviationData && (
            <Section title="Aviation Experience" themeColor={themeColor}>
              <div className="grid grid-cols-2 gap-6 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {Object.entries(aviationData.flightHours).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center border-b border-slate-200 pb-1 last:border-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-xs font-black text-slate-700">{value as string} hrs</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {aviationData.licenses.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Licenses</h4>
                    <div className="flex flex-wrap gap-2">
                      {aviationData.licenses.map((lic: any) => (
                        <span key={lic.id} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">
                          {lic.name} • {lic.number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section title="Work Experience" themeColor={themeColor}>
            <div className="space-y-8">
              {experience.map((exp: any) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{exp.position}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-xs font-bold mb-3 theme-text">{exp.company}</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-10">
          {tools && tools.length > 0 && (
            <Section title="Tech Stack" themeColor={themeColor}>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool: string, i: number) => (
                  <span key={i} className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{tool}</span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Core Skills" themeColor={themeColor}>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span key={i} className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">{skill}</span>
              ))}
            </div>
          </Section>

          <Section title="Education" themeColor={themeColor}>
            <div className="space-y-5">
              {education.map((edu: any) => (
                <div key={edu.id}>
                  <h3 className="font-bold text-slate-900 text-[12px] uppercase">{edu.degree}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{edu.school}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{edu.year}</p>
                </div>
              ))}
            </div>
          </Section>

          {certifications.length > 0 && (
            <Section title="Certifications" themeColor={themeColor}>
              <div className="space-y-4">
                {certifications.map((cert: any) => (
                  <div key={cert.id}>
                    <h3 className="font-bold text-slate-900 text-[11px] uppercase leading-tight">{cert.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{cert.issuer} • {cert.date}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {languages.length > 0 && (
            <Section title="Languages" themeColor={themeColor}>
              <div className="space-y-3">
                {languages.map((lang: any) => (
                  <div key={lang.id} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">{lang.name}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{lang.level}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Professional Template (Corporate ATS) ---
const ProfessionalTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, skills, aviationData, achievements, tools } = data;
  return (
    <div className="p-16 text-slate-900" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <div className="text-center mb-12 border-b-2 border-slate-900 pb-8">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">{personalInfo.fullName}</h1>
        <p className="text-lg font-medium mb-4 uppercase tracking-widest">{personalInfo.title}</p>
        <div className="flex justify-center flex-wrap gap-4 text-[11px] font-medium">
          <span>{personalInfo.email}</span>
          <span>•</span>
          <span>{personalInfo.phone}</span>
          <span>•</span>
          <span>{personalInfo.location}</span>
          {personalInfo.linkedin && (
            <>
              <span>•</span>
              <span>{personalInfo.linkedin}</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 mb-4">Professional Summary</h2>
          <p className="text-[12px] leading-relaxed">{personalInfo.summary}</p>
        </section>

        {achievements && achievements.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 mb-4">Key Achievements</h2>
            <ul className="space-y-2">
              {achievements.map((ach: string, i: number) => (
                <li key={i} className="text-[12px] flex items-start">
                  <span className="mr-3 font-bold">•</span>
                  {ach}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 mb-4">Professional Experience</h2>
          <div className="space-y-8">
            {experience.map((exp: any) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold text-[13px] mb-1">
                  <span>{exp.position}</span>
                  <span>{exp.startDate} - {exp.endDate}</span>
                </div>
                <div className="flex justify-between text-[12px] font-bold text-slate-600 mb-3">
                  <span>{exp.company}</span>
                  <span>{exp.location}</span>
                </div>
                <p className="text-[12px] leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-12">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 mb-4">Education</h2>
            <div className="space-y-4">
              {education.map((edu: any) => (
                <div key={edu.id}>
                  <div className="flex justify-between font-bold text-[12px]">
                    <span>{edu.degree}</span>
                    <span>{edu.year}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{edu.school}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 mb-4">Core Competencies</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {skills.map((s: string, i: number) => (
                <span key={i} className="text-[11px] font-medium">• {s}</span>
              ))}
            </div>
          </section>
        </div>

        {tools && tools.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 mb-4">Technical Proficiencies</h2>
            <p className="text-[11px] leading-relaxed">
              {tools.join(" • ")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

const InternationalTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, skills, certifications, languages, tools, themeColor } = data;
  return (
    <div className="p-14 bg-white text-slate-900 min-h-[820px]" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <div className="grid grid-cols-12 gap-8 mb-10">
        <div className="col-span-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-4">International Resume</p>
          <h1 className="text-5xl font-black text-slate-900 mb-3">{personalInfo.fullName}</h1>
          <p className="text-xl font-semibold text-slate-700 mb-6">{personalInfo.title}</p>
          <p className="text-sm leading-7 text-slate-600 max-w-2xl">{personalInfo.summary}</p>
        </div>
        <div className="col-span-4 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-[9px] uppercase tracking-[0.5em] text-slate-400 mb-3">Contact</h2>
              <div className="space-y-2 text-[12px] text-slate-600">
                {personalInfo.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {personalInfo.email}</div>}
                {personalInfo.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {personalInfo.phone}</div>}
                {personalInfo.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {personalInfo.location}</div>}
                {personalInfo.linkedin && <div className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-slate-400" /> {personalInfo.linkedin}</div>}
                {personalInfo.github && <div className="flex items-center gap-2"><Github className="h-4 w-4 text-slate-400" /> {personalInfo.github}</div>}
              </div>
            </div>
            <div>
              <h2 className="text-[9px] uppercase tracking-[0.5em] text-slate-400 mb-3">Core Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-2 bg-white text-slate-800 rounded-full text-[10px] font-semibold">{skill}</span>
                ))}
              </div>
            </div>
            {languages.length > 0 && (
              <div>
                <h2 className="text-[9px] uppercase tracking-[0.5em] text-slate-400 mb-3">Languages</h2>
                <div className="space-y-2 text-[12px] text-slate-600">
                  {languages.map((lang: any) => (
                    <div key={lang.id} className="flex justify-between"><span>{lang.name}</span><span className="font-bold">{lang.level}</span></div>
                  ))}
                </div>
              </div>
            )}
            {tools && tools.length > 0 && (
              <div>
                <h2 className="text-[9px] uppercase tracking-[0.5em] text-slate-400 mb-3">Tools</h2>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool: string, i: number) => (
                    <span key={i} className="px-3 py-2 bg-slate-900 text-white rounded-full text-[10px] font-semibold">{tool}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-10">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-4">Professional Experience</h2>
            <div className="space-y-8">
              {experience.map((exp: any) => (
                <div key={exp.id} className="border-l-2 pl-5 border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[13px] font-bold text-slate-900">{exp.position}</h3>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 mb-1">{exp.company}</p>
                  <p className="text-[12px] leading-relaxed text-slate-600 whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-4">Education</h2>
              <div className="space-y-6">
                {education.map((edu: any) => (
                  <div key={edu.id}>
                    <p className="text-[12px] font-bold text-slate-900">{edu.degree}</p>
                    <p className="text-[11px] text-slate-600">{edu.school} • {edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
            {certifications.length > 0 && (
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-4">Certifications</h2>
                <div className="space-y-4">
                  {certifications.map((cert: any) => (
                    <div key={cert.id}>
                      <p className="text-[12px] font-bold text-slate-900">{cert.name}</p>
                      <p className="text-[11px] text-slate-600">{cert.issuer} • {cert.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const IndianAviationTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, aviationData, skills, themeColor } = data;
  return (
    <div className="min-h-[820px] bg-slate-950 text-white p-12" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <div className="grid grid-cols-12 gap-8 mb-10">
        <div className="col-span-8 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300">Indian Aviation Resume</p>
          <h1 className="text-5xl font-black tracking-tight">{personalInfo.fullName}</h1>
          <p className="text-xl font-semibold text-slate-200">{personalInfo.title}</p>
          <div className="grid grid-cols-3 gap-4 text-[12px] text-slate-300 mt-6">
            <div><span className="font-bold text-white">Email</span><p>{personalInfo.email}</p></div>
            <div><span className="font-bold text-white">Phone</span><p>{personalInfo.phone}</p></div>
            <div><span className="font-bold text-white">Location</span><p>{personalInfo.location}</p></div>
          </div>
        </div>
        <div className="col-span-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <h2 className="text-[9px] uppercase tracking-[0.5em] text-amber-300 mb-3">Flight Hours</h2>
              <div className="space-y-3 text-[12px] text-slate-200">
                {aviationData?.flightHours && Object.entries(aviationData.flightHours).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex justify-between"><span className="capitalize">{key}</span><span>{String(value)} hrs</span></div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-[9px] uppercase tracking-[0.5em] text-amber-300 mb-3">Licenses & Ratings</h2>
              <div className="space-y-3 text-[12px] text-slate-200">
                {aviationData?.licenses.map((lic: any) => (
                  <div key={lic.id} className="border-b border-white/10 pb-2">
                    <p className="font-bold">{lic.name}</p>
                    <p className="text-slate-300 text-[11px]">{lic.number}</p>
                  </div>
                ))}
                {aviationData?.ratings.map((rat: any) => (
                  <div key={rat.id} className="border-b border-white/10 pb-2 last:border-0">
                    <p className="font-bold">{rat.name}</p>
                    <p className="text-slate-300 text-[11px]">{rat.aircraftType}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-10">
          <div className="rounded-3xl bg-white/5 p-8 border border-white/10">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-amber-300 mb-4">Aviation Summary</h2>
            <p className="text-[13px] leading-relaxed text-slate-200">{personalInfo.summary}</p>
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-amber-300 mb-4">Experience</h2>
            <div className="space-y-8">
              {experience.map((exp: any) => (
                <div key={exp.id} className="rounded-3xl bg-white/5 p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[14px] font-bold text-white">{exp.position}</h3>
                      <p className="text-[11px] text-slate-300">{exp.company}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-4 space-y-8">
          <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
            <h2 className="text-[9px] uppercase tracking-[0.5em] text-amber-300 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-2 bg-white/10 rounded-full text-[11px] text-slate-200">{skill}</span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 p-6 border border-white/10">
            <h2 className="text-[9px] uppercase tracking-[0.5em] text-amber-300 mb-4">Education</h2>
            <div className="space-y-4 text-[12px] text-slate-200">
              {education.map((edu: any) => (
                <div key={edu.id}>
                  <p className="font-bold text-white">{edu.degree}</p>
                  <p>{edu.school} • {edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Creative Template ---
const CreativeTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, skills, themeColor, aviationData, achievements, tools } = data;
  return (
    <div className="flex min-h-[820px]" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <div className="w-[280px] p-12 text-white flex flex-col theme-bg">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-3 leading-[0.9] uppercase tracking-tighter">{personalInfo.fullName}</h1>
          <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">{personalInfo.title}</p>
        </div>

        <div className="space-y-10 flex-1">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-2">Contact</h3>
            <div className="space-y-4 text-[11px] font-medium">
              <p className="flex items-center"><Mail className="h-3.5 w-3.5 mr-3 opacity-70" /> {personalInfo.email}</p>
              <p className="flex items-center"><Phone className="h-3.5 w-3.5 mr-3 opacity-70" /> {personalInfo.phone}</p>
              <p className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-3 opacity-70" /> {personalInfo.location}</p>
            </div>
          </div>

          {tools && tools.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool: string, i: number) => (
                  <span key={i} className="bg-white/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">{tool}</span>
                ))}
              </div>
            </div>
          )}

          {aviationData && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-2">Flight Log</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(aviationData.flightHours).slice(0, 4).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[8px] uppercase opacity-60 font-bold">{key}</p>
                    <p className="text-sm font-black">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-2">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: string, i: number) => (
                <span key={i} className="bg-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-white/10">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-16 bg-white">
        <div className="space-y-12">
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-6 flex items-center theme-text">
              <span className="w-8 h-0.5 mr-4 theme-bg" />
              About Me
            </h2>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{personalInfo.summary}</p>
          </section>

          {achievements && achievements.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-6 flex items-center theme-text">
                <span className="w-8 h-0.5 mr-4 theme-bg" />
                Key Achievements
              </h2>
              <ul className="space-y-4">
                {achievements.map((ach: string, i: number) => (
                  <li key={i} className="text-[12px] text-slate-600 flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-3 shrink-0 theme-text" />
                    {ach}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-8 flex items-center theme-text">
              <span className="w-8 h-0.5 mr-4 theme-bg" />
              Experience
            </h2>
            <div className="space-y-10">
              {experience.map((exp: any) => (
                <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100">
                  <div className="absolute -left-1.75 top-0 w-3 h-3 rounded-full bg-white border-2 theme-border-2" />
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{exp.position}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-[11px] font-black mb-4 uppercase tracking-widest theme-text">{exp.company}</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Minimalist Template ---
const MinimalistTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, skills, aviationData } = data;
  return (
    <div className="p-20 max-w-3xl mx-auto" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <header className="mb-20">
        <h1 className="text-4xl font-light tracking-[0.2em] text-slate-900 mb-4 uppercase">{personalInfo.fullName}</h1>
        <p className="text-slate-400 text-xs tracking-[0.4em] uppercase font-bold">{personalInfo.title}</p>
      </header>

      <div className="space-y-16">
        <section className="grid grid-cols-4 gap-12">
          <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Profile</h2>
          <div className="col-span-3">
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{personalInfo.summary}</p>
          </div>
        </section>

        {aviationData && (
          <section className="grid grid-cols-4 gap-12">
            <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Aviation</h2>
            <div className="col-span-3 grid grid-cols-3 gap-6">
              {Object.entries(aviationData.flightHours).slice(0, 3).map(([key, value]) => (
                <div key={key}>
                  <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">{key}</p>
                  <p className="text-sm font-bold text-slate-800">{value as string}h</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-4 gap-12">
          <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Experience</h2>
          <div className="col-span-3 space-y-12">
            {experience.map((exp: any) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">{exp.position}</h3>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">{exp.startDate} — {exp.endDate}</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{exp.company}</p>
                <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-4 gap-12">
          <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Contact</h2>
          <div className="col-span-3 text-[11px] text-slate-500 font-bold uppercase tracking-widest space-y-2">
            <p>{personalInfo.email}</p>
            <p>{personalInfo.phone}</p>
            <p>{personalInfo.location}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Executive Template ---
const ExecutiveTemplate = ({ data, fontFamily }: { data: any, fontFamily: string }) => {
  const { personalInfo, experience, education, skills, themeColor, aviationData } = data;
  return (
    <div className="p-16 bg-[#fcfcfc]" style={{ fontFamily }}> {/* eslint-disable-line react/style-prop-object */}
      <div className="bg-white p-12 shadow-xl border-t-12 theme-border-t-12">
        <div className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-5xl font-serif font-bold text-slate-900 mb-2 tracking-tight">{personalInfo.fullName}</h1>
            <p className="text-xl text-slate-500 font-serif italic tracking-wide">{personalInfo.title}</p>
          </div>
          <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] space-y-2">
            <p>{personalInfo.location}</p>
            <p className="text-slate-900">{personalInfo.email}</p>
            <p>{personalInfo.phone}</p>
          </div>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 border-b pb-3 mb-6">Executive Summary</h2>
            <p className="text-[14px] text-slate-700 leading-relaxed font-serif italic">{personalInfo.summary}</p>
          </section>

          {aviationData && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 border-b pb-3 mb-8">Aviation Credentials</h2>
              <div className="grid grid-cols-4 gap-8">
                {Object.entries(aviationData.flightHours).map(([key, value]) => (
                  <div key={key} className="border-l-2 pl-4 theme-border-l-2">
                    <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">{key}</p>
                    <p className="text-lg font-serif font-bold text-slate-800">{value as string}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 border-b pb-3 mb-10">Professional Tenure</h2>
            <div className="space-y-12">
              {experience.map((exp: any) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-lg font-serif font-bold text-slate-900">{exp.position}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 mb-4 italic tracking-wide theme-text">{exp.company}</p>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-serif">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children, themeColor, variant = "default" }: { title: string, children: React.ReactNode, themeColor: string, variant?: "default" | "minimal" }) => (
  <div className="mb-8">
    <h2
      className={cn(
        "font-black uppercase tracking-[0.2em] mb-5",
        variant === "default" ? "text-[10px] border-b-2 pb-2" : "text-[12px] border-l-4 pl-4"
      )}
      style={variant === "default" ? { color: themeColor, borderColor: `${themeColor}15` } : { color: themeColor, borderColor: themeColor }}
    >
      {title}
    </h2>
    {children}
  </div>
);
