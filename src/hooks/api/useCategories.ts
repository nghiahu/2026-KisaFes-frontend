import { useQuery } from '@tanstack/react-query';
import categoryService from '../../services/category.service';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
  detail: (id: string) => ['categories', id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: async () => {
      const response = await categoryService.getAllCategories();
      return response;
    },
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: CATEGORY_KEYS.detail(id!),
    queryFn: async () => {
      const response = await categoryService.getCategoryById(id!);
      return response;
    },
    enabled: !!id,
  });
}
