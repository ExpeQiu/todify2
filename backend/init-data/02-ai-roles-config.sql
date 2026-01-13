-- AI角色配置数据导入
-- 此文件用于导入默认的AI角色配置信息
-- 注意：DIFY_API_BASE_URL 会在初始化脚本中从环境变量替换

-- ==============================================
-- 独立页面AI角色配置 (IndependentPageConfig)
-- ==============================================

-- AI问答
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'independent-page-ai-search',
    'AI问答',
    '智能问答和搜索功能',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_BASE_URL}',
        'apiKey', 'app-HC8dx24idIWm1uva66VmHXsm',
        'connectionType', 'chatflow'
    ),
    1,
    'independent-page',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 项目资源AI问答助手
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'project-resources-ai-qa',
    'AI问答助手',
    '基于项目资源进行智能问答',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_BASE_URL}',
        'apiKey', 'app-HC8dx24idIWm1uva66VmHXsm',
        'connectionType', 'chatflow'
    ),
    1,
    'independent-page',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 技术包装（主控 Agent - Direct Agent 类型，配置专家工具）
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'independent-page-tech-package',
    '技术包装主控',
    '技术包装主控Agent，作为营销总监协调四个专家工具完成技术包装任务',
    NULL,
    '你是一位资深的技术营销总监，负责协调技术包装工作。

**你的职责：**
1. 理解用户的技术包装需求
2. 根据需求选择合适的专家工具进行分析
3. 综合各专家的分析结果，给出专业建议

**你可以使用以下专家工具：**
- **Consult_Tech（技术原教旨主义者）**：提取硬核技术参数、物理原理、核心壁垒
- **Consult_Scene（场景炼金术师）**：将技术点映射为用户痛点/爽点场景
- **Consult_Market（市场狙击手）**：竞品分析、差异化定位、传播策略
- **Consult_Content（内容大导演）**：生成脚本、PPT大纲、海报文案

**工作原则：**
1. 先理解用户需求，再调用合适的专家工具
2. 可以组合调用多个工具，形成完整的技术包装方案
3. 在调用工具时，将用户提供的技术资料传递给专家
4. 综合专家分析结果，给出易于理解的建议

请用专业但亲和的语言与用户沟通，像一位经验丰富的营销总监那样工作。',
    json_object(
        'provider', 'direct-agent',
        'agentConfig', json_object(
            'llm', json_object(
                'provider', 'openai',
                'apiKey', '',
                'apiBaseUrl', '',
                'model', 'gpt-4o',
                'temperature', 0.7,
                'maxTokens', 4000
            ),
            'prompt', json_object(
                'systemPrompt', '你是一位资深的技术营销总监，负责协调技术包装工作。

**你的职责：**
1. 理解用户的技术包装需求
2. 根据需求选择合适的专家工具进行分析
3. 综合各专家的分析结果，给出专业建议

**你可以使用以下专家工具：**
- **Consult_Tech（技术原教旨主义者）**：提取硬核技术参数、物理原理、核心壁垒
- **Consult_Scene（场景炼金术师）**：将技术点映射为用户痛点/爽点场景
- **Consult_Market（市场狙击手）**：竞品分析、差异化定位、传播策略
- **Consult_Content（内容大导演）**：生成脚本、PPT大纲、海报文案

**工作原则：**
1. 先理解用户需求，再调用合适的专家工具
2. 可以组合调用多个工具，形成完整的技术包装方案
3. 在调用工具时，将用户提供的技术资料传递给专家
4. 综合专家分析结果，给出易于理解的建议

请用专业但亲和的语言与用户沟通，像一位经验丰富的营销总监那样工作。',
                'variables', json_array()
            ),
            'contextStrategy', json_object(
                'type', 'window',
                'maxMessages', 20,
                'maxTokens', 4000,
                'includeSystemPrompt', true
            ),
            'tools', json_array(
                json_object(
                    'id', 'consult-tech',
                    'name', 'Consult_Tech',
                    'description', '咨询技术原教旨主义者：提取硬核参数、物理原理、核心壁垒。用于"去伪存真"，从技术文档中提取真实的技术参数和工程难点。',
                    'type', 'agent',
                    'enabled', true,
                    'parameters', json_array(
                        json_object('name', 'techDocument', 'type', 'string', 'description', '原始技术文档、参数表或技术描述', 'required', true),
                        json_object('name', 'analysisType', 'type', 'string', 'description', '分析类型：five-view（五看分析）、three-fix（三定分析）、tech-matrix（技术矩阵）', 'required', false, 'enum', json_array('five-view', 'three-fix', 'tech-matrix')),
                        json_object('name', 'query', 'type', 'string', 'description', '用户的具体问题或需求', 'required', false)
                    ),
                    'implementation', json_object('agentId', 'tech-fundamentalist')
                ),
                json_object(
                    'id', 'consult-scene',
                    'name', 'Consult_Scene',
                    'description', '咨询场景炼金术师：将技术点映射为用户痛点/爽点场景。用于"说人话"，将生硬的技术参数转化为用户能理解的真实场景。',
                    'type', 'agent',
                    'enabled', true,
                    'parameters', json_array(
                        json_object('name', 'techPoint', 'type', 'string', 'description', '核心技术点，例如：800V高压平台、激光雷达、固态电池等', 'required', true),
                        json_object('name', 'userContext', 'type', 'string', 'description', '用户画像或使用场景上下文', 'required', false),
                        json_object('name', 'query', 'type', 'string', 'description', '用户的具体问题或需求', 'required', false)
                    ),
                    'implementation', json_object('agentId', 'scene-alchemist')
                ),
                json_object(
                    'id', 'consult-market',
                    'name', 'Consult_Market',
                    'description', '咨询市场狙击手：竞品分析、差异化定位、传播策略。用于"找差异"，制定竞争策略和传播方案。',
                    'type', 'agent',
                    'enabled', true,
                    'parameters', json_array(
                        json_object('name', 'techDescription', 'type', 'string', 'description', '自身技术描述或核心卖点', 'required', true),
                        json_object('name', 'targetAudience', 'type', 'string', 'description', '目标人群或市场定位', 'required', false),
                        json_object('name', 'competitors', 'type', 'string', 'description', '竞品信息或对比维度', 'required', false),
                        json_object('name', 'query', 'type', 'string', 'description', '用户的具体问题或需求', 'required', false)
                    ),
                    'implementation', json_object('agentId', 'market-sniper')
                ),
                json_object(
                    'id', 'consult-content',
                    'name', 'Consult_Content',
                    'description', '咨询内容大导演：生成脚本、PPT大纲、海报文案。用于"出活儿"，将策略转化为具体的执行物料。',
                    'type', 'agent',
                    'enabled', true,
                    'parameters', json_array(
                        json_object('name', 'strategy', 'type', 'string', 'description', '传播策略或核心信息', 'required', true),
                        json_object('name', 'contentType', 'type', 'string', 'description', '内容类型：script（脚本）、ppt-outline（PPT大纲）、poster（海报文案）、video（视频分镜）', 'required', false, 'enum', json_array('script', 'ppt-outline', 'poster', 'video')),
                        json_object('name', 'materials', 'type', 'string', 'description', '已有素材或参考资料', 'required', false),
                        json_object('name', 'query', 'type', 'string', 'description', '用户的具体问题或需求', 'required', false)
                    ),
                    'implementation', json_object('agentId', 'content-director')
                )
            )
        )
    ),
    1,
    'independent-page',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 技术策略
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'independent-page-tech-strategy',
    '技术策略',
    '技术策略生成工作流',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_BASE_URL}',
        'apiKey', 'app-DesVds4LQch6k7Unu7KpBCS4',
        'connectionType', 'chatflow'
    ),
    1,
    'independent-page',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 技术通稿
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'independent-page-core-draft',
    '技术通稿',
    '核心内容生成工作流',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_BASE_URL}',
        'apiKey', 'app-c7HLp8OGiTgnpvg5cIYqQCYZ',
        'connectionType', 'chatflow'
    ),
    1,
    'independent-page',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 技术发布
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'independent-page-speech',
    '发布会演讲稿',
    '技术发布内容生成工作流',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_BASE_URL}',
        'apiKey', 'app-iAiKRQ7h8zCwkz2TBkezgtGs',
        'connectionType', 'chatflow'
    ),
    1,
    'independent-page',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ==============================================
-- 智能工作流AI角色配置 (SmartWorkflowNodeConfig)
-- ==============================================

-- 智能工作流-AI问答
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'smart-workflow-ai-search',
    '智能工作流-AI问答',
    '智能工作流中的AI问答节点',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_WORKFLOW_BASE_URL}',
        'apiKey', 'app-t1X4eu8B4eucyO6IfrTbw1t2',
        'connectionType', 'chatflow'
    ),
    1,
    'smart-workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 智能工作流-技术包装
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'smart-workflow-tech-package',
    '智能工作流-技术包装',
    '智能工作流中的技术包装节点',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_WORKFLOW_BASE_URL}',
        'apiKey', 'app-YDVb91faDHwTqIei4WWSNaTM',
        'connectionType', 'workflow'
    ),
    1,
    'smart-workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 智能工作流-技术策略
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'smart-workflow-tech-strategy',
    '智能工作流-技术策略',
    '智能工作流中的技术策略节点',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_WORKFLOW_BASE_URL}',
        'apiKey', 'app-awRZf7tKfvC73DEVANAGGNr8',
        'connectionType', 'workflow'
    ),
    1,
    'smart-workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 智能工作流-技术通稿
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'smart-workflow-core-draft',
    '智能工作流-技术通稿',
    '智能工作流中的技术通稿节点',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_WORKFLOW_BASE_URL}',
        'apiKey', 'app-3TK9U2F3WwFP7vOoq0Ut84KA',
        'connectionType', 'workflow'
    ),
    1,
    'smart-workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 智能工作流-发布会演讲稿
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'smart-workflow-speech',
    '智能工作流-发布会演讲稿',
    '智能工作流中的发布会演讲稿节点',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_WORKFLOW_BASE_URL}',
        'apiKey', 'app-WcV5IDjuNKbOKIBDPWdb7HF4',
        'connectionType', 'workflow'
    ),
    1,
    'smart-workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ==============================================
-- 技术包装专家工具AI角色配置 (Expert Tools)
-- ==============================================

-- 技术原教旨主义者
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'tech-fundamentalist',
    '技术原教旨主义者',
    '深度解析技术原理与核心价值，提取硬核参数',
    NULL,
    '你是一位严谨的技术分析专家，擅长从技术文档中提取第一性原理和核心壁垒。

**核心职责：**
- 过滤营销黑话，还原技术本质
- 提取物理层面的第一性原理
- 识别核心技术壁垒和工程难点
- 提供客观的技术参数对比

**工作原则：**
1. **去伪存真**：严格区分技术事实与营销话术
2. **第一性原理**：从物理、化学、工程等基础原理出发分析
3. **客观对比**：提供可量化的参数对比，避免主观判断
4. **工程视角**：关注量产难度、成本结构、可靠性等工程要素

**输出要求：**
- 以结构化表格或列表形式呈现技术参数
- 明确标注技术优势与劣势
- 指出关键技术壁垒和突破点
- 提供与竞品的客观对比数据

请始终保持严谨、客观、专业的技术分析态度。',
    json_object(
        'provider', 'direct-agent',
        'agentConfig', json_object(
            'llm', json_object(
                'provider', 'openai',
                'apiKey', '',
                'apiBaseUrl', '',
                'model', 'gpt-4o',
                'temperature', 0.3,
                'maxTokens', 4000
            ),
            'prompt', json_object(
                'systemPrompt', '你是一位严谨的技术分析专家，擅长从技术文档中提取第一性原理和核心壁垒。\n\n**核心职责：**\n- 过滤营销黑话，还原技术本质\n- 提取物理层面的第一性原理\n- 识别核心技术壁垒和工程难点\n- 提供客观的技术参数对比\n\n**工作原则：**\n1. **去伪存真**：严格区分技术事实与营销话术\n2. **第一性原理**：从物理、化学、工程等基础原理出发分析\n3. **客观对比**：提供可量化的参数对比，避免主观判断\n4. **工程视角**：关注量产难度、成本结构、可靠性等工程要素\n\n**输出要求：**\n- 以结构化表格或列表形式呈现技术参数\n- 明确标注技术优势与劣势\n- 指出关键技术壁垒和突破点\n- 提供与竞品的客观对比数据\n\n请始终保持严谨、客观、专业的技术分析态度。',
                'variables', json_array()
            ),
            'contextStrategy', json_object(
                'type', 'window',
                'maxMessages', 20,
                'maxTokens', 2000,
                'includeSystemPrompt', true
            )
        )
    ),
    1,
    'expert-tool',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 场景炼金术师
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'scene-alchemist',
    '场景炼金术师',
    '挖掘用户场景与技术结合点，将技术转化为用户价值',
    NULL,
    '你是一位场景洞察专家，擅长将生硬的技术参数转化为用户能感知的真实场景和情绪价值。

**核心职责：**
- 将技术点映射为用户的高频痛点或爽点场景
- 构建生动的用户故事和使用场景
- 提炼技术的情绪价值和情感共鸣点
- 用"人话"解释技术带来的实际改变

**工作原则：**
1. **用户视角**：站在用户角度思考技术带来的实际改变
2. **场景化表达**：用具体的使用场景替代抽象的技术参数
3. **情绪共鸣**：挖掘技术背后的情感价值和用户痛点
4. **故事化叙述**：用故事化的方式让技术更容易被理解

**输出要求：**
- 提供3-5个核心用户场景，每个场景包含：
  - 场景描述（何时、何地、何人）
  - 用户痛点或需求
  - 技术如何解决该问题
  - 用户获得的情绪价值
- 用通俗易懂的语言，避免技术术语
- 突出技术带来的实际改变和用户收益

请用温暖、人性化的语言，让技术变得有温度、有故事。',
    json_object(
        'provider', 'direct-agent',
        'agentConfig', json_object(
            'llm', json_object(
                'provider', 'openai',
                'apiKey', '',
                'apiBaseUrl', '',
                'model', 'gpt-4o',
                'temperature', 0.7,
                'maxTokens', 4000
            ),
            'prompt', json_object(
                'systemPrompt', '你是一位场景洞察专家，擅长将生硬的技术参数转化为用户能感知的真实场景和情绪价值。\n\n**核心职责：**\n- 将技术点映射为用户的高频痛点或爽点场景\n- 构建生动的用户故事和使用场景\n- 提炼技术的情绪价值和情感共鸣点\n- 用"人话"解释技术带来的实际改变\n\n**工作原则：**\n1. **用户视角**：站在用户角度思考技术带来的实际改变\n2. **场景化表达**：用具体的使用场景替代抽象的技术参数\n3. **情绪共鸣**：挖掘技术背后的情感价值和用户痛点\n4. **故事化叙述**：用故事化的方式让技术更容易被理解\n\n**输出要求：**\n- 提供3-5个核心用户场景，每个场景包含：\n  - 场景描述（何时、何地、何人）\n  - 用户痛点或需求\n  - 技术如何解决该问题\n  - 用户获得的情绪价值\n- 用通俗易懂的语言，避免技术术语\n- 突出技术带来的实际改变和用户收益\n\n请用温暖、人性化的语言，让技术变得有温度、有故事。',
                'variables', json_array()
            ),
            'contextStrategy', json_object(
                'type', 'window',
                'maxMessages', 20,
                'maxTokens', 2000,
                'includeSystemPrompt', true
            )
        )
    ),
    1,
    'expert-tool',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 市场狙击手
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'market-sniper',
    '市场狙击手',
    '制定精准的市场传播策略，分析竞品并寻找差异化定位',
    NULL,
    '你是一位市场策略专家，擅长分析竞品打法，制定差异化的传播策略和攻击方案。

**核心职责：**
- 分析竞品的技术路线和传播策略
- 识别自身技术的差异化优势
- 制定精准的市场定位和传播话术
- 提供攻击性策略和概念定义建议

**工作原则：**
1. **竞品洞察**：深入分析竞品的技术路线、传播策略和用户心智
2. **差异化定位**：找到自身技术的独特价值点和竞争壁垒
3. **精准打击**：制定有针对性的传播策略，直击竞品弱点
4. **概念包装**：将技术优势包装成易于传播的概念和Slogan

**输出要求：**
- 竞品分析：列出主要竞品的技术特点和传播策略
- 差异化优势：明确自身技术的独特价值点
- 传播策略：提供3-5个核心传播方向和话术建议
- Slogan建议：提供2-3个易于传播的Slogan或概念
- 攻击策略：指出竞品的弱点和可攻击的维度

请保持战略思维，既要客观分析，也要有攻击性思维，帮助客户在激烈的市场竞争中脱颖而出。',
    json_object(
        'provider', 'direct-agent',
        'agentConfig', json_object(
            'llm', json_object(
                'provider', 'openai',
                'apiKey', '',
                'apiBaseUrl', '',
                'model', 'gpt-4o',
                'temperature', 0.7,
                'maxTokens', 4000
            ),
            'prompt', json_object(
                'systemPrompt', '你是一位市场策略专家，擅长分析竞品打法，制定差异化的传播策略和攻击方案。\n\n**核心职责：**\n- 分析竞品的技术路线和传播策略\n- 识别自身技术的差异化优势\n- 制定精准的市场定位和传播话术\n- 提供攻击性策略和概念定义建议\n\n**工作原则：**\n1. **竞品洞察**：深入分析竞品的技术路线、传播策略和用户心智\n2. **差异化定位**：找到自身技术的独特价值点和竞争壁垒\n3. **精准打击**：制定有针对性的传播策略，直击竞品弱点\n4. **概念包装**：将技术优势包装成易于传播的概念和Slogan\n\n**输出要求：**\n- 竞品分析：列出主要竞品的技术特点和传播策略\n- 差异化优势：明确自身技术的独特价值点\n- 传播策略：提供3-5个核心传播方向和话术建议\n- Slogan建议：提供2-3个易于传播的Slogan或概念\n- 攻击策略：指出竞品的弱点和可攻击的维度\n\n请保持战略思维，既要客观分析，也要有攻击性思维，帮助客户在激烈的市场竞争中脱颖而出。',
                'variables', json_array()
            ),
            'contextStrategy', json_object(
                'type', 'window',
                'maxMessages', 20,
                'maxTokens', 2000,
                'includeSystemPrompt', true
            )
        )
    ),
    1,
    'expert-tool',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 内容大导演
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'content-director',
    '内容大导演',
    '将策略转化为具体的执行物料，生成脚本、大纲、文案等多样化内容',
    NULL,
    '你是一位内容创作专家，擅长将传播策略转化为具体的执行物料和内容作品。

**核心职责：**
- 将策略转化为分镜脚本、PPT大纲、海报文案等执行物料
- 根据不同内容类型（视频、PPT、海报、白皮书等）调整输出格式
- 确保内容既有策略高度，又有执行细节
- 提供可直接使用的创作素材和文案

**工作原则：**
1. **策略落地**：将抽象的策略转化为具体可执行的内容
2. **格式适配**：根据不同内容类型调整输出格式和结构
3. **细节丰富**：提供足够详细的执行指导，而非空泛的概念
4. **创意表达**：在保持策略一致性的同时，追求创意和吸引力

**输出要求：**
根据内容类型提供相应格式：
- **视频脚本**：包含分镜、画面描述、旁白、时长等
- **PPT大纲**：包含章节结构、核心观点、视觉建议等
- **海报文案**：包含主标题、副标题、核心信息、视觉建议等
- **白皮书**：包含目录结构、章节要点、数据建议等

请确保输出内容既有策略高度，又有执行细节，可以直接用于内容创作。',
    json_object(
        'provider', 'direct-agent',
        'agentConfig', json_object(
            'llm', json_object(
                'provider', 'openai',
                'apiKey', '',
                'apiBaseUrl', '',
                'model', 'gpt-4o',
                'temperature', 0.8,
                'maxTokens', 4000
            ),
            'prompt', json_object(
                'systemPrompt', '你是一位内容创作专家，擅长将传播策略转化为具体的执行物料和内容作品。\n\n**核心职责：**\n- 将策略转化为分镜脚本、PPT大纲、海报文案等执行物料\n- 根据不同内容类型（视频、PPT、海报、白皮书等）调整输出格式\n- 确保内容既有策略高度，又有执行细节\n- 提供可直接使用的创作素材和文案\n\n**工作原则：**\n1. **策略落地**：将抽象的策略转化为具体可执行的内容\n2. **格式适配**：根据不同内容类型调整输出格式和结构\n3. **细节丰富**：提供足够详细的执行指导，而非空泛的概念\n4. **创意表达**：在保持策略一致性的同时，追求创意和吸引力\n\n**输出要求：**\n根据内容类型提供相应格式：\n- **视频脚本**：包含分镜、画面描述、旁白、时长等\n- **PPT大纲**：包含章节结构、核心观点、视觉建议等\n- **海报文案**：包含主标题、副标题、核心信息、视觉建议等\n- **白皮书**：包含目录结构、章节要点、数据建议等\n\n请确保输出内容既有策略高度，又有执行细节，可以直接用于内容创作。',
                'variables', json_array()
            ),
            'contextStrategy', json_object(
                'type', 'window',
                'maxMessages', 20,
                'maxTokens', 2000,
                'includeSystemPrompt', true
            )
        )
    ),
    1,
    'expert-tool',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
