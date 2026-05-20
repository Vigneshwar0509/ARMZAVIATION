import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import toast from 'react-hot-toast';
import { authService } from '@/src/services/authService';

const initialOtpSendTracker = new Set<string>();

interface OTPVerificationProps {
  email?: string;
  phone?: string;
  type: 'email' | 'phone' | 'password_reset';
  onSuccess: (user: any) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export default function OTPVerification({
  email,
  phone,
  type,
  onSuccess,
  onCancel,
  title,
  description
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const target = email || phone || '';
  const isEmail = type === 'email' || !!email;

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const sendOtp = async () => {
    await authService.sendOTP(email, phone, type);
    startCountdown();
  };

  useEffect(() => {
    const key = `${type}:${target}`;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      if (!target || initialOtpSendTracker.has(key)) {
        return;
      }
      initialOtpSendTracker.add(key);

      try {
        await authService.sendOTP(email, phone, type);
        cleanup = startCountdown();
      } catch (error) {
        // Error toast is handled by authService
      }
    };

    void run();

    return () => {
      cleanup?.();
      if (initialOtpSendTracker.has(key)) {
        window.setTimeout(() => {
          initialOtpSendTracker.delete(key);
        }, 5000);
      }
    };
  }, [email, phone, type, target]);

  const handleSendOTP = async () => {
    setIsResending(true);
    try {
      await sendOtp();
    } catch (error) {
      // Error toast is handled by authService
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyOTP({
        email,
        phone,
        otp,
        type,
      });

      onSuccess(result);
    } catch (error) {
      // Error toast is handled by authService
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleVerifyOTP();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          {isEmail ? (
            <Mail className="h-8 w-8 text-purple-600" />
          ) : (
            <Phone className="h-8 w-8 text-purple-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {title || `Verify ${isEmail ? 'Email' : 'Phone'}`}
        </h2>
        <p className="text-slate-600">
          {description || `We've sent a 6-digit code to ${target}`}
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter OTP
          </label>
          <Input
            type="text"
            value={otp}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            className="text-center text-2xl font-mono tracking-widest"
            maxLength={6}
            autoFocus
          />
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.length !== 6}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            <>
              Verify OTP
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">
            Didn't receive the code?
          </p>
          {countdown > 0 ? (
            <p className="text-sm text-slate-500">
              Resend in {countdown}s
            </p>
          ) : (
            <button
              onClick={handleSendOTP}
              disabled={isResending}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center mx-auto"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Resend OTP
                </>
              )}
            </button>
          )}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}