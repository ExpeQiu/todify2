import { ZodSchema, ZodTypeAny } from 'zod';

import { failure } from './result';

export class ValidationException extends Error {
  constructor(public readonly errors: unknown) {
    super('VALIDATION_ERROR');
    this.name = 'ValidationException';
  }
}

export const validateDTO = <T>(schema: ZodSchema<T> | ZodTypeAny, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationException(result.error.flatten());
  }

  return result.data;
};

export const formatValidationFailure = (error: unknown) => {
  if (error instanceof ValidationException) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: '请求参数验证失败',
      details: error.errors,
    });
  }

  return failure({
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : '未知错误',
    details: error,
  });
};

