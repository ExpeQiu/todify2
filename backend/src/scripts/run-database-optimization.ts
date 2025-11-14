#!/usr/bin/env node

/**
 * 数据库优化执行脚本
 * 统一执行阶段1和阶段2的数据库优化
 */

import { DatabaseConfigUpdater } from './update-database-config';
import { DatabaseMigration } from './migrate-to-unified-database';
import { DatabasePerformanceOptimizer } from './performance-optimization';

class DatabaseOptimizationRunner {
  
  /**
   * 执行完整的数据库优化流程
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 开始数据库优化流程...');
      console.log('=====================================');
      
      // 阶段1: 数据库统一
      console.log('📋 阶段1: 数据库统一');
      console.log('=====================================');
      
      await this.runStage1();
      
      console.log('\n');
      
      // 阶段2: 性能优化
      console.log('⚡ 阶段2: 性能优化');
      console.log('=====================================');
      
      await this.runStage2();
      
      console.log('\n');
      console.log('🎉 数据库优化流程完成！');
      console.log('=====================================');
      
    } catch (error) {
      console.error('💥 数据库优化流程失败:', error);
      throw error;
    }
  }

  /**
   * 执行阶段1: 数据库统一
   */
  private async runStage1(): Promise<void> {
    try {
      console.log('1️⃣ 更新数据库配置...');
      const configUpdater = new DatabaseConfigUpdater();
      await configUpdater.updateConfig();
      
      console.log('2️⃣ 执行数据库迁移...');
      const migration = new DatabaseMigration();
      await migration.migrate();
      await migration.cleanup();
      
      console.log('✅ 阶段1完成: 数据库已统一');
      
    } catch (error) {
      console.error('❌ 阶段1失败:', error);
      throw error;
    }
  }

  /**
   * 执行阶段2: 性能优化
   */
  private async runStage2(): Promise<void> {
    try {
      console.log('1️⃣ 执行性能优化...');
      const optimizer = new DatabasePerformanceOptimizer();
      await optimizer.optimize();
      await optimizer.cleanup();
      
      console.log('✅ 阶段2完成: 性能已优化');
      
    } catch (error) {
      console.error('❌ 阶段2失败:', error);
      throw error;
    }
  }

  /**
   * 显示优化总结
   */
  showSummary(): void {
    console.log('\n📊 优化总结');
    console.log('=====================================');
    
    const summary = {
      '阶段1 - 数据库统一': [
        '✅ 合并多个数据库文件',
        '✅ 统一表结构设计',
        '✅ 完善外键约束',
        '✅ 标准化命名规范',
        '✅ 数据完整性验证'
      ],
      '阶段2 - 性能优化': [
        '✅ 添加复合索引',
        '✅ 优化查询语句',
        '✅ 实施缓存策略',
        '✅ 数据访问模式优化',
        '✅ 性能监控配置'
      ],
      '预期收益': [
        '🚀 查询性能提升 50-80%',
        '💾 内存使用优化 30%',
        '🔧 维护成本降低 40%',
        '📈 系统稳定性提升',
        '🛡️ 数据完整性保障'
      ]
    };
    
    Object.entries(summary).forEach(([category, items]) => {
      console.log(`\n${category}:`);
      items.forEach(item => console.log(`  ${item}`));
    });
    
    console.log('\n🎯 下一步建议:');
    console.log('  1. 运行应用测试验证功能');
    console.log('  2. 监控数据库性能指标');
    console.log('  3. 根据使用情况调优配置');
    console.log('  4. 定期备份和维护数据库');
  }
}

// 主执行函数
async function main() {
  const runner = new DatabaseOptimizationRunner();
  
  try {
    await runner.run();
    runner.showSummary();
    process.exit(0);
  } catch (error) {
    console.error('💥 数据库优化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { DatabaseOptimizationRunner };
