import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { logger } from '@/src/utils/logger';

type QueryHookOptions = {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
};

type DashboardRange = "7d" | "30d" | "90d" | "12m";

const shouldRetryQuery = (failureCount: number, error: any, maxRetries: number): boolean => {
  if (error?.isBackendUnavailable || error?.isNetworkError || error?.isMixedContent || error?.isFrontendOnly) {
    return false;
  }

  return failureCount < maxRetries;
};

const handleMutationError = (error: Error, context: string) => {
  logger.error(`Mutation error in ${context}`, { error: error.message });
  toast.error(`Failed to ${context}. Please try again.`);
};

// Jobs Hooks
export const useJobs = (options?: QueryHookOptions) => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await apiService.getJobs();
      return res.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => shouldRetryQuery(failureCount, error, 2),
  });
};

export const useJobActions = () => {
  const queryClient = useQueryClient();

  const createJobMutation = useMutation({
    mutationFn: (data: any) => apiService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job posted successfully');
    },
    onError: (error: Error) => {
      handleMutationError(error, 'create job');
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      handleMutationError(error, 'update job');
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted successfully');
    },
    onError: (error: Error) => {
      handleMutationError(error, 'delete job');
    },
  });

  return {
    createJob: createJobMutation.mutateAsync,
    updateJob: updateJobMutation.mutateAsync,
    deleteJob: deleteJobMutation.mutateAsync,
    isSubmitting: createJobMutation.isPending || updateJobMutation.isPending,
  };
};

// Applications Hooks
export const useApplications = (userId?: string, options?: QueryHookOptions) => {
  const normalizedUserId = userId != null ? String(userId) : 'all';
  return useQuery({
    queryKey: ['applications', normalizedUserId],
    enabled: options?.enabled ?? (userId !== undefined),
    staleTime: 0, // Always consider stale to force refetch on mount
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    refetchOnMount: options?.refetchOnMount ?? 'always', // Fresh fetch every mount
    queryFn: async () => {
      const res = await apiService.getApplications(userId || undefined);
      logger.info(`Applications fetched for user ${userId}:`, res.data);
      return res.data;
    },
  });
};

export const useApplicationActions = () => {
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: ({ id, userId, type }: { id: string; userId: string; type?: string }) => {
      if (type?.toLowerCase() === 'internship') {
        return apiService.applyForInternship(id, userId);
      }
      return apiService.applyForJob(id, userId);
    },
    onSuccess: (_data, variables) => {
      // Invalidate all applications queries to ensure refetch
      queryClient.invalidateQueries({ 
        queryKey: ['applications'],
        exact: false // Match all queries starting with ['applications']
      });
      
      // Specifically refetch this user's applications
      if (variables?.userId) {
        queryClient.refetchQueries({ 
          queryKey: ['applications', String(variables.userId)],
          type: 'active'
        });
      }
      
      toast.success('Application submitted successfully');
    },
    onError: (error: Error) => handleMutationError(error, 'submit application'),
  });

  return {
    apply: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,
  };
};

export const useApplicationManagement = () => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiService.updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application status updated');
    },
    onError: (error: Error) => handleMutationError(error, 'update application status'),
  });

  return {
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
};

// User Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiService.getAllUsers();
      return res.data;
    },
  });
};

export const useSavedJobs = (userId?: string, options?: QueryHookOptions) => {
  return useQuery({
    queryKey: ['saved-jobs', userId],
    enabled: (options?.enabled ?? true) && !!userId,
    queryFn: async () => {
      const res = await apiService.getSavedJobs(userId || '');
      return res.data;
    },
    initialData: [],
  });
};

export const useUserActions = () => {
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => handleMutationError(error, 'update user'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => handleMutationError(error, 'delete user'),
  });

  return {
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
  };
};

// Stats Hooks
export const useDashboardStats = (rangeOrOptions?: DashboardRange | QueryHookOptions, maybeOptions?: QueryHookOptions) => {
  const range = typeof rangeOrOptions === "string" ? rangeOrOptions : undefined;
  const options = typeof rangeOrOptions === "object" ? rangeOrOptions : maybeOptions;

  return useQuery({
    queryKey: ['stats', range ?? 'all'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiService.getDashboardStats(range);
      return res.data;
    },
  });
};

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await apiService.getLeads();
      return res.data;
    },
  });
};
