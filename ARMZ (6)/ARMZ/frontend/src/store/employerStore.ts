import { create } from 'zustand';
import { apiService } from '@/src/services/api';
import toast from 'react-hot-toast';

export type EmployerStatus = 'Active' | 'Inactive' | 'Pending';

export interface Employer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  hrName?: string;
  companyDetails?: string;
  subscription: string;
  isVerified: boolean;
  profileComplete: boolean;
  createdAt: string;
  status: EmployerStatus;
  jobsPosted: number;
  applicationsReceived: number;
  profileCompletion: number;
}

interface EmployerState {
  employers: Employer[];
  isLoading: boolean;
  fetchEmployers: () => Promise<void>;
  updateEmployer: (id: string, data: Partial<Employer>) => Promise<void>;
  deleteEmployer: (id: string) => Promise<void>;
}

const mapEmployer = (item: any): Employer => ({
  id: String(item.id),
  firstName: item.firstName || item.first_name || item.username?.split(' ')[0] || '',
  lastName: item.lastName || item.last_name || item.username?.split(' ').slice(1).join(' ') || '',
  email: item.email || '',
  phone: item.phone || '',
  companyName: item.companyName || item.company_name || '',
  hrName: item.hrName || item.hr_name || '',
  companyDetails: item.companyDetails || item.company_details || '',
  subscription: item.subscription || 'free',
  isVerified: Boolean(item.isVerified || item.is_verified),
  profileComplete: Boolean(item.profileComplete || item.profile_complete),
  createdAt: item.createdAt || item.date_joined || new Date().toISOString(),
  status: (item.isVerified ? 'Active' : 'Pending') as EmployerStatus,
  jobsPosted: Number(item.jobsPosted || item.job_count || 0),
  applicationsReceived: Number(item.applicationsReceived || item.application_count || 0),
  profileCompletion: item.profileComplete ? 100 : item.companyName ? 75 : item.phone ? 50 : 25,
});

export const useEmployerStore = create<EmployerState>((set) => ({
  employers: [],
  isLoading: false,

  fetchEmployers: async () => {
    set({ isLoading: true });
    try {
      const res = await apiService.getAllUsers();
      const allUsers = res.data || [];
      const employers = allUsers
        .filter((user: any) => user.role === 'employer')
        .map(mapEmployer);

      set({ employers, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch employers:', error);
      toast.error('Failed to load employers');
      set({ isLoading: false });
    }
  },

  updateEmployer: async (id: string, data: Partial<Employer>) => {
    try {
      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        company_name: data.companyName,
        hr_name: data.hrName,
        company_details: data.companyDetails,
        is_verified: data.isVerified,
        profile_complete: data.profileComplete,
      };

      const res = await apiService.updateUser(id, updateData);
      const updatedEmployer = mapEmployer(res.data);

      set((state) => ({
        employers: state.employers.map((emp) =>
          emp.id === id ? updatedEmployer : emp
        ),
      }));

      toast.success('Employer updated successfully');
    } catch (error) {
      console.error('Failed to update employer:', error);
      toast.error('Failed to update employer');
      throw error;
    }
  },

  deleteEmployer: async (id: string) => {
    try {
      await apiService.deleteUser(id);
      set((state) => ({
        employers: state.employers.filter((emp) => emp.id !== id),
      }));
      toast.success('Employer deleted successfully');
    } catch (error) {
      console.error('Failed to delete employer:', error);
      toast.error('Failed to delete employer');
      throw error;
    }
  },
}));
