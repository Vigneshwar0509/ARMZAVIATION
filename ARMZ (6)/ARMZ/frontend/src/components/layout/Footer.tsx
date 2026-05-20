import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Youtube, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import primaryLogo from "@/src/assets/newlogo.png";
import { useAuthStore } from "@/src/store/authStore";

const socialLinks = [
  { Icon: Linkedin, href: "https://linkedin.com/company/armz-aviation", label: "LinkedIn" },
  { Icon: Twitter, href: "https://twitter.com/armzaviation", label: "Twitter" },
  { Icon: Facebook, href: "https://facebook.com/armzaviation", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com/armzaviation", label: "Instagram" },
  { Icon: Youtube, href: "https://youtube.com/@armzaviation", label: "YouTube" },
];

export default function Footer() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubscribing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    toast.success("Successfully subscribed to our newsletter!");
    setIsSubscribed(true);
    setIsSubscribing(false);
    setEmail("");
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  return (
    <footer className="bg-transparent pt-8 sm:pt-12 pb-4 sm:pb-8 text-slate-900">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Section: Brand & Newsletter */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 sm:gap-12 mb-8 sm:mb-10">
            
            {/* Left: Brand & Certifications */}
            <div className="lg:max-w-md w-full space-y-6 sm:space-y-8">
              <Link to="/" className="flex items-center group">
                <img
                  src={primaryLogo}
                  alt="ARMZ Aviation"
                  className="h-8 sm:h-10 lg:h-12 w-auto max-w-[120px] sm:max-w-[160px] lg:max-w-80 object-contain object-left"
                  loading="lazy"
                  decoding="async"
                />
              </Link>
              
              <p className="text-slate-600 font-medium leading-relaxed text-sm">
              </p>
              
              {/* Certification Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {["ISO 9001", "MSME", "DPIIT", "ISF"].map((cert) => (
                  <span 
                    key={cert}
                    className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md sm:rounded-lg"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Newsletter & Social */}
            <div className="w-full lg:max-w-xl space-y-6 sm:space-y-8">
              {/* Newsletter Box */}
              <div className="glass-card p-4 sm:p-6 lg:p-8">
                <p className="text-purple-600 font-bold text-xs uppercase tracking-wider mb-4 sm:mb-6">Stay Updated</p>
                {isSubscribed ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-sm">Thanks for subscribing!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="grow h-12 rounded-lg px-3 sm:px-4 bg-white/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm"
                    />
                    <button 
                      type="submit"
                      disabled={isSubscribing}
                      className="premium-button-primary h-12 px-4 sm:px-8 text-xs sm:text-sm disabled:opacity-70 min-w-fit"
                    >
                      <span className="flex items-center justify-center gap-1 sm:gap-2">
                        {isSubscribing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <span className="hidden sm:inline">Subscribe</span>
                            <span className="sm:hidden">Sub</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              {/* Social Icons */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a 
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-12 w-12 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm bg-white/50"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200 w-full mb-8 sm:mb-10" />

          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            {/* Company */}
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  { name: 'About Us', path: '/about' },
                  { name: 'Events', path: '/events' },
                  { name: 'College Collab', path: '/collaboration' },
                  { name: 'Careers', path: '/jobs' },
                  { name: 'Contact Us', path: '/contact' }
                ].map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-slate-600 font-medium text-xs sm:text-sm hover:text-purple-600 transition-colors truncate">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Employers */}
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Employers</h4>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  { name: 'Hiring Solutions', path: '/collaboration' },
                  { name: 'Post a Job', path: '/login' },
                  { name: 'Dashboard', path: '/login' },
                  { name: 'Campus Hiring', path: '/events' },
                  { name: 'Partner With Us', path: '/contact' }
                ].map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-slate-600 font-medium text-xs sm:text-sm hover:text-purple-600 transition-colors truncate">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Candidates */}
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Candidates</h4>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  { name: 'Find Jobs', path: '/jobs' },
                  { name: 'Events', path: '/events' },
                  { name: 'Build Resume', path: '/dashboard/resume' },
                  { name: 'Dashboard', path: '/dashboard' },
                  { name: 'Join Community', path: '/register' }
                ].map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-slate-600 font-medium text-xs sm:text-sm hover:text-purple-600 transition-colors truncate">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Support */}
            <div className="space-y-4 sm:space-y-6">
              <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  { name: 'Privacy Policy', path: '/privacy' },
                  { name: 'Terms of Service', path: '/terms' },
                  { name: 'Cookie Policy', path: '/cookies' },
                  { name: 'Help Center', path: '/contact' },
                ].map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-slate-600 font-medium text-xs sm:text-sm hover:text-purple-600 transition-colors truncate">{link.name}</Link>
                  </li>
                ))}
                {(!user || user.role === 'admin') && (
                  <li className="pt-2 sm:pt-4">
                    <Link to="/admin-login" className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hover:text-purple-600 transition-colors opacity-50 hover:opacity-100">Admin Portal</Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 sm:pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
            <p className="text-slate-400 font-medium text-center sm:text-left">
              © {new Date().getFullYear()} ARMZ Aviation. All Rights Reserved.
            </p>
            <div className="flex items-center gap-3 sm:gap-6 text-slate-400">
              <Link to="/privacy" className="hover:text-purple-600 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-purple-600 transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-purple-600 transition-colors">Support</Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

