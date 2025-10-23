#!/usr/bin/env node

/**
 * 初始化工作流统计数据表脚本
 * 用于创建和初始化工作流统计相关的数据库表
 */

import { WorkflowStatsTableCreator } from './create-workflow-stats-tables';
import { DatabaseManager } from '../config/database';

class WorkflowStatsInitializer {
  private db: DatabaseManager;
  private tableCreator: WorkflowStatsTableCreator;

  constructor() {
    this.db = new DatabaseManager();
    this.tableCreator = new WorkflowStatsTableCreator();
  }

  /**
   * 初始化工作流统计系统
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 开始初始化工作流统计系统...');
      console.log('=====================================');
      
      // 1. 创建数据库表
      console.log('📋 步骤1: 创建数据库表');
      await this.tableCreator.createTables();
      
      // 2. 插入示例数据
      console.log('\n📝 步骤2: 插入示例数据');
      await this.tableCreator.insertSampleData();
      
      // 3. 验证系统状态
      console.log('\n🔍 步骤3: 验证系统状态');
      await this.verifySystemStatus();
      
      console.log('\n🎉 工作流统计系统初始化完成！');
      console.log('=====================================');
      
      // 显示访问信息
      this.showAccessInfo();
      
    } catch (error) {
      console.error('❌ 初始化工作流统计系统失败:', error);
      throw error;
    }
  }

  /**
   * 验证系统状态
   */
  private async verifySystemStatus(): Promise<void> {
    try {
      // 检查表是否存在
      const tables = [
        'workflow_node_usage',
        'ai_qa_feedback', 
        'workflow_session_stats',
        'node_content_processing',
        'workflow_stats_summary'
      ];
      
      console.log('📊 验证数据库表状态:');
      for (const tableName of tables) {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = Array.isArray(result) ? result[0].count : result.count;
        console.log(`  ✅ ${tableName}: ${count} 条记录`);
      }
      
      // 检查索引
      const indexResult = await this.db.query(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`);
      const indexCount = Array.isArray(indexResult) ? indexResult[0].count : indexResult.count;
      console.log(`  📈 索引数量: ${indexCount} 个`);
      
      // 检查触发器
      const triggerResult = await this.db.query(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='trigger'`);
      const triggerCount = Array.isArray(triggerResult) ? triggerResult[0].count : triggerResult.count;
      console.log(`  ⚡ 触发器数量: ${triggerCount} 个`);
      
    } catch (error) {
      console.error('验证系统状态失败:', error);
      throw error;
    }
  }

  /**
   * 显示访问信息
   */
  private showAccessInfo(): void {
    console.log('\n📋 系统访问信息:');
    console.log('=====================================');
    console.log('🔗 前端统计页面: http://localhost:3000/workflow-stats');
    console.log('🔗 增强统计页面: http://localhost:3000/enhanced-workflow-stats');
    console.log('🔗 API接口文档: http://localhost:3001/api/workflow-stats');
    console.log('');
    console.log('📊 主要API端点:');
    console.log('  GET  /api/workflow-stats/overview - 获取综合统计概览');
    console.log('  GET  /api/workflow-stats/node-usage/overview - 获取节点使用统计');
    console.log('  GET  /api/workflow-stats/session/completion - 获取工作流完成率统计');
    console.log('  GET  /api/workflow-stats/content-processing/adoption - 获取内容采纳率统计');
    console.log('  POST /api/workflow-stats/node-usage - 记录节点使用统计');
    console.log('  POST /api/workflow-stats/feedback - 记录用户反馈');
    console.log('  POST /api/workflow-stats/session - 记录会话统计');
    console.log('  POST /api/workflow-stats/content-processing - 记录内容处理统计');
    console.log('');
    console.log('📈 统计功能特性:');
    console.log('  ✅ 各功能使用数据统计');
    console.log('  ✅ AI问答的评价指标（点赞、采纳、重新生成、点踩）');
    console.log('  ✅ 平均响应时间和字数统计');
    console.log('  ✅ 完整工作流使用率及跳出节点分析');
    console.log('  ✅ 节点内容的直接采纳和编辑占比');
    console.log('  ✅ 实时数据统计和监控');
    console.log('  ✅ 数据可视化图表');
    console.log('  ✅ 数据导出功能');
    console.log('');
    console.log('🎯 下一步操作:');
    console.log('  1. 启动前端应用: npm run dev');
    console.log('  2. 启动后端服务: npm run dev');
    console.log('  3. 访问统计页面查看数据');
    console.log('  4. 在节点组件中集成统计收集功能');
    console.log('');
    console.log('💡 集成提示:');
    console.log('  使用 statsCollector 工具类在现有节点组件中收集统计数据');
    console.log('  使用 withStatsTracking 等装饰器快速集成统计功能');
    console.log('  参考 useWorkflowStats 钩子进行数据收集和上报');
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

// 主执行函数
async function main() {
  const initializer = new WorkflowStatsInitializer();
  
  try {
    await initializer.initialize();
    process.exit(0);
  } catch (error) {
    console.error('💥 初始化失败:', error);
    process.exit(1);
  } finally {
    await initializer.cleanup();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { WorkflowStatsInitializer };
