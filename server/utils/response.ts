import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/common.js';

export const sendSuccess = <T>(res: Response, data: T, pagination?: PaginationMeta) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString()
  };
  res.json(response);
};

export const sendError = (res: Response, statusCode: number, message: string) => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: message,
    timestamp: new Date().toISOString()
  };
  res.status(statusCode).json(response);
};