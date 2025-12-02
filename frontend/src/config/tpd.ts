/**
 * TPD2 项目 API 配置
 * 用于访问 TPD2 项目的技术点对外服务 API
 */

// TPD2 API 基础 URL
// 支持通过环境变量配置，默认使用 localhost:3004
export const TPD_API_BASE_URL = 
  import.meta.env.VITE_TPD_API_URL || 
  'http://localhost:3004/api/external/v1';

