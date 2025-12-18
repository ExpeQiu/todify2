-- 测试数据：技术分类
-- 此文件用于验证 Docker 部署时的数据导入功能

INSERT OR IGNORE INTO tech_categories (name, description, level, sort_order, status) VALUES
('动力系统', '发动机、电机、传动系统等相关技术', 1, 1, 'active'),
('智能驾驶', '自动驾驶、辅助驾驶相关技术', 1, 2, 'active'),
('车联网', '车载通信、物联网技术', 1, 3, 'active'),
('新能源', '电池、充电、能源管理技术', 1, 4, 'active'),
('安全技术', '主动安全、被动安全技术', 1, 5, 'active');
