import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import SEO from "@/src/components/common/SEO";

export default function Terms() {
  return (
    <div className="min-h-screen py-20">
      <SEO title="Terms of Service" description="ARMZ Aviation Terms of Service - Rules and guidelines for using our platform" />
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-purple-600 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="glass-card p-8 md:p-12 rounded-4xl space-y-8">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
            <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Terms of Service</h1>
              <p className="text-slate-500 text-sm">Last updated: January 2024</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using ARMZ Aviation&apos;s services, you agree to be bound by these Terms of Service. 
                If you do not agree, please do not use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">2. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account.
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Keep your login credentials secure</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>You must be at least 18 years old to use our services</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">3. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed">
                You agree not to use our services for any unlawful purpose or in any way that could damage, 
                disable, or impair our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">4. Job Listings & Applications</h2>
              <p className="text-slate-600 leading-relaxed">
                We do not guarantee employment outcomes. Job listings are provided by third-party employers, 
                and we are not responsible for the accuracy of job descriptions or hiring decisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">5. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed">
                All content on our platform, including logos, text, and graphics, is the property of ARMZ Aviation 
                and is protected by intellectual property laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">6. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                ARMZ Aviation shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages arising from your use of our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">7. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of our services after 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">8. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                For questions about these Terms, contact us at{" "}
                <a href="mailto:legal@armzaviation.com" className="text-purple-600 hover:underline">
                  legal@armzaviation.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

