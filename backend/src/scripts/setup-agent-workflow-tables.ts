import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../config/database';

/**
 * 创建Agent工作流相关数据库表
 */
async function setupAgentWorkflowTables() {
  try {
    console.log('开始创建Agent工作流数据库表...');

    // 连接数据库
    await db.connect();

    // 读取SQL文件
    const sqlPath = join(__dirname, 'create-agent-workflow-tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // 分割SQL语句并执行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.query(statement);
        console.log('✅ SQL语句执行成功');
      } catch (error) {
        // 忽略重复创建的错误
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log('⚠️  表或索引已存在，跳过');
        } else {
          console.error('❌ SQL语句执行失败:', error);
          // 不抛出错误，继续执行其他语句
        }
      }
    }

    console.log('✅ Agent工作流数据库表创建完成');

    // 关闭数据库连接
    await db.close();
  } catch (error) {
    console.error('❌ 创建数据库表失败:', error);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  setupAgentWorkflowTables()
    .then(() => {
      console.log('🎉 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { setupAgentWorkflowTables };

