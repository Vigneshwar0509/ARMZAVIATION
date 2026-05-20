import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import SEO from "@/src/components/common/SEO";

export default function Privacy() {
  return (
    <div className="min-h-screen py-20">
      <SEO title="Privacy Policy" description="ARMZ Aviation Privacy Policy - How we collect, use, and protect your data" />
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-purple-600 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="glass-card p-8 md:p-12 rounded-4xl space-y-8">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
            <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Privacy Policy</h1>
              <p className="text-slate-500 text-sm">Last updated: January 2024</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed">
                We collect information you provide directly, including your name, email address, phone number, 
                resume, and other profile information when you register for an account or apply for jobs.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed">
                Your information is used to provide our services, match you with relevant job opportunities, 
                communicate with you about your account, and improve our platform.
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Facilitate job applications and connections with employers</li>
                <li>Send job alerts and relevant career opportunities</li>
                <li>Improve and personalize your experience</li>
                <li>Communicate important updates and changes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">3. Data Sharing</h2>
              <p className="text-slate-600 leading-relaxed">
                We share your profile information with employers when you apply for jobs. We do not sell 
                your personal information to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">4. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement industry-standard security measures to protect your personal information. 
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">5. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed">
                You have the right to access, update, or delete your personal information at any time 
                through your account settings or by contacting us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">6. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@armzaviation.com" className="text-purple-600 hover:underline">
                  privacy@armzaviation.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

