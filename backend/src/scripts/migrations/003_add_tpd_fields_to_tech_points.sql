-- 迁移脚本：为 tech_points 表添加 TPD2 同步相关字段
-- 执行日期：2025-12-08
-- 说明：添加 tpd_id, car_models_info, resources_info 字段，实现单表管理

-- SQLite 版本
-- 注意：SQLite 不支持直接 ALTER TABLE ADD COLUMN 添加多个列，需要逐个添加

-- 1. 添加 tpd_id 字段（用于存储 TPD2 项目的原始 ID，作为同步锚点）
ALTER TABLE tech_points ADD COLUMN tpd_id VARCHAR(100);

-- 2. 添加 car_models_info 字段（JSON 格式存储车型信息）
ALTER TABLE tech_points ADD COLUMN car_models_info TEXT;

-- 3. 添加 resources_info 字段（JSON 格式存储资源信息）
ALTER TABLE tech_points ADD COLUMN resources_info TEXT;

-- 4. 添加 knowledge_info 字段（JSON 格式存储知识点详情，整合现有字段）
ALTER TABLE tech_points ADD COLUMN knowledge_info TEXT;

-- 5. 为 tpd_id 创建索引（用于快速查找和同步）
CREATE INDEX IF NOT EXISTS idx_tech_points_tpd_id ON tech_points(tpd_id);

-- PostgreSQL 版本（如果需要）
-- 注意：PostgreSQL 支持一次添加多个列
/*
ALTER TABLE tech_points 
  ADD COLUMN IF NOT EXISTS tpd_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS car_models_info JSONB,
  ADD COLUMN IF NOT EXISTS resources_info JSONB,
  ADD COLUMN IF NOT EXISTS knowledge_info JSONB;

CREATE INDEX IF NOT EXISTS idx_tech_points_tpd_id ON tech_points(tpd_id);
*/



