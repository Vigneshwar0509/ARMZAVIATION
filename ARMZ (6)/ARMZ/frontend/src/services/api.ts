import apiClient from "@/src/services/apiClient";

type DashboardRange = "7d" | "30d" | "90d" | "12m";

type AnyRecord = Record<string, any>;

const unwrapData = (response: any): any => response?.data?.data ?? response?.data ?? response;

const ensureArray = (value: any): any[] => (Array.isArray(value) ? value : []);

const normalizeListWithStats = (raw: any, listKey: string) => {
  if (Array.isArray(raw)) {
    return { [listKey]: raw, stats: null };
  }

  if (raw && typeof raw === "object") {
    const list = ensureArray(raw[listKey] ?? raw.items ?? raw.results);
    return {
      ...(raw as AnyRecord),
      [listKey]: list,
      stats: raw.stats ?? null,
    };
  }

  return { [listKey]: [], stats: null };
};

const normalizeNotifications = (raw: any) => {
  const notifications = ensureArray(
    raw?.notifications ?? raw?.items ?? raw?.results ?? raw?.data ?? raw
  );

  return {
    ...(raw && typeof raw === "object" ? raw : {}),
    notifications,
    unreadCount:
      typeof raw?.unreadCount === "number"
        ? raw.unreadCount
        : notifications.filter((item: any) => !item.read).length,
  };
};

const normalizeWebinars = (raw: any) => {
  const webinars = ensureArray(raw?.webinars ?? raw?.items ?? raw?.results ?? raw?.data ?? raw);
  const categoriesFromData = webinars
    .map((item: any) => item.category)
    .filter(Boolean) as string[];

  const categories = Array.from(
    new Set(ensureArray(raw?.categories).concat(categoriesFromData))
  ) as string[];

  return {
    ...(raw && typeof raw === "object" ? raw : {}),
    webinars,
    categories,
  };
};

const normalizeUserRecord = (user: any) => ({
  ...user,
  role: user?.isPrime ? "admin" : user?.role === "prime" ? "admin" : user?.role,
  isPrime: Boolean(user?.isPrime),
});

const normalizeJobRecord = (job: any) => ({
  ...job,
  company: job?.company ?? job?.company_name ?? "",
  postedAt: job?.postedAt ?? job?.posted_at ?? "",
  category: job?.category ?? "General",
  type: job?.type ?? "Job",
  requirements: Array.isArray(job?.requirements)
    ? job.requirements
    : typeof job?.requirements === "string" && job.requirements
    ? [job.requirements]
    : [],
  responsibilities: Array.isArray(job?.responsibilities)
    ? job.responsibilities
    : typeof job?.responsibilities === "string" && job.responsibilities
    ? [job.responsibilities]
    : [],
});

const denormalizeJobRecord = (job: any) => ({
  ...job,
  company_name: job?.company ?? job?.company_name ?? "",
});

const normalizeJobList = (raw: any) => ensureArray(raw).map(normalizeJobRecord);

const normalizeInternshipRecord = (internship: any) => ({
  ...internship,
  id: String(internship?.id ?? ""),
  title: internship?.title ?? "",
  company: internship?.company ?? internship?.company_name ?? "",
  location: internship?.location ?? "",
  description: internship?.description ?? "",
  salary: internship?.stipend ?? "",
  experience: internship?.duration ?? "",
  category: internship?.department ?? "Internship",
  type: "Internship",
  logo: internship?.logo ?? "",
  postedAt: internship?.postedAt ?? internship?.posted_at ?? "",
  createdAt: internship?.createdAt ?? internship?.created_at ?? "",
  skills: Array.isArray(internship?.skills)
    ? internship.skills
    : typeof internship?.skills === "string" && internship.skills
    ? [internship.skills]
    : [],
  requirements: Array.isArray(internship?.requirements)
    ? internship.requirements
    : typeof internship?.requirements === "string" && internship.requirements
    ? [internship.requirements]
    : [],
  responsibilities: Array.isArray(internship?.responsibilities)
    ? internship.responsibilities
    : typeof internship?.responsibilities === "string" && internship.responsibilities
    ? [internship.responsibilities]
    : [],
});

const denormalizeInternshipRecord = (internship: any) => ({
  title: internship?.title ?? "",
  company_name: internship?.company ?? internship?.company_name ?? "",
  location: internship?.location ?? "",
  duration: internship?.duration ?? "",
  stipend: internship?.stipend ?? "",
  description: internship?.description ?? "",
  department: internship?.department ?? "",
  skills: internship?.skills ?? [],
  requirements: internship?.requirements ?? [],
  status: internship?.status ?? "Active",
  applications: internship?.applications ?? 0,
  views: internship?.views ?? 0,
});

const normalizeInternshipList = (raw: any) => ensureArray(raw).map(normalizeInternshipRecord);

const normalizeSubscriptionRecord = (subscription: any) => {
  const amount = Number(subscription?.amount ?? 0);
  const normalizedPlanName = subscription?.planName ?? subscription?.plan_name ?? subscription?.plan?.name ?? "Free";
  const normalizedUserName = subscription?.userName ?? subscription?.user_name ?? subscription?.user?.full_name ?? subscription?.user?.username ?? subscription?.user?.email ?? "";
  const normalizedUserEmail = subscription?.userEmail ?? subscription?.user_email ?? subscription?.user?.email ?? "";

  return {
    ...subscription,
    userId: subscription?.userId ?? subscription?.user ?? null,
    userName: normalizedUserName,
    userEmail: normalizedUserEmail,
    planId: subscription?.planId ?? subscription?.plan ?? null,
    planName: normalizedPlanName,
    status: subscription?.status ?? 'pending',
    amount: amount,
    amountFormatted:
      subscription?.amountFormatted ??
      (Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : String(subscription?.amount ?? '₹0')),
    paymentMethod: subscription?.paymentMethod ?? subscription?.payment_method ?? "",
    autoRenew: subscription?.autoRenew ?? subscription?.auto_renew ?? false,
    createdAt: subscription?.createdAt ?? subscription?.created_at ?? null,
    startDate: subscription?.startDate ?? subscription?.start_date ?? null,
    endDate: subscription?.endDate ?? subscription?.end_date ?? null,
    renewalDate: subscription?.renewalDate ?? subscription?.renewal_date ?? null,
  };
};

const normalizeApplicationStatus = (status: any, statusLabel?: string) => {
  const rawValue = String(statusLabel || status || "").trim();
  const normalized = rawValue.toLowerCase();

  if (normalized === "pending" || normalized === "applied") return "Applied";
  if (normalized === "reviewed" || normalized === "under review" || normalized === "in review") return "Under Review";
  if (normalized === "shortlisted" || normalized === "interview scheduled") return "Interview Scheduled";
  if (normalized === "hired" || normalized === "offer extended") return "Offer Extended";
  if (normalized === "rejected") return "Rejected";

  if (rawValue) return rawValue;
  return "Applied";
};

const normalizeApplicationRecord = (application: any) => {
  const job = application?.job ?? {};
  const internship = application?.internship ?? {};
  
  // Use backend's applicationType if available, otherwise infer from internship_id/job_id
  let applicationType = application?.applicationType;
  if (!applicationType) {
    applicationType = application?.internship_id ? "Internship" : "Job";
  }
  applicationType = String(applicationType || "Job").trim();

  // Ensure jobId is set correctly
  const jobId = String(
    application?.jobId ??
    application?.job_id ??
    application?.internship_id ??
    job?.id ??
    internship?.id ??
    ""
  ).trim();

  // Get job details from nested object or fields
  const jobDetails = application?.job_details || {};
  const hasJobDetails = Object.keys(jobDetails).length > 0 && jobDetails.title;

  const normalizedUserName =
    application?.userName ??
    application?.user_name ??
    application?.user?.full_name ??
    application?.user?.name ??
    application?.user?.email ??
    "";

  return {
    ...application,
    name: application?.name ?? normalizedUserName,
    jobId: jobId,
    userId: String(application?.userId ?? application?.user_id ?? "").trim(),
    appliedAt: application?.appliedAt ?? application?.applied_at ?? "",
    userName: normalizedUserName,
    userEmail: application?.userEmail ?? application?.user?.email ?? application?.user_email ?? "",
    userPhone: application?.userPhone ?? application?.user?.phone ?? application?.user_phone ?? "",
    status: normalizeApplicationStatus(application?.status, application?.statusLabel),
    applicationType: applicationType,
    job_details: hasJobDetails ? jobDetails : {
      id: jobId,
      title: applicationType === "Internship" ? (internship?.title ?? job?.title ?? "") : (job?.title ?? internship?.title ?? ""),
      company:
        job?.company ?? job?.company_name ?? internship?.company ?? internship?.company_name ?? "",
      location: job?.location ?? internship?.location ?? "",
      salary: job?.salary ?? internship?.salary ?? internship?.stipend ?? "",
      type: applicationType,
    },
  };
};

const normalizeApplicationList = (raw: any) => {
  // Handle direct array
  if (Array.isArray(raw)) {
    return raw.map(normalizeApplicationRecord);
  }

  // Handle object response with data/items/results/applications array
  if (raw && typeof raw === 'object') {
    const list = ensureArray(
      raw.data ?? 
      raw.items ?? 
      raw.results ?? 
      raw.applications ?? 
      raw
    );
    return list.map(normalizeApplicationRecord);
  }

  return [];
};

const normalizeCourseThumbnail = (thumbnail: any) => {
  const value = String(thumbnail ?? "").trim();
  if (!value) {
    return "";
  }

  if (/^data:image\//i.test(value)) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      if (hostname === "via.placeholder.com" || hostname === "placeholder.com") {
        return "";
      }
      return value;
    } catch {
      return "";
    }
  }

  return "";
};

const normalizeCourseRecord = (course: any) => ({
  ...course,
  createdAt: course?.createdAt ?? course?.created_at ?? "",
  thumbnail: normalizeCourseThumbnail(course?.thumbnail),
});

const normalizeCourseList = (raw: any) => ensureArray(raw).map(normalizeCourseRecord);

const normalizeSettingList = (raw: any) =>
  ensureArray(raw).map((item) => ({
    id: item?.id,
    key: item?.key ?? "",
    value: item?.value ?? "",
    description: item?.description ?? "",
    updatedAt: item?.updated_at ?? item?.updatedAt ?? "",
  }));

const normalizePaymentMethodList = (raw: any) =>
  ensureArray(raw).map((item) => ({
    id: String(item?.id ?? ""),
    name: item?.name ?? "",
    type: item?.type ?? "credit_card",
    lastDigits: item?.lastDigits ?? item?.last_digits ?? "",
    expiryDate: item?.expiryDate ?? item?.expiry_date ?? "",
    isDefault: Boolean(item?.is_default ?? item?.isDefault),
    addedDate: item?.addedDate ?? item?.created_at ?? "",
  }));

const normalizeReportExportList = (raw: any) =>
  ensureArray(raw).map((item) => ({
    id: String(item?.id ?? ""),
    title: item?.title ?? item?.report_name ?? "Report Export",
    type: item?.type ?? item?.export_format ?? "pdf",
    status: item?.status ?? "completed",
    updated: item?.updated ?? item?.updated_at ?? item?.created_at ?? "",
    fileName: item?.file_name ?? "",
    period: item?.period ?? "",
    metadata: item?.metadata ?? {},
  }));

const normalizeAdminActionList = (raw: any) =>
  ensureArray(raw).map((item) => ({
    id: String(item?.id ?? ""),
    actionType: item?.action_type ?? item?.actionType ?? "",
    status: item?.status ?? "completed",
    message: item?.message ?? "",
    metadata: item?.metadata ?? {},
    updated: item?.updated ?? item?.created_at ?? "",
  }));

const toFiniteNumber = (value: any, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizePlanRecord = (plan: any) => ({
  ...plan,
  id: String(plan?.id ?? ""),
  name: String(plan?.name ?? ""),
  price: toFiniteNumber(plan?.price, 0),
  tier: toFiniteNumber(plan?.tier, 0),
  period: plan?.period ?? "month",
  description: plan?.description ?? "",
  features: Array.isArray(plan?.features) ? plan.features : [],
  permissions: Array.isArray(plan?.permissions) ? plan.permissions : [],
  tabs: Array.isArray(plan?.tabs) ? plan.tabs : [],
  razorpay_plan_id: plan?.razorpay_plan_id ?? null,
  isActive: Boolean(plan?.isActive ?? plan?.is_active),
  subscriberCount: toFiniteNumber(plan?.subscriberCount ?? plan?.subscriber_count ?? plan?.subscribers, 0),
  revenueGenerated: toFiniteNumber(plan?.revenueGenerated ?? plan?.revenue_generated ?? plan?.revenue, 0),
  createdAt: plan?.createdAt ?? plan?.created_at ?? "",
  type: plan?.type === "employer" ? "employer" : "student",
});

export const apiService = {
  getAdmins: async () => {
    const response = await apiClient.get("/admins");
    return { data: unwrapData(response) };
  },

  createAdmin: async (data: any) => {
    const response = await apiClient.post("/admins", data);
    return { data: unwrapData(response) };
  },

  updateAdmin: async (id: string, data: any) => {
    const response = await apiClient.put(`/admins/${id}`, data);
    return { data: unwrapData(response) };
  },

  deleteAdmin: async (id: string) => {
    const response = await apiClient.delete(`/admins/${id}`);
    return { data: unwrapData(response) };
  },

  adminLogin: async (email: string, password?: string) => {
    const response = await apiClient.post("/auth/admin/login", { email, password });
    const data = unwrapData(response);
    return {
      data: {
        ...data,
        user: normalizeUserRecord(data?.user),
      },
    };
  },

  getJobs: async () => {
    const [jobsResponse, internshipsResponse] = await Promise.all([
      apiClient.get("/jobs/"),
      apiClient.get("/internships/"),
    ]);

    const jobs = normalizeJobList(unwrapData(jobsResponse));
    const internships = normalizeInternshipList(unwrapData(internshipsResponse));

    return {
      data: [...jobs, ...internships].sort((a: any, b: any) => {
        const aTime = new Date(a.postedAt).getTime() || 0;
        const bTime = new Date(b.postedAt).getTime() || 0;
        return bTime - aTime;
      }),
    };
  },

  getInternships: async () => {
    const response = await apiClient.get("/internships/");
    return { data: normalizeInternshipList(unwrapData(response)) };
  },

  createJob: async (data: any) => {
    const response = await apiClient.post("/jobs", data);
    return { data: normalizeJobRecord(unwrapData(response)) };
  },

  updateJob: async (id: string, data: any) => {
    const response = await apiClient.put(`/jobs/${id}`, data);
    return { data: normalizeJobRecord(unwrapData(response)) };
  },

  deleteJob: async (id: string) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return { data: unwrapData(response) };
  },

  getJobById: async (id: string) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return { data: normalizeJobRecord(unwrapData(response)) };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        const internshipResponse = await apiClient.get(`/internships/${id}`);
        return { data: normalizeInternshipRecord(unwrapData(internshipResponse)) };
      }
      throw error;
    }
  },

  getDashboardStats: async (range?: DashboardRange) => {
    const response = await apiClient.get("/dashboard/stats", {
      params: range ? { range } : undefined,
    });
    return { data: unwrapData(response) };
  },

  getApplications: async (userId?: string) => {
    const response = await apiClient.get("/applications", {
      params: userId ? { userId } : undefined,
    });
    const unwrapped = unwrapData(response);
    return { data: normalizeApplicationList(unwrapped) };
  },

  updateApplicationStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/applications/${id}/status`, { status });
    const data = unwrapData(response);
    return { data: normalizeApplicationRecord(data) };
  },

  applyForJob: async (jobId: string, userId: string) => {
    const response = await apiClient.post(`/jobs/${jobId}/apply`, { userId });
    const data = unwrapData(response);
    return { data: normalizeApplicationRecord(data) };
  },

  applyForInternship: async (internshipId: string, userId: string) => {
    const response = await apiClient.post(`/internships/${internshipId}/apply`, { userId });
    const data = unwrapData(response);
    return { data: normalizeApplicationRecord(data) };
  },

  saveJob: async (jobId: string, userId: string) => {
    const response = await apiClient.post(`/users/${userId}/saved-jobs`, { jobId });
    return { data: unwrapData(response) };
  },

  removeSavedJob: async (jobId: string, userId: string) => {
    const response = await apiClient.delete(`/users/${userId}/saved-jobs/${jobId}`);
    return { data: unwrapData(response) };
  },

  getSavedJobs: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/saved-jobs`);
    const data = unwrapData(response);
    const savedJobs = ensureArray(data).map((item: any) => normalizeJobRecord(item?.job ?? item));
    return { data: savedJobs };
  },

  getStudents: async () => {
    const response = await apiClient.get("/students");
    return { data: ensureArray(unwrapData(response)) };
  },

  createStudent: async (data: any) => {
    const response = await apiClient.post("/students", data);
    return { data: unwrapData(response) };
  },

  updateStudent: async (id: string, data: any) => {
    const response = await apiClient.put(`/students/${id}`, data);
    return { data: unwrapData(response) };
  },

  deleteStudent: async (id: string) => {
    const response = await apiClient.delete(`/students/${id}`);
    return { data: unwrapData(response) };
  },

  getAllUsers: async () => {
    const response = await apiClient.get("/users");
    return { data: unwrapData(response) };
  },

  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return { data: unwrapData(response) };
  },

  verifyUser: async (id: string, isVerified: boolean) => {
    const response = await apiClient.post(`/users/${id}/verify`, { is_verified: isVerified });
    return { data: unwrapData(response) };
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return { data: unwrapData(response) };
  },

  getPlans: async () => {
    const response = await apiClient.get("/plans/");
    return { data: unwrapData(response) };
  },

  getCampaigns: async () => {
    const response = await apiClient.get("/admin/campaigns");
    return { data: unwrapData(response) };
  },

  createCampaign: async (data: any) => {
    const response = await apiClient.post("/admin/campaigns", data);
    return { data: unwrapData(response) };
  },

  updateCampaign: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/campaigns/${id}`, data);
    return { data: unwrapData(response) };
  },

  deleteCampaign: async (id: string) => {
    const response = await apiClient.delete(`/admin/campaigns/${id}`);
    return { data: unwrapData(response) };
  },

  getColleges: async () => {
    const response = await apiClient.get("/admin/colleges");
    return { data: unwrapData(response) };
  },

  createCollege: async (data: any) => {
    const response = await apiClient.post("/admin/colleges", data);
    return { data: unwrapData(response) };
  },

  updateCollege: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/colleges/${id}`, data);
    return { data: unwrapData(response) };
  },

  deleteCollege: async (id: string) => {
    const response = await apiClient.delete(`/admin/colleges/${id}`);
    return { data: unwrapData(response) };
  },

  getEvents: async () => {
    const response = await apiClient.get("/events/");
    return { data: unwrapData(response) };
  },

  getLeads: async () => {
    const response = await apiClient.get("/leads");
    return { data: unwrapData(response) };
  },

  createLead: async (data: any) => {
    const response = await apiClient.post("/leads", data);
    return { data: unwrapData(response) };
  },

  updateLeadStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/leads/${id}/status`, { status });
    return { data: unwrapData(response) };
  },

  deleteLead: async (id: string) => {
    const response = await apiClient.delete(`/leads/${id}`);
    return { data: unwrapData(response) };
  },

  createEvent: async (data: any) => {
    const config: any = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined;
    const response = await apiClient.post("/events", data, config);
    return { data: unwrapData(response) };
  },

  updateEvent: async (id: string, data: any) => {
    const config: any = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined;
    const response = await apiClient.put(`/events/${id}`, data, config);
    return { data: unwrapData(response) };
  },

  deleteEvent: async (id: string) => {
    const response = await apiClient.delete(`/events/${id}`);
    return { data: unwrapData(response) };
  },

  registerForEvent: async (eventId: string, userId: string) => {
    const response = await apiClient.post(`/events/${eventId}/register`, { userId });
    return { data: unwrapData(response) };
  },

  unregisterFromEvent: async (eventId: string, userId: string) => {
    const response = await apiClient.post(`/events/${eventId}/unregister`, { userId });
    return { data: unwrapData(response) };
  },

  getEventRegistrations: async (userId: string) => {
    const response = await apiClient.get(`/events/registrations/${userId}`);
    return { data: unwrapData(response) };
  },

  login: async (email: string, password?: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    return { data: unwrapData(response) };
  },

  register: async (data: any) => {
    const response = await apiClient.post("/auth/register", data);
    return { data: unwrapData(response) };
  },

  createSubscription: async (planId: string) => {
    const response = await apiClient.post("/payments/create-subscription", { planId });
    return { data: unwrapData(response) };
  },

  createOrder: async (orderData: any) => {
    const response = await apiClient.post("/payments/create-order", orderData);
    return { data: unwrapData(response) };
  },

  verifyPayment: async (paymentData: any) => {
    const response = await apiClient.post("/payments/verify", paymentData);
    return { data: unwrapData(response) };
  },

  getAdminPlans: async () => {
    const response = await apiClient.get("/admin/plans");
    const normalized = normalizeListWithStats(unwrapData(response), "plans");
    return { data: { ...normalized, plans: ensureArray(normalized.plans).map(normalizePlanRecord) } };
  },

  createAdminPlan: async (planData: any) => {
    const response = await apiClient.post("/admin/plans", planData);
    return { data: unwrapData(response) };
  },

  updateAdminPlan: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/plans/${id}`, data);
    return { data: unwrapData(response) };
  },

  deleteAdminPlan: async (id: string) => {
    const response = await apiClient.delete(`/admin/plans/${id}`);
    return { data: unwrapData(response) };
  },

  toggleAdminPlanStatus: async (id: string, isActive: boolean) => {
    const response = await apiClient.put(`/admin/plans/${id}/status`, { isActive });
    return { data: unwrapData(response) };
  },

  syncAdminPlan: async (id: string) => {
    const response = await apiClient.post(`/admin/plans/${id}/sync`);
    return { data: unwrapData(response) };
  },

  getAdminJobs: async () => {
    const response = await apiClient.get("/admin/jobs");
    const normalized = normalizeListWithStats(unwrapData(response), "jobs");
    return { data: { ...normalized, jobs: normalizeJobList(normalized.jobs) } };
  },

  createAdminJob: async (data: any) => {
    const response = await apiClient.post("/admin/jobs", denormalizeJobRecord(data));
    return { data: normalizeJobRecord(unwrapData(response)) };
  },

  updateAdminJob: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/jobs/${id}`, denormalizeJobRecord(data));
    return { data: normalizeJobRecord(unwrapData(response)) };
  },

  deleteAdminJob: async (id: string) => {
    const response = await apiClient.delete(`/admin/jobs/${id}`);
    return { data: unwrapData(response) };
  },

  getAdminInternships: async () => {
    const response = await apiClient.get("/admin/internships");
    const normalized = normalizeListWithStats(unwrapData(response), "internships");
    return { data: { ...normalized, internships: normalizeInternshipList(normalized.internships) } };
  },

  createAdminInternship: async (data: any) => {
    const response = await apiClient.post("/admin/internships", denormalizeInternshipRecord(data));
    return { data: normalizeInternshipRecord(unwrapData(response)) };
  },

  updateAdminInternship: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/internships/${id}`, denormalizeInternshipRecord(data));
    return { data: normalizeInternshipRecord(unwrapData(response)) };
  },

  deleteAdminInternship: async (id: string) => {
    const response = await apiClient.delete(`/admin/internships/${id}`);
    return { data: unwrapData(response) };
  },

  getAdminPayments: async () => {
    const response = await apiClient.get("/admin/payments");
    const raw = unwrapData(response);

    if (Array.isArray(raw)) {
      return { data: { transactions: raw, summary: null } };
    }

    return {
      data: {
        ...(raw && typeof raw === "object" ? raw : {}),
        transactions: ensureArray(raw?.transactions ?? raw?.items ?? raw?.results),
        summary: raw?.summary ?? null,
      },
    };
  },

  getPaymentHistory: async (userId?: string) => {
    const response = await apiClient.get("/payments/history", {
      params: userId ? { userId } : undefined,
    });
    return { data: unwrapData(response) };
  },

  getSubscriptionStatus: async (userId: string) => {
    const response = await apiClient.get(`/subscriptions/status/${userId}`);
    return { data: unwrapData(response) };
  },

  getPlanChangeStatus: async () => {
    const response = await apiClient.get("/payments/plan-change");
    const data = unwrapData(response);
    return {
      data: {
        ...data,
        currentPlan: data?.currentPlan ? normalizePlanRecord(data.currentPlan) : null,
        pendingChange: data?.pendingChange ? normalizePlanRecord(data.pendingChange) : null,
      },
    };
  },

  changePlan: async (planId: string | number) => {
    const response = await apiClient.post("/payments/plan-change", { planId });
    const data = unwrapData(response);
    return {
      data: {
        ...data,
        currentPlan: data?.currentPlan ? normalizePlanRecord(data.currentPlan) : null,
        pendingChange: data?.pendingChange ? normalizePlanRecord(data.pendingChange) : null,
      },
    };
  },

  getAdminSubscriptions: async () => {
    const response = await apiClient.get("/admin/subscriptions");
    const normalized = normalizeListWithStats(unwrapData(response), "subscriptions");
    return {
      data: {
        ...normalized,
        subscriptions: ensureArray(normalized.subscriptions).map(normalizeSubscriptionRecord),
      },
    };
  },

  updateSubscriptionStatus: async (subscriptionId: string, status: string) => {
    const response = await apiClient.put(`/admin/subscriptions/${subscriptionId}/status`, { status });
    return { data: unwrapData(response) };
  },

  deleteSubscription: async (subscriptionId: string) => {
    const response = await apiClient.delete(`/admin/subscriptions/${subscriptionId}`);
    return { data: unwrapData(response) };
  },

  getNotifications: async (userId: string) => {
    const response = await apiClient.get("/notifications", { params: { userId } });
    return { data: normalizeNotifications(unwrapData(response)) };
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return { data: unwrapData(response) };
  },

  markAllNotificationsAsRead: async (userId: string) => {
    const response = await apiClient.patch("/notifications/read-all", { userId });
    return { data: unwrapData(response) };
  },

  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return { data: unwrapData(response) };
  },

  getNotificationPreferences: async (userId: string) => {
    const response = await apiClient.get(`/notifications/preferences/${userId}`);
    return { data: unwrapData(response) };
  },

  updateNotificationPreferences: async (userId: string, preferences: any) => {
    const response = await apiClient.put(`/notifications/preferences/${userId}`, preferences);
    return { data: unwrapData(response) };
  },

  getWebinars: async (userId?: string) => {
    const response = await apiClient.get("/webinars", {
      params: userId ? { userId } : undefined,
    });
    return { data: normalizeWebinars(unwrapData(response)) };
  },

  registerForWebinar: async (webinarId: string, userId: string) => {
    const response = await apiClient.post(`/webinars/${webinarId}/register`, { userId });
    return { data: unwrapData(response) };
  },

  unregisterFromWebinar: async (webinarId: string, userId: string) => {
    const response = await apiClient.post(`/webinars/${webinarId}/unregister`, { userId });
    return { data: unwrapData(response) };
  },

  getWebinarRegistrations: async (userId: string) => {
    const response = await apiClient.get(`/webinars/registrations/${userId}`);
    return { data: unwrapData(response) };
  },

  getWebinarRegistrationList: async (webinarId: string) => {
    const response = await apiClient.get(`/webinars/${webinarId}/registrations`);
    return { data: unwrapData(response) };
  },

  getWebinarPreferences: async (userId: string) => {
    const response = await apiClient.get(`/webinars/preferences/${userId}`);
    return { data: unwrapData(response) };
  },

  updateWebinarPreferences: async (userId: string, preferences: any) => {
    const response = await apiClient.put(`/webinars/preferences/${userId}`, preferences);
    return { data: unwrapData(response) };
  },

  createWebinar: async (data: any) => {
    const response = await apiClient.post("/webinars", data);
    return { data: unwrapData(response) };
  },

  updateWebinar: async (id: string, data: any) => {
    const response = await apiClient.put(`/webinars/${id}`, data);
    return { data: unwrapData(response) };
  },

  deleteWebinar: async (id: string) => {
    const response = await apiClient.delete(`/webinars/${id}`);
    return { data: unwrapData(response) };
  },

  getCourses: async () => {
    const response = await apiClient.get("/courses");
    const normalized = normalizeListWithStats(unwrapData(response), "courses");
    return { data: { ...normalized, courses: normalizeCourseList(normalized.courses) } };
  },

  getAdminCourses: async () => {
    const response = await apiClient.get("/admin/courses");
    const normalized = normalizeListWithStats(unwrapData(response), "courses");
    return { data: { ...normalized, courses: normalizeCourseList(normalized.courses) } };
  },

  createAdminCourse: async (data: any) => {
    const response = await apiClient.post("/admin/courses", data);
    return { data: normalizeCourseRecord(unwrapData(response)) };
  },

  updateAdminCourse: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/courses/${id}`, data);
    return { data: normalizeCourseRecord(unwrapData(response)) };
  },

  deleteAdminCourse: async (id: string) => {
    const response = await apiClient.delete(`/admin/courses/${id}`);
    return { data: unwrapData(response) };
  },

  getEnrolledCourses: async (userId?: string) => {
    const response = await apiClient.get("/courses/enrolled", {
      params: userId ? { userId } : undefined,
    });
    return { data: normalizeListWithStats(unwrapData(response), "courses") };
  },

  updateCourseProgress: async (courseId: string, progress: number) => {
    const response = await apiClient.patch(`/courses/${courseId}/progress`, { progress });
    return { data: unwrapData(response) };
  },

  getInterviews: async (userId?: string) => {
    const response = await apiClient.get("/interviews", {
      params: userId ? { userId } : undefined,
    });
    return { data: unwrapData(response) };
  },

  rescheduleInterview: async (interviewId: string, newDate: string, newTime: string) => {
    const response = await apiClient.patch(`/interviews/${interviewId}/reschedule`, {
      newDate,
      newTime,
    });
    return { data: unwrapData(response) };
  },

  cancelInterview: async (interviewId: string) => {
    const response = await apiClient.delete(`/interviews/${interviewId}`);
    return { data: unwrapData(response) };
  },

  getAssessments: async (userId?: string) => {
    const response = await apiClient.get("/assessments", {
      params: userId ? { userId } : undefined,
    });
    return { data: unwrapData(response) };
  },

  startAssessment: async (assessmentId: string) => {
    const response = await apiClient.post(`/assessments/${assessmentId}/start`);
    return { data: unwrapData(response) };
  },

  submitAssessment: async (assessmentId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/assessments/${assessmentId}/submit`, { answers });
    return { data: unwrapData(response) };
  },

  getAssessmentResult: async (assessmentId: string) => {
    const response = await apiClient.get(`/assessments/${assessmentId}/result`);
    return { data: unwrapData(response) };
  },

  getSiteSettings: async () => {
    const response = await apiClient.get("/core/settings");
    return { data: normalizeSettingList(unwrapData(response)) };
  },

  saveSiteSettings: async (settings: Array<{ key: string; value: string; description?: string }>) => {
    const response = await apiClient.post("/core/settings", { settings });
    return { data: normalizeSettingList(unwrapData(response)) };
  },

  getPaymentMethods: async () => {
    const response = await apiClient.get("/core/payment-methods");
    return { data: normalizePaymentMethodList(unwrapData(response)) };
  },

  createPaymentMethod: async (data: any) => {
    const response = await apiClient.post("/core/payment-methods", data);
    return { data: unwrapData(response) };
  },

  updatePaymentMethod: async (id: string, data: any) => {
    const response = await apiClient.put(`/core/payment-methods/${id}`, data);
    return { data: unwrapData(response) };
  },

  deletePaymentMethod: async (id: string) => {
    const response = await apiClient.delete(`/core/payment-methods/${id}`);
    return { data: unwrapData(response) };
  },

  getReportExports: async () => {
    const response = await apiClient.get("/core/report-exports");
    return { data: normalizeReportExportList(unwrapData(response)) };
  },

  createReportExport: async (data: { reportName: string; format: string; period?: string; metadata?: Record<string, any> }) => {
    const response = await apiClient.post("/core/report-exports", data);
    return { data: unwrapData(response) };
  },

  getAdminActions: async () => {
    const response = await apiClient.get("/core/admin-actions");
    return { data: normalizeAdminActionList(unwrapData(response)) };
  },

  createAdminAction: async (data: { actionType: string; metadata?: Record<string, any> }) => {
    const response = await apiClient.post("/core/admin-actions", data);
    return { data: unwrapData(response) };
  },
};

export default apiService;
