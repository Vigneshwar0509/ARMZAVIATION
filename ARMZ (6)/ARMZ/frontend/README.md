# ARMZ Aviation Career Portal

A comprehensive aviation career platform built with React, TypeScript, and modern web technologies. Features include job matching, resume building, career coaching, and secure payment processing.

## 🚀 Features

### ✅ **Implemented Features**

#### **Authentication & Security**
- **Multi-role Authentication**: Student, Employer, Admin roles
- **OTP Verification**: Email and phone number verification
- **Google OAuth**: Social login integration
- **Password Reset**: Secure password recovery with OTP
- **JWT Authentication**: Token-based authentication with refresh tokens
- **Role-based Access Control**: Protected routes and permissions

#### **Payment Integration**
- **Razorpay Integration**: Complete payment processing
- **Multiple Payment Plans**: Premium, Professional, Enterprise tiers
- **Payment Verification**: Secure server-side verification
- **Subscription Management**: Recurring payments and plan upgrades
- **Payment History**: Transaction tracking and receipts

#### **Job Portal**
- **Advanced Job Search**: Filter by location, type, company
- **Job Applications**: One-click apply with resume upload
- **Employer Dashboard**: Post jobs, manage applications
- **Application Tracking**: Real-time status updates
- **Saved Jobs**: Bookmark favorite positions

#### **Resume Builder**
- **Smart Resume**: Smart content suggestions
- **ATS Optimization**: Resume scoring and optimization
- **Multiple Templates**: Professional templates
- **PDF Export**: High-quality resume downloads
- **Aviation-Specific Fields**: Licenses, ratings, flight hours

#### **Career Coach**
- **Personalized Guidance**: Career path recommendations
- **Skill Assessment**: Competency evaluation
- **Interview Preparation**: Mock interviews and tips
- **Job Matching**: Job recommendations

#### **Admin Panel**
- **User Management**: Complete user lifecycle management
- **Content Management**: Jobs, courses, events
- **Analytics Dashboard**: Platform metrics and insights
- **Payment Management**: Transaction monitoring
- **Lead Management**: Sales funnel tracking

### 🎯 **User Roles**

#### **Students/Candidates**
- Browse and apply to aviation jobs
- Build ATS-optimized resumes
- Access career coaching
- Track application status
- Purchase premium subscriptions

#### **Employers**
- Post job openings
- Review and manage applications
- Access candidate database
- Schedule interviews
- Manage company profile

#### **Administrators**
- Full platform management
- User and content moderation
- Analytics and reporting
- Payment and subscription oversight

## 🛠️ **Technology Stack**

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend Framework** | React | 19.0.0 |
| **Build Tool** | Vite | 6.2.0 |
| **Language** | TypeScript | 5.8.2 |
| **State Management** | Zustand | 5.0.12 |
| **Styling** | Tailwind CSS | 4.1.14 |
| **API Client** | Axios | 1.15.0 |
| **Forms** | React Hook Form + Zod | 7.72.1 + 4.3.6 |
| **Routing** | React Router | 7.14.0 |
| **Data Fetching** | React Query | 5.99.0 |
| **Animations** | Framer Motion | 12.38.0 |
| **Payment** | Razorpay | 2.9.6 |
| **Authentication** | JWT + Google OAuth | - |
| **Icons** | Lucide React | 0.546.0 |
| **Notifications** | React Hot Toast | 2.6.0 |
| **Testing** | Vitest | 4.1.4 |

## 📁 **Project Structure**

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   │   ├── GoogleLogin.tsx
│   │   ├── OTPVerification.tsx
│   │   └── ForgetPassword.tsx
│   ├── common/         # Shared components
│   │   ├── PaymentFlow.tsx
│   │   └── LeadCaptureModal.tsx
│   ├── dashboard/      # Student dashboard
│   ├── jobs/           # Job-related components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── config/             # Configuration files
│   └── env.ts          # Environment variables
├── hooks/              # Custom React hooks
├── layouts/            # Page layouts
├── pages/              # Route components
│   ├── admin/          # Admin pages
│   ├── dashboard/      # Student dashboard
│   ├── employer/       # Employer pages
│   └── public/         # Public pages
├── sections/           # Homepage sections
├── services/           # API services
│   ├── apiClient.ts    # Axios configuration
│   ├── authService.ts  # Authentication service
│   ├── paymentService.ts # Payment service
├── store/              # Zustand stores
│   ├── authStore.ts    # Authentication state
│   ├── planStore.ts    # Subscription plans
│   └── resumeStore.ts  # Resume builder state
├── types.ts            # TypeScript definitions
└── lib/                # Utilities
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd armz-aviation-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

4. **Configure Environment Variables**
```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com/api

# Payment Gateway
VITE_RAZORPAY_KEY_ID=<YOUR_RAZORPAY_KEY>

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend-only secrets belong in backend/.env, not the frontend env file.
```

5. **Start Development Server**
```bash
npm run dev
```

6. **Build for Production**
```bash
npm run build
npm run preview
```

## 🔧 **Configuration**

### **Razorpay Setup**
1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Get API keys from Settings > API Keys
3. Add keys to environment variables

### **Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Add client ID to environment variables

### **Backend API**
The frontend expects a REST API with the following endpoints:

#### **Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `POST /auth/logout` - Logout

#### **Payments**
- `POST /payments/create-order` - Create payment order
- `POST /payments/verify` - Verify payment
- `GET /payments/history` - Payment history

#### **Jobs & Applications**
- `GET /jobs` - List jobs
- `POST /jobs/:id/apply` - Apply to job
- `GET /applications` - User applications

## 📱 **Usage**

### **For Students**
1. Register/Login with email or Google
2. Complete profile and verify email
3. Build resume using the resume builder
4. Search and apply to aviation jobs
5. Track applications and prepare for interviews
6. Upgrade to premium for advanced features

### **For Employers**
1. Register as employer and verify account
2. Complete company profile
3. Post job openings with detailed requirements
4. Review applications and shortlist candidates
5. Schedule interviews and manage hiring process

### **For Administrators**
1. Access admin dashboard
2. Manage users, jobs, and content
3. Monitor platform analytics
4. Handle payment and subscription issues
5. Generate reports and insights

## 🧪 **Testing**

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

## 📦 **Deployment**

### **Build Commands**
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### **Environment Variables for Production**
```env
NODE_ENV=production
VITE_API_BASE_URL=https://api.armzaviation.com
VITE_RAZORPAY_KEY_ID=<YOUR_PRODUCTION_RAZORPAY_KEY>
VITE_GOOGLE_CLIENT_ID=your_production_client_id
```

### **Deployment Checklist**
- [ ] Environment variables configured
- [ ] Razorpay keys updated for production
- [ ] Google OAuth configured for production domain
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] CDN configured for static assets

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- Email: support@armzaviation.com
- Documentation: [Wiki](https://github.com/armz/aviation-portal/wiki)
- Issues: [GitHub Issues](https://github.com/armz/aviation-portal/issues)

## 🎯 **Roadmap**

### **Phase 1 (Current)**
- ✅ Core authentication and authorization
- ✅ Job portal with applications
- ✅ Resume builder with advanced assistance
- ✅ Payment integration with Razorpay
- ✅ Admin dashboard

### **Phase 2 (Upcoming)**
- 🔄 Mobile app development
- 🔄 Advanced career coaching
- 🔄 Video interviewing platform
- 🔄 Integration with ATS systems
- 🔄 Multi-language support

### **Phase 3 (Future)**
- 🔄 Blockchain-based credentials
- 🔄 VR training modules
- 🔄 Global expansion
- 🔄 Advanced analytics and insights

---

**Built with ❤️ for the aviation community**
- [ ] All lint errors fixed and tests passing.
- [ ] Environment variables configured for production.
- [ ] Database indexes optimized for frequent queries.
- [ ] SSL/TLS certificates configured.
- [ ] Backup and recovery plan verified.
- [ ] Monitoring and error tracking active.
