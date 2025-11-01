import { cachedQuery, invalidateCache } from '../db-cache.js';
import { PaginatedResult, PaginationParams } from '../types/common.js';
import { createPaginationMeta } from '../utils/pagination.js';

export abstract class BaseService<T> {
  protected abstract tableName: string;
  protected abstract selectFields: string;
  protected abstract cachePrefix: string;

  async findAll(pagination: PaginationParams, filters?: any): Promise<PaginatedResult<T>> {
    const whereClause = this.buildWhereClause(filters);
    const params = this.buildWhereParams(filters);
    
    const [dataResult, countResult] = await Promise.all([
      cachedQuery(
        `SELECT ${this.selectFields} FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pagination.limit, pagination.offset],
        { cachePrefix: `${this.cachePrefix}:list:${pagination.page}:${pagination.limit}`, ttl: 300 }
      ),
      cachedQuery(
        `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
        params,
        { cachePrefix: `${this.cachePrefix}:count`, ttl: 300 }
      )
    ]);

    const total = parseInt(countResult.rows[0].total);
    
    return {
      data: dataResult.rows,
      pagination: createPaginationMeta(pagination.page, pagination.limit, total)
    };
  }

  async findById(id: string): Promise<T | null> {
    const result = await cachedQuery(
      `SELECT ${this.selectFields} FROM ${this.tableName} WHERE id = $1`,
      [id],
      { cachePrefix: `${this.cachePrefix}:${id}`, ttl: 600 }
    );
    
    return result.rows[0] || null;
  }

  async invalidateEntityCache(id?: string): Promise<void> {
    if (id) {
      await invalidateCache(this.cachePrefix, id);
    }
    await invalidateCache(this.cachePrefix);
  }

  protected buildWhereClause(filters?: any): string {
    return '';
  }

  protected buildWhereParams(filters?: any): any[] {
    return [];
  }
}