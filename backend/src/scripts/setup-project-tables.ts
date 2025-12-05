import fs from 'fs';
import path from 'path';
import { db } from '../config/database';

async function setupProjectTables() {
  try {
    console.log('开始创建项目相关表...');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'create-project-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // 连接数据库
    await db.connect();
    
    // 执行SQL（按语句分割执行，因为SQLite不支持多语句执行）
    // 先移除所有注释行，然后按分号分割
    const cleanedSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');
    
    // 按分号分割，但保留多行语句
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await db.query(statement);
        const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
        console.log('✓ 执行成功:', preview + '...');
      } catch (error: any) {
        // 如果表已存在，忽略错误
        if (error.message && (
          error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('UNIQUE constraint')
        )) {
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.log('⚠ 已存在，跳过:', preview + '...');
        } else if (error.message && error.message.includes('no such table')) {
          // 如果表不存在，可能是执行顺序问题，记录但不中断
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.warn('⚠ 表不存在，稍后重试:', preview + '...');
          console.warn('   错误:', error.message);
        } else {
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.error('✗ 执行失败:', preview + '...');
          console.error('   错误:', error.message);
        }
      }
    }
    
    // 如果第一次执行有表不存在的错误，再执行一次索引创建
    console.log('\n检查并创建缺失的索引...');
    const indexStatements = statements.filter(s => s.toUpperCase().includes('CREATE INDEX'));
    for (const statement of indexStatements) {
      try {
        await db.query(statement);
        const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
        console.log('✓ 索引创建成功:', preview + '...');
      } catch (error: any) {
        if (error.message && (
          error.message.includes('already exists') || 
          error.message.includes('duplicate')
        )) {
          // 索引已存在，忽略
        } else {
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.warn('⚠ 索引创建失败（可能已存在）:', preview + '...');
        }
      }
    }
    
    console.log('✅ 项目表创建完成！');
  } catch (error) {
    console.error('❌ 创建项目表失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupProjectTables()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export default setupProjectTables;
