const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 读取SQL文件
const sqlPath = path.join(__dirname, 'create-agent-workflow-tables.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// 数据库路径
const dbPath = path.join(__dirname, '../../data/todify2.db');

console.log('开始创建Agent工作流数据库表...');
console.log('数据库路径:', dbPath);

// 打开数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('打开数据库失败:', err);
    process.exit(1);
  }
  
  console.log('✅ 数据库连接成功');
  
  // 分割SQL语句并执行
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let executedCount = 0;
  let errorCount = 0;

  statements.forEach((statement, index) => {
    db.run(statement, (err) => {
      if (err) {
        // 忽略重复创建的错误
        if (err.message.includes('already exists')) {
          console.log(`⚠️  语句 ${index + 1}/${statements.length}: 已存在，跳过`);
        } else {
          console.error(`❌ 语句 ${index + 1}/${statements.length} 执行失败:`, err.message);
          errorCount++;
        }
      } else {
        console.log(`✅ 语句 ${index + 1}/${statements.length}: 执行成功`);
        executedCount++;
      }

      // 检查是否所有语句都执行完毕
      if (executedCount + errorCount === statements.length) {
        console.log('\n=== 执行总结 ===');
        console.log(`总计: ${statements.length} 条语句`);
        console.log(`成功: ${executedCount}`);
        console.log(`失败: ${errorCount}`);
        console.log('✅ 数据库表创建完成\n');
        
        db.close((err) => {
          if (err) {
            console.error('关闭数据库失败:', err);
          } else {
            console.log('✅ 数据库连接已关闭');
          }
          process.exit(errorCount > 0 ? 1 : 0);
        });
      }
    });
  });
});

