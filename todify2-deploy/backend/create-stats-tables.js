const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'data', 'database.db');

console.log('🔍 数据库路径:', dbPath);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('✅ 已连接到数据库');
});

// 创建统计表的SQL
const createTablesSQL = `
-- 工作流节点使用统计表
CREATE TABLE IF NOT EXISTS workflow_node_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    node_name TEXT NOT NULL,
    node_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT,
    usage_count INTEGER DEFAULT 1,
    total_time_spent REAL DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    total_characters INTEGER DEFAULT 0,
    avg_characters INTEGER DEFAULT 0,
    content_quality_score REAL DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    regenerations_count INTEGER DEFAULT 0,
    adoptions_count INTEGER DEFAULT 0,
    edits_count INTEGER DEFAULT 0,
    is_workflow_mode BOOLEAN DEFAULT FALSE,
    is_standalone_mode BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI问答评价表
CREATE TABLE IF NOT EXISTS ai_qa_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT,
    feedback_type TEXT NOT NULL,
    feedback_value INTEGER DEFAULT 0,
    feedback_comment TEXT,
    response_time REAL,
    content_length INTEGER,
    content_quality_score REAL,
    query_text TEXT,
    response_text TEXT,
    context_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 工作流会话统计表
CREATE TABLE IF NOT EXISTS workflow_session_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    session_start_time DATETIME,
    session_end_time DATETIME,
    session_duration REAL DEFAULT 0,
    total_nodes_visited INTEGER DEFAULT 0,
    completed_nodes INTEGER DEFAULT 0,
    skipped_nodes INTEGER DEFAULT 0,
    node_visit_sequence TEXT,
    node_completion_status TEXT,
    exit_node_id TEXT,
    exit_reason TEXT,
    exit_time DATETIME,
    workflow_path TEXT,
    path_efficiency_score REAL DEFAULT 0,
    overall_satisfaction_score REAL,
    user_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 节点内容处理统计表
CREATE TABLE IF NOT EXISTS node_content_processing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    message_id TEXT,
    processing_type TEXT NOT NULL,
    processing_time REAL,
    original_content_length INTEGER,
    final_content_length INTEGER,
    edit_ratio REAL DEFAULT 0,
    edit_count INTEGER DEFAULT 0,
    edit_types TEXT,
    edit_duration REAL DEFAULT 0,
    user_satisfaction_score REAL,
    user_behavior_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 实时统计汇总表
CREATE TABLE IF NOT EXISTS workflow_stats_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    node_id TEXT NOT NULL,
    total_usage_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    success_rate REAL DEFAULT 0,
    total_characters INTEGER DEFAULT 0,
    avg_characters INTEGER DEFAULT 0,
    avg_content_quality REAL DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_dislikes INTEGER DEFAULT 0,
    total_regenerations INTEGER DEFAULT 0,
    total_adoptions INTEGER DEFAULT 0,
    total_edits INTEGER DEFAULT 0,
    direct_adoption_rate REAL DEFAULT 0,
    edit_adoption_rate REAL DEFAULT 0,
    abandonment_rate REAL DEFAULT 0,
    workflow_completion_rate REAL DEFAULT 0,
    avg_session_duration REAL DEFAULT 0,
    common_exit_points TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date, node_id)
);
`;

// 执行创建表操作
db.exec(createTablesSQL, (err) => {
  if (err) {
    console.error('创建表失败:', err);
    return;
  }
  console.log('✅ 统计表创建成功！');
  
  // 验证表是否创建成功
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%workflow%'", (err, rows) => {
    if (err) {
      console.error('验证表失败:', err);
      return;
    }
    console.log('📋 创建的表:', rows.map(r => r.name));
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('✅ 数据库连接已关闭');
        console.log('🎉 统计表创建完成！现在可以插入测试数据了。');
      }
    });
  });
});
