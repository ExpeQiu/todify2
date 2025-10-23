const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3004;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库路径
const dbPath = path.join(__dirname, 'backend', 'data', 'database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
  } else {
    console.log('✅ 已连接到数据库');
  }
});

// 简单的概览API
app.get('/api/workflow-stats/overview', (req, res) => {
  console.log('📊 收到概览请求');
  
  const query = `
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
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('查询失败:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    console.log('📈 查询结果:', rows);
    
    const response = {
      success: true,
      data: {
        overview: {
          totalUsage: rows.reduce((sumuran, row) => sumuran + row.total_usage, 0),
          totalSessions: 2,
          completionRate: 78.5,
          avgSatisfaction: 4.1
        },
        nodeStats: rows.map(row => ({
          node_id: row.node_id,
          node_name: row.node_name,
          node_type: row.node_type,
          total_usage: row.total_usage,
          avg_response_time: row.avg_response_time,
          total_likes: row.total_likes,
          total_dislikes: row.total_dislikes,
          total_adoptions: row.total_adoptions,
          total_edits: row.total_edits
        }))
      }
    };
    
    res.json(response);
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 测试API服务器运行在 http://localhost:${PORT}`);
  console.log(`🔗 概览API: http://localhost:${PORT}/api/workflow-stats/overview`);
});
