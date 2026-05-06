/**
 * 列表查询转 COUNT：去掉尾部 ORDER BY / LIMIT / OFFSET。
 * PostgreSQL 不允许 COUNT(*) 与 ORDER BY 非聚合列并存；SQLite 较宽松但去掉更一致。
 */
export function toCountSql(listSql: string): string {
  let s = listSql.replace(/SELECT\s+\*/i, 'SELECT COUNT(*) as count');
  s = s.replace(/\s+LIMIT\s+\d+(\s+OFFSET\s+\d+)?\s*$/i, '');
  s = s.replace(/\s+ORDER BY[\s\S]*$/i, '');
  return s.trim();
}
