/**
 * 初始化页面工具配置表和数据
 */
import { DatabaseManager } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const db = new DatabaseManager();

async function initPageToolConfigs() {
  try {
    await db.connect();
    console.log('✅ 数据库连接成功');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'create-page-tool-config-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // 执行SQL语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
          console.log('✅ 执行SQL语句成功');
        } catch (error: any) {
          // 忽略表已存在的错误
          if (error.message && error.message.includes('already exists')) {
            console.log('ℹ️  表已存在，跳过创建');
          } else {
            console.error('❌ 执行SQL语句失败:', error.message);
            console.error('SQL:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    console.log('✅ 页面工具配置表初始化完成');
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initPageToolConfigs()
    .then(() => {
      console.log('✅ 初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化失败:', error);
      process.exit(1);
    });
}

export default initPageToolConfigs;

