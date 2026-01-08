import { NodeExecutor } from './NodeExecutor';

/**
 * 节点注册中心
 * 支持动态注册和管理节点执行器
 */
export class NodeRegistry {
  private static nodes = new Map<string, NodeExecutor>();

  /**
   * 注册节点执行器
   * @param type 节点类型
   * @param executor 节点执行器
   */
  static register(type: string, executor: NodeExecutor): void {
    this.nodes.set(type, executor);
  }

  /**
   * 注销节点执行器
   * @param type 节点类型
   */
  static unregister(type: string): void {
    this.nodes.delete(type);
  }

  /**
   * 执行节点
   * @param node 节点配置
   * @param context 共享上下文
   * @returns 节点执行结果
   */
  static async execute(node: any, context: Record<string, any>): Promise<any> {
    const executor = this.nodes.get(node.type);
    if (!executor) {
      throw new Error(`未知节点类型: ${node.type}`);
    }
    return executor.execute(node, context);
  }

  /**
   * 获取已注册的节点类型列表
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * 检查节点类型是否已注册
   */
  static isRegistered(type: string): boolean {
    return this.nodes.has(type);
  }
}

