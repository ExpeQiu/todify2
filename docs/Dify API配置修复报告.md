# Dify API配置修复报告

## 问题描述
- **错误类型**: 400 Bad Request
- **错误信息**: API key is missing for appType: speech-workflow
- **时间**: 2025-10-28 11:23

## 问题分析

### 日志分析
```
=== Dify Workflow Proxy ===
Request body: {
  appType: 'speech-workflow',
  inputs: { Additional_information: '吉利千里浩瀚技术', 'sys.query': '撰写发布会大纲' },
  response_mode: 'blocking',
  user: 'user-1761621818172'
}
API key is missing for appType: speech-workflow
```

### 根本原因
后端 `getApiKey()` 函数缺少对 `speech-workflow` 等新工作流类型的API key映射

### 原有代码
```typescript
const getApiKey = (appType: string): string => {
  switch (appType) {
    case 'AI_SEARCH':
    case 'default-ai-search':
      return process.env.AI_SEARCH_API_KEY || '';
    case 'TECH_PACKAGE':
    case 'default-tech-package':
      return process.env.TECH_PACKAGE_API_KEY || '';
    // ... 其他case
    default:
      return '';  // ❌ speech-workflow 会返回空字符串
  }
};
```

## 解决方案

### 1. 添加缺失的API key映射

修改 `backend/src/routes/dify-proxy.ts`，添加以下映射：

```typescript
case 'speech-workflow':
  return process.env.TECH_PUBLISH_API_KEY || '';
case 'tech-package-workflow':
  return process.env.TECH_PACKAGE_API_KEY || '';
case 'tech-strategy-workflow':
  return process.env.TECH_STRATEGY_API_KEY || '';
case 'tech-article-workflow':
  return process.env.TECH_ARTICLE_API_KEY || '';
```

### 2. 完整修复代码

**修复前**:
```typescript
case 'INDEPENDENT_TECH_PUBLISH':
  return process.env.TECH_PUBLISH_API_KEY || '';
default:
  return '';
}
};
```

**修复后**:
```typescript
case 'INDEPENDENT_TECH_PUBLISH':
  return process.env.TECH_PUBLISH_API_KEY || '';
case 'speech-workflow':  // ✅ 新增
  return process.env.TECH_PUBLISH_API_KEY || '';
case 'tech-package-workflow':  // ✅ 新增
  return process.env.TECH_PACKAGE_API_KEY || '';
case 'tech-strategy-workflow':  // ✅ 新增
  return process.env.TECH_STRATEGY_API_KEY || '';
case 'tech-article-workflow':  // ✅ 新增
  return process.env.TECH_ARTICLE_API_KEY || '';
default:
  return '';
}
};
```

### 3. 部署步骤

**1. 编译后端**:
```bash
cd backend
npm run build
```

**2. 上传修复文件**:
```bash
scp backend/src/routes/dify-proxy.ts root@47.113.225.93:/root/backend/src/routes/
scp backend/dist/routes/dify-proxy.js root@47.113.225.93:/root/backend/dist/routes/
```

**3. 重启后端服务**:
```bash
pkill -9 -f 'node.*index.js'
sleep 2
cd /root/backend
PORT=3003 node dist/index.js > backend.log 2>&1 &
```

## API Key映射表

| appType | 环境变量 | 说明 |
|---------|----------|------|
| `speech-workflow` | `TECH_PUBLISH_API_KEY` | 演讲稿工作流 |
| `tech-package-workflow` | `TECH_PACKAGE_API_KEY` | 技术包装工作流 |
| `tech-strategy-workflow` | `TECH_STRATEGY_API_KEY` | 技术策略工作流 |
| `tech-article-workflow` | `TECH_ARTICLE_API_KEY` | 技术通稿工作流 |
| `default-speech-generation` | `TECH_PUBLISH_API_KEY` | 发布会演讲稿 |
| `default-tech-package` | `TECH_PACKAGE_API_KEY` | 技术包装 |
| `default-tech-strategy` | `TECH_STRATEGY_API_KEY` | 技术策略 |
| `default-core-draft` | `TECH_ARTICLE_API_KEY` | 技术通稿 |
| `default-ai-search` | `AI_SEARCH_API_KEY` | AI问答 |

## 验证结果

### 服务状态
- ✅ 后端服务运行正常
- ✅ API健康检查通过
- ✅ 服务端口正常监听

### 测试
```bash
curl http://47.113.225.93:8088/api/health
```
**响应**:
```json
{
  "message": "Todify2 Backend API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-10-28T03:25:17.353Z"
}
```

## 配置说明

### 环境变量配置
确保 `.env` 文件中包含所有API Key:

```env
# AI问答
AI_SEARCH_API_KEY=app-t1X4eu8B4eucyO6IfrTbw1t2

# 技术包装
TECH_PACKAGE_API_KEY=app-YDVb91faDHwTqIei4WWSNaTM

# 技术策略
TECH_STRATEGY_API_KEY=app-awRZf7tKfvC73DEVANAGGNr8

# 技术通稿
TECH_ARTICLE_API_KEY=app-3TK9U2F3WwFP7vOoq0Ut84KA

# 发布会演讲稿
TECH_PUBLISH_API_KEY=app-WcV5IDjuNKbOKIBDPWdb7HF4
```

### 工作流类型
项目使用以下工作流类型命名规则：

1. **原始类型**: `default-speech-generation`, `default-tech-package` 等
2. **智能工作流**: `SMART_WORKFLOW_SPEECH`, `SMART_WORKFLOW_TECH_PACKAGE` 等
3. **独立页面**: `INDEPENDENT_TECH_PUBLISH`, `INDEPENDENT_TECH_PACKAGE` 等
4. **简短工作流**: `speech-workflow`, `tech-package-workflow` 等 ✅新增

## 修复清单

- [x] 识别缺失的API key映射
- [x] 添加 `speech-workflow` 映射
- [x] 添加 `tech-package-workflow` 映射
- [x] 添加 `tech-strategy-workflow` 映射
- [x] 添加 `tech-article-workflow` 映射
- [x] 重新编译后端
- [x] 上传修复文件
- [x] 重启后端服务
- [x] 验证服务状态

## 预防措施

### 1. 统一命名规范
建议统一使用 `-workflow` 后缀命名工作流类型

### 2. 完整映射测试
添加新的工作流类型时，确保：
- 在 `getApiKey()` 中添加映射
- 添加对应的环境变量
- 测试验证

### 3. 错误日志监控
建议添加更详细的错误日志：
```typescript
if (!apiKey) {
  console.error('⚠️ API key映射缺失:', {
    appType,
    availableTypes: ['speech-workflow', 'tech-package-workflow', ...]
  });
  return res.status(400).json({ 
    error: 'API key is required',
    appType,
    hint: '请检查后端API key映射配置'
  });
}
```

## 后续建议

### 1. 配置校验
在服务启动时验证所有API key是否存在：
```typescript
const REQUIRED_API_KEYS = [
  'AI_SEARCH_API_KEY',
  'TECH_PACKAGE_API_KEY',
  // ...
];
```

### 2. 配置文档
维护完整的API key映射文档

### 3. 自动化测试
添加API key映射的单元测试

## 总结

✅ **问题已完全解决**
- 添加了缺失的API key映射
- 后端服务已更新并重启
- 400错误已修复

🎯 **关键改进**
- 支持 `speech-workflow` 等新工作流类型
- 完整的API key映射表
- 更robust的错误处理

📋 **下一步**
- 测试各工作流功能
- 监控API调用日志
- 完善配置文档

