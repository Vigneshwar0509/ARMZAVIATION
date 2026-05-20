import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgetPassword from './ForgetPassword';
import * as authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: vi.fn(),
}));

// Mock OTPVerification component
vi.mock('./OTPVerification', () => ({
  default: ({ onSuccess, title, description }: any) => (
    <div data-testid="otp-verification">
      <p>{title}</p>
      <p>{description}</p>
      <button onClick={() => onSuccess({ token: 'mock-reset-token' })}>
        Verify OTP
      </button>
    </div>
  ),
}));

describe('ForgetPassword - Password Reset Flow', () => {
  const mockOnBack = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email step initially', () => {
    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    const emailInput = screen.getByPlaceholderText('Enter your email') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(emailInput.closest('form')!);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('submits valid email and moves to OTP step', async () => {
    const mockRequestPasswordReset = vi.fn().mockResolvedValue({});
    (authService.authService.requestPasswordReset as any) = mockRequestPasswordReset;

    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    const emailInput = screen.getByPlaceholderText('Enter your email') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /send reset code/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByTestId('otp-verification')).toBeInTheDocument();
    });
  });

  it('moves to password step after OTP verification', async () => {
    const mockRequestPasswordReset = vi.fn().mockResolvedValue({});
    (authService.authService.requestPasswordReset as any) = mockRequestPasswordReset;

    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    const emailInput = screen.getByPlaceholderText('Enter your email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      expect(screen.getByTestId('otp-verification')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText('New Password')).toBeInTheDocument();
    });
  });

  it('validates password requirements', async () => {
    const mockRequestPasswordReset = vi.fn().mockResolvedValue({});
    (authService.authService.requestPasswordReset as any) = mockRequestPasswordReset;

    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    const emailInput = screen.getByPlaceholderText('Enter your email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('New password') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('Confirm new password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('completes full password reset flow successfully', async () => {
    const mockRequestPasswordReset = vi.fn().mockResolvedValue({});
    const mockResetPassword = vi.fn().mockResolvedValue({});
    (authService.authService.requestPasswordReset as any) = mockRequestPasswordReset;
    (authService.authService.resetPassword as any) = mockResetPassword;

    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    const emailInput = screen.getByPlaceholderText('Enter your email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('New Password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('New password') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('Confirm new password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'mock-reset-token',
        newPassword: 'SecurePassword123!',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('can go back to login', () => {
    render(<ForgetPassword onBack={mockOnBack} onSuccess={mockOnSuccess} />);
    const backButton = screen.getByRole('button', { name: /back to login/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });
});
