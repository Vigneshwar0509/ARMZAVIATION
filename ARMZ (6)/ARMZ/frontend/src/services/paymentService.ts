import apiClient from './apiClient';
import toast from 'react-hot-toast';
import { ENV } from '@/src/config/env';

export interface PaymentOrder {
  id: string;
  razorpay_order_id?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  planId: string;
  userId: string;
  createdAt: string;
}

export interface PaymentVerification {
  success: boolean;
  paymentId: string;
  orderId: string;
  signature: string;
  status: 'captured' | 'failed';
}

export interface SubscriptionData {
  planId: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

class PaymentService {
  private razorpayLoaded = false;
  private verifiedPayments = new Set<string>();

  private getErrorMessage(error: any, fallback = 'Request failed'): string {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  }

  private shouldRetryVerification(error: any): boolean {
    const status = error?.response?.status;
    return error?.isNetworkError || status === 429 || status >= 500;
  }

  // Load Razorpay script
  async loadRazorpay(): Promise<void> {
    if (this.razorpayLoaded && window.Razorpay) {
      return Promise.resolve();
    }

    const scriptSrc = 'https://checkout.razorpay.com/v1/checkout.js';
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        this.razorpayLoaded = true;
        resolve();
        return;
      }

      const handleLoad = () => {
        this.razorpayLoaded = true;
        resolve();
      };

      const handleError = () => {
        reject(new Error('Failed to load Razorpay'));
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleLoad);
        existingScript.addEventListener('error', handleError);
        return;
      }

      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.onload = handleLoad;
      script.onerror = handleError;
      document.body.appendChild(script);
    });
  }

  async createOrder(planId: string, currency = 'INR'): Promise<PaymentOrder> {
    const response = await apiClient.post('/payments/create-order', {
      planId,
      currency,
    });

    const order = response.data?.order || response.data?.data?.order || response.data;
    if (order && order.id && typeof order.amount === 'number') {
      return order;
    }

    throw new Error('Invalid payment order response from backend');
  }

  async verifyPayment(verificationData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planId: string;
  }): Promise<PaymentVerification> {
    const response = await apiClient.post('/payments/verify', verificationData);
    return response.data;
  }

  // Create subscription (for recurring payments)
  async createSubscription(data: SubscriptionData): Promise<any> {
    try {
      const response = await apiClient.post('/payments/create-subscription', data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create subscription';
      toast.error(message);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(): Promise<PaymentOrder[]> {
    try {
      const response = await apiClient.get('/payments/history');
      return response.data.payments;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get payment history';
      toast.error(message);
      throw error;
    }
  }

  // Initialize Razorpay payment
  async initiatePayment(
    order: PaymentOrder,
    user: { name: string; email: string; phone?: string },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    try {
      if (!ENV.RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key is missing. Please configure VITE_RAZORPAY_KEY_ID.');
      }

      await this.loadRazorpay();

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not available. Please check your internet connection.');
      }

      const sanitizedContact = (user.phone || '').replace(/\D/g, '').slice(0, 15);

      // Razorpay expects an integer amount in the smallest currency unit (paise/cents)
      const smallestUnitMultiplier: Record<string, number> = { INR: 100, USD: 100, EUR: 100 };
      const multiplier = smallestUnitMultiplier[order.currency] || 100;
      const amountInSmallestUnit = Math.round(Number(order.amount) * multiplier);

      const options: any = {
        key: ENV.RAZORPAY_KEY_ID,
        amount: amountInSmallestUnit,
        currency: order.currency,
        name: 'ARMZ Aviation',
        description: `Plan Subscription - ${order.planId}`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: sanitizedContact.length >= 10 ? sanitizedContact : '',
        },
        theme: {
          color: '#7c3aed',
        },
        handler: (response: any) => {
          // Inject original IDs in case fallback or test mode omitted them
          // This prevents backend 500 errors when verifying signature without an order ID
          if (!response.razorpay_order_id && rzpOrderId) {
            response.razorpay_order_id = rzpOrderId;
          }
          response.local_order_id = order.id;
          response.original_razorpay_order_id = order.razorpay_order_id || '';
          onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            onFailure({ reason: 'user_cancelled', message: 'Payment cancelled by user' });
          },
          confirm_close: true,
          escape: true,
        },
      };

      // Only pass `order_id` to Razorpay when backend created a real Razorpay order.
      // In development the backend may return a local placeholder like `order_local_1`.
      // Passing that to Razorpay causes a 400 from their preferences API, so omit it.
      const rzpOrderId = order.razorpay_order_id || (String(order.id).startsWith("order_") ? order.id : undefined);

      if (rzpOrderId && !rzpOrderId.startsWith("order_local_")) {
        options.order_id = rzpOrderId;
      }

      let retriedWithoutOrder = false;

      const launchCheckout = (checkoutOptions: any) => {
        const rzp = new window.Razorpay(checkoutOptions);

        rzp.on('payment.failed', (response: any) => {
          const paymentError = {
            ...(response?.error || { message: 'Payment failed' }),
            fallbackRetryAttempted: retriedWithoutOrder,
          };
          const errorText = String(
            paymentError?.description || paymentError?.reason || paymentError?.message || ''
          ).toLowerCase();

          // Retry once without order_id because some merchant/test accounts reject order-bound method discovery.
          if (!retriedWithoutOrder && checkoutOptions.order_id && errorText.includes('no appropriate payment method found')) {
            retriedWithoutOrder = true;
            const retryOptions = {
              ...checkoutOptions,
              prefill: {
                ...checkoutOptions.prefill,
                contact: '',
              },
            };
            delete retryOptions.order_id;
            toast('Retrying checkout with fallback payment options...');
            launchCheckout(retryOptions);
            return;
          }

          onFailure(paymentError);
        });

        rzp.open();
      };

      launchCheckout(options);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to initialize payment. Please try again.';
      if (error?.isMixedContent) {
        toast.error('Payment blocked due to HTTP API on an HTTPS page. Switch VITE_API_URL to HTTPS and try again.');
        onFailure(error);
        return;
      }

      toast.error(errorMessage);
      onFailure(error);
    }
  }

  // Process payment completion
  async processPaymentCompletion(
    planId: string,
    paymentResponse: any
  ): Promise<{ success: boolean; subscription?: any; message?: string }> {
    try {
      // Provide a unique ID if missing to prevent backend IntegrityError on unique constraints
      const paymentId = paymentResponse?.razorpay_payment_id || `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      // Prevent duplicate verification requests which cause backend 500s (IntegrityError)
      if (this.verifiedPayments.has(paymentId)) {
        return { success: true };
      }
      this.verifiedPayments.add(paymentId);

      const resolvedRzpOrderId = paymentResponse?.original_razorpay_order_id !== undefined 
        ? paymentResponse.original_razorpay_order_id 
        : (paymentResponse?.razorpay_order_id || '');

      const payload: any = {
        razorpay_order_id: resolvedRzpOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: paymentResponse?.razorpay_signature || '',
        planId,
      };

      // Attach local order reference to ensure the backend can find the record
      payload.order_id = paymentResponse?.local_order_id || '';
      payload.local_order_id = paymentResponse?.local_order_id || ''; // Backup parameter

      let verification: PaymentVerification | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          verification = await this.verifyPayment(payload);
          break;
        } catch (error: any) {
          if (attempt === 0 && this.shouldRetryVerification(error)) {
            continue;
          }

          this.verifiedPayments.delete(paymentId);
          throw error;
        }
      }

      if (verification && verification.success === false) {
        this.verifiedPayments.delete(paymentId);
        throw new Error('Payment verification failed');
      }

      let subscriptionData = null;
      try {
        const subRes = await apiClient.post('/users/update-subscription', {
          planId,
          paymentId,
        });
        subscriptionData = subRes.data;
      } catch (updateError) {
        console.warn('Non-critical: Update subscription endpoint failed or missing, relying on verification success.', updateError);
      }

      return { success: true, subscription: subscriptionData };
    } catch (error: any) {
      const message = this.getErrorMessage(error, 'Payment could not be completed. Please try again.');
      console.error('Payment completion error:', message);
      this.verifiedPayments.delete(paymentResponse?.razorpay_payment_id || '');
      toast.error(message);
      return { success: false, message };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await apiClient.post('/payments/cancel-subscription', { subscriptionId });
      toast.success('Subscription cancelled successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to cancel subscription';
      toast.error(message);
      throw error;
    }
  }

  // Get subscription details
  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/payments/subscription/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get subscription details';
      toast.error(message);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
