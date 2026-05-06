/**
 * 门户 / 网关部署时通过构建参数 VITE_API_BASE_URL=/todify-api/v1 指向统一前缀。
 */
export const API_V1_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api/v1';
