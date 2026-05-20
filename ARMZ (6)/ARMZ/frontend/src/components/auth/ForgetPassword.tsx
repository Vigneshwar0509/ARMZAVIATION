import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import OTPVerification from './OTPVerification';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface ForgetPasswordProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ForgetPassword({ onBack, onSuccess }: ForgetPasswordProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(data.email);
      setEmail(data.email);
      setStep('otp');
    } catch (error) {
      console.error('Password reset request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (response: { token: string }) => {
    if (response && response.token) {
      setResetToken(response.token);
      setStep('password');
    } else {
      toast.error('Invalid verification response. Please try again.');
      console.error('OTP verification did not provide a reset token.');
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: resetToken,
        newPassword: data.password,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onBack(); // Go back to login
      }
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Reset Password
        </h2>
        <p className="text-slate-600">
          Enter your email address and we'll send you a reset code
        </p>
      </div>

      <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
        <div>
          <Input
            {...emailForm.register('email')}
            type="email"
            placeholder="Enter your email"
          />
          {emailForm.formState.errors.email && (
            <p className="text-xs text-red-500 font-bold mt-1">
              {emailForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              Send Reset Code
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      <button
        onClick={onBack}
        className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 flex items-center justify-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Login
      </button>
    </motion.div>
  );

  const renderOTPStep = () => (
    <OTPVerification
      email={email}
      type="password_reset"
      onSuccess={(response) => handleOTPVerified(response as { token: string })}
      onCancel={() => setStep('email')}
      title="Verify Reset Code"
      description={`We've sent a 6-digit code to ${email}`}
    />
  );

  const renderPasswordStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          New Password
        </h2>
        <p className="text-slate-600">
          Enter your new password
        </p>
      </div>

      <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
        <div>
          <Input
            {...passwordForm.register('password')}
            type="password"
            placeholder="New password"
          />
          {passwordForm.formState.errors.password && (
            <p className="text-xs text-red-500 font-bold mt-1">
              {passwordForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Input
            {...passwordForm.register('confirmPassword')}
            type="password"
            placeholder="Confirm new password"
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500 font-bold mt-1">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              Update Password
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      <button
        onClick={() => setStep('otp')}
        className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
      >
        Back
      </button>
    </motion.div>
  );

  return (
    <div className="max-w-md mx-auto">
      {step === 'email' && renderEmailStep()}
      {step === 'otp' && renderOTPStep()}
      {step === 'password' && renderPasswordStep()}
    </div>
  );
}