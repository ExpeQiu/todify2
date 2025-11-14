# 工作流程测试文档

## 概述

本测试套件用于验证从AI问答到技术发布的完整工作流程，确保每个步骤的数据流转换正确，API接口响应正常。

## 工作流程

```
AI问答 → 技术包装 → 技术策略 → 技术通稿 → 技术发布
```

### 详细流程说明

1. **AI问答** (`/workflow/ai-search`)
   - 输入：用户查询问题
   - 输出：AI生成的回答内容

2. **技术包装** (`/workflow/tech-package`)
   - 输入：AI问答结果 + 附加信息
   - 输出：技术包装后的内容

3. **技术策略** (`/workflow/tech-strategy`)
   - 输入：技术包装结果
   - 输出：技术策略规划

4. **技术通稿** (`/workflow/core-draft`)
   - 输入：技术策略 + 推广策略 + 模板
   - 输出：技术通稿内容

5. **技术发布** (`/workflow/tech-publish`)
   - 输入：技术通稿内容
   - 输出：最终发布内容

## 测试文件结构

```
tests/
├── workflow/
│   ├── complete-workflow-test.js    # 完整工作流程测试
│   ├── individual-step-tests.js     # 独立步骤测试
│   ├── test-runner.js              # 测试运行器
│   └── README.md                   # 本文档
```

## 使用方法

### 前置条件

1. 确保后端服务正在运行 (`npm run dev` 在 backend 目录)
2. 确保前端服务正在运行 (`npm run dev` 在 frontend 目录)
3. 确保 Dify API 配置正确
4. 安装 axios 依赖：`npm install axios`

### 运行测试

#### 1. 运行所有测试（推荐）
```bash
cd tests/workflow
node test-runner.js
```

#### 2. 只运行完整工作流程测试
```bash
node test-runner.js --complete
```

#### 3. 只运行独立步骤测试
```bash
node test-runner.js --individual
```

#### 4. 直接运行特定测试文件
```bash
# 完整工作流程测试
node complete-workflow-test.js

# 独立步骤测试
node individual-step-tests.js
```

### 查看帮助
```bash
node test-runner.js --help
```## 测试结果解读

### 成功标志
- ✅ 表示测试步骤成功
- 📄 显示结果内容预览和长度
- 🎉 表示所有测试通过

### 失败标志
- ❌ 表示测试步骤失败
- ⚠️ 表示部分测试失败

### 常见问题排查

#### 1. 连接失败
```
❌ 测试异常: connect ECONNREFUSED 127.0.0.1:3001
```
**解决方案**: 确保后端服务正在运行

#### 2. API密钥错误
```
❌ 测试失败: 技术发布失败
```
**解决方案**: 检查环境变量中的 Dify API 密钥配置

#### 3. 超时错误
```
❌ 测试异常: timeout of 30000ms exceeded
```
**解决方案**: 
- 检查网络连接
- 增加测试超时时间
- 确认 Dify 服务响应正常

#### 4. 输入格式错误
```
❌ 测试失败: input is required in input form
```
**解决方案**: 检查 API 路由的输入参数格式

## 测试数据

### 默认测试查询
- "什么是人工智能在医疗领域的应用？"
- "区块链技术的核心原理是什么？"
- "云计算的主要优势有哪些？"

### 测试配置
- 基础URL: `http://localhost:3001`
- 超时时间: 30秒
- 推广策略: "面向医疗专业人士和技术决策者"
- 模板: "技术深度分析"

## 扩展测试

### 添加新的测试用例

1. 在 `individual-step-tests.js` 中添加新的测试查询
2. 在 `complete-workflow-test.js` 中修改 `TEST_DATA` 配置
3. 运行测试验证新用例

### 自定义测试参数

可以通过修改测试文件中的配置来自定义：
- API 基础URL
- 超时时间
- 测试数据
- 输出格式

## 持续集成

建议将这些测试集成到 CI/CD 流程中：

```bash
# 在部署前运行测试
npm test

# 或者直接运行工作流程测试
node tests/workflow/test-runner.js
```

## 贡献指南

1. 添加新测试时，请确保包含适当的错误处理
2. 测试数据应该具有代表性
3. 添加详细的注释说明测试目的
4. 更新本文档以反映新的测试内容