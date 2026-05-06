-- =============================================
-- 技术分类种子数据 (PostgreSQL)
-- 创建时间: 2026-04-28
-- 说明: 为 GeelyTPD2 技术点数据库提供初始分类数据
-- =============================================

-- 技术分类 (tech_categories)
INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status) VALUES
('动力系统', '发动机、电机、传动系统等相关技术，包含燃油发动机、混合动力、纯电动等多种动力形式', NULL, 1, 1, 'active'),
('智能驾驶', '自动驾驶、辅助驾驶相关技术，包括感知、决策、执行等核心能力', NULL, 1, 2, 'active'),
('新能源技术', '电池、充电、能源管理技术，覆盖纯电动和混合动力两大路线', NULL, 1, 3, 'active'),
('底盘与悬架', '底盘调校、悬架系统、转向系统等关键技术', NULL, 1, 4, 'active'),
('安全技术', '主动安全、被动安全技术，包括车身结构、安全气囊、ADAS等', NULL, 1, 5, 'active'),
('智能座舱', '车载信息娱乐、语音交互、座椅舒适等人机交互技术', NULL, 1, 6, 'active'),
('车联网', 'V2X通信 OTA升级 远程控制等网联技术', NULL, 1, 7, 'active')
ON CONFLICT DO NOTHING;

-- 获取插入的分类ID
DO $$
DECLARE
    cat_dongli_id INTEGER;
    cat_zhineng_id INTEGER;
    cat_xinneng_id INTEGER;
    cat_dipan_id INTEGER;
    cat_anquan_id INTEGER;
BEGIN
    SELECT id INTO cat_dongli_id FROM tech_categories WHERE name = '动力系统' LIMIT 1;
    SELECT id INTO cat_zhineng_id FROM tech_categories WHERE name = '智能驾驶' LIMIT 1;
    SELECT id INTO cat_xinneng_id FROM tech_categories WHERE name = '新能源技术' LIMIT 1;
    SELECT id INTO cat_dipan_id FROM tech_categories WHERE name = '底盘与悬架' LIMIT 1;
    SELECT id INTO cat_anquan_id FROM tech_categories WHERE name = '安全技术' LIMIT 1;

    -- 子分类: 动力系统
    IF cat_dongli_id IS NOT NULL THEN
        INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status) VALUES
        ('雷神电混', '雷神动力智能电混系统', cat_dongli_id, 2, 1, 'active'),
        ('纯电动', '纯电动汽车驱动技术', cat_dongli_id, 2, 2, 'active'),
        ('燃油动力', '传统燃油发动机技术', cat_dongli_id, 2, 3, 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 子分类: 智能驾驶
    IF cat_zhineng_id IS NOT NULL THEN
        INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status) VALUES
        ('感知系统', '摄像头、雷达、传感器等感知设备', cat_zhineng_id, 2, 1, 'active'),
        ('智能计算', '自动驾驶芯片和算法', cat_zhineng_id, 2, 2, 'active'),
        ('驾驶辅助', 'L2/L3级别辅助驾驶功能', cat_zhineng_id, 2, 3, 'active')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 子分类: 新能源技术
    IF cat_xinneng_id IS NOT NULL THEN
        INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status) VALUES
        ('神盾电池', '吉利神盾电池安全技术', cat_xinneng_id, 2, 1, 'active'),
        ('充电技术', '快充、慢充、换电技术', cat_xinneng_id, 2, 2, 'active'),
        ('热管理', '电池热管理系统', cat_xinneng_id, 2, 3, 'active')
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

SELECT 'tech_categories 种子数据导入完成' AS result;
