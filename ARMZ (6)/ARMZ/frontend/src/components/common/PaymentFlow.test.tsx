import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentFlow from './PaymentFlow';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock the stores
vi.mock('@/src/store/planStore', () => ({
  usePlanStore: () => ({
    plans: [{
      id: 'premium',
      name: 'Premium Plan',
      price: 9999,
      features: ['Feature 1', 'Feature 2']
    }]
  })
}));

vi.mock('@/src/store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890'
    }
  })
}));

vi.mock('@/src/store/leadStore', () => ({
  useLeadStore: () => ({
    createLead: vi.fn()
  })
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div>X</div>,
  Loader2: () => <div>Loading</div>,
  Check: () => <div>Check</div>,
  Zap: () => <div>Zap</div>,
  Shield: () => <div>Shield</div>,
  CreditCard: () => <div>CreditCard</div>,
  Lock: () => <div>Lock</div>,
  ArrowRight: () => <div>ArrowRight</div>,
  AlertCircle: () => <div>AlertCircle</div>
}));

// Mock payment service
vi.mock('@/src/services/paymentService', () => ({
  paymentService: {
    loadRazorpay: vi.fn().mockResolvedValue(undefined),
    createOrder: vi.fn().mockResolvedValue({
      id: 'order_test_123',
      amount: 1170000,
      currency: 'INR',
      status: 'created',
      planId: 'premium',
      userId: 'demo_user',
      createdAt: new Date().toISOString(),
    }),
    initiatePayment: vi.fn().mockResolvedValue(undefined),
    processPaymentCompletion: vi.fn().mockResolvedValue({ success: true }),
  }
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('PaymentFlow Component', () => {
  it('renders confirmation step initially', async () => {
    render(
      <MemoryRouter>
        <PaymentFlow isOpen={true} onClose={() => {}} planId="premium" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Secure Payment')).toBeInTheDocument());
    expect(screen.getByText('Continue to Payment')).toBeInTheDocument();
    expect(screen.getAllByText(/Premium Plan/).length).toBeGreaterThan(0);
  });

  it('does not render when isOpen is false', () => {
    render(
      <MemoryRouter>
        <PaymentFlow isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Secure Payment')).not.toBeInTheDocument();
  });

  it('shows checkout notice', async () => {
    render(
      <MemoryRouter>
        <PaymentFlow isOpen={true} onClose={() => {}} planId="premium" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Secure Checkout:/)).toBeInTheDocument());
  });
});
