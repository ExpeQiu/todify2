-- 文件存储表
-- 用于存储上传的文件信息，支持后续反复调用

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT UNIQUE NOT NULL, -- 文件唯一标识
  original_name TEXT NOT NULL, -- 原始文件名
  stored_name TEXT NOT NULL, -- 存储的文件名
  file_path TEXT NOT NULL, -- 文件存储路径
  file_url TEXT NOT NULL, -- 文件访问URL
  mime_type TEXT NOT NULL, -- 文件MIME类型
  file_size INTEGER NOT NULL, -- 文件大小（字节）
  file_hash TEXT, -- 文件哈希值（用于去重）
  category TEXT DEFAULT 'general', -- 文件分类（general, document, image等）
  tags TEXT, -- JSON数组格式存储标签
  description TEXT, -- 文件描述
  uploader_id TEXT, -- 上传者ID
  conversation_id TEXT, -- 关联的对话ID（可选）
  usage_count INTEGER DEFAULT 0, -- 使用次数
  last_used_at DATETIME, -- 最后使用时间
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata TEXT, -- JSON格式存储额外信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_files_file_id ON files(file_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_file_hash ON files(file_hash);

