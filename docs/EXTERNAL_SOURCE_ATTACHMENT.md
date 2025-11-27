# 外部来源文本内容作为附加信息传递给 Dify

## 功能说明

当在 SourceSidebar 中勾选外部来源（文本类型）时，文本内容会**仅在第一次对话时**作为附加信息合并到查询中，传递给 Dify API。后续对话中不会再次带入附加信息。

## 实现原理

### 1. 前端处理

- **AddTextModal**: 用户通过"粘贴已复制的文字"添加文本来源时，`description` 字段会包含完整的文本内容
- **DialogueContent**: 发送消息时，会将 `sources` 数组传递到后端

### 2. 后端处理

**位置**: `backend/src/modules/ai-search/application/useCases/SendMessage.usecase.ts`

**buildConversationData 方法**:

1. **判断是否是第一次对话**:
   ```typescript
   const isFirstMessage = !params.conversation || 
                         !params.conversation.messages || 
                         params.conversation.messages.length === 0;
   ```

2. **仅在第一次对话时提取外部来源文本**:
   ```typescript
   if (isFirstMessage) {
     const externalTextSources = effectiveSources.filter((s: any) => 
       s.type === 'external' && s.description && s.description.trim()
     );
     // ... 构建附加信息
   }
   ```

2. **构建附加信息**:
   ```typescript
   if (externalTextSources.length > 0) {
     const textContents: string[] = [];
     externalTextSources.forEach((source: any) => {
       if (source.description && source.description.trim()) {
         const title = source.title || '附加信息';
         textContents.push(`【${title}】\n${source.description.trim()}`);
       }
     });
     
     additionalContext = '\n\n=== 附加信息 ===\n' + textContents.join('\n\n---\n\n');
   }
   ```

3. **合并到查询**:
   ```typescript
   let finalQuery = params.content;
   if (additionalContext) {
     finalQuery = params.content + additionalContext;
   }
   ```

### 3. 数据流

```
用户勾选外部来源（文本类型）
    ↓
DialogueContent 发送消息（包含 sources）
    ↓
SendMessageUseCase.buildConversationData
    ├─ 提取外部来源的 description（文本内容）
    ├─ 构建附加信息字符串
    └─ 合并到 query 中
    ↓
工作流输入（query 包含附加信息）
    ↓
Dify API（query 包含附加信息）
    ↓
AI 处理（能够看到附加信息）
```

## 使用示例

### 用户操作

1. 在 SourceSidebar 中点击"添加信息"
2. 选择"粘贴已复制的文字"
3. 粘贴文本："千里浩瀚智能安全辅助驾驶系统 2025年3月3日，吉利正式发布了千里浩瀚智能安全辅助驾驶系统..."
4. 点击"插入"
5. 勾选该外部来源
6. 发送消息："请分析这个信息"

### 实际发送的 query

```
请分析这个信息

=== 附加信息 ===
【千里浩瀚智能安全辅助驾驶系统 2025年3月3日，吉利正式发布了千里浩瀚智能安全辅助驾驶系统...】
千里浩瀚智能安全辅助驾驶系统 2025年3月3日，吉利正式发布了千里浩瀚智能安全辅助驾驶系统（简称...
```

## 日志记录

### 提取日志

**第一次对话时的日志标识**: `提取外部来源文本内容作为附加信息（仅第一次对话）`

**日志内容**:
```json
{
  "isFirstMessage": true,
  "sourcesCount": 1,
  "totalTextLength": 500,
  "sources": [
    {
      "id": "text_xxx",
      "title": "千里浩瀚智能安全辅助驾驶系统...",
      "descriptionLength": 500
    }
  ]
}
```

**后续对话时的日志标识**: `检测到外部来源文本，但非第一次对话，跳过附加信息`

**日志内容**:
```json
{
  "isFirstMessage": false,
  "messageCount": 2,
  "sourcesCount": 1
}
```

### 合并日志

**日志标识**: `合并附加信息到查询内容`

**日志内容**:
```json
{
  "originalLength": 10,
  "additionalLength": 500,
  "finalLength": 510
}
```

## 验证方法

1. **查看后端日志**: 查找 `提取外部来源文本内容作为附加信息` 和 `合并附加信息到查询内容` 日志
2. **检查 query 内容**: 确认 query 中包含 `=== 附加信息 ===` 标记和完整的文本内容
3. **验证 AI 回复**: AI 应该能够引用附加信息中的内容

## 注意事项

1. **仅第一次对话**: 附加信息只在第一次对话时添加，后续对话中不会再次带入，避免重复信息影响对话质量
2. **文本长度**: 附加信息会合并到 query 中，如果文本过长可能会超过 Dify API 的 query 长度限制
3. **多个外部来源**: 如果有多个文本类型的外部来源，会全部合并，每个来源使用 `【标题】` 和分隔符 `---` 分隔
4. **文件来源 vs 文本来源**: 
   - **文件来源**（有 URL）: 通过文件上传到 Dify 处理
   - **文本来源**（有 description）: 作为附加信息合并到 query 中（仅第一次对话）

