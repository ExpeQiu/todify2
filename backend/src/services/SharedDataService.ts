/**
 * Shared Schema Data Service
 * 
 * 直接查询 shared schema 中的 tech_points、vehicles、tech_point_vehicles 表
 * 替代原有的 HTTP 调用 tech-hub 方式获取技术点和车型数据
 */

import { db } from '../config/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SharedTechPoint {
  id: number;
  name: string;
  description: string | null;
  tech_principle: string | null;
  tech_boundary: string | null;
  technical_details: Record<string, any> | null;
  metadata: Record<string, any> | null;
  status: string;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface SharedVehicle {
  id: number;
  name: string;
  brand: string;
  type: string | null;
  archived: number;
  created_at: Date | null;
  updated_at: Date | null;
  model_code: string | null;
  series: string | null;
  year: number | null;
  status: string;
  image_url: string | null;
  description: string | null;
  specs: string | null;
  hub_vehicle_id: number | null;
  synced_at: Date | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── SharedDataService ─────────────────────────────────────────────────────────

export class SharedDataService {
  /**
   * 检查是否使用 PostgreSQL
   */
  private checkPostgres(): void {
    if (db.getType() !== 'postgresql') {
      throw new Error('Shared schema 仅支持 PostgreSQL 数据库，当前数据库类型: ' + db.getType());
    }
  }

  /**
   * 设置 search_path 到 shared schema
   */
  private async setSearchPath(): Promise<void> {
    this.checkPostgres();
    await db.query('SET search_path TO shared', []);
  }

  /**
   * 恢复 search_path 到 public
   */
  private async resetSearchPath(): Promise<void> {
    try {
      await db.query('SET search_path TO public', []);
    } catch (e) {
      // ignore
    }
  }

  /**
   * 执行 shared schema 查询（自动设置 search_path）
   */
  private async queryShared<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      await this.setSearchPath();
      return await db.query(sql, params) as T[];
    } finally {
      await this.resetSearchPath();
    }
  }

  // ─── Tech Points ─────────────────────────────────────────────────────────

  /**
   * 获取所有技术点（分页）
   */
  async getTechPoints(options: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedResult<SharedTechPoint>> {
    const {
      page = 1,
      pageSize = 20,
      status,
      keyword,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = options;

    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const countValues: any[] = [];
    const dataValues: any[] = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`status = ?`);
      countValues.push(status);
      dataValues.push(status);
    } else {
      conditions.push(`status != ?`);
      countValues.push('archived');
      dataValues.push('archived');
    }

    if (keyword) {
      conditions.push(`(name ILIKE ? OR description ILIKE ?)`);
      countValues.push(`%${keyword}%`, `%${keyword}%`);
      dataValues.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count query
    const totalResult = await this.queryShared<any[]>(
      `SELECT COUNT(*) as total FROM tech_points ${whereClause}`,
      countValues
    );
    const total = Number(totalResult[0]?.total ?? 0);

    // Data query
    paramIdx = conditions.length + 1;
    const orderDirectionUpper = orderDirection.toUpperCase();
    const dataSql = `
      SELECT * FROM tech_points
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirectionUpper}
      LIMIT ? OFFSET ?
    `;
    dataValues.push(pageSize, offset);

    const data = await this.queryShared<SharedTechPoint[]>(dataSql, dataValues);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 根据ID获取技术点
   */
  async getTechPointById(id: number): Promise<SharedTechPoint | null> {
    const result = await this.queryShared<SharedTechPoint[]>(
      'SELECT * FROM tech_points WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 获取技术点树结构
   */
  async getTechPointTree(): Promise<SharedTechPoint[]> {
    return await this.queryShared<SharedTechPoint[]>(
      `SELECT * FROM tech_points WHERE status = 'active' ORDER BY id ASC`,
      []
    );
  }

  /**
   * 获取技术点关联的车型
   */
  async getTechPointVehicles(techPointId: number): Promise<SharedVehicle[]> {
    return await this.queryShared<SharedVehicle[]>(
      `SELECT v.* FROM vehicles v
       JOIN tech_point_vehicles tpv ON v.id = tpv.vehicle_id
       WHERE tpv.tech_point_id = ? AND v.archived = 0
       ORDER BY v.brand, v.name`,
      [techPointId]
    );
  }

  /**
   * 获取技术点统计
   */
  async getTechPointStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }> {
    const totalResult = await this.queryShared<any[]>(
      'SELECT COUNT(*) as total FROM tech_points',
      []
    );

    const statusResult = await this.queryShared<any[]>(
      'SELECT status, COUNT(*) as count FROM tech_points GROUP BY status',
      []
    );

    const byStatus: Record<string, number> = {};
    for (const row of statusResult) {
      byStatus[row.status] = Number(row.count);
    }

    return {
      total: Number(totalResult[0]?.total ?? 0),
      byStatus
    };
  }

  // ─── Vehicles ─────────────────────────────────────────────────────────────

  /**
   * 获取所有车型（分页）
   */
  async getVehicles(options: {
    page?: number;
    pageSize?: number;
    brand?: string;
    status?: string;
    keyword?: string;
  } = {}): Promise<PaginatedResult<SharedVehicle>> {
    const {
      page = 1,
      pageSize = 20,
      brand,
      status,
      keyword
    } = options;

    const conditions: string[] = ['archived = 0'];
    const countValues: any[] = [];
    const dataValues: any[] = [];
    let paramIdx = 1;

    if (brand) {
      conditions.push(`brand = ?`);
      countValues.push(brand);
      dataValues.push(brand);
    }

    if (status) {
      conditions.push(`status = ?`);
      countValues.push(status);
      dataValues.push(status);
    } else {
      conditions.push(`status != 'deleted'`);
    }

    if (keyword) {
      conditions.push(`(name ILIKE ? OR brand ILIKE ? OR series ILIKE ?)`);
      countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      dataValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const offset = (page - 1) * pageSize;

    const totalResult = await this.queryShared<any[]>(
      `SELECT COUNT(*) as total FROM vehicles ${whereClause}`,
      countValues
    );
    const total = Number(totalResult[0]?.total ?? 0);

    const dataSql = `
      SELECT * FROM vehicles
      ${whereClause}
      ORDER BY brand, name
      LIMIT ? OFFSET ?
    `;
    dataValues.push(pageSize, offset);

    const data = await this.queryShared<SharedVehicle[]>(dataSql, dataValues);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 根据ID获取车型
   */
  async getVehicleById(id: number): Promise<SharedVehicle | null> {
    const result = await this.queryShared<SharedVehicle[]>(
      'SELECT * FROM vehicles WHERE id = ? AND archived = 0',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 根据品牌获取车型
   */
  async getVehiclesByBrand(brand: string): Promise<SharedVehicle[]> {
    return await this.queryShared<SharedVehicle[]>(
      `SELECT * FROM vehicles
       WHERE brand = ? AND archived = 0 AND status != 'deleted'
       ORDER BY name`,
      [brand]
    );
  }

  /**
   * 获取所有品牌列表
   */
  async getBrands(): Promise<string[]> {
    const result = await this.queryShared<any[]>(
      `SELECT DISTINCT brand FROM vehicles
       WHERE archived = 0 AND status != 'deleted'
       ORDER BY brand`,
      []
    );
    return result.map((row) => row.brand);
  }
}

// 导出单例
export const sharedDataService = new SharedDataService();
