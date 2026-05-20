export interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  experience?: string;
  category: string;
  type: string;
  postedAt: string;
  posted_by_email?: string;
  logo: string;
  requirements: string[];
  responsibilities?: string[];
  status?: string;
}

export interface Application {
  id: string | number;
  jobId: string | number;
  userId: string;
  status: string;
  appliedAt: string;
  name?: string;
  experience?: string;
  score?: number;
  job?: Job;
  job_details?: {
    title: string;
    company: string;
  };
}

export interface DashboardStats {
  totalJobs: number;
  totalApplications: number;
  totalHires: number;
  activeUsers: number;
  activeStudents: number;
  revenue: string;
  newLeads?: number;
  conversionRate?: number;
  platformScore?: number;
  avgResponseTime?: string;
  offerRate?: string;
  jobTrends: { month: string; count: number }[];
  userActivity?: { id: string; user: string; action: string; time: string }[];
  roadmap?: { id: number; title: string; status: string; date: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'employer';
  avatar?: string;
  photoURL?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  company_name?: string;
  hr_name?: string;
  company_details?: string;
  status?: string;
  joined?: string;
  joinedAt?: string;
  createdAt?: string;
  subscription?: string;
  isPrime?: boolean;
  permissions?: string[];
  isVerified?: boolean;
  onboardingRequired?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  reach: string | number;
  target: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  students: number;
  status: 'Active' | 'Pending' | 'Inactive';
}

export interface AdminEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
  type: 'Webinar' | 'Event' | string;
  attendees?: number;
  status?: string;
  description?: string;
  category?: string;
  meetingLink?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  period: string;
  description: string;
  permissions: string[];
  razorpay_plan_id: string;
  type?: 'student' | 'employer';
}
