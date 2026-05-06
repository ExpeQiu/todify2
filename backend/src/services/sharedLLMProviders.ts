/**
 * sharedLLMProviders - 从 shared.llm_providers 表读取 LLM Provider 配置
 *
 * 当 todify4 使用 PostgreSQL (DB_TYPE=postgresql) 时，直接从 shared.llm_providers 表读取配置
 * 当使用 SQLite (DB_TYPE=sqlite) 时，回退到 geelyhubAI 的内存/local 模式
 *
 * shared.llm_providers 表结构：
 *   id, name, provider_type, api_base_url, api_key_encrypted,
 *   model_configs (JSONB), is_active, priority, created_at, updated_at
 */
import { db } from '@/config/database';
import { logger } from '@/shared/lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SharedLLMProvider {
  id: number;
  name: string;
  provider_type: string;
  api_base_url: string;
  api_key_encrypted: string | null;
  model_configs: LLMProviderModelConfigs;
  is_active: boolean;
  priority: number;
}

export interface LLMProviderModelConfigs {
  default_model?: string;
  embedding_model?: string;
  max_tokens?: number;
  temperature?: string | null;
  connection_kind?: string;
  provider?: string;
  models?: string[];
  settings?: {
    timeout?: number;
    max_retries?: number;
  };
}

// ─── Cache ────────────────────────────────────────────────────────────────────

let _cache: SharedLLMProvider[] | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseModelConfigs(raw: any): LLMProviderModelConfigs {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

// ─── Core Query ────────────────────────────────────────────────────────────────

/**
 * 验证 shared.llm_providers 表是否存在（仅 PostgreSQL）
 */
export async function sharedTableExists(): Promise<boolean> {
  if (db.getType() !== 'postgresql') return false;
  try {
    const rows = await db.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'shared' AND table_name = 'llm_providers'
       LIMIT 1`,
    );
    return (rows as any[]).length > 0;
  } catch {
    return false;
  }
}

/**
 * 获取所有已启用的 Provider（带缓存）
 */
export async function listActiveProviders(): Promise<SharedLLMProvider[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) {
    return _cache;
  }

  if (db.getType() !== 'postgresql') {
    logger.warn('[sharedLLMProviders] DB_TYPE != postgresql，无法访问 shared.llm_providers');
    return [];
  }

  try {
    const rows = await db.query(
      `SELECT id, name, provider_type, api_base_url, api_key_encrypted,
              model_configs, is_active, priority
       FROM shared.llm_providers
       WHERE is_active = true
       ORDER BY priority ASC, id ASC`,
    ) as any[];

    _cache = rows.map(r => ({
      id: r.id,
      name: r.name,
      provider_type: r.provider_type,
      api_base_url: r.api_base_url,
      api_key_encrypted: r.api_key_encrypted,
      model_configs: parseModelConfigs(r.model_configs),
      is_active: r.is_active,
      priority: r.priority || 0,
    }));

    _cacheTime = Date.now();
    logger.info(`[sharedLLMProviders] 加载 ${_cache.length} 个活跃 Provider`);
    return _cache;
  } catch (error) {
    logger.error({ err: error }, '[sharedLLMProviders] 查询 shared.llm_providers 失败');
    return _cache || [];
  }
}

/**
 * 根据 ID 获取单个 Provider
 */
export async function getProviderById(id: number): Promise<SharedLLMProvider | null> {
  const providers = await listActiveProviders();
  return providers.find(p => p.id === id) || null;
}

/**
 * 根据 provider_type 查找 Provider
 */
export async function getProviderByType(providerType: string): Promise<SharedLLMProvider | null> {
  const providers = await listActiveProviders();
  return providers.find(p => p.provider_type === providerType) || null;
}

/**
 * 根据 default_model 查找 Provider
 */
export async function getProviderByModel(modelCode: string): Promise<SharedLLMProvider | null> {
  const providers = await listActiveProviders();
  return providers.find(p => p.model_configs?.default_model === modelCode) || null;
}

/**
 * 清除缓存
 */
export function invalidateCache(): void {
  _cache = null;
  _cacheTime = 0;
  logger.info('[sharedLLMProviders] 缓存已清除');
}

// ─── 转换为 geelyhubAI.ProviderConfig 格式 ─────────────────────────────────────

/**
 * 将 shared provider 转换为 geelyhubAI.ProviderConfig 格式
 */
export function toProviderConfig(shared: SharedLLMProvider): {
  id: string | number;
  providerId: string | number;
  provider: string;
  model: string;
  apiKey?: string;
  apiBaseUrl?: string;
  temperature?: number;
  maxTokens?: number;
} {
  return {
    id: shared.id,
    providerId: shared.id,
    provider: shared.provider_type,
    model: shared.model_configs?.default_model || '',
    apiKey: shared.api_key_encrypted || undefined,
    apiBaseUrl: shared.api_base_url || undefined,
    temperature: shared.model_configs?.temperature
      ? parseFloat(String(shared.model_configs.temperature))
      : undefined,
    maxTokens: shared.model_configs?.max_tokens,
  };
}
