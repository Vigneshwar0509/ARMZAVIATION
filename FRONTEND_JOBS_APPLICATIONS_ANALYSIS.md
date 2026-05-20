# ARMZ Frontend - Jobs & Applications Analysis

## 1. COMPONENT STRUCTURE & LOCATIONS

### Student/Dashboard Views
- **Jobs Page**: [src/pages/dashboard/Jobs.tsx](src/pages/dashboard/Jobs.tsx)
  - Main job browsing and application management page
  - Tabs: Applications, Saved Jobs, Browse Opportunities
  - Features: Search, filters, quick apply, save jobs

- **Applications Page**: [src/pages/dashboard/Applications.tsx](src/pages/dashboard/Applications.tsx)
  - Track user's job applications
  - Displays application status, timeline, and filtering
  - Shows statistics: Total Applied, In Review, Interviews, Offers

### Job Components
- **JobCard Component**: [src/components/common/JobCard.tsx](src/components/common/JobCard.tsx)
  - Individual job card display
  - Shows: logo, title, company, location, salary, type, posted date
  - Actions: Apply, Save, Quick View
  - Handles subscription checks before applying

- **JobApplyModal**: [src/components/jobs/JobApplyModal.tsx](src/components/jobs/JobApplyModal.tsx)
  - Multi-step application form (2 steps)
  - Step 1: Personal Info (name, email, phone, experience)
  - Step 2: Cover Letter + Resume confirmation
  - Form validation with Zod schema
  - Subscription check before submission

- **JobQuickView**: [src/components/jobs/JobQuickView.tsx](src/components/jobs/JobQuickView.tsx)
  - Sidebar/modal job detail view
  - Shows full job details, requirements, responsibilities
  - Quick apply button
  - Save job button

### Admin Views
- **AdminApplications Page**: [src/pages/admin/AdminApplications.tsx](src/pages/admin/AdminApplications.tsx)
  - View all job applications across platform
  - Table with columns: Candidate, Opportunity, Company, Type, Status, Applied Date
  - Filters: Search, Status filter, Sort by (newest/oldest)
  - Statistics: Total Applications, Under Review, Interviews, Offers
  - Admin status update functionality

- **Admin Jobs Page**: [src/pages/admin/Jobs.tsx](src/pages/admin/Jobs.tsx)
  - Manage all jobs on platform
  - CRUD operations for jobs
  - Dashboard with stats and analytics
  - Search and filter options

---

## 2. STATE MANAGEMENT

### Zustand Stores

**Job Store**: [src/store/jobStore.ts](src/store/jobStore.ts)
```typescript
Interface: JobStore {
  savedJobIds: string[]           // Array of saved job IDs (localStorage)
  saveJob(jobId: string)          // Add to saved
  removeJob(jobId: string)        // Remove from saved
  setSavedJobs(jobIds: string[])  // Batch set saved jobs
  clearSavedJobs()                // Clear all saved
  isJobSaved(jobId: string)       // Check if saved
}
```
- **Persistence**: localStorage (via zustand persist middleware)
- **Storage Key**: 'job-storage'
- **Updates On**: User saves/removes jobs

### React Query (TanStack Query)

**useQueries Hook**: [src/hooks/useQueries.ts](src/hooks/useQueries.ts)

#### Application Queries & Mutations

```typescript
useApplications(userId?: string, options?: QueryHookOptions)
├─ Query Key: ['applications', normalizedUserId]
├─ Fetch: GET /applications?userId={userId}
├─ Stale Time: 10 seconds (aggressive refresh for fresh data)
├─ GC Time: 5 minutes
├─ Refetch: On window focus + on mount
└─ Returns: Normalized application list

useApplicationActions()
├─ applyMutation:
│  ├─ POST /jobs/{jobId}/apply { userId }
│  ├─ POST /internships/{internshipId}/apply { userId }
│  └─ Invalidates: All ['applications'] queries
├─ return.apply({ id, userId, type })
└─ return.isApplying (boolean)

useApplicationManagement()
├─ updateStatusMutation:
│  ├─ PATCH /applications/{id}/status { status }
│  └─ Invalidates: All ['applications'] queries
└─ return.updateStatus({ id, status })
```

#### Job Queries

```typescript
useJobs(options?: QueryHookOptions)
├─ Query Key: ['jobs']
├─ Fetch: GET /jobs
├─ Stale Time: 5 minutes
└─ Returns: Normalized job list

useSavedJobs(userId?: string, options?: QueryHookOptions)
├─ Query Key: ['saved-jobs', userId]
├─ Fetch: GET /users/{userId}/saved-jobs
└─ Returns: Array of saved job objects
```

---

## 3. API SERVICE FUNCTIONS

### Location: [src/services/api.ts](src/services/api.ts)

#### Job Application APIs
```typescript
applyForJob(jobId: string, userId: string)
├─ POST /jobs/{jobId}/apply
├─ Body: { userId }
└─ Returns: Normalized application

applyForInternship(internshipId: string, userId: string)
├─ POST /internships/{internshipId}/apply
├─ Body: { userId }
└─ Returns: Normalized application

updateApplicationStatus(id: string, status: string)
├─ PATCH /applications/{id}/status
├─ Body: { status }
└─ Status values: Applied, Under Review, Interview Scheduled, Offer Extended, Rejected

getApplications(userId?: string)
├─ GET /applications
├─ Query Params: userId (optional, if not provided gets all)
└─ Returns: Normalized application list
```

#### Save/Unsave APIs
```typescript
saveJob(jobId: string, userId: string)
├─ POST /users/{userId}/saved-jobs
└─ Body: { jobId }

removeSavedJob(jobId: string, userId: string)
├─ DELETE /users/{userId}/saved-jobs/{jobId}
└─ Returns: Success response

getSavedJobs(userId: string)
├─ GET /users/{userId}/saved-jobs
└─ Returns: Array of saved job objects
```

#### Admin APIs
```typescript
getAdminJobs()
├─ GET /admin/jobs
└─ Returns: { jobs: [], stats: { totalJobs, activeJobs, totalApplications, ... } }

createAdminJob(jobData)
├─ POST /admin/jobs
└─ Denormalizes data before sending

updateAdminJob(id: string, jobData)
├─ PUT /admin/jobs/{id}
└─ Denormalizes data

deleteAdminJob(id: string)
├─ DELETE /admin/jobs/{id}
```

---

## 4. HOW APPLY FUNCTIONALITY WORKS

### Flow Diagram
```
User clicks "Apply Now" (JobCard or QuickView)
  ↓
Check if authenticated → If not, redirect to /register
  ↓
Check hasActiveSubscription(user) → If not, redirect to /subscription
  ↓
Open JobApplyModal component
  ↓
User fills Form (Step 1: Personal Info)
  └─ Full Name, Email, Phone, Experience Level
  └─ Form validation with Zod
  ↓
User fills Form (Step 2: Cover Letter & Resume)
  └─ Cover letter (min 50 chars)
  └─ Resume confirmation checkbox
  ↓
User submits form
  └─ Calls: useApplicationActions().apply({
      id: job.id,
      userId: user.id,
      type: job.type
    })
  ↓
API Mutation:
  ├─ If type === "internship": POST /internships/{jobId}/apply
  └─ Else: POST /jobs/{jobId}/apply
  ↓
On Success:
  ├─ Show success modal
  ├─ Invalidate all ['applications'] queries (React Query)
  ├─ Trigger refetch for user's applications
  ├─ Capture lead for marketing
  └─ Close modal on user action
  ↓
Display "Application Submitted!" success screen
```

### Key Implementation Details

**Subscription Check** (src/lib/subscription.ts):
```typescript
hasActiveSubscription(user: User) -> boolean
// Checks if user has active plan subscription
// Required to submit job applications
```

**Lead Capture** (useLeadCapture hook):
```typescript
captureJobApplyLead(jobTitle: string, company: string)
// Tracks job application for marketing/analytics
// Called on successful application submission
```

**Application Status Normalization**:
```typescript
// Backend sends: pending, reviewed, shortlisted, hired
// Frontend normalizes to: Applied, Under Review, Interview Scheduled, Offer Extended
normalizeApplicationStatus(status) {
  "Pending" → "Applied"
  "Reviewed" → "Under Review"
  "Shortlisted" → "Interview Scheduled"
  "Hired" → "Offer Extended"
}
```

---

## 5. HOW APPLIED JOBS ARE DISPLAYED/TRACKED

### Dashboard Applications Page
**Location**: [src/pages/dashboard/Applications.tsx](src/pages/dashboard/Applications.tsx)

**Display Features**:
1. **Statistics Cards** (Top of page):
   - Total Applied: Count of all applications
   - In Review: Count of "Under Review" applications
   - Interviews: Count of "Interview Scheduled" applications
   - Offers: Count of "Offer Extended" applications

2. **Application List**:
   - Search by job title, company, or job ID
   - Filter by status (All, Applied, Under Review, Interview Scheduled, Offer Extended, Rejected)
   - Sort by newest or oldest first
   - Displays:
     - Job title and company
     - Application status with color coding
     - Applied date and time
     - Action buttons (withdraw, share, message)

3. **Status Color Coding**:
   - Applied: blue
   - Under Review: purple
   - Interview Scheduled: emerald/green
   - Offer Extended: green
   - Rejected: red

### Jobs Page - Applications Tab
**Location**: [src/pages/dashboard/Jobs.tsx](src/pages/dashboard/Jobs.tsx) - "applications" tab

**Display**:
```
Statistics (4 cards):
├─ Total Applied: applications.length
├─ Interviews: applications.filter(a => a.status === "Interview Scheduled").length
├─ Offers: applications.filter(a => a.status === "Offer Extended").length
└─ Rejected: applications.filter(a => a.status === "Rejected").length
```

### Application Detection Logic
**In Jobs.tsx**:
```typescript
hasAppliedForOpportunity(job: Job) -> boolean {
  // Converts job type to expected application type
  const expectedType = jobType === 'internship' ? 'Internship' : 'Job'
  
  // Checks if any application matches:
  // 1. Application type matches (Job vs Internship)
  // 2. Job ID matches (handles: jobId, job_id, internship_id)
  
  return applications.some(app =>
    app.applicationType === expectedType &&
    (app.jobId || app.job_id || app.internship_id) === job.id
  )
}
```

---

## 6. ADMIN APPLICATIONS PANEL

### Location: [src/pages/admin/AdminApplications.tsx](src/pages/admin/AdminApplications.tsx)

### Features

1. **Header Section**:
   - Title and description
   - Export button (exports applications data)
   - Refresh button (refetch all data)

2. **Statistics Dashboard** (4 cards):
   - Total Applications: applications.length
   - Under Review: Count with "Under Review" status
   - Interviews: Count with "Interview Scheduled" status
   - Offers: Count with "Offer Extended" status

3. **Search & Filter Section**:
   - Search input: Searches job title, company, student name, email, phone, job ID
   - Status filter dropdown: All, Applied, Under Review, Interview Scheduled, Offer Extended, Rejected
   - Sort dropdown: Newest First, Oldest First

4. **Applications Table**:
   | Column | Content |
   |--------|---------|
   | Candidate | Student name, ID, email, phone |
   | Opportunity | Job/Internship title, Reference ID |
   | Company | Company name |
   | Type | Job or Internship |
   | Status | Color-coded status badge |
   | Applied | Date and time of application |

5. **Status Update Functionality**:
   - Admin can change application status via dropdown
   - Updates via: `useApplicationManagement().updateStatus({ id, status })`
   - API: PATCH /applications/{id}/status { status }
   - Refetches all applications on success

### Data Source
```typescript
const { data: applications = [], isLoading, isError, error, refetch } = 
  useApplications(undefined, {  // undefined = get ALL applications
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
```

---

## 7. DATA NORMALIZATION

### Application Record Normalization
**Location**: [src/services/api.ts](src/services/api.ts) - `normalizeApplicationRecord()`

**Backend fields** → **Frontend fields**:
```typescript
{
  id: from backend
  jobId: (jobId || job_id || internship_id || job.id || internship.id)
  userId: (userId || user_id)
  applicationType: (applicationType || (internship_id ? "Internship" : "Job"))
  status: normalizeApplicationStatus(status)
  userName: (userName || user_name)
  userEmail: userEmail
  userPhone: userPhone
  appliedAt: (appliedAt || applied_at)
  job_details: {
    title: (job.title || internship.title)
    company: (job.company || internship.company || ...)
    location: (job.location || internship.location)
    salary: (job.salary || internship.stipend)
  }
}
```

### Job Record Normalization
```typescript
{
  id: from backend
  title: job.title
  company: (company || company_name)
  location: job.location
  type: job.type
  salary: job.salary
  description: job.description
  category: job.category
  experience: job.experience
  requirements: [array of requirements]
  responsibilities: [array of responsibilities]
  applications: count of applications
  views: count of views
  postedAt: (postedAt || posted_at)
  createdAt: (createdAt || created_at)
}
```

---

## 8. USEEFFECT HOOKS MANAGING APPLICATIONS

### Jobs Page - Saved Jobs Sync
```typescript
useEffect(() => {
  if (!user) {
    clearSavedJobs();
    return;
  }
  setSavedJobs(savedJobs.map((job: any) => String(job.id)));
}, [savedJobs, user]);

// Purpose: Sync saved jobs from backend to Zustand store
// Triggers: When savedJobs query data changes or user changes
```

### JobApplyModal - Form Reset
```typescript
useEffect(() => {
  if (isOpen) {
    setStep(1);
    setIsSuccess(false);
    reset({
      fullName: user?.name || "",
      email: user?.email || "",
      phone: "",
      experience: "",
      coverLetter: "",
      resumeConfirm: false,
    });
  }
}, [isOpen, user, reset]);

// Purpose: Reset form when modal opens
// Auto-fill with user's name and email
```

### JobCard - Applied State Sync
```typescript
useEffect(() => {
  if (hasApplied) {
    setLocalHasApplied(true);
  }
}, [hasApplied]);

// Purpose: Sync hasApplied prop to local state
// Updates button visual state
```

---

## 9. QUICK REFERENCE: API ENDPOINTS

```
JOBS
  GET  /jobs                           - List all jobs
  GET  /jobs/{id}                      - Get job details
  POST /jobs/{id}/apply                - Apply for job
  
INTERNSHIPS
  POST /internships/{id}/apply         - Apply for internship
  
APPLICATIONS
  GET  /applications                   - List applications (user or all)
  GET  /applications?userId={id}       - List user's applications
  PATCH /applications/{id}/status      - Update application status
  
SAVED JOBS
  GET    /users/{userId}/saved-jobs           - List saved jobs
  POST   /users/{userId}/saved-jobs           - Save job
  DELETE /users/{userId}/saved-jobs/{jobId}   - Unsave job
  
ADMIN
  GET    /admin/jobs                   - Get jobs with stats
  POST   /admin/jobs                   - Create job
  PUT    /admin/jobs/{id}              - Update job
  DELETE /admin/jobs/{id}              - Delete job
```

---

## 10. KEY FILES SUMMARY

| File | Purpose |
|------|---------|
| [src/pages/dashboard/Jobs.tsx](src/pages/dashboard/Jobs.tsx) | Main job browsing page with apply/save functionality |
| [src/pages/dashboard/Applications.tsx](src/pages/dashboard/Applications.tsx) | User's job applications tracking page |
| [src/pages/admin/AdminApplications.tsx](src/pages/admin/AdminApplications.tsx) | Admin panel for reviewing all applications |
| [src/pages/admin/Jobs.tsx](src/pages/admin/Jobs.tsx) | Admin panel for managing jobs |
| [src/components/common/JobCard.tsx](src/components/common/JobCard.tsx) | Reusable job display card component |
| [src/components/jobs/JobApplyModal.tsx](src/components/jobs/JobApplyModal.tsx) | Multi-step application form modal |
| [src/components/jobs/JobQuickView.tsx](src/components/jobs/JobQuickView.tsx) | Job detail quick view sidebar |
| [src/hooks/useQueries.ts](src/hooks/useQueries.ts) | React Query hooks for all data fetching |
| [src/services/api.ts](src/services/api.ts) | API service with normalization logic |
| [src/store/jobStore.ts](src/store/jobStore.ts) | Zustand store for saved jobs (localStorage) |
| [src/api/endpoints.ts](src/api/endpoints.ts) | API endpoint constants (partial) |
| [src/services/apiClient.ts](src/services/apiClient.ts) | Axios HTTP client setup |

---

## 11. SUBSCRIPTION REQUIREMENT

Before applying for a job, the system checks:

```typescript
if (!hasActiveSubscription(user)) {
  // Show error message
  // Redirect to subscription page
  return;
}
```

**Affected Actions**:
- Apply for job (via JobCard button)
- Apply for job (via JobApplyModal submission)
- Quick apply (via JobQuickView)

**Subscription Check Location**: `src/lib/subscription.ts`
