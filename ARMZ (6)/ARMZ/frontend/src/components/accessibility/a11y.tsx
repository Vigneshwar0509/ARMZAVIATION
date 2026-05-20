import React from 'react';
import './a11y.css';

/**
 * Accessibility (a11y) Enhancement Utilities
 * Ensures WCAG 2.1 AA compliance
 */

// ARIA Attributes Helper
export const a11yAttrs = {
  // For loading states
  loading: {
    'aria-busy': 'true',
    'aria-label': 'Loading content',
  },
  
  // For error states
  error: {
    'role': 'alert',
    'aria-live': 'polite',
  },
  
  // For buttons
  button: (disabled: boolean = false) => ({
    'aria-disabled': disabled,
    'aria-pressed': undefined,
  }),
  
  // For form fields
  formField: (id: string, required: boolean = false, error?: string) => ({
    'id': id,
    'aria-label': id,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : undefined,
  }),
  
  // For navigation
  nav: (current: boolean = false) => ({
    'aria-current': current ? 'page' : undefined,
  }),
  
  // For dialogs/modals
  dialog: {
    'role': 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'dialog-title',
  },
  
  // For live regions (chat, notifications)
  liveRegion: {
    'role': 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
  
  // For tab panels
  tabPanel: (tabId: string) => ({
    'id': `${tabId}-panel`,
    'role': 'tabpanel',
    'aria-labelledby': tabId,
  }),
};

// Keyboard navigation utilities
export const keyboardShortcuts = {
  // Focus trap - keeps focus within modal
  focusTrap: (element: HTMLElement, onEscape?: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
      
      if (e.key === 'Tab') {
        const focusableElements = element.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  },
  
  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Screen reader only class
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  },
};

// Color contrast checker
export const contrastChecker = {
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((val) => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  
  getContrast: (color1: string, color2: string): number => {
    const rgb1 = color1.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const rgb2 = color2.match(/\d+/g)?.map(Number) || [0, 0, 0];
    
    const lum1 = contrastChecker.getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = contrastChecker.getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },
  
  isAccessible: (contrast: number, level: 'AA' | 'AAA' = 'AA'): boolean => {
    return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
  },
};

// Skip to main content link
export const SkipToMainLink = () => {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
    >
      Skip to main content
    </a>
  );
};

// Form field with accessibility
export const AccessibleFormField = ({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required"> *</span>}
      </label>
      {children}
      {error && (
        <div id={`${id}-error`} role="alert" className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

// Accessible button component
export const AccessibleButton = ({
  children,
  disabled,
  loading,
  onClick,
  ...props
}: any) => {
  if (loading) {
    return (
      <button
        disabled
        onClick={onClick}
        aria-busy="true"
        aria-disabled="true"
        {...props}
      >
        <span aria-hidden="true">⏳</span>
        {children}
      </button>
    );
  }

  if (disabled) {
    return (
      <button
        disabled
        onClick={onClick}
        aria-busy="false"
        aria-disabled="true"
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      disabled={false}
      onClick={onClick}
      aria-busy="false"
      aria-disabled="false"
      {...props}
    >
      {children}
    </button>
  );
};

// Tab navigation with a11y
export const AccessibleTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) => {
  return (
    <div>
      <div role="tablist" aria-label="Tabs">
        {tabs.map((tab) =>
          activeTab === tab.id ? (
            <button
              key={tab.id}
              role="tab"
              aria-selected="true"
              aria-controls={`${tab.id}-panel`}
              id={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="active"
            >
              {tab.label}
            </button>
          ) : (
            <button
              key={tab.id}
              role="tab"
              aria-selected="false"
              aria-controls={`${tab.id}-panel`}
              id={tab.id}
              onClick={() => onTabChange(tab.id)}
              className=""
            >
              {tab.label}
            </button>
          )
        )}
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${tab.id}-panel`}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

// Announcement component for dynamic content
export const LiveAnnouncement = ({ message }: { message: string }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
