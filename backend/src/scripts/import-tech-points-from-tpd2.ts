import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { DatabaseManager, getDatabaseConfig } from '../config/database';
import { logger } from '../shared/lib/logger';

/**
 * 从 TPD2 数据库直接导入技术点数据到当前项目
 * 
 * 使用方法：
 * 1. 确保 TPD2 数据库文件路径正确（默认：/Volumes/Lexar/git/03T/TPD2/backend/data/todify2.db）
 * 2. 运行: npx ts-node backend/src/scripts/import-tech-points-from-tpd2.ts
 */

interface TechCategoryRow {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TechPointRow {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  parent_id?: number;
  level: number;
  tech_type: string;
  priority: string;
  status: string;
  tags?: string;
  technical_details?: string;
  benefits?: string;
  applications?: string;
  keywords?: string;
  source_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

class TPD2DataImporter {
  private tpd2DbPath: string;
  private tpd2Db: sqlite3.Database | null = null;
  private targetDb: DatabaseManager;

  constructor(tpd2DbPath: string) {
    this.tpd2DbPath = tpd2DbPath;
    this.targetDb = new DatabaseManager();
  }

  /**
   * 连接到 TPD2 数据库
   */
  async connectTPD2(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.tpd2DbPath)) {
        reject(new Error(`TPD2 数据库文件不存在: ${this.tpd2DbPath}`));
        return;
      }

      this.tpd2Db = new sqlite3.Database(this.tpd2DbPath, (err) => {
        if (err) {
          logger.error('连接 TPD2 数据库失败:', err);
          reject(err);
        } else {
          logger.info(`✅ 成功连接到 TPD2 数据库: ${this.tpd2DbPath}`);
          resolve();
        }
      });
    });
  }

  /**
   * 查询 TPD2 数据库
   */
  private async queryTPD2(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.tpd2Db) {
      throw new Error('TPD2 数据库未连接');
    }

    return new Promise((resolve, reject) => {
      this.tpd2Db!.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('TPD2 数据库查询失败:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 关闭 TPD2 数据库连接
   */
  async closeTPD2(): Promise<void> {
    if (this.tpd2Db) {
      return new Promise((resolve) => {
        this.tpd2Db!.close(() => {
          logger.info('TPD2 数据库连接已关闭');
          resolve();
        });
      });
    }
  }

  /**
   * 检查表是否存在
   */
  private async tableExistsTPD2(tableName: string): Promise<boolean> {
    try {
      const result = await this.queryTPD2(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result.length > 0;
    } catch (error) {
      logger.error(`检查表 ${tableName} 是否存在时出错:`, error);
      return false;
    }
  }

  /**
   * 导入技术分类
   */
  async importTechCategories(): Promise<{
    imported: number;
    skipped: number;
    errors: number;
  }> {
    const stats = {
      imported: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // 检查表是否存在
      const categoriesTableExists = await this.tableExistsTPD2('tech_categories');
      if (!categoriesTableExists) {
        logger.warn('TPD2 数据库中不存在 tech_categories 表，跳过分类导入');
        return stats;
      }

      logger.info('开始导入技术分类...');
      const categories = await this.queryTPD2('SELECT * FROM tech_categories ORDER BY id');

      if (categories.length === 0) {
        logger.info('TPD2 数据库中没有技术分类数据');
        return stats;
      }

      logger.info(`找到 ${categories.length} 个技术分类`);

      for (const category of categories) {
        try {
          // 检查目标数据库中是否已存在
          const existing = await this.targetDb.query(
            'SELECT id FROM tech_categories WHERE id = ?',
            [category.id]
          );

          if (existing && existing.length > 0) {
            // 更新现有分类
            await this.targetDb.query(
              `UPDATE tech_categories SET
                name = ?,
                description = ?,
                parent_id = ?,
                level = ?,
                sort_order = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
              [
                category.name,
                category.description || null,
                category.parent_id || null,
                category.level || 1,
                category.sort_order || 0,
                category.status || 'active',
                category.id,
              ]
            );
            stats.skipped++;
            logger.debug(`更新分类: ${category.name} (ID: ${category.id})`);
          } else {
            // 插入新分类
            await this.targetDb.query(
              `INSERT INTO tech_categories (
                id, name, description, parent_id, level, sort_order, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                category.id,
                category.name,
                category.description || null,
                category.parent_id || null,
                category.level || 1,
                category.sort_order || 0,
                category.status || 'active',
                category.created_at || new Date().toISOString(),
                category.updated_at || new Date().toISOString(),
              ]
            );
            stats.imported++;
            logger.debug(`导入分类: ${category.name} (ID: ${category.id})`);
          }
        } catch (error) {
          logger.error(`导入分类失败 (ID: ${category.id}, Name: ${category.name}):`, error);
          stats.errors++;
        }
      }

      logger.info(`技术分类导入完成: 新增 ${stats.imported} 个, 更新 ${stats.skipped} 个, 错误 ${stats.errors} 个`);
      return stats;
    } catch (error) {
      logger.error('导入技术分类失败:', error);
      throw error;
    }
  }

  /**
   * 导入技术点
   */
  async importTechPoints(): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // 检查表是否存在
      const techPointsTableExists = await this.tableExistsTPD2('tech_points');
      if (!techPointsTableExists) {
        logger.warn('TPD2 数据库中不存在 tech_points 表，跳过技术点导入');
        return stats;
      }

      logger.info('开始导入技术点...');
      const techPoints = await this.queryTPD2('SELECT * FROM tech_points ORDER BY id');

      if (techPoints.length === 0) {
        logger.info('TPD2 数据库中没有技术点数据');
        return stats;
      }

      logger.info(`找到 ${techPoints.length} 个技术点`);

      for (const techPoint of techPoints) {
        try {
          // 检查目标数据库中是否已存在（先通过 ID，再通过名称）
          let existing = await this.targetDb.query(
            'SELECT id, name FROM tech_points WHERE id = ?',
            [techPoint.id]
          );

          if (!existing || existing.length === 0) {
            // 尝试通过名称查找
            existing = await this.targetDb.query(
              'SELECT id, name FROM tech_points WHERE name = ?',
              [techPoint.name]
            );
          }

          // 解析 JSON 字段
          let tags = null;
          let technical_details = null;
          let benefits = null;
          let applications = null;
          let keywords = null;

          try {
            if (techPoint.tags) {
              tags = typeof techPoint.tags === 'string' ? techPoint.tags : JSON.stringify(techPoint.tags);
            }
            if (techPoint.technical_details) {
              technical_details = typeof techPoint.technical_details === 'string'
                ? techPoint.technical_details
                : JSON.stringify(techPoint.technical_details);
            }
            if (techPoint.benefits) {
              benefits = typeof techPoint.benefits === 'string'
                ? techPoint.benefits
                : JSON.stringify(techPoint.benefits);
            }
            if (techPoint.applications) {
              applications = typeof techPoint.applications === 'string'
                ? techPoint.applications
                : JSON.stringify(techPoint.applications);
            }
            if (techPoint.keywords) {
              keywords = typeof techPoint.keywords === 'string'
                ? techPoint.keywords
                : JSON.stringify(techPoint.keywords);
            }
          } catch (parseError) {
            logger.warn(`解析技术点 ${techPoint.id} 的 JSON 字段失败:`, parseError);
          }

          if (existing && existing.length > 0) {
            // 更新现有技术点
            const existingId = existing[0].id;
            await this.targetDb.query(
              `UPDATE tech_points SET
                name = ?,
                description = ?,
                category_id = ?,
                parent_id = ?,
                level = ?,
                tech_type = ?,
                priority = ?,
                status = ?,
                tags = ?,
                technical_details = ?,
                benefits = ?,
                applications = ?,
                keywords = ?,
                source_url = ?,
                created_by = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
              [
                techPoint.name,
                techPoint.description || null,
                techPoint.category_id || null,
                techPoint.parent_id || null,
                techPoint.level || 1,
                techPoint.tech_type || 'feature',
                techPoint.priority || 'medium',
                techPoint.status || 'active',
                tags,
                technical_details,
                benefits,
                applications,
                keywords,
                techPoint.source_url || null,
                techPoint.created_by || null,
                existingId,
              ]
            );
            stats.updated++;
            logger.debug(`更新技术点: ${techPoint.name} (ID: ${existingId})`);
          } else {
            // 插入新技术点
            await this.targetDb.query(
              `INSERT INTO tech_points (
                id, name, description, category_id, parent_id, level, tech_type,
                priority, status, tags, technical_details, benefits, applications,
                keywords, source_url, created_by, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                techPoint.id,
                techPoint.name,
                techPoint.description || null,
                techPoint.category_id || null,
                techPoint.parent_id || null,
                techPoint.level || 1,
                techPoint.tech_type || 'feature',
                techPoint.priority || 'medium',
                techPoint.status || 'active',
                tags,
                technical_details,
                benefits,
                applications,
                keywords,
                techPoint.source_url || null,
                techPoint.created_by || null,
                techPoint.created_at || new Date().toISOString(),
                techPoint.updated_at || new Date().toISOString(),
              ]
            );
            stats.imported++;
            logger.debug(`导入技术点: ${techPoint.name} (ID: ${techPoint.id})`);
          }
        } catch (error) {
          logger.error(`导入技术点失败 (ID: ${techPoint.id}, Name: ${techPoint.name}):`, error);
          stats.errors++;
        }
      }

      logger.info(
        `技术点导入完成: 新增 ${stats.imported} 个, 更新 ${stats.updated} 个, 错误 ${stats.errors} 个`
      );
      return stats;
    } catch (error) {
      logger.error('导入技术点失败:', error);
      throw error;
    }
  }

  /**
   * 执行完整导入流程
   */
  async import(): Promise<void> {
    try {
      // 连接数据库
      await this.connectTPD2();
      await this.targetDb.connect();

      logger.info('========================================');
      logger.info('开始从 TPD2 导入技术点数据');
      logger.info('========================================');

      // 导入技术分类
      const categoryStats = await this.importTechCategories();

      // 导入技术点
      const techPointStats = await this.importTechPoints();

      // 输出汇总
      logger.info('========================================');
      logger.info('数据导入完成');
      logger.info('========================================');
      logger.info('技术分类:');
      logger.info(`  新增: ${categoryStats.imported}`);
      logger.info(`  更新: ${categoryStats.skipped}`);
      logger.info(`  错误: ${categoryStats.errors}`);
      logger.info('技术点:');
      logger.info(`  新增: ${techPointStats.imported}`);
      logger.info(`  更新: ${techPointStats.updated}`);
      logger.info(`  错误: ${techPointStats.errors}`);
      logger.info('========================================');
    } catch (error) {
      logger.error('导入过程发生错误:', error);
      throw error;
    } finally {
      // 关闭数据库连接
      await this.closeTPD2();
      await this.targetDb.close();
    }
  }
}

// 主函数
async function main() {
  // TPD2 数据库路径（可根据实际情况修改）
  const tpd2DbPath = process.env.TPD2_DB_PATH || '/Volumes/Lexar/git/03T/TPD2/backend/data/todify2.db';

  // 检查文件是否存在
  if (!fs.existsSync(tpd2DbPath)) {
    logger.error(`❌ TPD2 数据库文件不存在: ${tpd2DbPath}`);
    logger.info('请设置环境变量 TPD2_DB_PATH 指定正确的数据库路径');
    process.exit(1);
  }

  logger.info(`TPD2 数据库路径: ${tpd2DbPath}`);

  // 获取当前项目数据库配置
  const config = getDatabaseConfig();
  if (config.type === 'sqlite' && config.sqlite) {
    logger.info(`目标数据库路径: ${config.sqlite.path}`);
  }

  try {
    const importer = new TPD2DataImporter(tpd2DbPath);
    await importer.import();
    logger.info('✅ 数据导入成功完成');
    process.exit(0);
  } catch (error) {
    logger.error('❌ 数据导入失败:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch((error) => {
    logger.error('未处理的错误:', error);
    process.exit(1);
  });
}

export { TPD2DataImporter };
