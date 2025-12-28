import { Project } from '../../types/database';
import { MatchedResources } from './ResourceMatcher';
import { ExtractedRequirement } from './RequirementExtractor';

/**
 * 上下文构建器
 * 将匹配的资源转换为文本上下文
 */
export class ContextBuilder {
  private readonly MAX_CONTEXT_LENGTH = 20000;  // 最大字符数

  /**
   * 构建上下文
   */
  buildContext(
    project: Project,
    matchedResources: MatchedResources,
    requirement: ExtractedRequirement
  ): string {
    let context = '';

    // 1. 项目基本信息
    context += `# 项目信息\n`;
    context += `项目名称：${project.name}\n`;
    context += `项目描述：${project.description || '无'}\n\n`;

    // 2. 任务需求
    context += `# 任务需求\n`;
    context += `任务类型：${requirement.scene === 'tech-package' ? '技术包装' : requirement.scene === 'tech-strategy' ? '技术策略' : '技术通稿'}\n`;
    context += `技术范围：${requirement.techScope.join(', ') || '未指定'}\n`;
    context += `目标受众：${requirement.targetAudience}\n`;
    context += `输出格式：${requirement.outputFormat}\n`;
    if (requirement.keyRequirements.length > 0) {
      context += `关键要求：${requirement.keyRequirements.join(', ')}\n`;
    }
    context += `\n`;

    // 3. 相关技术点
    if (matchedResources.techPoints.length > 0) {
      context += `# 相关技术点\n\n`;
      matchedResources.techPoints.forEach((item, idx) => {
        const tp = item.data;
        context += `## ${idx + 1}. ${tp.name} (匹配度: ${(item.score * 100).toFixed(0)}%)\n`;
        context += `${tp.description || '无描述'}\n\n`;
        
        if (tp.technical_details?.tech_principle) {
          context += `**技术原理**：\n${tp.technical_details.tech_principle}\n\n`;
        }
        if (tp.technical_details?.tech_value) {
          context += `**价值**：\n${tp.technical_details.tech_value}\n\n`;
        }
        if (tp.technical_details?.tech_boundary) {
          context += `**适用边界**：\n${tp.technical_details.tech_boundary}\n\n`;
        }
        if (tp.benefits && Array.isArray(tp.benefits) && tp.benefits.length > 0) {
          context += `**技术优势**：\n${tp.benefits.map(b => `- ${b}`).join('\n')}\n\n`;
        }
        if (tp.applications && Array.isArray(tp.applications) && tp.applications.length > 0) {
          context += `**应用场景**：\n${tp.applications.map(a => `- ${a}`).join('\n')}\n\n`;
        }
        
        context += `---\n\n`;
      });
    }

    // 4. 相关知识点
    if (matchedResources.knowledgePoints.length > 0) {
      context += `# 相关知识点\n\n`;
      matchedResources.knowledgePoints.forEach((item, idx) => {
        const kp = item.data;
        context += `## ${idx + 1}. ${kp.title} (匹配度: ${(item.score * 100).toFixed(0)}%)\n`;
        context += `${kp.content}\n\n`;
        
        if (kp.examples && Array.isArray(kp.examples) && kp.examples.length > 0) {
          context += `**示例**：\n${kp.examples.map(e => `- ${e}`).join('\n')}\n\n`;
        }
        
        context += `---\n\n`;
      });
    }

    // 5. 来源信息
    if (matchedResources.sources.length > 0) {
      context += `# 参考来源\n\n`;
      matchedResources.sources.forEach((item, idx) => {
        const src = item.data;
        context += `## ${idx + 1}. ${src.title} (匹配度: ${(item.score * 100).toFixed(0)}%)\n`;
        if (src.description) {
          context += `${src.description}\n`;
        }
        if (src.url) {
          context += `来源：${src.url}\n`;
        }
        context += `\n`;
      });
    }

    // 截断过长的上下文
    if (context.length > this.MAX_CONTEXT_LENGTH) {
      context = context.substring(0, this.MAX_CONTEXT_LENGTH) + '\n\n[内容过长，已截断...]';
    }

    return context;
  }
}

