# Dify工作流字段对接文档

## 📋 概述

本文档基于 `robot1-技术包装.yml` 工作流配置，详细说明了Todify系统与Dify工作流的字段对接要求。

## 🔍 工作流结构分析

### 工作流节点流程
```
开始 → 上游信息解读(LLM) → 信息整合输出(LLM) → 结束
```

### 技术配置
- **模型**: GPT-4
- **温度**: 0.7
- **模式**: 聊天模式
- **文件上传**: 支持但当前未启用

## 📥 输入字段映射

### 字段映射表

| Dify字段 | 系统字段 | 类型 | 必填 | 限制 | 说明 |
|---------|---------|------|------|------|------|
| `input1` | `upstream_info` | paragraph | ✅ 是 | 5000字符 | 上游信息 |
| `input2` | `files` | file-list | ❌ 否 | 5个文件 | 附件上传 |
| `input3` | `optimization_suggestions` | paragraph | ❌ 否 | 1000字符 | 优化建议 |

### 详细字段说明

#### 1. input1 - 上游信息
```yaml
# Dify配置
- default: ''
  hint: ''
  label: 上游信息
  max_length: 5000
  options: []
  placeholder: ''
  required: true
  type: paragraph
  variable: input1
```

**系统实现要求:**
- **字段名**: `input1` 或 `upstream_info`
- **类型**: 字符串 (paragraph)
- **必填**: 是
- **最大长度**: 5000字符
- **UI组件**: 多行文本输入框
- **验证规则**: 非空 + 长度限制

#### 2. input2 - 附件上传
```yaml
# Dify配置
- allowed_file_extensions: []
  allowed_file_types:
  - image
  - document
  allowed_file_upload_methods:
  - local_file
  - remote_url
  default: ''
  hint: ''
  label: 附件上传
  max_length: 5
  options: []
  placeholder: ''
  required: false
  type: file-list
  variable: input2
```

**系统实现要求:**
- **字段名**: `input2` 或 `files`
- **类型**: 文件数组 (file-list)
- **必填**: 否
- **最大文件数**: 5个
- **支持类型**: 图片、文档
- **支持扩展名**: .JPG, .JPEG, .PNG, .GIF, .WEBP, .SVG
- **上传方式**: 本地文件、远程URL
- **UI组件**: 文件上传组件

#### 3. input3 - 优化建议
```yaml
# Dify配置
- default: ''
  hint: ''
  label: 优化建议
  max_length: 1000
  options: []
  placeholder: ''
  required: false
  type: paragraph
  variable: input3
```

**系统实现要求:**
- **字段名**: `input3` 或 `optimization_suggestions`
- **类型**: 字符串 (paragraph)
- **必填**: 否
- **最大长度**: 1000字符
- **UI组件**: 多行文本输入框
- **验证规则**: 长度限制

## 📤 输出字段映射

### 输出字段说明

#### text - 处理结果
```yaml
# Dify配置
outputs:
- value_selector:
  - '1760575033371'  # 最后一个LLM节点ID
  - text
  value_type: string
  variable: text
```

**系统实现要求:**
- **字段名**: `text`
- **类型**: 字符串
- **来源**: 最后一个LLM节点的text输出
- **说明**: LLM处理后的最终文本结果

## 🔧 API接口规范

### 请求格式
```typescript
interface TechAppRequest {
  inputs: {
    input1?: string;        // 上游信息 (必填)
    input2?: File[];        // 附件上传 (可选)
    input3?: string;        // 优化建议 (可选)
    query?: string;         // 兼容旧版本
    [key: string]: any;     // 其他字段
  };
}
```

### 响应格式
```typescript
interface TechAppResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      text?: string;        // 处理结果文本
      [key: string]: any;   // 其他输出
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}
```

## 🎨 前端实现规范

### 表单字段配置
```typescript
interface DifyWorkflowFields {
  inputs: {
    input1: {
      value: string;
      label: '上游信息';
      placeholder: '请输入需要处理的上游信息内容';
      required: true;
      maxLength: 5000;
      type: 'textarea';
    };
    input2: {
      value: File[];
      label: '附件上传';
      placeholder: '支持上传图片和文档文件';
      required: false;
      maxFiles: 5;
      allowedTypes: string[];
      type: 'file-upload';
    };
    input3: {
      value: string;
      label: '优化建议';
      placeholder: '提供优化建议或特殊要求';
      required: false;
      maxLength: 1000;
      type: 'textarea';
    };
  };
  outputs: {
    text: {
      value: string;
      label: '处理结果';
      type: 'text';
    };
  };
}
```

### 验证规则
```typescript
interface FieldValidationRule {
  required?: boolean;
  maxLength?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}
```

## 🚀 实现检查清单

### 后端实现
- [x] 更新API类型定义 (`backend/src/types/api.ts`)
- [x] 添加Dify字段映射接口
- [x] 更新请求/响应格式
- [ ] 更新验证逻辑
- [ ] 测试API接口

### 前端实现
- [x] 更新工作流类型定义 (`frontend/src/types/workflow.ts`)
- [x] 添加Dify字段配置
- [ ] 更新表单组件
- [ ] 实现文件上传功能
- [ ] 添加字段验证
- [ ] 测试表单功能

### 文档和测试
- [x] 创建字段对接文档
- [ ] 编写API测试用例
- [ ] 编写前端组件测试
- [ ] 更新开发指南

## 🔍 注意事项

1. **字段兼容性**: 保持与旧版本字段的兼容性
2. **文件上传**: 需要实现文件上传和存储功能
3. **验证规则**: 严格按照Dify配置实现验证
4. **错误处理**: 完善的错误处理和用户提示
5. **性能优化**: 大文件上传的性能考虑

## 📞 技术支持

如有问题，请参考：
- Dify工作流配置: `guide/workflow/robot1-技术包装.yml`
- API文档: `guide/API_DOCUMENTATION.md`
- 技术文档: `guide/technical-document.md`
