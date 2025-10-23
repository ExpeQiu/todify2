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

// 检查表是否存在
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%workflow%'", (err, rows) => {
  if (err) {
    console.error('检查表失败:', err);
    return;
  }
  console.log('📋 现有表:', rows.map(r => r.name));
  
  if (rows.length === 0) {
    console.log('❌ 没有找到统计表，请先运行初始化脚本');
    db.close();
    return;
  }
  
  // 插入测试数据
  insertTestData();
});

function insertTestData() {
  console.log('🚀 开始插入测试数据...');
  
  // 插入工作流节点使用统计测试数据
  const nodeUsageData = [
    {
      node_id: 'ai_qa',
      node_name: 'AI问答',
      node_type: 'ai_qa',
      session_id: 'test_session_001',
      user_id: 'test_user_001',
      usage_count: 25,
      avg_response_time: 3.2,
      success_count: 24,
      total_characters: 3750,
      avg_characters: 150,
      content_quality_score: 4.2,
      likes_count: 18,
      dislikes_count: 2,
      regenerations_count: 5,
      adoptions_count: 20,
      edits_count: 8,
      is_workflow_mode: true,
      is_standalone_mode: false
    },
    {
      node_id: 'tech_package',
      node_name: '技术包装',
      node_type: 'tech_package',
      session_id: 'test_session_002',
      user_id: 'test_user_002',
      usage_count: 15,
      avg_response_time: 8.5,
      success_count: 15,
      total_characters: 12000,
      avg_characters: 800,
      content_quality_score: 4.0,
      likes_count: 12,
      dislikes_count: 1,
      regenerations_count: 3,
      adoptions_count: 14,
      edits_count: 6,
      is_workflow_mode: true,
      is_standalone_mode: false
    }
  ];

  // 插入数据到数据库
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO workflow_node_usage (
      node_id, node_name, node_type, session_id, user_id,
      usage_count, avg_response_time, success_count, total_characters,
      avg_characters, content_quality_score, likes_count, dislikes_count,
      regenerations_count, adoptions_count, edits_count, is_workflow_mode,
      is_standalone_mode, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let completed = 0;
  nodeUsageData.forEach((data, index) => {
    stmt.run([
      data.node_id, data.node_name, data.node_type, data.session_id, data.user_id,
      data.usage_count, data.avg_response_time, data.success_count, data.total_characters,
      data.avg_characters, data.content_quality_score, data.likes_count, data.dislikes_count,
      data.regenerations_count, data.adoptions_count, data.edits_count, data.is_workflow_mode,
      data.is_standalone_mode
    ], (err) => {
      if (err) {
        console.error(`插入节点使用数据失败 (${index + 1}):`, err);
      } else {
        completed++;
        console.log(`✅ 插入节点使用数据 (${index + 1}/${nodeUsageData.length})`);
        if (completed === nodeUsageData.length) {
          stmt.finalize();
          console.log('🎉 测试数据插入完成！');
          console.log('🔗 现在可以访问统计页面查看数据:');
          console.log('  http://localhost:3000/workflow-stats');
          console.log('  http://localhost:3000/enhanced-workflow-stats');
          db.close();
        }
      }
    });
  });
}
