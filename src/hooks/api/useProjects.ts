import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type ProjectCreateRequest } from '../../services/project.service';

export const PROJECT_KEYS = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: PROJECT_KEYS.all,
    queryFn: async () => {
      const response = await projectService.getAllProjects();
      return response;
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id!),
    queryFn: async () => {
      const response = await projectService.getProjectById(id!);
      return response;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProjectCreateRequest) => {
      const response = await projectService.createProject(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}
