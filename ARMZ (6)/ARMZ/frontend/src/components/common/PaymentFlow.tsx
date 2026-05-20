import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, Zap, Shield, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';
import { usePlanStore } from '@/src/store/planStore';
import { useAuthStore } from '@/src/store/authStore';
import { useLeadStore } from '@/src/store/leadStore';
import { paymentService } from '@/src/services/paymentService';
import toast from 'react-hot-toast';
import { authService } from '@/src/services/authService';
import { normalizePlanCode, normalizeStoredPlanCode } from '@/src/lib/subscription';
import { useNavigate } from 'react-router-dom';

interface PaymentFlowProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
  planName?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentFlow({ isOpen, onClose, planId, planName }: PaymentFlowProps) {
  const { user, login } = useAuthStore();
  const { plans } = usePlanStore();
  const { createLead } = useLeadStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'confirmation' | 'payment' | 'success'>('confirmation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const plan = plans.find(p => normalizePlanCode(p.id) === normalizePlanCode(planId));
  const planIdForPayment = planId || plan?.id || 'premium';
  const selectedPlanName = planName || plan?.name || 'Premium';
  const selectedPlanPrice = plan?.price || 9999;
  const selectedPlanFeatures = plan?.features || [];
  const normalizedPlanName = selectedPlanName.replace(/\s*plan$/i, '').trim();
  const displayPlanName = normalizedPlanName || selectedPlanName;

  useEffect(() => {
    if (isOpen) {
      setStep('confirmation');
      setIsProcessing(false);

      paymentService.loadRazorpay()
        .then(() => setRazorpayLoaded(true))
        .catch(() => {
          setRazorpayLoaded(false);
          toast.error('Failed to load payment system. Please refresh and try again.');
        });
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to proceed');
      return;
    }

    if (!razorpayLoaded) {
      toast.error('Payment system not loaded. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment order
      await paymentService.loadRazorpay();
      const order = await paymentService.createOrder(planIdForPayment);

      // Initialize payment (real Razorpay flow)
      await paymentService.initiatePayment(
        order,
        {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        async (response) => {
          // Payment successful
          try {
            const result = await paymentService.processPaymentCompletion(
              planIdForPayment,
              response
            );

            if (result.success) {
              // Create lead for payment conversion
              try {
                await createLead({
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '+91-0000000000',
                  interest: `Subscribed to ${displayPlanName} Plan`,
                  source: 'enquiry', // Safer choice to prevent Django model strict-choice errors
                  message: `Payment successful for ${displayPlanName} plan - ₹${Math.round(selectedPlanPrice * 1.18)} - Payment ID: ${response.razorpay_payment_id}`,
                });
              } catch (leadError) {
                console.warn('Non-critical: Failed to capture payment lead', leadError);
              }

            // Optimistic update to guarantee UI unblocking immediately
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              login({ ...currentUser, subscription: planIdForPayment } as any);
              try {
                await authService.updateProfile({ subscription: planIdForPayment } as any);
              } catch (e) {
                console.warn("Failed to sync subscription to backend", e);
              }
            }

            // Update user subscription from server, but safeguard the plan to prevent race conditions
            try {
              const refreshedProfile = await authService.getProfile(true);
              if (refreshedProfile) {
                login({ ...refreshedProfile, subscription: planIdForPayment } as any);
              }
            } catch (e) {
              console.error("Profile refresh failed", e);
            }

              setStep('success');

              setTimeout(() => {
                toast.success(`Welcome to ${displayPlanName}! Your subscription is now active.`, {
                  duration: 5000,
                  icon: '🎉',
                });
                onClose();
              
              // Redirect to dashboard if they are on a payment/subscription page
              if (window.location.pathname.includes('subscription') || window.location.pathname.includes('onboarding')) {
                navigate(currentUser?.role === 'employer' ? '/employer' : '/dashboard', { replace: true });
              }
              }, 2500);
            } else {
              toast.error(result.message || 'Payment verification failed');
              setIsProcessing(false);
            }
          } catch (error) {
            console.error('Payment completion error:', error);
            toast.error((error as any)?.response?.data?.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        (error) => {
          console.error('Payment failed:', error);
          const errorText = String(error?.description || error?.message || error?.reason || '').toLowerCase();
          if (errorText.includes('no appropriate payment method found')) {
            toast.error('No payment methods are available for this merchant key in current mode. Please verify Razorpay test-mode method settings.');
          } else if (error?.reason && error.reason !== 'user_cancelled') {
            toast.error(error?.description || error?.message || 'Payment failed. Please try again.');
          }
          setIsProcessing(false);
        }
      );
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      if (error.isNetworkError) {
        toast.error('Network error: Unable to connect to payment service. Please check your connection and try again.');
      } else {
        toast.error('Failed to initialize payment. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:items-center sm:pt-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-700 text-white p-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Secure Payment</h2>
                <p className="text-purple-200 mt-1">Complete your {displayPlanName} Plan upgrade</p>
              </div>
              {step !== 'payment' && !isProcessing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-12">
                {['confirmation', 'payment', 'success'].map((s, idx) => (
                  <React.Fragment key={s}>
                    <motion.div
                      animate={{
                        scale: ['confirmation', 'payment', 'success'].indexOf(step) >= idx ? 1 : 0.8,
                        opacity: ['confirmation', 'payment', 'success'].indexOf(step) >= idx ? 1 : 0.5,
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        ['confirmation', 'payment', 'success'].indexOf(step) > idx
                          ? 'bg-green-500 text-white'
                          : ['confirmation', 'payment', 'success'].indexOf(step) === idx
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {['confirmation', 'payment', 'success'].indexOf(step) > idx ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        idx + 1
                      )}
                    </motion.div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                          ['confirmation', 'payment', 'success'].indexOf(step) > idx
                            ? 'bg-green-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* STEP 1: CONFIRMATION */}
                {step === 'confirmation' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-linear-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
                      <div className="flex items-start space-x-4">
                        <Zap className="h-8 w-8 text-purple-600 shrink-0 mt-1" />
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            {displayPlanName} Plan
                          </h3>
                          <p className="text-4xl font-bold text-purple-600 mb-4">
                            ₹{selectedPlanPrice.toLocaleString()}
                          </p>
                          <div className="space-y-3">
                            {selectedPlanFeatures.map((feature: any, idx: number) => (
                              <div key={idx} className="flex items-center space-x-3">
                                <Check className="h-5 w-5 text-green-600" />
                                <span className="text-slate-700 font-medium">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        <span className="font-bold">Secure Checkout:</span> You will be redirected to Razorpay to complete payment.
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('payment')}
                      className="w-full bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
                    >
                      <span>Continue to Payment</span>
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 2: PAYMENT */}
                {step === 'payment' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Review Before Making Payment</p>
                        <p className="text-xs text-amber-800 mt-1">Your selected plan will be sent to Razorpay for secure checkout.</p>
                      </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">{displayPlanName} Plan</span>
                        <span className="text-2xl font-bold text-purple-600">
                          ₹{selectedPlanPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <motion.button
                      whileHover={!isProcessing ? { scale: 1.02 } : {}}
                      whileTap={!isProcessing ? { scale: 0.98 } : {}}
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          <span>Make Payment</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center space-y-6 py-8"
                  >
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                    >
                      <Check className="h-10 w-10 text-green-600" />
                    </motion.div>

                    <div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-2">
                        Payment Successful!
                      </h3>
                      <p className="text-slate-600 text-lg">
                        You're now a {displayPlanName} member
                      </p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 space-y-3">
                      <p className="text-sm text-green-700">
                        <span className="font-bold">✓ Order Confirmation</span>
                      </p>
                      <div className="text-left space-y-2 text-sm">
                        <p><span className="font-bold">Plan:</span> {displayPlanName}</p>
                        <p><span className="font-bold">Amount:</span> ₹{selectedPlanPrice.toLocaleString()}</p>
                        <p><span className="font-bold">Status:</span> <span className="text-green-600 font-bold">Active</span></p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500">
                      Confirmation email sent to <span className="font-bold">{user?.email}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}