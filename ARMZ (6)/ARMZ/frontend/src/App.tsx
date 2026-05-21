import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import MainLayout from "@/src/layouts/MainLayout";
import DashboardLayout from "@/src/layouts/DashboardLayout";
import AdminLayout from "@/src/layouts/AdminLayout";
import EmployerLayout from "@/src/layouts/EmployerLayout";
import ErrorBoundary from "@/src/components/common/ErrorBoundary";
import ProtectedRoute from "@/src/components/auth/ProtectedRoute";
import PlanAccessGate from "@/src/components/auth/PlanAccessGate";
import { Toaster } from "react-hot-toast";

// Loading Component
const PageLoader = () => (
  <div className="flight-loader">
    <style>{`
      .flight-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #ffffff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
      }

      .plane-icon {
        width: 50px;
        height: 50px;
        fill: #4B207E;
        animation: takeoff 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }

      .runway {
        width: 120px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #4B207E, transparent);
        margin-top: 15px;
        border-radius: 5px;
        animation: fadeRunway 2.5s infinite;
      }

      .loading-text {
        margin-top: 20px;
        color: #4B207E;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 3px;
        text-transform: uppercase;
        animation: pulseText 2.5s infinite;
      }

      @keyframes takeoff {
        0% {
          transform: translate(-50px, 20px) rotate(60deg) scale(0.8);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        75% {
          opacity: 1;
        }
        100% {
          transform: translate(70px, -60px) rotate(60deg) scale(1.1);
          opacity: 0;
        }
      }

      @keyframes fadeRunway {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.8; }
      }

      @keyframes pulseText {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `}</style>

    <svg className="plane-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>

    <div className="runway" />
    <span className="loading-text">Loading...</span>
  </div>
);

// Lazy Loaded Public Pages
const Home = lazy(() => import("@/src/pages/public/Home"));
const Jobs = lazy(() => import("@/src/pages/public/Jobs"));
const JobDetails = lazy(() => import("@/src/pages/public/JobDetails"));
const Login = lazy(() => import("@/src/pages/public/Login"));
const Register = lazy(() => import("@/src/pages/public/Register"));
const PlanOnboarding = lazy(() => import("@/src/pages/public/PlanOnboarding"));
const About = lazy(() => import("@/src/pages/public/About"));
const Contact = lazy(() => import("@/src/pages/public/Contact"));
const CollegeCollaboration = lazy(() => import("@/src/pages/public/CollegeCollaboration"));
const Events = lazy(() => import("@/src/pages/public/Events"));
const AdminLogin = lazy(() => import("@/src/pages/public/AdminLogin"));
const NotFound = lazy(() => import("@/src/pages/public/NotFound"));
const Privacy = lazy(() => import("@/src/pages/public/Privacy"));
const Terms = lazy(() => import("@/src/pages/public/Terms"));
const Cookies = lazy(() => import("@/src/pages/public/Cookies"));
const Programs = lazy(() => import("@/src/pages/public/Programs"));

// Lazy Loaded Employer Pages
const EmployerDashboard = lazy(() => import("@/src/pages/employer/EmployerDashboard"));
const PostJob = lazy(() => import("@/src/pages/employer/PostJob"));
const ApplicantManagement = lazy(() => import("@/src/pages/employer/ApplicantManagement"));
const InterviewManagement = lazy(() => import("@/src/pages/employer/InterviewManagement"));
const EmployerProfile = lazy(() => import("@/src/pages/employer/EmployerProfile"));
const EmployerSubscription = lazy(() => import("@/src/pages/employer/Subscriptions"));
const EmployerConclaves = lazy(() => import("@/src/pages/employer/Conclaves"));

// Lazy Loaded Student Dashboard Pages
const DashboardHome = lazy(() => import("@/src/pages/dashboard/DashboardHome"));
const ResumeBuilder = lazy(() => import("@/src/pages/dashboard/ResumeBuilder"));
const Profile = lazy(() => import("@/src/pages/dashboard/Profile"));
const StudentJobs = lazy(() => import("@/src/pages/dashboard/Jobs"));
const StudentInterviews = lazy(() => import("@/src/pages/dashboard/Interviews"));
const StudentSubscriptions = lazy(() => import("@/src/pages/dashboard/Subscriptions"));
const StudentNotifications = lazy(() => import("@/src/pages/dashboard/Notifications"));
const StudentWebinars = lazy(() => import("@/src/pages/dashboard/Webinars"));
const StudentLinkedIn = lazy(() => import("@/src/pages/dashboard/LinkedInSupport"));
const StudentSettings = lazy(() => import("@/src/pages/dashboard/Settings"));
const StudentApplications = lazy(() => import("@/src/pages/dashboard/Applications"));
const StudentCourses = lazy(() => import("@/src/pages/dashboard/Courses"));
const StudentAssessments = lazy(() => import("@/src/pages/dashboard/Assessments"));

// Lazy Loaded Admin Panel Pages
const AdminDashboard = lazy(() => import("@/src/pages/admin/AdminDashboard"));
const AdminStudents = lazy(() => import("@/src/pages/admin/Students"));
const AdminJobs = lazy(() => import("@/src/pages/admin/Jobs"));
const AdminApplications = lazy(() => import("@/src/pages/admin/AdminApplications"));
const AdminInternships = lazy(() => import("@/src/pages/admin/Internships"));
const AdminInterviews = lazy(() => import("@/src/pages/admin/Interviews"));
const AdminPlans = lazy(() => import("@/src/pages/admin/Plans"));
const AdminPayments = lazy(() => import("@/src/pages/admin/Payments"));
const AdminCampaigns = lazy(() => import("@/src/pages/admin/Campaigns"));
const AdminColleges = lazy(() => import("@/src/pages/admin/Colleges"));
const AdminEvents = lazy(() => import("@/src/pages/admin/Events"));
const AdminWebinarRegistrations = lazy(() => import("@/src/pages/admin/AdminWebinarRegistrations"));
const AdminReports = lazy(() => import("@/src/pages/admin/Reports"));
const AdminEmployers = lazy(() => import("@/src/pages/admin/Employers"));
const AdminEnquiries = lazy(() => import("@/src/pages/admin/Enquiries"));
const AdminManagement = lazy(() => import("@/src/pages/admin/AdminManagement"));
const AdminCourses = lazy(() => import("@/src/pages/admin/Courses"));
const AdminLeads = lazy(() => import("@/src/pages/admin/Leads"));
const AdminSettings = lazy(() => import("@/src/pages/admin/Settings"));
const AdminSubscriptions = lazy(() => import("@/src/pages/admin/Subscriptions"));

import { AnimatePresence, motion } from "motion/react";
import LeadCaptureModal from "@/src/components/common/LeadCaptureModal";
import WhatsAppButton from "@/src/components/common/WhatsAppButton";
import UpdatesQrWidget from "@/src/components/common/UpdatesQrWidget";
import PaymentFlow from "@/src/components/common/PaymentFlow";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import { useAuthStore } from "@/src/store/authStore";
import { useUIStore } from "@/src/store/uiStore";

export const PaymentContext = React.createContext<{
  isPaymentOpen: boolean;
  openPayment: (planId: string, planName: string) => void;
  closePayment: () => void;
} | null>(null);

function AnimatedRoutes() {
  const location = useLocation();
  useAnalytics();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="programs" element={<Programs />} />
          <Route path="about" element={<About />} />
          <Route path="collaboration" element={<CollegeCollaboration />} />
          <Route path="events" element={<Events />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="admin-login" element={<AdminLogin />} />
          <Route path="register" element={<Register />} />
          <Route
            path="onboarding/plan"
            element={
              <ProtectedRoute allowedRoles={["student", "employer"]} allowSubscriptionBypass>
                <PlanOnboarding />
              </ProtectedRoute>
            }
          />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="cookies" element={<Cookies />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Student Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["student"]} allowPlanAccessBypass>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="resume"
            element={
              <PlanAccessGate
                featureName="Resume Builder"
                description="Build and export aviation-ready resumes with the plan that includes career tools and application support."
              >
                <ResumeBuilder />
              </PlanAccessGate>
            }
          />
          <Route
            path="linkedin"
            element={
              <PlanAccessGate
                featureName="LinkedIn Support"
                description="LinkedIn profile optimization is available on higher student plans designed for placement preparation."
              >
                <StudentLinkedIn />
              </PlanAccessGate>
            }
          />
          <Route path="jobs" element={<StudentJobs />} />
          <Route
            path="interviews"
            element={
              <PlanAccessGate
                featureName="Interview Schedule"
                description="Interview scheduling and advanced interview support unlock after you upgrade to an eligible student plan."
              >
                <StudentInterviews />
              </PlanAccessGate>
            }
          />
          <Route path="subscription" element={<StudentSubscriptions />} />
          <Route path="subscriptions" element={<StudentSubscriptions />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route
            path="webinars"
            element={
              <PlanAccessGate
                featureName="Webinars"
                description="Live webinars and expert sessions are reserved for student plans that include placement-focused access."
              >
                <StudentWebinars />
              </PlanAccessGate>
            }
          />
          <Route path="settings" element={<StudentSettings />} />
          <Route
            path="applications"
            element={
              <PlanAccessGate
                featureName="Applications"
                description="Track application stages and job progress with a student plan that includes advanced placement tools."
              >
                <StudentApplications />
              </PlanAccessGate>
            }
          />
          <Route
            path="courses"
            element={
              <PlanAccessGate
                featureName="Courses"
                description="Professional aviation courses are available when your plan includes skills training and guided preparation."
              >
                <StudentCourses />
              </PlanAccessGate>
            }
          />
          <Route
            path="courses/:id"
            element={
              <PlanAccessGate
                featureName="Courses"
                description="This course content is part of paid student plans with training access."
              >
                <StudentCourses />
              </PlanAccessGate>
            }
          />
          <Route
            path="assessments"
            element={
              <PlanAccessGate
                featureName="Assessments"
                description="Skill assessments unlock on higher student plans built for interview readiness and placement success."
              >
                <StudentAssessments />
              </PlanAccessGate>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Employer Dashboard Routes */}
        <Route 
          path="/employer" 
          element={
            <ProtectedRoute allowedRoles={["employer"]} allowPlanAccessBypass>
              <EmployerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployerDashboard />} />
          <Route
            path="post-job"
            element={
              <PlanAccessGate
                featureName="Job Posting"
                description="Post new jobs and manage listings using your employer plan permissions."
              >
                <PostJob />
              </PlanAccessGate>
            }
          />
          <Route path="applicants" element={<ApplicantManagement />} />
          <Route
            path="interviews"
            element={
              <PlanAccessGate
                featureName="Interview Management"
                description="Interview coordination tools are available on employer plans that include advanced hiring workflows."
              >
                <InterviewManagement />
              </PlanAccessGate>
            }
          />
          <Route path="profile" element={<EmployerProfile />} />
          <Route path="subscription" element={<EmployerSubscription />} />
          <Route
            path="conclaves"
            element={
              <PlanAccessGate
                featureName="Conclaves"
                description="Employer conclaves, networking access, and event registration are reserved for higher-tier hiring plans."
              >
                <EmployerConclaves />
              </PlanAccessGate>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Panel Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="internships" element={<AdminInternships />} />
          <Route path="interviews" element={<AdminInterviews />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="colleges" element={<AdminColleges />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="webinars/:webinarId/registrations" element={<AdminWebinarRegistrations />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="employers" element={<AdminEmployers />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="management" element={<AdminManagement />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollTarget = document.scrollingElement || document.documentElement || document.body;
    if (!scrollTarget) return;

    requestAnimationFrame(() => {
      scrollTarget.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  }, [pathname]);

  return null;
}

function FloatingWidgets() {
  const { pathname } = useLocation();
  const hideWidgets = pathname.startsWith('/admin');

  if (hideWidgets) {
    return null;
  }

  return (
    <>
      <UpdatesQrWidget />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const theme = useUIStore((state) => state.theme);
  const [paymentState, setPaymentState] = useState<{ isOpen: boolean; planId?: string; planName?: string }>({
    isOpen: false,
  });

  useEffect(() => {
    void initializeAuth();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const openPayment = (planId: string, planName: string) => {
    setPaymentState({ isOpen: true, planId, planName });
  };

  const closePayment = () => {
    setPaymentState({ isOpen: false });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PaymentContext.Provider value={{ isPaymentOpen: paymentState.isOpen, openPayment, closePayment }}>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  color: '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: '#9333ea',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <LeadCaptureModal />
            <PaymentFlow
              isOpen={paymentState.isOpen}
              onClose={closePayment}
              planId={paymentState.planId}
              planName={paymentState.planName}
            />
            <FloatingWidgets />
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </ErrorBoundary>
        </Router>
      </PaymentContext.Provider>
    </QueryClientProvider>
  );
}
