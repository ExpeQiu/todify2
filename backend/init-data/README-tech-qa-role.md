# AI技术通用问答角色配置说明

## 概述

`tech-general-qa-assistant` 是一个专门用于技术通用问答的AI角色，强化了对来源信息的解读能力，能够精准回答用户的技术问题。

## 角色特点

1. **深度解读来源信息**：仔细阅读和分析所有提供的来源内容
2. **精准回答问题**：基于来源信息准确回答，避免编造或推测
3. **来源标注**：在回答中明确标注信息来源
4. **分类识别**：能够识别和优先使用不同类型的来源信息

## 安装方式

### 方式一：使用npm script（推荐）

```bash
cd backend
npm run init:tech-qa-role
```

### 方式二：使用npx

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/init-tech-qa-role.ts
```

### 方式三：使用本地路径

```bash
cd backend
./node_modules/.bin/ts-node -r tsconfig-paths/register src/scripts/init-tech-qa-role.ts
```

### 方式二：使用SQL脚本

```bash
# 需要先替换环境变量
export OPENAI_API_KEY="your-api-key-here"
sed "s/\${OPENAI_API_KEY}/$OPENAI_API_KEY/g" init-data/03-ai-tech-qa-role.sql | sqlite3 data/todify3-v3.db
```

## 配置要求

### 环境变量

需要设置以下环境变量：

```bash
export OPENAI_API_KEY="sk-your-openai-api-key"
```

### 角色配置

角色使用 `direct-agent` 类型，配置如下：

- **LLM Provider**: OpenAI
- **Model**: gpt-4o
- **Temperature**: 0.3 (较低温度，确保回答准确性)
- **Max Tokens**: 4000
- **Context Strategy**: Window模式，最多30条消息，8000 tokens

## 使用方法

### 在AI问答页面使用

1. 进入AI问答页面（`/todify/project/{projectId}/ai-qa`）
2. 在来源侧边栏选择相关来源信息
3. 开始提问，AI会自动使用此角色进行回答

### 通过API使用

```typescript
// 使用角色ID调用
const roleId = 'tech-general-qa-assistant';
// ... 调用AI角色API
```

## 系统提示词特点

系统提示词包含以下关键部分：

1. **来源分类识别**：区分AI共创信息、技术资源、外部来源
2. **信息解读流程**：通读→识别→关联→提取
3. **回答构建策略**：直接回答、综合分析、部分回答、无法回答
4. **回答质量要求**：准确性、完整性、可读性、结构化
5. **来源标注格式**：【来源：XXX】或【综合来源：XXX、YYY】

## 验证安装

运行以下SQL查询验证角色是否创建成功：

```sql
SELECT id, name, description, enabled, source 
FROM ai_roles 
WHERE id = 'tech-general-qa-assistant';
```

## 更新配置

如果需要更新角色配置，可以：

1. 修改 `backend/src/scripts/init-tech-qa-role.ts` 中的配置
2. 重新运行脚本（脚本会自动检测并更新现有角色）

## 注意事项

1. **API Key配置**：确保 `OPENAI_API_KEY` 环境变量已正确设置
2. **数据库连接**：确保数据库已初始化，`ai_roles` 表已创建
3. **来源信息**：此角色依赖来源信息，确保在提问前已选择相关来源

## 故障排查

### 角色未创建

- 检查数据库连接
- 确认 `ai_roles` 表已存在
- 查看脚本执行日志

### API调用失败

- 检查 `OPENAI_API_KEY` 是否正确设置
- 验证API Key是否有效
- 检查网络连接

### 回答质量不佳

- 确保已选择相关来源信息
- 检查来源信息是否完整
- 考虑调整 `temperature` 参数（当前为0.3）
