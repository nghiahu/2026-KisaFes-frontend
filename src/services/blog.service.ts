import axiosClient from './axiosClient';

export interface PublicBlog {
  id: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  authorName: string;
  publishAt: string;
  tags: string[];
  content?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const blogService = {
  // Use public endpoint, fallback to generic if not structured yet
  getLatestBlogs: async (limit: number = 3): Promise<PublicBlog[]> => {
    try {
      const response = await axiosClient.get<PageResponse<PublicBlog>>('/public/blogs', {
        params: {
          page: 1,
          size: limit,
          sortBy: 'publishAt',
          sortDir: 'desc'
        }
      });
      return response.data?.content || [];
    } catch (error) {
      console.warn("Could not fetch from /public/blogs, trying /admin/blogs as fallback", error);
      // Fallback for demo purposes if public endpoint isn't ready
      const response = await axiosClient.get<unknown>('/admin/blogs', {
        params: {
          page: 1,
          size: limit,
          status: 'PUBLISHED',
          sortBy: 'publishAt',
          sortDir: 'desc'
        }
      });
      const data = response.data as { data?: { content?: PublicBlog[] }, content?: PublicBlog[] };
      return data?.data?.content || data?.content || [];
    }
  },

  getBlogById: async (id: string): Promise<PublicBlog> => {
    try {
      const response = await axiosClient.get<{ data: PublicBlog }>(`/public/blogs/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.warn(`Could not fetch from /public/blogs/${id}, trying /admin/blogs/${id} as fallback`, error);
      const response = await axiosClient.get<{ data: PublicBlog }>(`/admin/blogs/${id}`);
      return response.data?.data || response.data;
    }
  }
};
