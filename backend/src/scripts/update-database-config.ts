import fs from 'fs';
import path from 'path';

/**
 * 更新数据库配置脚本
 * 将应用配置指向统一的数据库
 */
class DatabaseConfigUpdater {
  
  /**
   * 更新数据库配置
   */
  async updateConfig(): Promise<void> {
    try {
      console.log('🔧 更新数据库配置...');
      
      // 1. 更新环境变量配置
      await this.updateEnvironmentConfig();
      
      // 2. 更新数据库连接配置
      await this.updateDatabaseConnectionConfig();
      
      // 3. 创建数据库备份
      await this.createDatabaseBackup();
      
      console.log('✅ 数据库配置更新完成！');
      
    } catch (error) {
      console.error('❌ 数据库配置更新失败:', error);
      throw error;
    }
  }

  /**
   * 更新环境变量配置
   */
  private async updateEnvironmentConfig(): Promise<void> {
    console.log('📝 更新环境变量配置...');
    
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    // 读取现有环境变量
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新数据库配置
    const updatedEnvContent = this.updateEnvContent(envContent);
    
    // 写入更新后的环境变量
    fs.writeFileSync(envPath, updatedEnvContent);
    
    // 更新 .env.example
    fs.writeFileSync(envExamplePath, updatedEnvContent);
    
    console.log('✅ 环境变量配置更新完成');
  }

  /**
   * 更新环境变量内容
   */
  private updateEnvContent(content: string): string {
    const lines = content.split('\n');
    const updatedLines: string[] = [];
    
    // 需要更新的配置项
    const configUpdates = {
      'DB_TYPE': 'sqlite',
      'SQLITE_DB_PATH': './data/unified.db',
      'PG_HOST': 'localhost',
      'PG_PORT': '5432',
      'PG_USER': 'postgres',
      'PG_PASSWORD': '',
      'PG_DATABASE': 'todify2_unified'
    };
    
    const existingKeys = new Set<string>();
    
    // 处理现有行
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key] = trimmedLine.split('=');
        if (key && configUpdates.hasOwnProperty(key)) {
          updatedLines.push(`${key}=${configUpdates[key as keyof typeof configUpdates]}`);
          existingKeys.add(key);
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    // 添加缺失的配置项
    for (const [key, value] of Object.entries(configUpdates)) {
      if (!existingKeys.has(key)) {
        updatedLines.push(`${key}=${value}`);
      }
    }
    
    // 添加注释说明
    const headerComment = [
      '# Todify2 数据库配置',
      '# 统一数据库配置 - 合并了聊天和业务数据',
      '# 创建时间: ' + new Date().toISOString(),
      ''
    ];
    
    return headerComment.join('\n') + updatedLines.join('\n');
  }

  /**
   * 更新数据库连接配置
   */
  private async updateDatabaseConnectionConfig(): Promise<void> {
    console.log('🔌 更新数据库连接配置...');
    
    const configPath = path.join(__dirname, '../config/database.ts');
    
    if (!fs.existsSync(configPath)) {
      console.warn('⚠️ 数据库配置文件不存在，跳过更新');
      return;
    }
    
    // 读取现有配置
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // 更新默认数据库路径
    configContent = configContent.replace(
      /path: process\.env\.SQLITE_DB_PATH \|\| '\.\/data\/todify2\.db'/g,
      "path: process.env.SQLITE_DB_PATH || './data/unified.db'"
    );
    
    // 添加统一数据库的注释
    const headerComment = `/**
 * 统一数据库配置
 * 合并了聊天对话和业务数据的数据库连接管理
 * 更新时间: ${new Date().toISOString()}
 */

`;
    
    configContent = headerComment + configContent;
    
    // 写入更新后的配置
    fs.writeFileSync(configPath, configContent);
    
    console.log('✅ 数据库连接配置更新完成');
  }

  /**
   * 创建数据库备份
   */
  private async createDatabaseBackup(): Promise<void> {
    console.log('💾 创建数据库备份...');
    
    const dataDir = path.join(process.cwd(), 'data');
    const backupDir = path.join(dataDir, 'backup');
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 备份现有数据库文件
    const databasesToBackup = [
      { source: 'database.db', name: 'chat_database' },
      { source: 'todify2.db', name: 'business_database' },
      { source: 'database.sqlite', name: 'legacy_database' }
    ];
    
    for (const db of databasesToBackup) {
      const sourcePath = path.join(dataDir, db.source);
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, `${db.name}_${timestamp}.db`);
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 备份 ${db.source} -> ${path.basename(backupPath)}`);
      }
    }
    
    console.log('✅ 数据库备份完成');
  }

  /**
   * 生成迁移报告
   */
  generateMigrationReport(): void {
    console.log('📊 生成迁移报告...');
    
    const report = {
      migrationDate: new Date().toISOString(),
      changes: [
        '统一数据库结构 - 合并聊天和业务数据表',
        '优化索引策略 - 添加复合索引提升查询性能',
        '完善外键约束 - 确保数据完整性',
        '标准化命名规范 - 统一表名和字段名',
        '添加数据验证 - 增强数据质量检查'
      ],
      performanceImprovements: [
        '复合索引优化 - 提升多条件查询性能',
        '查询缓存策略 - 减少重复查询开销',
        '数据分区准备 - 为大数据量做准备',
        '连接池优化 - 提升数据库连接效率'
      ],
      nextSteps: [
        '运行数据迁移脚本',
        '验证数据完整性',
        '更新应用配置',
        '性能测试和调优'
      ]
    };
    
    const reportPath = path.join(process.cwd(), 'data', 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 迁移报告已生成: ${reportPath}`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const updater = new DatabaseConfigUpdater();
  
  updater.updateConfig()
    .then(() => {
      updater.generateMigrationReport();
      console.log('🎉 数据库配置更新成功完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库配置更新失败:', error);
      process.exit(1);
    });
}

export { DatabaseConfigUpdater };
