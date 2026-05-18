import axiosClient from './axiosClient';
import type { Category } from '../types/category.interface';

const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await axiosClient.get('/categories');
    return response.data;
  },
  
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  }
};

export default categoryService;
