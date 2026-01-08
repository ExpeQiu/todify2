/**
 * 节点执行器接口
 * 所有节点类型都需要实现此接口
 */
export interface NodeExecutor {
  /**
   * 执行节点
   * @param node 节点配置
   * @param context 共享上下文
   * @returns 节点执行结果
   */
  execute(node: any, context: Record<string, any>): Promise<any>;
}

