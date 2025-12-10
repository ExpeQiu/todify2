import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { errorTracking } from '../infrastructure/monitoring/errorTracking';

/**
 * 异步错误处理包装器
 * 用于包装 Express 路由处理函数，自动捕获异步错误
 * 
 * @param fn 异步路由处理函数
 * @returns 包装后的路由处理函数
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // 记录错误
      logger.error('异步路由处理错误', {
        error,
        stack: error?.stack,
        requestUrl: req.url,
        method: req.method,
        path: req.path,
        body: req.body,
      });

      // 发送到错误追踪
      errorTracking.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          context: {
            metadata: {
              method: req.method,
              path: req.path,
              body: req.body,
            },
          },
        }
      );

      // 传递给 Express 错误处理中间件
      next(error);
    });
  };
}















