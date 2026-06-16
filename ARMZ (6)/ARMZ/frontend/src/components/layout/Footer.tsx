import { Link } from "react-router-dom";
import { 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Youtube,
} from "lucide-react";
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

  return (
    <footer className="bg-transparent pt-8 sm:pt-12 pb-4 sm:pb-8 text-slate-900">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          
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

          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm bg-white/50"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
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

