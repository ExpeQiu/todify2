import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 确保logs目录存在
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 定义日志级别和颜色
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// 自定义日志格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 根据环境变量确定日志级别
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'warn';
    default:
      return 'debug';
  }
};

// 创建Winston logger实例
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // 组合日志文件
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],

  // 处理未捕获的异常和Promise拒绝
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// 如果是生产环境，移除控制台输出
if (process.env.NODE_ENV === 'production') {
  logger.transports = logger.transports.filter(
    (transport) => transport.constructor.name !== 'Console'
  );
}

// 导出增强的logger接口
export class Logger {
  // 基础日志方法
  static error(message: string, meta?: Record<string, unknown>): void {
    logger.error(message, meta);
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, meta);
  }

  static info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, meta);
  }

  static http(message: string, meta?: Record<string, unknown>): void {
    logger.http(message, meta);
  }

  static debug(message: string, meta?: Record<string, unknown>): void {
    logger.debug(message, meta);
  }

  // 请求日志
  static request(req: {
    method: string;
    url: string;
    ip?: string;
    statusCode?: number;
  }): void {
    const message = `${req.method} ${req.url}`;
    const meta = {
      ip: req.ip,
      statusCode: req.statusCode,
    };

    if (req.statusCode && req.statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.http(message, meta);
    }
  }

  // 数据库操作日志
  static database(operation: string, details?: Record<string, unknown>): void {
    logger.debug(`[Database] ${operation}`, details);
  }

  // API调用日志
  static api(
    service: string,
    operation: string,
    details?: Record<string, unknown>
  ): void {
    logger.info(`[API] ${service} - ${operation}`, details);
  }

  // 错误日志（带堆栈）
  static exception(error: Error, context?: string): void {
    logger.error(`[Exception] ${context || 'Unknown context'}`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
}

export default logger;
