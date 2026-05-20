import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authService } from '@/src/services/authService';
import { ENV } from '@/src/config/env';

interface GoogleLoginProps {
  onSuccess: (user: any) => void;
  onError?: (error: any) => void;
  text?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    __armzGoogleSignInInitialized?: boolean;
    __armzGoogleSignInClientId?: string;
  }
}

export default function GoogleLogin({
  onSuccess,
  onError,
  text = "Continue with Google",
  className = ""
}: GoogleLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const googleClientId = ENV.GOOGLE_CLIENT_ID;
  const isGoogleSignInEnabled = ENV.GOOGLE_SIGN_IN_ENABLED;
  const isGoogleDisabled = !isGoogleSignInEnabled || !googleClientId;
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const googleCallbackRef = useRef<((response: any) => Promise<void>) | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    const scriptSrc = 'https://accounts.google.com/gsi/client';
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    const handleGoogleResponse = async (response: any) => {
      setIsLoading(true);
      try {
        const result = await authService.googleLogin(response.credential);
        onSuccessRef.current(result);
      } catch (error) {
        if (onErrorRef.current) onErrorRef.current(error);
      } finally {
        setIsLoading(false);
      }
    };
    googleCallbackRef.current = handleGoogleResponse;

    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id) {
        return;
      }

      if (!isGoogleSignInEnabled) {
        setIsGoogleLoaded(false);
        setInitError('Google Sign-In is disabled in this environment. Use email/password login for now.');
        return;
      }

      if (!googleClientId) {
        setIsGoogleLoaded(false);
        setInitError('Google Sign-In is not configured for this environment.');
        return;
      }

      setInitError(null);

      const accountsId = window.google.accounts.id;
      const shouldInitialize =
        !window.__armzGoogleSignInInitialized ||
        window.__armzGoogleSignInClientId !== googleClientId;

      if (shouldInitialize) {
        accountsId.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            void googleCallbackRef.current?.(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.__armzGoogleSignInInitialized = true;
        window.__armzGoogleSignInClientId = googleClientId;
      }

      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = '';
        try {
          accountsId.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: buttonContainerRef.current.offsetWidth || 320,
            logo_alignment: 'left',
          });
        } catch (renderError) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown-origin';
          const message =
            `Google Sign-In failed to render. This often means the origin (${origin}) is not authorized for the OAuth client id ${googleClientId}. ` +
            `Please authorize this origin in your Google Cloud Console.`;
          setInitError(message);
          if (onErrorRef.current) onErrorRef.current(renderError);
          return;
        }

        // Normalize styling of the injected Google button so it matches our UI.
        // We wait briefly to allow the library to inject the markup, then adjust.
        setTimeout(() => {
          try {
            const container = buttonContainerRef.current!;
            if (container.childElementCount === 0) {
              const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown-origin';
              const renderErrorMessage =
                `Google Sign-In failed to render. This often means the origin (${origin}) is not authorized for the OAuth client id ${googleClientId}. Add your origin under "Authorized JavaScript origins" in the Google Cloud Console: https://console.cloud.google.com/apis/credentials`;
              setInitError(renderErrorMessage);
              if (onErrorRef.current) onErrorRef.current(new Error(renderErrorMessage));
              return;
            }

            // Apply classes and inline styles so the button spans full width, has our
            // rounded corners and consistent height.
            const injected = container.querySelector('div, button, .GIDButton') || container.firstElementChild;
            if (injected && injected instanceof HTMLElement) {
              injected.style.width = '100%';
              injected.style.height = '44px';
              injected.style.display = 'flex';
              injected.style.alignItems = 'center';
              injected.style.justifyContent = 'center';
              injected.style.borderRadius = '12px';
              injected.style.overflow = 'hidden';
              // Add tailwind-like classes where possible for color and border fallback
              injected.classList.add('w-full');
              injected.classList.add('rounded-xl');
              injected.classList.add('border');
              injected.classList.add('border-slate-200');
              injected.classList.add('bg-white');

              // Ensure the inner button content doesn't overflow horizontally
              Array.from(injected.querySelectorAll('*')).forEach((el) => {
                if (el instanceof HTMLElement) {
                  el.style.maxWidth = '100%';
                }
              });
            }
          } catch (e) {
            // ignore diagnostic styling errors
          }
        }, 120);
      }

      setIsGoogleLoaded(true);
    };

    if (isGoogleDisabled) {
      setIsGoogleLoaded(false);
      setInitError(
        !isGoogleSignInEnabled
          ? 'Google Sign-In is disabled in this environment. Use email/password login for now.'
          : 'Google Sign-In is not configured for this environment.'
      );
      return;
    }

    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        return;
      }

      if (existingScript) {
        existingScript.addEventListener('load', initializeGoogleSignIn);
        existingScript.addEventListener('error', () => {
          setInitError('Failed to load Google services.');
          if (onErrorRef.current) onErrorRef.current(new Error('Failed to load Google services'));
        });
        return;
      }

      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        setInitError('Failed to load Google services.');
        if (onErrorRef.current) onErrorRef.current(new Error('Failed to load Google services'));
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();

    return () => {
      if (existingScript) {
        existingScript.removeEventListener('load', initializeGoogleSignIn);
      }
    };
  }, [googleClientId, isGoogleSignInEnabled]);

  if (isGoogleDisabled) {
    return (
      <div className={`w-full ${className}`}>
        <div className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 text-center">
          {!isGoogleSignInEnabled
            ? 'Google Sign-In is disabled in this environment. Use email/password login for now.'
            : 'Google Sign-In is not configured for this environment.'}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={buttonContainerRef}
        title={initError || undefined}
        className={`min-h-11 w-full overflow-hidden rounded-xl ${!isGoogleLoaded ? 'opacity-60' : ''}`}
      />
      {isLoading && (
        <div className="mt-2 flex items-center justify-center text-sm text-slate-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        </div>
      )}
      {initError && (
        <p className="mt-2 text-center text-xs text-slate-500">{initError}</p>
      )}
      {!initError && !isGoogleLoaded && googleClientId && isGoogleSignInEnabled && (
        <p className="mt-2 text-center text-xs text-slate-500">{text}</p>
      )}
    </div>
  );
}
