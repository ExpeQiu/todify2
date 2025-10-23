const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'data', 'database.db');

console.log('🔍 测试数据库连接和API数据...');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('✅ 已连接到数据库');
});

// 测试查询
db.all("SELECT * FROM workflow_node_usage LIMIT 5", (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }
  console.log('📊 查询结果:', rows);
  
  // 测试概览查询
  db.all(`
    SELECT 
      node_id,
      node_name,
      node_type,
      SUM(usage_count) as total_usage,
      AVG(avg_response_time) as avg_response_time,
      SUM(likes_count) as total_likes,
      SUM(dislikes_count) as total_dislikes,
      SUM(adoptions_count) as total_adoptions,
      SUM(edits_count) as total_edits
    FROM workflow_node_usage 
    GROUP BY node_id, node_name, node_type
  `, (err, rows) => {
    if (err) {
      console.error('概览查询失败:', err);
      return;
    }
    console.log('📈 概览查询结果:', rows);
    
    db.close();
  });
});
