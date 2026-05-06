-- =============================================
-- GeelyTPD2 技术数据种子文件 (PostgreSQL)
-- 一站式导入: 分类 + 技术点 + 技术IP
-- 创建时间: 2026-04-28
-- 使用方法: 
--   psql -h <host> -p <port> -U <user> -d <database> -f SEED-TECH-DATA.sql
-- =============================================

-- Step 0: 确保 technology_id 列存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tech_points' 
        AND column_name = 'technology_id'
    ) THEN
        ALTER TABLE tech_points ADD COLUMN technology_id BIGINT;
        RAISE NOTICE 'technology_id 列已添加到 tech_points 表';
    ELSE
        RAISE NOTICE 'technology_id 列已存在';
    END IF;
END $$;

-- Step 1: 插入技术分类 (tech_categories)
-- 主分类
INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status) VALUES
('动力系统', '发动机、电机、传动系统等相关技术', NULL, 1, 1, 'active'),
('智能驾驶', '自动驾驶、辅助驾驶相关技术', NULL, 1, 2, 'active'),
('新能源技术', '电池、充电、能源管理技术', NULL, 1, 3, 'active'),
('底盘与悬架', '底盘调校、悬架系统、转向系统等关键技术', NULL, 1, 4, 'active'),
('安全技术', '主动安全、被动安全技术', NULL, 1, 5, 'active'),
('智能座舱', '车载信息娱乐、语音交互等人机交互技术', NULL, 1, 6, 'active')
ON CONFLICT DO NOTHING;

-- 子分类
INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status) 
SELECT * FROM (VALUES
('雷神电混', '雷神动力智能电混系统', (SELECT id FROM tech_categories WHERE name = '动力系统' LIMIT 1), 2, 1, 'active'),
('纯电动驱动', '纯电动汽车驱动技术', (SELECT id FROM tech_categories WHERE name = '动力系统' LIMIT 1), 2, 2, 'active'),
('感知系统', '摄像头、雷达、传感器等感知设备', (SELECT id FROM tech_categories WHERE name = '智能驾驶' LIMIT 1), 2, 1, 'active'),
('智能计算', '自动驾驶芯片和算法', (SELECT id FROM tech_categories WHERE name = '智能驾驶' LIMIT 1), 2, 2, 'active'),
('神盾电池', '吉利神盾电池安全技术', (SELECT id FROM tech_categories WHERE name = '新能源技术' LIMIT 1), 2, 1, 'active'),
('充电技术', '快充、慢充、换电技术', (SELECT id FROM tech_categories WHERE name = '新能源技术' LIMIT 1), 2, 2, 'active')
) AS t(name, description, parent_id, level, sort_order, status)
WHERE NOT EXISTS (SELECT 1 FROM tech_categories WHERE name = t.name);

-- Step 2: 插入技术IP (technologies)
INSERT INTO technologies (name, name_en, description, version, status) VALUES
('雷神动力', 'Leishen Powertrain', '吉利雷神动力品牌，涵盖燃油发动机、混合动力、纯电动三大动力技术路线', '3.0', 'active'),
('神盾电池', 'Shendun Battery', '吉利自研电池安全技术品牌，包含磷酸铁锂短刀电池', '2.0', 'active'),
('千里浩瀚', 'Qianli Haohan', '吉利高阶智能驾驶技术品牌', 'H7', 'active'),
('G-AI智能座舱', 'G-AI Cockpit', '吉利智能座舱技术品牌，搭载银河OS操作系统', '2.0', 'active'),
('SEA浩瀚架构', 'SEA Architecture', '吉利SEA浩瀚智能进化体验架构，纯电动汽车战略核心', '2.0', 'active')
ON CONFLICT (name) DO NOTHING;

-- Step 3: 插入技术点 (tech_points)
-- 使用 CTE 获取分类和技术ID，然后插入技术点
WITH cat_ids AS (
    SELECT id, name FROM tech_categories WHERE parent_id IS NULL AND level = 1
),
tech_ids AS (
    SELECT id, name FROM technologies
)
INSERT INTO tech_points (name, description, category_id, tech_type, priority, status, tags, technical_details, benefits, applications, keywords, technology_id) 
SELECT * FROM (
    VALUES
    (
        '雷神AI电混2.0',
        '吉利雷神动力AI智能电混系统，采用高效燃烧技术，综合热效率行业领先',
        (SELECT id FROM cat_ids WHERE name = '动力系统' LIMIT 1),
        'technology', 'high', 'active',
        '["混合动力", "AI智能", "高效节能"]'::jsonb,
        '{"热效率": "46%", "电机功率": "120kW", "纯电续航": "100km"}'::jsonb,
        '["节油率提升40%", "纯电续航100km", "支持快充"]'::jsonb,
        '["城市通勤", "长途出行", "家庭用车"]'::jsonb,
        '["雷神电混", "PHEV", "插电混动", "新能源"]',
        (SELECT id FROM tech_ids WHERE name = '雷神动力' LIMIT 1)
    ),
    (
        '雷神EM-P超级电混',
        '雷神EM-P超级电混系统，专为性能取向车型设计，支持三电机四驱',
        (SELECT id FROM cat_ids WHERE name = '动力系统' LIMIT 1),
        'technology', 'high', 'active',
        '["高性能", "四驱", "超级电混"]'::jsonb,
        '{"综合功率": "320kW", "综合扭矩": "720Nm", "纯电续航": "150km"}'::jsonb,
        '["零百加速4秒内", "三电机四驱"]'::jsonb,
        '["性能车型", "四驱SUV", "高端产品"]'::jsonb,
        '["雷神EM-P", "PHEV", "四驱", "高性能"]',
        (SELECT id FROM tech_ids WHERE name = '雷神动力' LIMIT 1)
    ),
    (
        '神盾短刀电池',
        '吉利自研神盾短刀电池，采用磷酸铁锂材料，通过针刺等超国标安全测试',
        (SELECT id FROM cat_ids WHERE name = '新能源技术' LIMIT 1),
        'technology', 'critical', 'active',
        '["磷酸铁锂", "短刀设计", "高安全"]'::jsonb,
        '{"能量密度": "180Wh/kg", "循环寿命": "3500次", "安全性": "针刺无起火"}'::jsonb,
        '["安全标准超国标", "寿命3500次", "低温性能好"]'::jsonb,
        '["纯电动", "插电混动", "极寒地区"]'::jsonb,
        '["神盾电池", "短刀电池", "磷酸铁锂", "安全"]',
        (SELECT id FROM tech_ids WHERE name = '神盾电池' LIMIT 1)
    ),
    (
        '千里浩瀚H7智驾系统',
        '吉利千里浩瀚H7高阶智驾系统，支持高速NOA、城市NOA、泊车辅助等全场景功能',
        (SELECT id FROM cat_ids WHERE name = '智能驾驶' LIMIT 1),
        'technology', 'high', 'active',
        '["NOA", "高阶智驾", "城市智驾"]'::jsonb,
        '{"算力": "1000TOPS", "传感器": "激光雷达+摄像头", "OTA频率": "每月迭代"}'::jsonb,
        '["全场景NOA", "算力冗余", "持续进化"]'::jsonb,
        '["高速公路", "城市道路", "停车场"]'::jsonb,
        '["千里浩瀚", "NOA", "城市NOA", "泊车辅助"]',
        (SELECT id FROM tech_ids WHERE name = '千里浩瀚' LIMIT 1)
    ),
    (
        'G-AI智能座舱',
        '吉利G-AI智能座舱系统，搭载银河OS系统，支持全场景语音、手势交互',
        (SELECT id FROM cat_ids WHERE name = '智能座舱' LIMIT 1),
        'feature', 'high', 'active',
        '["智能座舱", "银河OS", "语音交互"]'::jsonb,
        '{"系统": "银河OS 2.0", "芯片": "龍鹰一号", "语音响应": "500ms"}'::jsonb,
        '["可见即可说", "情感交互", "持续OTA"]'::jsonb,
        '["车内交互", "家庭出行", "娱乐办公"]'::jsonb,
        '["G-AI", "银河OS", "智能座舱", "语音助手"]',
        (SELECT id FROM tech_ids WHERE name = 'G-AI智能座舱' LIMIT 1)
    ),
    (
        'SEA浩瀚架构',
        '吉利SEA浩瀚智能进化体验架构，支持1800-3300mm轴距延展，覆盖A级到E级车开发',
        (SELECT id FROM cat_ids WHERE name = '底盘与悬架' LIMIT 1),
        'technology', 'critical', 'active',
        '["纯电架构", "模块化", "800V"]'::jsonb,
        '{"电压平台": "800V", "快充功率": "360kW", "零件通用率": "80%"}'::jsonb,
        '["纯电专属", "超快充", "高度通用"]'::jsonb,
        '["纯电动车", "高端车型", "平台化开发"]'::jsonb,
        '["SEA", "浩瀚架构", "纯电平台", "800V"]',
        (SELECT id FROM tech_ids WHERE name = 'SEA浩瀚架构' LIMIT 1)
    ),
    (
        'G-Safety安全技术',
        '吉利G-Safety全维安全体系，包括被动安全、主动安全、功能安全、信息安全四大维度',
        (SELECT id FROM cat_ids WHERE name = '安全技术' LIMIT 1),
        'technology', 'critical', 'active',
        '["被动安全", "主动安全", "信息安全"]'::jsonb,
        '{"被动安全": "热成型钢31%", "主动安全": "AEB/FCW/LDW", "信息安全": "国密认证"}'::jsonb,
        '["五星安全", "智能防护", "数据安全"]'::jsonb,
        '["所有车型", "安全敏感用户"]'::jsonb,
        '["G-Safety", "被动安全", "主动安全", "信息安全"]',
        NULL
    ),
    (
        '雷神EM-i超级电混',
        '雷神EM-i超级电混系统，主打极致能耗表现，实现百公里亏电油耗低于4L',
        (SELECT id FROM cat_ids WHERE name = '动力系统' LIMIT 1),
        'technology', 'high', 'active',
        '["超低油耗", "经济实用", "EM-i"]'::jsonb,
        '{"热效率": "46.5%", "亏电油耗": "3.8L/100km", "综合续航": "1200km"}'::jsonb,
        '["亏电油耗3.8L", "综合续航1200km", "成本优化"]'::jsonb,
        '["家用轿车", "网约车", "日常通勤"]'::jsonb,
        '["雷神EM-i", "PHEV", "低油耗", "经济型"]',
        (SELECT id FROM tech_ids WHERE name = '雷神动力' LIMIT 1)
    )
) AS t(name, description, category_id, tech_type, priority, status, tags, technical_details, benefits, applications, keywords, technology_id)
WHERE NOT EXISTS (
    SELECT 1 FROM tech_points WHERE name = t.name
);

-- 验证插入结果
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '种子数据导入完成!';
    RAISE NOTICE '========================================';
END $$;

SELECT 'tech_categories' AS table_name, COUNT(*) AS row_count FROM tech_categories
UNION ALL
SELECT 'tech_points', COUNT(*) FROM tech_points
UNION ALL
SELECT 'technologies', COUNT(*) FROM technologies;
