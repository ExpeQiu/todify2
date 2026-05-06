-- =============================================
-- 技术点关联技术IP迁移脚本 (PostgreSQL)
-- 创建时间: 2026-04-28
-- 说明: 为 tech_points 表添加 technology_id 外键列
-- =============================================

-- 检查并添加 technology_id 列到 tech_points 表
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tech_points' 
        AND column_name = 'technology_id'
    ) THEN
        ALTER TABLE tech_points ADD COLUMN technology_id INTEGER;
        RAISE NOTICE 'technology_id 列已添加到 tech_points 表';
    ELSE
        RAISE NOTICE 'technology_id 列已存在于 tech_points 表';
    END IF;
END $$;

-- 添加外键约束（可选，如果需要严格的外键引用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tech_points_technology'
    ) THEN
        ALTER TABLE tech_points 
        ADD CONSTRAINT fk_tech_points_technology 
        FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE SET NULL;
        RAISE NOTICE '外键约束已添加';
    ELSE
        RAISE NOTICE '外键约束已存在';
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE '添加外键约束失败（可能列不存在）: %', SQLERRM;
END $$;

-- 创建索引
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tech_points' 
        AND indexname = 'idx_tech_points_technology_id'
    ) THEN
        CREATE INDEX idx_tech_points_technology_id ON tech_points(technology_id);
        RAISE NOTICE '索引 idx_tech_points_technology_id 已创建';
    ELSE
        RAISE NOTICE '索引 idx_tech_points_technology_id 已存在';
    END IF;
END $$;

SELECT 'technology_id 迁移完成' AS result;
