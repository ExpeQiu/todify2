# 技术通稿生成工作流配置指南

## 概述

技术通稿生成工作流用于从AI问答、技术包装、技术策略三个页面的内容中提取信息，生成多版本的结构化新闻通稿。

## Dify工作流配置

### 1. 环境变量设置

在 `.env` 文件中添加：

```bash
TECH_ARTICLE_WORKFLOW_ID=your_dify_workflow_id
```

### 2. 工作流输入参数

工作流需要接收以下输入参数：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `source_conversations` | String (JSON) | 是 | 来源对话内容数组（JSON字符串） |
| `source_outputs` | String (JSON) | 是 | 来源输出内容数组（JSON字符串） |
| `grouped_by_page_type` | String (JSON) | 否 | 按页面类型分组的内容（JSON字符串） |
| `article_types` | String (JSON) | 是 | 目标文章类型数组，如 `["media_release", "internal_memo", "social_media"]` |
| `tone` | String | 否 | 语气风格，默认 "专业严谨" |
| `target_audience` | String | 否 | 目标受众，默认 "媒体记者" |

### 3. 输入参数示例

```json
{
  "source_conversations": "[{\"id\":\"...\",\"pageType\":\"ai-qa\",\"title\":\"...\",\"messages\":[...]}]",
  "source_outputs": "[{\"id\":\"...\",\"pageType\":\"tech-package\",\"title\":\"...\",\"content\":{...}}]",
  "grouped_by_page_type": "{\"ai-qa\":{\"conversations\":[...],\"outputs\":[]},\"tech-package\":{...}}",
  "article_types": "[\"media_release\",\"internal_memo\",\"social_media\"]",
  "tone": "专业严谨",
  "target_audience": "媒体记者"
}
```

### 4. 工作流输出Schema

工作流应返回以下格式的输出：

```json
{
  "outputs": {
    "media_release": {
      "title": "文章标题",
      "lead": "导语",
      "body": {
        "techBackground": "技术背景",
        "coreFeatures": "核心功能",
        "techAdvantages": "技术优势",
        "applicationScenarios": "应用场景",
        "marketSignificance": "市场意义"
      },
      "conclusion": "结语"
    },
    "internal_memo": {
      "title": "内部通报标题",
      "body": {
        "techBackground": "技术细节",
        "techAdvantages": "数据支撑",
        "marketSignificance": "竞品对比"
      }
    },
    "social_media": {
      "title": "社交媒体标题",
      "highlights": ["亮点1", "亮点2", "亮点3"],
      "hashtags": ["#标签1", "#标签2"]
    }
  }
}
```

### 5. Prompt建议

在Dify工作流中使用LLM节点时，建议使用以下Prompt结构：

```
你是一位专业的技术通稿撰写专家。根据提供的内容，生成多版本的技术通稿。

## 来源内容
{grouped_by_page_type}

## 生成要求
- 文章类型：{article_types}
- 语气风格：{tone}
- 目标受众：{target_audience}

## 输出格式要求
请严格按照以下JSON格式输出：
{
  "media_release": {
    "title": "...",
    "lead": "...",
    "body": {
      "techBackground": "...",
      "coreFeatures": "...",
      "techAdvantages": "...",
      "applicationScenarios": "...",
      "marketSignificance": "..."
    },
    "conclusion": "..."
  },
  "internal_memo": {
    "title": "...",
    "body": {
      "techBackground": "...",
      "techAdvantages": "...",
      "marketSignificance": "..."
    }
  },
  "social_media": {
    "title": "...",
    "highlights": ["...", "..."],
    "hashtags": ["#...", "#..."]
  }
}
```

## 测试验证

1. 在技术通稿页面选择至少一个对话或输出
2. 选择要生成的文章类型
3. 点击"生成技术通稿"
4. 验证返回的结果是否包含所有请求的版本
5. 检查每个版本的结构是否完整

## 注意事项

- Token消耗：聚合大量内容时token成本较高，建议在Prompt中添加内容摘要步骤
- 输出格式：确保LLM输出严格的JSON格式，必要时使用JSON Schema约束
- 错误处理：工作流应处理内容过长、格式错误等情况

