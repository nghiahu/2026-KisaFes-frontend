import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type UpdateProfilePayload } from '../../services/userService';
import type { User } from '../../types/user.interface';

export const USER_KEYS = {
  profile: ['user', 'profile'] as const,
};

export function useUserProfileQuery() {
  return useQuery<User>({
    queryKey: USER_KEYS.profile,
    queryFn: async () => {
      const response = await userService.getMyProfile();
      return (response as any).data;
    },
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfilePayload) => {
      const response = await userService.updateMyProfile(data);
      return (response as any).data;
    },
    onSuccess: (updatedProfile) => {
      // Optimistically update the cache with the new profile data
      queryClient.setQueryData(USER_KEYS.profile, updatedProfile);
    },
  });
}
