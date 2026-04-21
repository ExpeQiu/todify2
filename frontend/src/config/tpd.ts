/**
 * tech-hub API 配置
 * 用于访问 tech-hub 的技术点对外服务 API
 */

// tech-hub API 基础 URL
// 支持通过环境变量配置，默认使用 localhost:3004
export const TECH_HUB_API_BASE_URL = 
  import.meta.env.VITE_TECH_HUB_API_URL ||
  import.meta.env.VITE_TPD_API_URL || 
  'http://localhost:3004/api/external/v1';

// 兼容旧命名
export const TPD_API_BASE_URL = TECH_HUB_API_BASE_URL;

