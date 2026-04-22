/**
 * Geelyhub AI Configuration Service for Todify4 Backend.
 *
 * Provides unified access to AI provider configs from Geelyhub,
 * with local config taking priority over remote Geelyhub config.
 *
 * Environment variables:
 *   GEELYHUB_URL: Geelyhub backend URL (default: http://geelyhub-backend:8011)
 *   GEELYHUB_SYSTEM_TOKEN: System-level auth token
 *   AI_CONFIG_FALLBACK: Enable local fallback when Geelyhub unavailable (default: true)
 */

import axios from 'axios';
import { logger } from '@/shared/lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIProvider {
  id: string | number;
  name: string;
  description?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface ProviderConfig {
  id: string | number;
  providerId: string | number;
  provider: string;
  model: string;
  apiKey?: string;
  apiBaseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

// ─── Configuration ─────────────────────────────────────────────────────────────

const GEELYHUB_URL = process.env.GEELYHUB_URL || 'http://geelyhub-backend:8011';
const SYSTEM_TOKEN = process.env.GEELYHUB_SYSTEM_TOKEN || '';
const FALLBACK_ENABLED = process.env.AI_CONFIG_FALLBACK !== 'false';

// ─── In-memory local config store ─────────────────────────────────────────────

const localProviderConfigs: Map<string | number, ProviderConfig> = new Map();

// ─── Local config management ──────────────────────────────────────────────────

export function registerLocalProviderConfig(config: ProviderConfig): void {
  localProviderConfigs.set(config.id, config);
  logger.info({ providerId: config.id }, '[geelyhubAI] Registered local config for provider');
}

export function getLocalProviderConfig(providerId: string | number): ProviderConfig | undefined {
  return localProviderConfigs.get(providerId);
}

// ─── Geelyhub API calls ───────────────────────────────────────────────────────

export async function getAIProvidersFromGeelyhub(): Promise<AIProvider[]> {
  const url = `${GEELYHUB_URL}/hub-api/v1/ai/providers`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${SYSTEM_TOKEN}`,
        Accept: 'application/json',
      },
      timeout: 10000,
    });
    return response.data?.data ?? response.data ?? [];
  } catch (error: any) {
    logger.warn({ err: error, url }, '[geelyhubAI] Failed to fetch providers from Geelyhub');
    return [];
  }
}

export async function getProviderConfigFromGeelyhub(providerId: string | number): Promise<ProviderConfig | null> {
  const url = `${GEELYHUB_URL}/hub-api/v1/ai/providers/${providerId}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${SYSTEM_TOKEN}`,
        Accept: 'application/json',
      },
      timeout: 10000,
    });
    return response.data?.data ?? response.data ?? null;
  } catch (error: any) {
    logger.warn({ err: error, providerId }, '[geelyhubAI] Failed to fetch provider config from Geelyhub');
    return null;
  }
}

// ─── Layered config resolution ─────────────────────────────────────────────────

/**
 * Get AI config with layered fallback:
 * 1. Local config (highest priority, checked first when FALLBACK_ENABLED)
 * 2. Geelyhub config (if FALLBACK_ENABLED and Geelyhub is reachable)
 * 3. Local config (last resort if FALLBACK_ENABLED=false but Geelyhub failed)
 *
 * Returns null if neither is available.
 */
export async function getAIConfig(providerId: string | number): Promise<ProviderConfig | null> {
  // Step 1: Try local config
  if (FALLBACK_ENABLED) {
    const local = getLocalProviderConfig(providerId);
    if (local) {
      logger.debug({ providerId }, '[geelyhubAI] Using local config for provider');
      return local;
    }
  }

  // Step 2: Try Geelyhub
  const geelyhub = await getProviderConfigFromGeelyhub(providerId);
  if (geelyhub) {
    logger.debug({ providerId }, '[geelyhubAI] Using Geelyhub config for provider');
    return geelyhub;
  }

  // Step 3: Last-resort local even if FALLBACK_ENABLED was false
  const local = getLocalProviderConfig(providerId);
  if (local) return local;

  logger.warn({ providerId }, '[geelyhubAI] No config found for provider');
  return null;
}

/**
 * Get all available providers (merged: local + Geelyhub, Geelyhub wins on id collision)
 */
export async function getAllAIProviders(): Promise<AIProvider[]> {
  const geelyhubProviders = await getAIProvidersFromGeelyhub();

  const merged = new Map<string | number, AIProvider>();

  // Local entries first
  localProviderConfigs.forEach((config, id) => {
    merged.set(id, { id, name: config.provider, enabled: true });
  });

  // Geelyhub entries overwrite local for same id (source of truth)
  for (const p of geelyhubProviders) {
    merged.set(p.id, p);
  }

  return Array.from(merged.values());
}
