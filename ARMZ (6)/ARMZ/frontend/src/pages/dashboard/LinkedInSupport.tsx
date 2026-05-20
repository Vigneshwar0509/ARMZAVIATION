import React, { useEffect, useState } from "react";
import { Linkedin, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useResumeStore } from "@/src/store/resumeStore";

const LINKEDIN_STORAGE_KEY = "linkedinSupportProfileUrl";

function isValidLinkedInUrl(value: string) {
  return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9_-]+\/?$/.test(value.trim());
}

function normalizeLinkedInUrl(url: string) {
  return url.trim().replace(/\s+/g, "");
}

export default function LinkedInSupport() {
  const { data } = useResumeStore();
  const [linkedinUrl, setLinkedinUrl] = useState(data.personalInfo.linkedin || "");
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  useEffect(() => {
    const storedProfile = window.localStorage.getItem(LINKEDIN_STORAGE_KEY);
    const profileUrl = storedProfile || data.personalInfo.linkedin || "";
    if (profileUrl && isValidLinkedInUrl(profileUrl)) {
      setLinkedinUrl(profileUrl);
      setLinkedinConnected(true);
      window.localStorage.setItem(LINKEDIN_STORAGE_KEY, profileUrl);
    }
  }, [data.personalInfo.linkedin]);

  const handleLinkedInUrlChange = (value: string) => {
    setLinkedinUrl(value);
  };

  const handleConnectLinkedIn = () => {
    const normalizedUrl = normalizeLinkedInUrl(linkedinUrl);

    if (!normalizedUrl || !isValidLinkedInUrl(normalizedUrl)) {
      toast.error("Paste a valid LinkedIn profile URL first.");
      return;
    }

    window.localStorage.setItem(LINKEDIN_STORAGE_KEY, normalizedUrl);
    setLinkedinUrl(normalizedUrl);
    setLinkedinConnected(true);
    toast.success("LinkedIn profile connected successfully!");
    window.open(normalizedUrl, "_blank");
  };

  const handleViewStrategies = () => {
    window.open("https://www.linkedin.com/help/linkedin/answer/a507587", "_blank");
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">LinkedIn Support</h1>
          <p className="text-slate-500 mt-2">Optimize your professional presence, strengthen your network, and get actionable profile insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <button
            className={`w-full sm:w-auto justify-center inline-flex items-center space-x-2 rounded-xl px-6 py-3 font-bold transition-colors ${linkedinConnected ? "bg-slate-200 text-slate-900" : "bg-[#0077B5] text-white hover:bg-[#006097]"}`}
            onClick={handleConnectLinkedIn}
          >
            <Linkedin className="h-5 w-5" />
            <span>{linkedinConnected ? "Reconnect LinkedIn" : "Connect LinkedIn"}</span>
          </button>
          <button
            className="w-full sm:w-auto justify-center inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={handleViewStrategies}
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Networking Guide</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[40px] space-y-8 bg-white border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2 text-slate-700 text-sm font-semibold">
              <Linkedin className="h-4 w-4 text-[#0077B5]" />
              {linkedinConnected ? "Connected" : "Not connected"}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Profile Optimization Audit</h3>
            <p className="text-slate-600">Complete a LinkedIn profile audit that checks your headline, summary, experience, and skills for the best aviation career visibility.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-semibold text-slate-700">LinkedIn profile URL</label>
            <input
              value={linkedinUrl}
              onChange={(event) => handleLinkedInUrlChange(event.target.value)}
              placeholder="https://www.linkedin.com/in/yourname"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/15"
            />
            <p className="mt-2 text-sm text-slate-500">Paste your LinkedIn profile URL to connect and unlock a personalized audit.</p>
            {data.personalInfo.linkedin && isValidLinkedInUrl(data.personalInfo.linkedin) && (
              <p className="mt-3 text-sm text-slate-600">Using saved profile from your resume builder: <span className="font-semibold text-slate-900">{data.personalInfo.linkedin}</span></p>
            )}
          </div>

          <div className="grid gap-4">
            {[
              { label: "Headline clarity", key: "headline" },
              { label: "Professional summary", key: "summary" },
              { label: "Experience impact", key: "experience" },
              { label: "Skills relevance", key: "skills" }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Auto-check</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-500">Use these profile tips and the networking guide to strengthen your LinkedIn presence.</p>
          </div>
        </div>

        <div className="rounded-3xl sm:rounded-[40px] border border-slate-200 bg-slate-950 p-6 sm:p-10 text-white shadow-2xl">
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold">LinkedIn Networking Strategies</h3>
            <p className="text-slate-400">Use these proven tactics to get noticed by aviation recruiters and hiring managers.</p>
          </div>

          <div className="space-y-5 mt-6">
            {[
              { title: "Customize every request", description: "Personalize connection messages for recruiters and senior pilots." },
              { title: "Share meaningful updates", description: "Post brief aviation insights, milestones, and flying achievements." },
              { title: "Showcase endorsements", description: "Ask peers to endorse your most relevant aviation skills." },
              { title: "Engage with aviation content", description: "Comment on industry posts to stay visible to recruiters." }
            ].map((tip, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0A66C2]/10 text-[#0A66C2]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="font-semibold text-white">{tip.title}</p>
                </div>
                <p className="text-sm text-slate-400">{tip.description}</p>
              </div>
            ))}
          </div>

          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={handleViewStrategies}
          >
            <span>Open LinkedIn best practices</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
