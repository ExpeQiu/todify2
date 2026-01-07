-- 为 conversations 表添加 project_id 字段
-- 用于关联对话与项目
-- 创建日期: 2025-01-XX

-- 添加 project_id 字段（如果不存在）
-- SQLite 不支持直接检查列是否存在，需要先尝试添加
-- 如果列已存在，会报错但可以忽略

-- 方法1: 使用 ALTER TABLE（SQLite 3.2.0+）
ALTER TABLE conversations ADD COLUMN project_id INTEGER;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);

-- 可选：添加外键约束（如果数据库支持）
-- SQLite 3.37.0+ 支持 ALTER TABLE ADD CONSTRAINT
-- 注意：SQLite 的外键约束需要先启用 PRAGMA foreign_keys = ON;
-- FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL

