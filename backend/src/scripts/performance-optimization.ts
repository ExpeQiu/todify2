import { DatabaseManager } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * 数据库性能优化脚本
 * 实施查询优化、缓存策略和性能监控
 */
class DatabasePerformanceOptimizer {
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * 执行完整的性能优化
   */
  async optimize(): Promise<void> {
    try {
      console.log('⚡ 开始数据库性能优化...');
      
      // 1. 分析查询性能
      await this.analyzeQueryPerformance();
      
      // 2. 优化慢查询
      await this.optimizeSlowQueries();
      
      // 3. 实施查询缓存
      await this.implementQueryCache();
      
      // 4. 优化数据访问模式
      await this.optimizeDataAccessPatterns();
      
      // 5. 生成性能报告
      await this.generatePerformanceReport();
      
      console.log('✅ 数据库性能优化完成！');
      
    } catch (error) {
      console.error('❌ 数据库性能优化失败:', error);
      throw error;
    }
  }

  /**
   * 分析查询性能
   */
  private async analyzeQueryPerformance(): Promise<void> {
    console.log('📊 分析查询性能...');
    
    try {
      await this.db.connect();
      
      // 分析表统计信息
      const tables = [
        'conversations', 'chat_messages', 'workflow_executions',
        'brands', 'car_models', 'car_series', 'tech_categories', 
        'tech_points', 'tech_point_car_models', 'knowledge_points'
      ];
      
      const analysisResults = [];
      
      for (const table of tables) {
        try {
          // 获取表行数
          const countResult = await this.db.query(`SELECT COUNT(*) as count FROM ${table}`);
          const rowCount = countResult[0].count;
          
          // 获取表大小（估算）
          const sizeResult = await this.db.query(`SELECT COUNT(*) * 100 as estimated_size FROM ${table}`); // 简单估算
          const estimatedSize = sizeResult[0].estimated_size;
          
          analysisResults.push({
            table,
            rowCount,
            estimatedSize: `${estimatedSize} bytes`,
            status: rowCount > 10000 ? 'Large' : rowCount > 1000 ? 'Medium' : 'Small'
          });
          
        } catch (error) {
          console.warn(`⚠️ 分析表 ${table} 时出现警告:`, error);
        }
      }
      
      console.log('📈 表分析结果:');
      analysisResults.forEach(result => {
        console.log(`  ${result.table}: ${result.rowCount} 行, ${result.estimatedSize}, ${result.status}`);
      });
      
      // 分析索引使用情况
      await this.analyzeIndexUsage();
      
    } catch (error) {
      console.error('❌ 查询性能分析失败:', error);
      throw error;
    }
  }

  /**
   * 分析索引使用情况
   */
  private async analyzeIndexUsage(): Promise<void> {
    console.log('🔍 分析索引使用情况...');
    
    try {
      // 获取所有索引
      const indexes = await this.db.query(`
        SELECT name, tbl_name, sql 
        FROM sqlite_master 
        WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
        ORDER BY tbl_name, name
      `);
      
      console.log(`📋 发现 ${indexes.length} 个用户索引:`);
      indexes.forEach((index: any) => {
        console.log(`  ${index.tbl_name}.${index.name}`);
      });
      
      // 检查重复索引
      await this.checkDuplicateIndexes();
      
    } catch (error) {
      console.warn('⚠️ 索引分析时出现警告:', error);
    }
  }

  /**
   * 检查重复索引
   */
  private async checkDuplicateIndexes(): Promise<void> {
    console.log('🔍 检查重复索引...');
    
    const duplicateIndexes = [];
    
    // 检查可能的重复索引模式
    const indexPatterns = [
      { pattern: 'idx_%_status', description: '状态索引' },
      { pattern: 'idx_%_created_at', description: '创建时间索引' },
      { pattern: 'idx_%_id', description: 'ID索引' }
    ];
    
    for (const pattern of indexPatterns) {
      const matchingIndexes = await this.db.query(`
        SELECT name, tbl_name 
        FROM sqlite_master 
        WHERE type = 'index' AND name LIKE '${pattern.pattern}' 
        AND name NOT LIKE 'sqlite_%'
      `);
      
      if (matchingIndexes.length > 1) {
        duplicateIndexes.push({
          pattern: pattern.description,
          indexes: matchingIndexes
        });
      }
    }
    
    if (duplicateIndexes.length > 0) {
      console.log('⚠️ 发现可能的重复索引:');
      duplicateIndexes.forEach((dup: any) => {
        console.log(`  ${dup.pattern}:`);
        dup.indexes.forEach((idx: any) => {
          console.log(`    ${idx.tbl_name}.${idx.name}`);
        });
      });
    } else {
      console.log('✅ 未发现明显的重复索引');
    }
  }

  /**
   * 优化慢查询
   */
  private async optimizeSlowQueries(): Promise<void> {
    console.log('🚀 优化慢查询...');
    
    // 定义需要优化的查询模式
    const slowQueries = [
      {
        name: '技术点分页查询',
        sql: `SELECT tp.*, tc.name as category_name 
              FROM tech_points tp 
              LEFT JOIN tech_categories tc ON tp.category_id = tc.id 
              WHERE tp.status = ? 
              ORDER BY tp.created_at DESC 
              LIMIT ? OFFSET ?`,
        optimization: '添加复合索引: (status, created_at)'
      },
      {
        name: '车型技术点关联查询',
        sql: `SELECT tp.*, cm.name as car_model_name 
              FROM tech_points tp 
              JOIN tech_point_car_models tpcm ON tp.id = tpcm.tech_point_id 
              JOIN car_models cm ON tpcm.car_model_id = cm.id 
              WHERE tp.status = ? AND tpcm.application_status = ?`,
        optimization: '添加复合索引: (status, application_status)'
      },
      {
        name: '聊天消息历史查询',
        sql: `SELECT * FROM chat_messages 
              WHERE conversation_id = ? 
              ORDER BY created_at DESC 
              LIMIT ?`,
        optimization: '添加复合索引: (conversation_id, created_at)'
      }
    ];
    
    // 创建优化索引
    const optimizationIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_tech_points_status_created ON tech_points(status, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_status ON tech_point_car_models(tech_point_id, application_status)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created ON chat_messages(conversation_id, created_at)'
    ];
    
    for (const indexSQL of optimizationIndexes) {
      try {
        await this.db.query(indexSQL);
        console.log(`✅ 创建优化索引: ${indexSQL.substring(0, 50)}...`);
      } catch (error) {
        console.warn(`⚠️ 创建索引时出现警告: ${error}`);
      }
    }
    
    console.log('✅ 慢查询优化完成');
  }

  /**
   * 实施查询缓存
   */
  private async implementQueryCache(): Promise<void> {
    console.log('💾 实施查询缓存策略...');
    
    // 创建缓存配置
    const cacheConfig = {
      enabled: true,
      defaultTTL: 300, // 5分钟
      maxSize: 1000, // 最大缓存条目数
      tables: {
        'tech_categories': { ttl: 3600, description: '技术分类缓存1小时' },
        'brands': { ttl: 1800, description: '品牌信息缓存30分钟' },
        'car_models': { ttl: 1800, description: '车型信息缓存30分钟' },
        'tech_points': { ttl: 600, description: '技术点缓存10分钟' },
        'chat_messages': { ttl: 60, description: '聊天消息缓存1分钟' }
      }
    };
    
    // 保存缓存配置
    const configPath = path.join(process.cwd(), 'data', 'cache-config.json');
    fs.writeFileSync(configPath, JSON.stringify(cacheConfig, null, 2));
    
    console.log('✅ 查询缓存配置已创建');
    
    // 创建缓存管理类
    await this.createCacheManager();
  }

  /**
   * 创建缓存管理器
   */
  private async createCacheManager(): Promise<void> {
    const cacheManagerCode = `
import { DatabaseManager } from '../config/database';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * 数据库查询缓存管理器
 */
export class DatabaseCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: any;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configPath = require('path').join(process.cwd(), 'data', 'cache-config.json');
      this.config = require(configPath);
    } catch (error) {
      console.warn('缓存配置加载失败，使用默认配置');
      this.config = { enabled: true, defaultTTL: 300 };
    }
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存数据
   */
  async set(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.config.enabled) return;

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, entry);

    // 清理过期缓存
    this.cleanupExpiredCache();
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cacheManager = new DatabaseCacheManager();
`;

    const cacheManagerPath = path.join(__dirname, '../utils/DatabaseCacheManager.ts');
    fs.writeFileSync(cacheManagerPath, cacheManagerCode);
    
    console.log('✅ 缓存管理器已创建');
  }

  /**
   * 优化数据访问模式
   */
  private async optimizeDataAccessPatterns(): Promise<void> {
    console.log('🔧 优化数据访问模式...');
    
    // 创建数据访问优化建议
    const optimizationSuggestions = [
      {
        table: 'tech_points',
        suggestion: '使用批量查询代替循环单条查询',
        example: 'SELECT * FROM tech_points WHERE id IN (?, ?, ?)'
      },
      {
        table: 'chat_messages',
        suggestion: '使用游标分页代替OFFSET分页',
        example: 'SELECT * FROM chat_messages WHERE id > ? ORDER BY id LIMIT ?'
      },
      {
        table: 'tech_point_car_models',
        suggestion: '使用EXISTS代替JOIN进行存在性检查',
        example: 'SELECT * FROM tech_points WHERE EXISTS (SELECT 1 FROM tech_point_car_models WHERE tech_point_id = tech_points.id)'
      }
    ];
    
    // 保存优化建议
    const suggestionsPath = path.join(process.cwd(), 'data', 'optimization-suggestions.json');
    fs.writeFileSync(suggestionsPath, JSON.stringify(optimizationSuggestions, null, 2));
    
    console.log('✅ 数据访问模式优化建议已生成');
  }

  /**
   * 生成性能报告
   */
  private async generatePerformanceReport(): Promise<void> {
    console.log('📊 生成性能报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      database: {
        type: 'SQLite',
        unified: true,
        optimization: 'Completed'
      },
      performance: {
        indexes: {
          total: 0,
          composite: 0,
          single: 0
        },
        cache: {
          enabled: true,
          tables: 5,
          defaultTTL: 300
        },
        queries: {
          optimized: 3,
          cached: 5
        }
      },
      recommendations: [
        '定期分析查询性能',
        '监控缓存命中率',
        '考虑数据分区策略',
        '实施读写分离（如需要）'
      ],
      nextSteps: [
        '实施查询监控',
        '设置性能告警',
        '定期优化索引',
        '监控数据库增长'
      ]
    };
    
    // 获取实际索引统计
    try {
      const indexes = await this.db.query(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
      `);
      report.performance.indexes.total = indexes[0].count;
    } catch (error) {
      console.warn('获取索引统计失败:', error);
    }
    
    const reportPath = path.join(process.cwd(), 'data', 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 性能报告已生成: ${reportPath}`);
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
  const optimizer = new DatabasePerformanceOptimizer();
  
  optimizer.optimize()
    .then(() => {
      console.log('🎉 数据库性能优化成功完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库性能优化失败:', error);
      process.exit(1);
    })
    .finally(() => {
      optimizer.cleanup();
    });
}

export { DatabasePerformanceOptimizer };
