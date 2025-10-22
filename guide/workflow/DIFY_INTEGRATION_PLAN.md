# “技术包装”模块与Dify服务对接方案

## 1. 目标

对接Dify服务，以实现基于智能搜索结果的自动化技术内容生成。

## 2. 核心流程

- **前端**: 用户在“技术包装”界面触发生成操作，可选择不同模板。前端将智能搜索的结果和所选模板作为输入，发送至后端。
- **后端**:
    - 接收前端请求，并调用 `DifyClient` 服务。
    - `DifyClient` 根据应用类型（`TECH_PACKAGE`）获取对应的API密钥。
    - 调用Dify的 `workflows/run` API，执行预设的“技术包装”工作流。
    - 将Dify返回的生成结果（`data.outputs.text`）返回给前端。
- **前端**: 接收并展示由Dify生成的技术包装内容。

## 3. 关键实施步骤

### 步骤一：环境配置

在 `backend/.env` 文件中，确认并配置以下Dify相关的环境变量：

- `DIFY_BASE_URL`: Dify服务的基地址 (当前为 `http://47.113.225.93:9999/v1`)。
- `DIFY_WORKFLOW_BASE_URL`: Dify工作流服务的地址 (当前为 `http://47.113.225.93:9999/v1`)。
- `TECH_PACKAGE_API_KEY`: 从Dify平台获取的“技术包装”应用的API密钥。技术包装：app-GgD3uUNDWOFu7DlBgSVkIrIt

### 步骤二：Dify工作流输入与输出确认

- **工作流文件已更新**：工作流文件已变更为 `guide/workflow/AI问答-技术包装2.yml`。
- **输入变量分析**：根据新的工作流文件，Dify工作流现在期望一个名为 `Additional_information` 的核心输入变量。
- **数据映射**：前端传递的智能搜索结果 `stepData.smartSearch` 和模板信息 `template` 需要在后端被整合，并作为 `Additional_information` 变量传递给Dify工作流。
- **输出格式**：工作流的输出是一个结构化的技术分析报告，而非纯文本。后端需要确保能够正确处理此格式，并将其传递给前端进行渲染。

### 步骤三：后端逻辑完善

- `DifyClient.ts` 中的 `techPackage` 和 `runWorkflow` 方法已基本满足需求。
- 核心工作是确保传递给 `runWorkflow` 的 `inputs` 对象结构与Dify工作流的定义完全匹配。

### 步骤四：端到端测试

- 完成上述配置和代码调整后，进行完整的端到端测试，覆盖从前端触发到接收并展示Dify生成内容的整个链路。
- 测试不同模板下的生成效果。
- 模拟Dify API异常，验证系统的容错和错误处理能力。