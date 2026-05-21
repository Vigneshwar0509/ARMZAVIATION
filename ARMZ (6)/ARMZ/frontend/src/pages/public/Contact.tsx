import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import SEO from "@/src/components/common/SEO";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";
import { contactService } from "@/src/services/contactService";

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150, "Subject is too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      await contactService.submitContact(data);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setIsSubmitted(true);
      reset();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to send message. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    reset();
  };

  return (
    <div className="pt-12">
      <SEO title="Contact Us" description="Get in touch with ARMZ Aviation - Your trusted aviation career partner" />
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                  Your Aviation Career <span className="text-purple-600">Starts Here</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Do not wait for opportunities. Connect with ARMZ Aviation and create your next career milestone with expert guidance.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  { icon: Mail, title: "Email Us", detail: "ceo@armzaviation.com", sub: "Response within 24 hours", href: "mailto:ceo@armzaviation.com" },
                  { icon: Phone, title: "Call Us", detail: "+91 8220551116", sub: "Also available: +91 9962551116 | +91 9962751116 | +91 9092551116", href: "tel:+918220551116" },
                  { icon: MapPin, title: "Visit Us", detail: "Plot No 2, 2nd Floor, VSR Complex, Taramani Link Road", sub: "Velachery, Chennai - 600042", href: "https://www.google.com/maps/place/ARMZ+AVIATION+(P)+LTD+-+Best+Aviation+Training+Institute/@12.9780396,80.2215581,17z" }
                ].map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.href}
                    target={item.icon === MapPin ? "_blank" : undefined}
                    rel={item.icon === MapPin ? "noopener noreferrer" : undefined}
                    className="flex items-start space-x-6 group"
                  >
                    <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{item.title}</h4>
                      <p className="text-purple-600 font-bold">{item.detail}</p>
                      <p className="text-slate-400 text-sm">{item.sub}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Map Location */}
              <a 
                href="https://www.google.com/maps/place/ARMZ+AVIATION+(P)+LTD+-+Best+Aviation+Training+Institute/@12.9780396,80.2215581,17z" 
                target="_blank" 
                rel="noopener noreferrer"
                className="glass-card overflow-hidden rounded-3xl! border border-slate-200 h-80 group flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative"
              >
                {/* Decorative Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-emerald-300 to-blue-500 opacity-40" />
                
                {/* Map Grid Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(%23grid)" />
                </svg>

                {/* Water/Land decoration */}
                <div className="absolute top-0 left-0 w-1/3 h-1/2 bg-blue-400 opacity-30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-1/2 h-2/3 bg-emerald-300 opacity-20 rounded-full blur-3xl" />

                {/* Map Marker Pin */}
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="relative">
                    <div className="w-12 h-12 bg-red-500 rounded-full animate-pulse shadow-lg" />
                    <div className="absolute inset-2 bg-red-600 rounded-full" />
                    <svg className="absolute inset-0 w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                </div>

                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-3 text-center px-6 bottom-4">
                  <div className="bg-white shadow-2xl p-6 rounded-2xl backdrop-blur-md">
                    <p className="text-base font-bold text-slate-900">📍 ARMZ Aviation Office</p>
                    <p className="text-sm font-semibold text-purple-600 mt-2">VSR Complex, Taramani</p>
                    <p className="text-xs text-slate-600 mt-1">Velachery, Chennai - 600042</p>
                    <p className="text-xs text-slate-500 mt-2 border-t pt-2">Click to open in Google Maps</p>
                  </div>
                </div>
              </a>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-6 lg:p-8 rounded-[40px]!">
              {isSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Message Sent!</h3>
                    <p className="text-slate-500">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="premium-button-primary px-6 py-3 mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Contact form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="contact-fullName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        id="contact-fullName"
                        type="text" 
                        placeholder="John Doe" 
                        {...(errors.fullName ? { "aria-invalid": true } : {})}
                        aria-describedby={errors.fullName ? "contact-fullName-error" : undefined}
                        className={cn(
                          "w-full h-12 bg-white/50 rounded-xl border-none ring-1 focus:ring-2 focus:ring-purple-600 px-6 text-slate-700 transition-all",
                          errors.fullName ? "ring-red-300 focus:ring-red-500" : "ring-slate-200"
                        )}
                        {...register("fullName")}
                      />
                      {errors.fullName && (
                        <p id="contact-fullName-error" className="text-xs text-red-500 font-medium ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contact-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input 
                        id="contact-email"
                        type="email" 
                        placeholder="john@example.com" 
                        {...(errors.email ? { "aria-invalid": true } : {})}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                        className={cn(
                          "w-full h-12 bg-white/50 rounded-xl border-none ring-1 focus:ring-2 focus:ring-purple-600 px-6 text-slate-700 transition-all",
                          errors.email ? "ring-red-300 focus:ring-red-500" : "ring-slate-200"
                        )}
                        {...register("email")}
                      />
                      {errors.email && (
                        <p id="contact-email-error" className="text-xs text-red-500 font-medium ml-4 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <input 
                      id="contact-phone"
                      type="tel" 
                      placeholder="+91 8220551116" 
                      className="w-full h-12 bg-white/50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-600 px-6 text-slate-700 transition-all"
                      {...register("phone")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-subject" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="contact-subject"
                      type="text" 
                      placeholder="How can we help?" 
                      {...(errors.subject ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                      className={cn(
                        "w-full h-12 bg-white/50 rounded-xl border-none ring-1 focus:ring-2 focus:ring-purple-600 px-6 text-slate-700 transition-all",
                        errors.subject ? "ring-red-300 focus:ring-red-500" : "ring-slate-200"
                      )}
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p id="contact-subject-error" className="text-xs text-red-500 font-medium ml-4 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      id="contact-message"
                      rows={4} 
                      placeholder="Your message here..." 
                      {...(errors.message ? { "aria-invalid": true } : {})}
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                      className={cn(
                        "w-full bg-white/50 rounded-xl border-none ring-1 focus:ring-2 focus:ring-purple-600 p-6 text-slate-700 transition-all resize-none",
                        errors.message ? "ring-red-300 focus:ring-red-500" : "ring-slate-200"
                      )}
                      {...register("message")}
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="text-xs text-red-500 font-medium ml-4 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.message.message}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="premium-button-primary w-full h-14 flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    By submitting this form, you agree to our Privacy Policy.
                  </p>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
