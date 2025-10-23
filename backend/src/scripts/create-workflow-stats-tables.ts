import { DatabaseManager } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * 创建工作流统计数据表
 */
class WorkflowStatsTableCreator {
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * 创建所有统计数据表
   */
  async createTables(): Promise<void> {
    try {
      console.log('🚀 开始创建工作流统计数据表...');
      
      // 读取SQL脚本
      const schemaPath = path.join(__dirname, 'workflow-stats-schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // 分割SQL语句并执行
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`📋 准备执行 ${statements.length} 条SQL语句`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await this.db.query(statement);
            console.log(`✅ 执行语句 ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          } catch (error) {
            console.warn(`⚠️ 执行语句 ${i + 1} 时出现警告:`, error);
          }
        }
      }
      
      console.log('✅ 工作流统计数据表创建完成！');
      
      // 验证表创建
      await this.verifyTables();
      
    } catch (error) {
      console.error('❌ 创建工作流统计数据表失败:', error);
      throw error;
    }
  }

  /**
   * 验证表是否创建成功
   */
  private async verifyTables(): Promise<void> {
    console.log('🔍 验证表创建结果...');
    
    const expectedTables = [
      'workflow_node_usage',
      'ai_qa_feedback',
      'workflow_session_stats',
      'node_content_processing',
      'workflow_stats_summary'
    ];
    
    for (const tableName of expectedTables) {
      try {
        const result = await this.db.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        const rows = Array.isArray(result) ? result : result.rows || [result];
        
        if (rows.length > 0) {
          console.log(`✅ 表 ${tableName} 创建成功`);
        } else {
          console.warn(`⚠️ 表 ${tableName} 未找到`);
        }
      } catch (error) {
        console.error(`❌ 验证表 ${tableName} 时出错:`, error);
      }
    }
    
    // 检查索引创建情况
    const indexCount = await this.db.query(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`);
    const count = Array.isArray(indexCount) ? indexCount[0].count : indexCount.count;
    console.log(`📊 创建了 ${count} 个索引`);
  }

  /**
   * 插入示例数据
   */
  async insertSampleData(): Promise<void> {
    console.log('📝 插入示例数据...');
    
    try {
      // 插入示例工作流节点使用数据
      const sampleNodeUsage = [
        {
          node_id: 'ai_qa',
          node_name: 'AI问答',
          node_type: 'ai_qa',
          session_id: 'sample_session_001',
          user_id: 'sample_user_001',
          usage_count: 5,
          avg_response_time: 3.2,
          success_count: 5,
          total_characters: 750,
          avg_characters: 150,
          content_quality_score: 4.2,
          likes_count: 3,
          adoptions_count: 4,
          is_workflow_mode: true
        },
        {
          node_id: 'tech_package',
          node_name: '技术包装',
          node_type: 'tech_package',
          session_id: 'sample_session_001',
          user_id: 'sample_user_001',
          usage_count: 3,
          avg_response_time: 2.8,
          success_count: 3,
          total_characters: 2400,
          avg_characters: 800,
          content_quality_score: 4.0,
          likes_count: 2,
          adoptions_count: 3,
          is_workflow_mode: true
        },
        {
          node_id: 'promotion_strategy',
          node_name: '推广策略',
          node_type: 'promotion_strategy',
          session_id: 'sample_session_001',
          user_id: 'sample_user_001',
          usage_count: 2,
          avg_response_time: 28.5,
          success_count: 2,
          total_characters: 2400,
          avg_characters: 1200,
          content_quality_score: 3.8,
          likes_count: 1,
          edits_count: 1,
          is_workflow_mode: true
        }
      ];

      for (const data of sampleNodeUsage) {
        await this.db.query(`
          INSERT OR REPLACE INTO workflow_node_usage (
            node_id, node_name, node_type, session_id, user_id,
            usage_count, avg_response_time, success_count, total_characters,
            avg_characters, content_quality_score, likes_count, adoptions_count,
            edits_count, is_workflow_mode, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          data.node_id, data.node_name, data.node_type, data.session_id, data.user_id,
          data.usage_count, data.avg_response_time, data.success_count, data.total_characters,
          data.avg_characters, data.content_quality_score, data.likes_count, data.adoptions_count,
          data.edits_count, data.is_workflow_mode
        ]);
      }

      // 插入示例AI问答评价数据
      const sampleFeedback = [
        {
          message_id: 'sample_msg_001',
          node_id: 'ai_qa',
          session_id: 'sample_session_001',
          user_id: 'sample_user_001',
          feedback_type: 'like',
          feedback_value: 5,
          response_time: 3.2,
          content_length: 150
        },
        {
          message_id: 'sample_msg_002',
          node_id: 'tech_package',
          session_id: 'sample_session_001',
          user_id: 'sample_user_001',
          feedback_type: 'adopt',
          feedback_value: 4,
          response_time: 2.8,
          content_length: 800
        },
        {
          message_id: 'sample_msg_003',
          node_id: 'promotion_strategy',
          session_id: 'sample_session_001',
          user_id: 'sample_user_001',
          feedback_type: 'edit',
          feedback_value: 3,
          response_time: 28.5,
          content_length: 1200
        }
      ];

      for (const data of sampleFeedback) {
        await this.db.query(`
          INSERT OR REPLACE INTO ai_qa_feedback (
            message_id, node_id, session_id, user_id, feedback_type,
            feedback_value, response_time, content_length, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          data.message_id, data.node_id, data.session_id, data.user_id,
          data.feedback_type, data.feedback_value, data.response_time, data.content_length
        ]);
      }

      // 插入示例工作流会话统计数据
      const sampleSessionStats = {
        session_id: 'sample_session_001',
        user_id: 'sample_user_001',
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
      };

      await this.db.query(`
        INSERT OR REPLACE INTO workflow_session_stats (
          session_id, user_id, session_duration, total_nodes_visited,
          completed_nodes, skipped_nodes, node_visit_sequence,
          node_completion_status, exit_node_id, exit_reason, exit_time,
          workflow_path, path_efficiency_score, overall_satisfaction_score,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        sampleSessionStats.session_id, sampleSessionStats.user_id, sampleSessionStats.session_duration,
        sampleSessionStats.total_nodes_visited, sampleSessionStats.completed_nodes, sampleSessionStats.skipped_nodes,
        sampleSessionStats.node_visit_sequence, sampleSessionStats.node_completion_status,
        sampleSessionStats.exit_node_id, sampleSessionStats.exit_reason, sampleSessionStats.exit_time,
        sampleSessionStats.workflow_path, sampleSessionStats.path_efficiency_score,
        sampleSessionStats.overall_satisfaction_score
      ]);

      // 插入示例节点内容处理数据
      const sampleContentProcessing = [
        {
          node_id: 'ai_qa',
          session_id: 'sample_session_001',
          message_id: 'sample_msg_001',
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
          session_id: 'sample_session_001',
          message_id: 'sample_msg_002',
          processing_type: 'direct_adopt',
          original_content_length: 800,
          final_content_length: 800,
          edit_ratio: 0,
          edit_count: 0,
          edit_duration: 0,
          user_satisfaction_score: 4.0
        },
        {
          node_id: 'promotion_strategy',
          session_id: 'sample_session_001',
          message_id: 'sample_msg_003',
          processing_type: 'edit_adopt',
          original_content_length: 1200,
          final_content_length: 1350,
          edit_ratio: 0.125,
          edit_count: 2,
          edit_duration: 300,
          user_satisfaction_score: 3.0
        }
      ];

      for (const data of sampleContentProcessing) {
        await this.db.query(`
          INSERT OR REPLACE INTO node_content_processing (
            node_id, session_id, message_id, processing_type,
            original_content_length, final_content_length, edit_ratio,
            edit_count, edit_duration, user_satisfaction_score,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          data.node_id, data.session_id, data.message_id, data.processing_type,
          data.original_content_length, data.final_content_length, data.edit_ratio,
          data.edit_count, data.edit_duration, data.user_satisfaction_score
        ]);
      }

      console.log('✅ 示例数据插入完成');
      
    } catch (error) {
      console.error('❌ 插入示例数据失败:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      await this.db.close();
    } catch (error) {
      console.error('清理资源时出错:', error);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const creator = new WorkflowStatsTableCreator();
  
  creator.createTables()
    .then(() => {
      console.log('🎉 工作流统计数据表创建成功！');
      return creator.insertSampleData();
    })
    .then(() => {
      console.log('🎉 示例数据插入成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 创建工作流统计数据表失败:', error);
      process.exit(1);
    })
    .finally(() => {
      creator.cleanup();
    });
}

export { WorkflowStatsTableCreator };
