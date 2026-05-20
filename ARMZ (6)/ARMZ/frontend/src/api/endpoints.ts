export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ADMIN_LOGIN: '/auth/admin/login',
    GOOGLE: '/auth/google',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    CSRF: '/auth/csrf',
  },
  CONTACT: {
    SUBMIT: '/contact',
    LEADS: '/leads',
    LEAD_STATUS: (id: string | number) => `/leads/${id}/status`,
    LEAD_DETAIL: (id: string | number) => `/leads/${id}`,
  },
  PAYMENTS: {
    CREATE_ORDER: '/payments/create-order',
    VERIFY: '/payments/verify',
    HISTORY: '/payments/history',
  },
} as const;
