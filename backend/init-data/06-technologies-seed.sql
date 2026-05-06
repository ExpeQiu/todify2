-- =============================================
-- 技术IP种子数据 (PostgreSQL)
-- 创建时间: 2026-04-28
-- 说明: 为 GeelyTPD2 技术点数据库提供初始技术IP数据
-- 依赖: 04-tech-categories-seed.sql, 05-tech-points-seed.sql (建议先执行)
-- =============================================

-- 技术IP (technologies)
INSERT INTO technologies (name, name_en, description, version, status) VALUES
('雷神动力', 'Leishen Powertrain', '吉利雷神动力品牌，涵盖燃油发动机、混合动力、纯电动三大动力技术路线，主打高效、智能、环保', '3.0', 'active'),
('神盾电池', 'Shendun Battery', '吉利自研电池安全技术品牌，包含磷酸铁锂短刀电池和三元锂电芯，实现电池全栈自研', '2.0', 'active'),
('千里浩瀚', 'Qianli Haohan', '吉利高阶智能驾驶技术品牌，字母H代表Horizon（地平线）和Honor（荣耀），代表智能驾驶新高度', 'H7', 'active'),
('G-AI智能座舱', 'G-AI Cockpit', '吉利智能座舱技术品牌，搭载银河OS操作系统，提供沉浸式智能出行体验', '2.0', 'active'),
('SEA浩瀚架构', 'SEA Architecture', '吉利SEA浩瀚智能进化体验架构，是吉利纯电动汽车战略的核心技术底座', '2.0', 'active'),
('CMA架构', 'CMA Architecture', '吉利与沃尔沃联合开发的模块化架构，融合欧洲豪华车安全与亚洲成本优势', 'CMA-B', 'active')
ON CONFLICT (name) DO NOTHING;

-- 为技术点关联技术IP (technology_id)
-- 先查找tech_points中的技术点，然后关联到对应的technologies

DO $$
DECLARE
    tech_leishen_id INTEGER;
    tech_shendun_id INTEGER;
    tech_qianli_id INTEGER;
    tech_gai_id INTEGER;
    tech_sea_id INTEGER;
    tech_cma_id INTEGER;
BEGIN
    -- 获取技术IP ID
    SELECT id INTO tech_leishen_id FROM technologies WHERE name = '雷神动力' LIMIT 1;
    SELECT id INTO tech_shendun_id FROM technologies WHERE name = '神盾电池' LIMIT 1;
    SELECT id INTO tech_qianli_id FROM technologies WHERE name = '千里浩瀚' LIMIT 1;
    SELECT id INTO tech_gai_id FROM technologies WHERE name = 'G-AI智能座舱' LIMIT 1;
    SELECT id INTO tech_sea_id FROM technologies WHERE name = 'SEA浩瀚架构' LIMIT 1;
    SELECT id INTO tech_cma_id FROM technologies WHERE name = 'CMA架构' LIMIT 1;

    -- 关联技术点到技术IP
    -- 雷神电混系列 -> 雷神动力
    IF tech_leishen_id IS NOT NULL THEN
        UPDATE tech_points SET technology_id = tech_leishen_id 
        WHERE name IN ('雷神AI电混2.0', '雷神EM-P超级电混', '雷神EM-i超级电混')
        AND technology_id IS NULL;
    END IF;

    -- 电池安全系列 -> 神盾电池
    IF tech_shendun_id IS NOT NULL THEN
        UPDATE tech_points SET technology_id = tech_shendun_id 
        WHERE name IN ('神盾短刀电池', '神盾电池安全系统')
        AND technology_id IS NULL;
    END IF;

    -- 智驾系统 -> 千里浩瀚
    IF tech_qianli_id IS NOT NULL THEN
        UPDATE tech_points SET technology_id = tech_qianli_id 
        WHERE name = '千里浩瀚H7智驾系统'
        AND technology_id IS NULL;
    END IF;

    -- 座舱系统 -> G-AI
    IF tech_gai_id IS NOT NULL THEN
        UPDATE tech_points SET technology_id = tech_gai_id 
        WHERE name = 'G-AI智能座舱'
        AND technology_id IS NULL;
    END IF;

    -- 架构系列 -> SEA/CMA
    IF tech_sea_id IS NOT NULL THEN
        UPDATE tech_points SET technology_id = tech_sea_id 
        WHERE name = 'SEA浩瀚架构'
        AND technology_id IS NULL;
    END IF;

    IF tech_cma_id IS NOT NULL THEN
        UPDATE tech_points SET technology_id = tech_cma_id 
        WHERE name = 'CMA架构'
        AND technology_id IS NULL;
    END IF;

END $$;

SELECT 'technologies 种子数据导入完成' AS result;
