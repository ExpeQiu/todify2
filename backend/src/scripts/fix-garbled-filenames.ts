/**
 * 修复数据库中已存在的乱码文件名
 * 运行方式: npx ts-node backend/src/scripts/fix-garbled-filenames.ts
 */

import { DatabaseManager } from '../config/database';
import { logger } from '../shared/lib/logger';

/**
 * 修复文件名编码
 */
function fixFileNameEncoding(originalName: string): string {
  try {
    const hasGarbledChars = /ã|å|ä|è|ç|æ|Ã|â|€|¥/.test(originalName);
    
    if (hasGarbledChars) {
      // 策略1: 尝试将整个字符串按 Latin-1 编码转换为 UTF-8
      try {
        const buffer = Buffer.from(originalName, 'latin1');
        const decoded = buffer.toString('utf8');
        
        const hasChinese = /[\u4e00-\u9fa5]/.test(decoded);
        const originalPrintable = (originalName.match(/[\x20-\x7E\u4e00-\u9fa5]/g) || []).length;
        const decodedPrintable = (decoded.match(/[\x20-\x7E\u4e00-\u9fa5]/g) || []).length;
        const isMoreReadable = decodedPrintable > originalPrintable;
        const originalGarbled = (originalName.match(/ã|å|ä|è|ç|æ|Ã|â|€|¥/g) || []).length;
        const decodedGarbled = (decoded.match(/ã|å|ä|è|ç|æ|Ã|â|€|¥/g) || []).length;
        const hasLessGarbled = decodedGarbled < originalGarbled;
        
        if (hasChinese || (isMoreReadable && hasLessGarbled)) {
          return decoded;
        }
      } catch (e) {
        // 忽略错误
      }
    }
  } catch (e) {
    // 忽略错误
  }
  return originalName;
}

async function fixGarbledFilenames() {
  const db = new DatabaseManager();
  
  try {
    await db.connect();
    logger.info('开始修复乱码文件名...');
    
    // 获取所有文件
    const files = await db.query('SELECT id, name FROM public_knowledge_files');
    
    let fixedCount = 0;
    for (const file of files as any[]) {
      const originalName = file.name;
      const fixedName = fixFileNameEncoding(originalName);
      
      if (fixedName !== originalName) {
        // 更新文件名
        const dbType = db.getType();
        const sql = dbType === 'sqlite'
          ? 'UPDATE public_knowledge_files SET name = ? WHERE id = ?'
          : 'UPDATE public_knowledge_files SET name = $1 WHERE id = $2';
        
        await db.query(sql, [fixedName, file.id]);
        logger.info(`修复文件 ID ${file.id}: "${originalName}" -> "${fixedName}"`);
        fixedCount++;
      }
    }
    
    logger.info(`修复完成，共修复 ${fixedCount} 个文件名`);
  } catch (error) {
    logger.error('修复乱码文件名失败:', error);
    throw error;
  } finally {
    await db.disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  fixGarbledFilenames()
    .then(() => {
      logger.info('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { fixGarbledFilenames };
