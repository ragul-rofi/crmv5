import { PaginationParams } from '../types/common.js';

export const getPaginationParams = (query: any): PaginationParams => {
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit as string) || 50, 1), 100);
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

export const createPaginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit)
});