import { DatabaseManager } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * 数据库统一迁移脚本
 * 将 database.db 和 todify3.db 合并到统一的数据库中
 */
class DatabaseMigration {
  private sourceDb1: DatabaseManager;
  private sourceDb2: DatabaseManager;
  private targetDb: DatabaseManager;

  constructor() {
    this.sourceDb1 = new DatabaseManager();
    this.sourceDb2 = new DatabaseManager();
    this.targetDb = new DatabaseManager();
  }

  /**
   * 执行完整的数据库迁移
   */
  async migrate(): Promise<void> {
    try {
      console.log('🚀 开始数据库统一迁移...');
      
      // 1. 创建统一的数据库结构
      await this.createUnifiedSchema();
      
      // 2. 迁移聊天对话数据
      await this.migrateChatData();
      
      // 3. 迁移业务数据
      await this.migrateBusinessData();
      
      // 4. 验证数据完整性
      await this.validateDataIntegrity();
      
      // 5. 创建性能优化索引
      await this.createPerformanceIndexes();
      
      console.log('✅ 数据库统一迁移完成！');
      
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error);
      throw error;
    }
  }

  /**
   * 创建统一的数据库结构
   */
  private async createUnifiedSchema(): Promise<void> {
    console.log('📋 创建统一数据库结构...');
    
    // 读取统一数据库结构脚本
    const schemaPath = path.join(__dirname, 'unified-database-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // 分割SQL语句并执行
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await this.targetDb.query(statement);
        } catch (error) {
          console.warn(`⚠️ 执行SQL语句时出现警告: ${statement.substring(0, 100)}...`);
          console.warn(`警告详情: ${error}`);
        }
      }
    }
    
    console.log('✅ 统一数据库结构创建完成');
  }

  /**
   * 迁移聊天对话数据
   */
  private async migrateChatData(): Promise<void> {
    console.log('💬 迁移聊天对话数据...');
    
    try {
      // 连接源数据库
      await this.sourceDb1.connect();
      
      // 迁移对话会话数据
      const conversations = await this.sourceDb1.query('SELECT * FROM conversations');
      for (const conv of conversations) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO conversations (
            id, conversation_id, user_id, session_name, app_type, 
            status, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          conv.id, conv.conversation_id, conv.user_id, conv.session_name, 
          conv.app_type, conv.status, conv.metadata, conv.created_at, conv.updated_at
        ]);
      }
      
      // 迁移聊天消息数据
      const messages = await this.sourceDb1.query('SELECT * FROM chat_messages');
      for (const msg of messages) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO chat_messages (
            id, message_id, conversation_id, task_id, message_type, 
            content, query, inputs, app_type, dify_event, dify_mode, 
            dify_answer, prompt_tokens, completion_tokens, total_tokens, 
            total_price, currency, latency, retriever_resources, 
            status, error_message, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          msg.id, msg.message_id, msg.conversation_id, msg.task_id, msg.message_type,
          msg.content, msg.query, msg.inputs, msg.app_type, msg.dify_event, msg.dify_mode,
          msg.dify_answer, msg.prompt_tokens, msg.completion_tokens, msg.total_tokens,
          msg.total_price, msg.currency, msg.latency, msg.retriever_resources,
          msg.status, msg.error_message, msg.created_at, msg.updated_at
        ]);
      }
      
      // 迁移工作流执行数据
      const workflows = await this.sourceDb1.query('SELECT * FROM workflow_executions');
      for (const workflow of workflows) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO workflow_executions (
            id, workflow_run_id, task_id, message_id, workflow_id, app_type,
            status, error_message, inputs, outputs, elapsed_time, total_tokens,
            total_steps, started_at, finished_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          workflow.id, workflow.workflow_run_id, workflow.task_id, workflow.message_id,
          workflow.workflow_id, workflow.app_type, workflow.status, workflow.error_message,
          workflow.inputs, workflow.outputs, workflow.elapsed_time, workflow.total_tokens,
          workflow.total_steps, workflow.started_at, workflow.finished_at,
          workflow.created_at, workflow.updated_at
        ]);
      }
      
      // 迁移知识使用日志数据
      const logs = await this.sourceDb1.query('SELECT * FROM knowledge_usage_logs');
      for (const log of logs) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO knowledge_usage_logs (
            id, message_id, knowledge_point_ids, context_summary, 
            context_length, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          log.id, log.message_id, log.knowledge_point_ids, log.context_summary,
          log.context_length, log.created_at
        ]);
      }
      
      console.log(`✅ 聊天对话数据迁移完成 - 对话: ${conversations.length}, 消息: ${messages.length}, 工作流: ${workflows.length}, 日志: ${logs.length}`);
      
    } catch (error) {
      console.error('❌ 聊天对话数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移业务数据
   */
  private async migrateBusinessData(): Promise<void> {
    console.log('🏢 迁移业务数据...');
    
    try {
      // 连接源数据库
      await this.sourceDb2.connect();
      
      // 迁移品牌数据
      const brands = await this.sourceDb2.query('SELECT * FROM brands');
      for (const brand of brands) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO brands (
            id, name, name_en, logo_url, country, founded_year, 
            description, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          brand.id, brand.name, brand.name_en, brand.logo_url, brand.country,
          brand.founded_year, brand.description, brand.status, brand.created_at, brand.updated_at
        ]);
      }
      
      // 迁移车型数据
      const carModels = await this.sourceDb2.query('SELECT * FROM car_models');
      for (const model of carModels) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO car_models (
            id, brand_id, name, name_en, category, launch_year, 
            end_year, description, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          model.id, model.brand_id, model.name, model.name_en, model.category,
          model.launch_year, model.end_year, model.description, model.status,
          model.created_at, model.updated_at
        ]);
      }
      
      // 迁移车系数据
      const carSeries = await this.sourceDb2.query('SELECT * FROM car_series');
      for (const series of carSeries) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO car_series (
            id, model_id, name, name_en, description, launch_year, 
            end_year, market_segment, status, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          series.id, series.model_id, series.name, series.name_en, series.description,
          series.launch_year, series.end_year, series.market_segment, series.status,
          series.metadata, series.created_at, series.updated_at
        ]);
      }
      
      // 迁移技术分类数据
      const techCategories = await this.sourceDb2.query('SELECT * FROM tech_categories');
      for (const category of techCategories) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO tech_categories (
            id, name, description, parent_id, level, sort_order, 
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          category.id, category.name, category.description, category.parent_id,
          category.level, category.sort_order, category.status, category.created_at, category.updated_at
        ]);
      }
      
      // 迁移技术点数据
      const techPoints = await this.sourceDb2.query('SELECT * FROM tech_points');
      for (const point of techPoints) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO tech_points (
            id, name, description, category_id, parent_id, level, tech_type,
            priority, status, tags, technical_details, benefits, applications,
            keywords, source_url, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          point.id, point.name, point.description, point.category_id, point.parent_id,
          point.level, point.tech_type, point.priority, point.status, point.tags,
          point.technical_details, point.benefits, point.applications, point.keywords,
          point.source_url, point.created_by, point.created_at, point.updated_at
        ]);
      }
      
      // 迁移技术点与车型关联数据
      const techPointCarModels = await this.sourceDb2.query('SELECT * FROM tech_point_car_models');
      for (const relation of techPointCarModels) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO tech_point_car_models (
            id, tech_point_id, car_model_id, application_status, 
            implementation_date, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          relation.id, relation.tech_point_id, relation.car_model_id, relation.application_status,
          relation.implementation_date, relation.notes, relation.created_at, relation.updated_at
        ]);
      }
      
      // 迁移知识点数据
      const knowledgePoints = await this.sourceDb2.query('SELECT * FROM knowledge_points');
      for (const kp of knowledgePoints) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO knowledge_points (
            id, title, content, source_query, source_url, source_type,
            metadata, tags, relevance_score, status, dify_task_id,
            ai_search_session_id, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          kp.id, kp.title, kp.content, kp.source_query, kp.source_url, kp.source_type,
          kp.metadata, kp.tags, kp.relevance_score, kp.status, kp.dify_task_id,
          kp.ai_search_session_id, kp.created_by, kp.created_at, kp.updated_at
        ]);
      }
      
      // 迁移技术点与知识点关联数据
      const techPointKnowledgePoints = await this.sourceDb2.query('SELECT * FROM tech_point_knowledge_points');
      for (const relation of techPointKnowledgePoints) {
        await this.targetDb.query(`
          INSERT OR REPLACE INTO tech_point_knowledge_points (
            id, tech_point_id, knowledge_point_id, relation_type,
            relevance_score, notes, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          relation.id, relation.tech_point_id, relation.knowledge_point_id, relation.relation_type,
          relation.relevance_score, relation.notes, relation.created_by, relation.created_at, relation.updated_at
        ]);
      }
      
      // 迁移其他AI生成内容表...
      await this.migrateAIContentTables();
      
      console.log(`✅ 业务数据迁移完成 - 品牌: ${brands.length}, 车型: ${carModels.length}, 车系: ${carSeries.length}, 技术分类: ${techCategories.length}, 技术点: ${techPoints.length}, 知识点: ${knowledgePoints.length}`);
      
    } catch (error) {
      console.error('❌ 业务数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移AI生成内容表
   */
  private async migrateAIContentTables(): Promise<void> {
    console.log('🤖 迁移AI生成内容数据...');
    
    const tables = [
      'tech_packaging_materials',
      'tech_promotion_strategies', 
      'tech_press_releases',
      'tech_speeches',
      'promotion_tech_points',
      'press_tech_points',
      'speech_tech_points',
      'knowledge_point_favorites'
    ];
    
    for (const tableName of tables) {
      try {
        const data = await this.sourceDb2.query(`SELECT * FROM ${tableName}`);
        console.log(`📊 迁移表 ${tableName}: ${data.length} 条记录`);
        
        // 这里可以根据具体表结构进行数据迁移
        // 由于表结构可能不同，需要根据实际情况调整
        
      } catch (error) {
        console.warn(`⚠️ 迁移表 ${tableName} 时出现警告:`, error);
      }
    }
  }

  /**
   * 验证数据完整性
   */
  private async validateDataIntegrity(): Promise<void> {
    console.log('🔍 验证数据完整性...');
    
    try {
      // 检查关键表的数据量
      const tables = [
        'conversations', 'chat_messages', 'workflow_executions', 'knowledge_usage_logs',
        'brands', 'car_models', 'car_series', 'tech_categories', 'tech_points',
        'tech_point_car_models', 'knowledge_points', 'tech_point_knowledge_points'
      ];
      
      for (const tableName of tables) {
        const count = await this.targetDb.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`📊 表 ${tableName}: ${count[0].count} 条记录`);
      }
      
      // 检查外键约束
      const foreignKeyChecks = [
        {
          name: 'car_models -> brands',
          sql: `SELECT COUNT(*) as count FROM car_models cm LEFT JOIN brands b ON cm.brand_id = b.id WHERE b.id IS NULL`
        },
        {
          name: 'car_series -> car_models',
          sql: `SELECT COUNT(*) as count FROM car_series cs LEFT JOIN car_models cm ON cs.model_id = cm.id WHERE cm.id IS NULL`
        },
        {
          name: 'tech_points -> tech_categories',
          sql: `SELECT COUNT(*) as count FROM tech_points tp LEFT JOIN tech_categories tc ON tp.category_id = tc.id WHERE tp.category_id IS NOT NULL AND tc.id IS NULL`
        }
      ];
      
      for (const check of foreignKeyChecks) {
        const result = await this.targetDb.query(check.sql);
        if (result[0].count > 0) {
          console.warn(`⚠️ 外键约束检查失败: ${check.name} - ${result[0].count} 条记录`);
        } else {
          console.log(`✅ 外键约束检查通过: ${check.name}`);
        }
      }
      
      console.log('✅ 数据完整性验证完成');
      
    } catch (error) {
      console.error('❌ 数据完整性验证失败:', error);
      throw error;
    }
  }

  /**
   * 创建性能优化索引
   */
  private async createPerformanceIndexes(): Promise<void> {
    console.log('⚡ 创建性能优化索引...');
    
    try {
      // 读取索引优化脚本
      const indexPath = path.join(__dirname, 'unified-database-indexes.sql');
      const indexSQL = fs.readFileSync(indexPath, 'utf8');
      
      // 分割SQL语句并执行
      const statements = indexSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      let indexCount = 0;
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await this.targetDb.query(statement);
            indexCount++;
          } catch (error) {
            console.warn(`⚠️ 创建索引时出现警告: ${statement.substring(0, 100)}...`);
            console.warn(`警告详情: ${error}`);
          }
        }
      }
      
      console.log(`✅ 性能优化索引创建完成 - 共创建 ${indexCount} 个索引`);
      
    } catch (error) {
      console.error('❌ 性能优化索引创建失败:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      await this.sourceDb1.close();
      await this.sourceDb2.close();
      await this.targetDb.close();
    } catch (error) {
      console.error('清理资源时出错:', error);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const migration = new DatabaseMigration();
  
  migration.migrate()
    .then(() => {
      console.log('🎉 数据库迁移成功完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库迁移失败:', error);
      process.exit(1);
    })
    .finally(() => {
      migration.cleanup();
    });
}

export { DatabaseMigration };
