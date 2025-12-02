# 文件转Markdown功能设置说明

## 概述

系统已实现文件转Markdown功能，支持将上传的PDF、Word、PPT、TXT、Markdown文件转换为Markdown格式，并将其作为附加信息传递给Agent参与对话。

## 功能特性

1. **支持的文件类型**：
   - PDF (.pdf)
   - PowerPoint (.ppt, .pptx)
   - Word (.doc, .docx)
   - 文本文件 (.txt)
   - Markdown (.md, .markdown)

2. **自动转换**：
   - 文件上传时自动提取文本内容并转换为Markdown格式
   - Markdown内容存储在文件记录的metadata中

3. **智能传递**：
   - 文件的Markdown内容作为附加信息自动传递给Agent
   - 无论是否第一次对话，文件内容都会作为上下文传递

## 安装依赖

为了支持文件转换功能，需要安装以下npm包：

### 必需依赖

```bash
# PDF文件转换
npm install pdf-parse

# Word文件转换
npm install mammoth
```

### 可选依赖（PPT转换）

PPT文件转换功能目前返回占位符文本。如需完整支持，可以安装以下库：

```bash
# PPT转换（可选，需要额外配置）
npm install officegen
# 或
npm install pptx2json
```

## 使用说明

### 前端使用

1. 在"添加来源"弹窗中选择"上传文件"模式
2. 拖放或选择文件（支持PDF、PPT、Word、TXT、Markdown）
3. 文件上传后会自动提取文本内容

### 后端处理

1. 文件上传时，`FileToMarkdownService`会自动识别文件类型
2. 调用相应的转换方法提取文本内容
3. 将Markdown内容存储在文件记录的metadata中
4. 发送消息时，从文件记录中提取Markdown内容
5. 将Markdown内容作为附加信息添加到用户查询中

## 代码结构

### 服务文件

- `backend/src/services/FileToMarkdownService.ts` - 文件转Markdown服务
- `backend/src/modules/ai-search/api/aiSearch.routes.ts` - 文件上传路由（已集成转换功能）
- `backend/src/modules/ai-search/application/useCases/SendMessage.usecase.ts` - 消息发送用例（已集成Markdown内容提取）

### 前端组件

- `frontend/src/components/ai-search/AddTextModal.tsx` - 添加来源弹窗（已更新文件类型限制）

## 注意事项

1. **依赖安装**：确保已安装`pdf-parse`和`mammoth`库，否则文件转换会失败并返回提示信息

2. **文件大小限制**：当前文件大小限制为10MB（可在`aiSearch.routes.ts`中调整）

3. **PPT支持**：PPT文件转换功能需要额外配置，当前版本返回占位符文本

4. **错误处理**：如果文件转换失败，系统会记录警告日志，但不会阻止文件上传

5. **性能考虑**：大文件转换可能需要较长时间，建议异步处理或添加进度提示

## 故障排除

### 问题：PDF文件转换失败

**解决方案**：
```bash
npm install pdf-parse
```

### 问题：Word文件转换失败

**解决方案**：
```bash
npm install mammoth
```

### 问题：文件上传成功但Markdown内容为空

**检查**：
1. 确认文件类型是否支持
2. 查看后端日志，确认转换过程是否有错误
3. 检查文件记录的metadata字段是否包含markdownContent

## 未来改进

1. 支持更多文件格式（Excel、图片OCR等）
2. 添加文件转换进度提示
3. 优化大文件处理性能
4. 完善PPT文件转换支持
5. 添加文件内容预览功能

