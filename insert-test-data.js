const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'backend', 'data', 'database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('✅ 已连接到数据库');
});

// 插入测试数据的函数
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
    },
    {
      node_id: 'promotion_strategy',
      node_name: '推广策略',
      node_type: 'promotion_strategy',
      session_id: 'test_session_003',
      user_id: 'test_user_003',
      usage_count: 12,
      avg_response_time: 15.2,
      success_count: 11,
      total_characters: 14400,
      avg_characters: 1200,
      content_quality_score: 3.8,
      likes_count: 8,
      dislikes_count: 2,
      regenerations_count: 4,
      adoptions_count: 9,
      edits_count: 7,
      is_workflow_mode: true,
      is_standalone_mode: false
    },
    {
      node_id: 'ai_search',
      node_name: 'AI搜索',
      node_type: 'ai_search',
      session_id: 'test_session_004',
      user_id: 'test_user_004',
      usage_count: 30,
      avg_response_time: 2.1,
      success_count: 29,
      total_characters: 9000,
      avg_characters: 300,
      content_quality_score: 4.5,
      likes_count: 25,
      dislikes_count: 1,
      regenerations_count: 3,
      adoptions_count: 27,
      edits_count: 5,
      is_workflow_mode: false,
      is_standalone_mode: true
    }
  ];

  // 插入AI问答评价测试数据
  const feedbackData = [
    {
      message_id: 'msg_001',
      node_id: 'ai_qa',
      session_id: 'test_session_001',
      user_id: 'test_user_001',
      feedback_type: 'like',
      feedback_value: 5,
      response_time: 3.2,
      content_length: 150,
      query_text: '什么是人工智能？',
      response_text: '人工智能是模拟人类智能的计算机技术...'
    },
    {
      message_id: 'msg_002',
      node_id: 'ai_qa',
      session_id: 'test_session_001',
      user_id: 'test_user_001',
      feedback_type: 'adopt',
      feedback_value: 5,
      response_time: 2.8,
      content_length: 200,
      query_text: '如何优化AI模型？',
      response_text: '优化AI模型可以从数据质量、算法选择等方面入手...'
    },
    {
      message_id: 'msg_003',
      node_id: 'tech_package',
      session_id: 'test_session_002',
      user_id: 'test_user_002',
      feedback_type: 'like',
      feedback_value: 4,
      response_time: 8.5,
      content_length: 800,
      query_text: '包装技术方案',
      response_text: '技术包装方案需要从多个维度进行设计...'
    }
  ];

  // 插入会话统计测试数据
  const sessionData = [
    {
      session_id: 'test_session_001',
      user_id: 'test_user_001',
      session_duration: 180.5,
      total_nodes_visited: 3,
      completed_nodes: 2,
      skipped_nodes: 1,
      node_visit_sequence: JSON.stringify(['ai_qa', 'tech_package', 'promotion_strategy']),
      node_completion_status: JSON.stringify(['ai_qa', 'tech_package']),
      exit_node_id: 'promotion_strategy',
      exit_reason: 'user_abandon',
      exit_time: new Date().toISOString(),
      workflow_path: JSON.stringify({
        visited: ['ai_qa', 'tech_package', 'promotion_strategy'],
        completed: ['ai_qa', 'tech_package'],
        skipped: ['promotion_strategy']
      }),
      path_efficiency_score: 0.67,
      overall_satisfaction_score: 4.0
    },
    {
      session_id: 'test_session_002',
      user_id: 'test_user_002',
      session_duration: 245.8,
      total_nodes_visited: 2,
      completed_nodes: 2,
      skipped_nodes: 0,
      node_visit_sequence: JSON.stringify(['ai_qa', 'tech_package']),
      node_completion_status: JSON.stringify(['ai_qa', 'tech_package']),
      exit_node_id: null,
      exit_reason: 'completed',
      exit_time: null,
      workflow_path: JSON.stringify({
        visited: ['ai_qa', 'tech_package'],
        completed: ['ai_qa', 'tech_package'],
        skipped: []
      }),
      path_efficiency_score: 1.0,
      overall_satisfaction_score: 4.5
    }
  ];

  // 插入内容处理统计测试数据
  const contentProcessingData = [
    {
      node_id: 'ai_qa',
      session_id: 'test_session_001',
      message_id: 'msg_001',
      processing_type: 'direct_adopt',
      original_content_length: 150,
      final_content_length: 150,
      edit_ratio: 0,
      edit_count: 0,
      edit_duration: 0,
      user_satisfaction_score: 5.0
    },
    {
      node_id: 'tech_package',
      session_id: 'test_session_002',
      message_id: 'msg_003',
      processing_type: 'edit_adopt',
      original_content_length: 800,
      final_content_length: 950,
      edit_ratio: 0.1875,
      edit_count: 2,
      edit_duration: 300,
      user_satisfaction_score: 4.0
    }
  ];

  // 插入数据到数据库
  const insertNodeUsage = () => {
    return new Promise((resolve, reject) => {
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
            reject(err);
          } else {
            completed++;
            console.log(`✅ 插入节点使用数据 (${index + 1}/${nodeUsageData.length})`);
            if (completed === nodeUsageData.length) {
              stmt.finalize();
              resolve();
            }
          }
        });
      });
    });
  };

  const insertFeedback = () => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ai_qa_feedback (
          message_id, node_id, session_id, user_id, feedback_type,
          feedback_value, response_time, content_length, query_text,
          response_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      let completed = 0;
      feedbackData.forEach((data, index) => {
        stmt.run([
          data.message_id, data.node_id, data.session_id, data.user_id,
          data.feedback_type, data.feedback_value, data.response_time,
          data.content_length, data.query_text, data.response_text
        ], (err) => {
          if (err) {
            console.error(`插入反馈数据失败 (${index + 1}):`, err);
            reject(err);
          } else {
            completed++;
            console.log(`✅ 插入反馈数据 (${index + 1}/${feedbackData.length})`);
            if (completed === feedbackData.length) {
              stmt.finalize();
              resolve();
            }
          }
        });
      });
    });
  };

  const insertSessionStats = () => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO workflow_session_stats (
          session_id, user_id, session_duration, total_nodes_visited,
          completed_nodes, skipped_nodes, node_visit_sequence,
          node_completion_status, exit_node_id, exit_reason, exit_time,
          workflow_path, path_efficiency_score, overall_satisfaction_score,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      let completed = 0;
      sessionData.forEach((data, index) => {
        stmt.run([
          data.session_id, data.user_id, data.session_duration,
          data.total_nodes_visited, data.completed_nodes, data.skipped_nodes,
          data.node_visit_sequence, data.node_completion_status,
          data.exit_node_id, data.exit_reason, data.exit_time,
          data.workflow_path, data.path_efficiency_score, data.overall_satisfaction_score
        ], (err) => {
          if (err) {
            console.error(`插入会话统计失败 (${index + 1}):`, err);
            reject(err);
          } else {
            completed++;
            console.log(`✅ 插入会话统计 (${index + 1}/${sessionData.length})`);
            if (completed === sessionData.length) {
              stmt.finalize();
              resolve();
            }
          }
        });
      });
    });
  };

  const insertContentProcessing = () => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO node_content_processing (
          node_id, session_id, message_id, processing_type,
          original_content_length, final_content_length, edit_ratio,
          edit_count, edit_duration, user_satisfaction_score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      let completed = 0;
      contentProcessingData.forEach((data, index) => {
        stmt.run([
          data.node_id, data.session_id, data.message_id, data.processing_type,
          data.original_content_length, data.final_content_length, data.edit_ratio,
          data.edit_count, data.edit_duration, data.user_satisfaction_score
        ], (err) => {
          if (err) {
            console.error(`插入内容处理统计失败 (${index + 1}):`, err);
            reject(err);
          } else {
            completed++;
            console.log(`✅ 插入内容处理统计 (${index + 1}/${contentProcessingData.length})`);
            if (completed === contentProcessingData.length) {
              stmt.finalize();
              resolve();
            }
          }
        });
      });
    });
  };

  // 按顺序执行插入操作
  insertNodeUsage()
    .then(() => insertFeedback())
    .then(() => insertSessionStats())
    .then(() => insertContentProcessing())
    .then(() => {
      console.log('🎉 所有测试数据插入完成！');
      console.log('📊 数据统计:');
      console.log(`  - 节点使用数据: ${nodeUsageData.length} 条`);
      console.log(`  - 反馈数据: ${feedbackData.length} 条`);
      console.log(`  - 会话统计: ${sessionData.length} 条`);
      console.log(`  - 内容处理统计: ${contentProcessingData.length} 条`);
      console.log('');
      console.log('🔗 现在可以访问统计页面查看数据:');
      console.log('  http://localhost:3000/workflow-stats');
      console.log('  http://localhost:3000/enhanced-workflow-stats');
    })
    .catch((error) => {
      console.error('❌ 插入测试数据失败:', error);
    })
    .finally(() => {
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
        } else {
          console.log('✅ 数据库连接已关闭');
        }
      });
    });
}

// 执行插入操作
insertTestData();
