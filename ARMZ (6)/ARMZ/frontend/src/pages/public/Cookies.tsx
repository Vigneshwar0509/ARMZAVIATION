import { Link } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import SEO from "@/src/components/common/SEO";

export default function Cookies() {
  return (
    <div className="min-h-screen py-20">
      <SEO title="Cookie Policy" description="ARMZ Aviation Cookie Policy - How we use cookies on our platform" />
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-purple-600 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="glass-card p-8 md:p-12 rounded-4xl space-y-8">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
            <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Cookie className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Cookie Policy</h1>
              <p className="text-slate-500 text-sm">Last updated: January 2024</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">What Are Cookies?</h2>
              <p className="text-slate-600 leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide a better user experience and understand how our platform is used.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-bold text-slate-900 mb-2">Essential Cookies</h3>
                  <p className="text-slate-600 text-sm">Required for basic site functionality, such as keeping you logged in.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-bold text-slate-900 mb-2">Analytics Cookies</h3>
                  <p className="text-slate-600 text-sm">Help us understand how visitors interact with our website.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-bold text-slate-900 mb-2">Functional Cookies</h3>
                  <p className="text-slate-600 text-sm">Remember your preferences and settings.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-bold text-slate-900 mb-2">Marketing Cookies</h3>
                  <p className="text-slate-600 text-sm">Used to deliver relevant advertisements and track campaign performance.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Managing Cookies</h2>
              <p className="text-slate-600 leading-relaxed">
                You can control and manage cookies through your browser settings. Please note that disabling 
                certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Third-Party Cookies</h2>
              <p className="text-slate-600 leading-relaxed">
                We may use third-party services that set cookies on our behalf. These include analytics 
                providers and payment processors. These third parties have their own privacy policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have questions about our use of cookies, please contact us at{" "}
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

