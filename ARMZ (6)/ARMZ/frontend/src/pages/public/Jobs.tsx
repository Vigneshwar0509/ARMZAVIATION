import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Check, Users, Building2, Globe } from "lucide-react";
import SEO from "@/src/components/common/SEO";
import { Button } from "@/src/components/ui/Button";

const employerFeatures = [
  {
    title: "Freshers Pool",
    description: "Access motivated, trained freshers ready for entry-level aviation roles with upskilling credentials verified by ARMZ.",
    icon: Check,
  },
  {
    title: "Experienced Professionals",
    description: "Filter by years of experience, functional areas, and airline background for mid to senior-level positions.",
    icon: Building2,
  },
  {
    title: "Pilot & Engineer License Holders",
    description: "Browse verified CPL, ATPL, and AME license holders with documentation submitted and verified through our system.",
    icon: Users,
  },
  {
    title: "Interview Arrangements & Document Verification",
    description: "We coordinate interviews end-to-end and ensure all candidate documents are properly verified before your team�s time is committed.",
    icon: Globe,
  },
  {
    title: "Mass Recruitment of Aviation Professionals",
    description: "Planning a large-scale intake? ARMZ manages bulk hiring campaigns with precision � from sourcing to shortlisting to scheduling.",
    icon: Sparkles,
  },
];

const candidateTypes = [
  "Freshers",
  "Pilot License Holders",
  "Interview-Ready Candidates",
  "Experienced",
  "Engineer License Holders",
  "Mass Recruitment Batches",
];

export default function Jobs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#f9f5ff] to-[#fef7ff]">
      <SEO title="ARMZ Employer Access" description="Premium employer access to verified aviation candidate profiles." />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_25%)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#e9d5ff]/40 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr] items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex items-center rounded-full border border-purple-300 bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-800 shadow-sm">
                  For Employers
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
                  Find the right talent.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500">
                    Faster.
                  </span>
                </h1>
                <div className="space-y-4 text-base sm:text-lg text-slate-700">
                  <p>ARMZ Aviation gives employers privileged access to a pre-screened, diverse pool of aviation professionals � from freshers to experienced license holders. All data is secured and managed exclusively through ARMZ.</p>
                  <p>Hiring in aviation demands precision. ARMZ Aviation serves as your dedicated talent acquisition partner � providing curated candidate profiles, verification support, and mass recruitment capabilities, so your HR team focuses on closing, not searching.</p>
                  <p className="font-semibold text-slate-800">Privacy-first architecture: candidate email addresses and contact numbers are accessible exclusively through ARMZ, ensuring compliance and protecting candidate data throughout the process.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {employerFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-purple-200/80 bg-white/95 p-6 shadow-lg shadow-purple-100/60">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                        <Icon size={20} />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h2>
                      <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-[2rem] border border-purple-200/80 bg-white/98 p-6 sm:p-8 shadow-[0_30px_80px_rgba(139,92,246,0.12)]"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-800 mb-5">
                ARMZ-MANAGED ACCESS
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gain wide access to candidate profiles</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">Candidate contact information (email & phone) is restricted to ARMZ. All interactions are facilitated through our platform to maintain data integrity and candidate trust.</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {candidateTypes.map((label) => (
                  <div key={label} className="rounded-3xl border border-purple-200 bg-purple-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <a href="mailto:careers@armzaviation.com" className="block">
                  <Button className="w-full bg-purple-700 text-white hover:bg-purple-800" size="lg">
                    Partner with ARMZ
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </a>
                <div className="rounded-3xl border border-purple-200 bg-white/95 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  careers@armzaviation.com
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
