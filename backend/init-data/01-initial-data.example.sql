-- 示例初始数据文件
-- 此文件展示如何准备历史数据导入
-- 复制此文件为实际的 SQL 文件（去掉 .example 后缀）即可自动导入

-- 插入技术分类示例数据
INSERT OR IGNORE INTO tech_categories (name, description, level, sort_order, status) VALUES
('动力系统', '发动机、电机、传动系统等相关技术', 1, 1, 'active'),
('智能驾驶', '自动驾驶、辅助驾驶相关技术', 1, 2, 'active'),
('车联网', '车载通信、物联网技术', 1, 3, 'active'),
('新能源', '电池、充电、能源管理技术', 1, 4, 'active'),
('安全技术', '主动安全、被动安全技术', 1, 5, 'active');

-- 插入品牌示例数据
INSERT OR IGNORE INTO brands (name, name_en, country, status) VALUES
('比亚迪', 'BYD', '中国', 'active'),
('特斯拉', 'Tesla', '美国', 'active'),
('蔚来', 'NIO', '中国', 'active'),
('理想', 'Li Auto', '中国', 'active'),
('小鹏', 'XPeng', '中国', 'active');

-- 注意：
-- 1. 使用 INSERT OR IGNORE 避免重复数据冲突
-- 2. 确保外键关系正确（例如：tech_points 需要先有对应的 tech_categories）
-- 3. 文件名使用数字前缀控制执行顺序（例如：01-xxx.sql, 02-xxx.sql）
-- 4. 可以创建多个 SQL 文件，按字母顺序执行
