import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';

import { createSuccessResponse, createErrorResponse, ApiErrorCode } from '@/shared/types/api';

describe('API Response Helpers', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.error).toBeUndefined();
    });

    it('should create a success response with message', () => {
      const data = { id: '123' };
      const message = '操作成功';
      const response = createSuccessResponse(data, message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response', () => {
      const code = ApiErrorCode.VALIDATION_ERROR;
      const message = '验证失败';
      const response = createErrorResponse(code, message);

      expect(response.success).toBe(false);
      expect(response.error).toEqual({
        code,
        message,
      });
      expect(response.data).toBeUndefined();
    });

    it('should create an error response with details', () => {
      const code = ApiErrorCode.VALIDATION_ERROR;
      const message = '验证失败';
      const details = { field: 'email', reason: 'invalid format' };
      const response = createErrorResponse(code, message, details);

      expect(response.success).toBe(false);
      expect(response.error).toEqual({
        code,
        message,
        details,
      });
    });
  });
});

