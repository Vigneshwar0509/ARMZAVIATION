import { create } from 'zustand';
import { apiService } from '@/src/services/api';
import toast from 'react-hot-toast';

export type LeadSource =
  | 'job_apply'
  | 'contact_form'
  | 'newsletter'
  | 'enquiry'
  | 'program_interest'
  | 'course_enroll'
  | 'conclave_register'
  | 'webinar_register';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  source: LeadSource;
  status: LeadStatus;
  message?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface LeadState {
  leads: Lead[];
  isLoading: boolean;
  isModalOpen: boolean;
  modalConfig: {
    source: LeadSource;
    interest: string;
    title: string;
    subtitle: string;
    onSuccess?: () => void;
  } | null;
  openLeadModal: (config: LeadState['modalConfig']) => void;
  closeLeadModal: () => void;
  createLead: (data: Omit<Lead, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Lead | null>;
  fetchLeads: () => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  isLoading: false,
  isModalOpen: false,
  modalConfig: null,

  openLeadModal: (config) => {
    set({ isModalOpen: true, modalConfig: config });
  },

  closeLeadModal: () => {
    set({ isModalOpen: false, modalConfig: null });
  },

  createLead: async (data) => {
    try {
      const res = await apiService.createLead(data);
      const rawLead = res.data;
      const newLead: Lead = {
        ...rawLead,
        source: rawLead?.source || data.source || 'enquiry',
        status: (rawLead?.status?.toLowerCase() || 'new') as LeadStatus,
        createdAt: rawLead?.createdAt || new Date().toISOString(),
        updatedAt: rawLead?.updatedAt || new Date().toISOString(),
      };

      set((state) => ({ leads: [newLead, ...state.leads] }));

      toast.success('Thank you for your interest! Our team will contact you soon.', {
        duration: 4000,
        icon: '✓',
      });

      return newLead;
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast.error('Something went wrong. Please try again.');
      return null;
    }
  },

  fetchLeads: async () => {
    set({ isLoading: true });
    try {
      const res = await apiService.getLeads();
      const transformedLeads: Lead[] = (res.data || []).map((lead: any) => ({
        ...lead,
        source: lead.source || 'enquiry',
        status: (lead.status?.toLowerCase() || 'new') as LeadStatus,
        createdAt: lead.createdAt || new Date().toISOString(),
        updatedAt: lead.updatedAt || new Date().toISOString(),
      }));
      set({ leads: transformedLeads, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      set({ isLoading: false });
    }
  },

  updateLeadStatus: async (id, status) => {
    try {
      const res = await apiService.updateLeadStatus(id, status);
      const updatedLead = res.data;
      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                ...updatedLead,
                status: (updatedLead?.status?.toLowerCase() || status) as LeadStatus,
                updatedAt: updatedLead?.updatedAt || new Date().toISOString(),
              }
            : lead
        ),
      }));
      toast.success(`Lead status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
      throw error;
    }
  },
}));

export const getSourceLabel = (source: LeadSource): string => {
  const labels: Record<LeadSource, string> = {
    job_apply: 'Job Application',
    contact_form: 'Contact Form',
    newsletter: 'Newsletter Signup',
    enquiry: 'General Enquiry',
    program_interest: 'Program Interest',
    course_enroll: 'Course Enrollment',
    conclave_register: 'Conclave Registration',
    webinar_register: 'Webinar Registration',
  };
  return labels[source] || source;
};

export const getStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
    lost: 'bg-slate-100 text-slate-500',
  };
  return colors[status] || 'bg-slate-100 text-slate-500';
};
