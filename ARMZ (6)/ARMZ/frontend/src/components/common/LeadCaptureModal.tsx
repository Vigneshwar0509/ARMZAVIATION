import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, User, Mail, Phone, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useLeadStore, LeadSource } from '@/src/store/leadStore';
import { useAuthStore } from '@/src/store/authStore';

interface LeadCaptureModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  source?: LeadSource;
  interest?: string;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export default memo(function LeadCaptureModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  source: externalSource,
  interest: externalInterest,
  title: externalTitle,
  subtitle: externalSubtitle,
  onSuccess: externalOnSuccess,
}: LeadCaptureModalProps) {
  const { user } = useAuthStore();
  const { 
    isModalOpen: storeIsOpen, 
    modalConfig, 
    closeLeadModal, 
    createLead 
  } = useLeadStore();

  // Use external props if provided, otherwise use store
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : storeIsOpen;
  const onClose = externalOnClose || closeLeadModal;
  const source = externalSource || modalConfig?.source || 'enquiry';
  const interest = externalInterest || modalConfig?.interest || '';
  const title = externalTitle || modalConfig?.title || 'Get in Touch';
  const subtitle = externalSubtitle || modalConfig?.subtitle || 'Fill in your details and we will contact you shortly.';
  const onSuccessCallback = externalOnSuccess || modalConfig?.onSuccess;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      return;
    }

    setIsSubmitting(true);
    
    const lead = await createLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      interest,
      source,
      message: formData.message,
      metadata: {
        ...(user ? { userId: user.id } : {}),
        formType: 'lead_modal',
        modalTitle: title,
        modalSubtitle: subtitle,
        submittedFrom: typeof window !== 'undefined' ? window.location.pathname : '',
      },
    });

    setIsSubmitting(false);

    if (lead) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
        onSuccessCallback?.();
      }, 2000);
    }
  }, [formData, interest, source, user, title, subtitle, createLead, onClose, onSuccessCallback]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
            className="glass-card w-full max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-4xl relative overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-purple-500 via-pink-500 to-purple-500" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
                <p className="text-slate-500">Our team will reach out to you soon.</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
                  <p className="text-slate-500 text-sm">{subtitle}</p>
                  {interest && (
                    <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-purple-50 rounded-full">
                      <span className="text-xs font-medium text-purple-700">Interest: {interest}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+91 98765 43210"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Message (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your requirements..."
                        rows={3}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200/50 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-slate-400">
                    By submitting, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
