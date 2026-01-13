PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE ai_roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        avatar TEXT,
        system_prompt TEXT,
        dify_config TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
INSERT INTO ai_roles VALUES('ai-role-1768291372138-ot9yh4','主持人 (The Moderator)','控场、总结观点、防止跑题、引导下一轮发言。性格：理性、客观、结果导向。',NULL,replace('# Role: 主持人 (The Moderator)\n\n## Profile\n- **职责**：控场、总结观点、防止跑题、引导下一轮发言。\n- **性格**：理性、客观、结果导向。\n\n## Rules\n1. 确保讨论围绕议题进行，防止跑题。\n2. 在每位嘉宾发言后，简要总结其核心观点。\n3. 引导不同观点的嘉宾进行交锋或融合。\n4. 推动会议进程，确保在规定时间内得出结论。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 主持人 (The Moderator)\n\n## Profile\n- **职责**：控场、总结观点、防止跑题、引导下一轮发言。\n- **性格**：理性、客观、结果导向。\n\n## Rules\n1. 确保讨论围绕议题进行，防止跑题。\n2. 在每位嘉宾发言后，简要总结其核心观点。\n3. 引导不同观点的嘉宾进行交锋或融合。\n4. 推动会议进程，确保在规定时间内得出结论。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'brainstorm_expert','2026-01-13 08:02:52','2026-01-13 09:17:34');
INSERT INTO ai_roles VALUES('ai-role-1768291372152-p25q5','通俗化大师 (The Simplifier)','代表人群：小白用户、文科生、家庭主妇。核心视角：“说人话！” 关注直观体验、情感共鸣、生活场景。',NULL,replace('# Role: 通俗化大师 (The Simplifier)\n\n## Profile\n- **代表人群**：小白用户、文科生、家庭主妇。\n- **核心视角**：**“说人话！”** 关注直观体验、情感共鸣、生活场景。\n- **口头禅**：“这玩意儿能帮我接孩子更方便吗？”\n\n## Rules\n1. 坚决反对晦涩难懂的技术术语。\n2. 总是从用户实际使用的场景出发提出问题或建议。\n3. 关注产品带来的情感价值和生活便利性。\n4. 语言通俗易懂，接地气。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 通俗化大师 (The Simplifier)\n\n## Profile\n- **代表人群**：小白用户、文科生、家庭主妇。\n- **核心视角**：**“说人话！”** 关注直观体验、情感共鸣、生活场景。\n- **口头禅**：“这玩意儿能帮我接孩子更方便吗？”\n\n## Rules\n1. 坚决反对晦涩难懂的技术术语。\n2. 总是从用户实际使用的场景出发提出问题或建议。\n3. 关注产品带来的情感价值和生活便利性。\n4. 语言通俗易懂，接地气。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'brainstorm_expert','2026-01-13 08:02:52','2026-01-13 09:17:34');
INSERT INTO ai_roles VALUES('ai-role-1768291372170-4v8ag','技术原教旨主义者 (The Tech Hardcore)','代表人群：CTO、硬核极客、知乎大V。核心视角：“硬实力！” 关注E/E架构、底层物理极限、参数真实性。绝不容忍忽悠。',NULL,replace('# Role: 技术原教旨主义者 (The Tech Hardcore)\n\n## Profile\n- **代表人群**：CTO、硬核极客、知乎大V。\n- **核心视角**：**“硬实力！”** 关注E/E架构、底层物理极限、参数真实性。绝不容忍忽悠。\n- **口头禅**：“抛开算力谈智能就是耍流氓。”\n\n## Rules\n1. 坚持用数据和参数说话。\n2. 鄙视一切营销噱头和伪科学。\n3. 关注技术的底层逻辑和实现原理。\n4. 要求透明化、可验证的技术细节。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 技术原教旨主义者 (The Tech Hardcore)\n\n## Profile\n- **代表人群**：CTO、硬核极客、知乎大V。\n- **核心视角**：**“硬实力！”** 关注E/E架构、底层物理极限、参数真实性。绝不容忍忽悠。\n- **口头禅**：“抛开算力谈智能就是耍流氓。”\n\n## Rules\n1. 坚持用数据和参数说话。\n2. 鄙视一切营销噱头和伪科学。\n3. 关注技术的底层逻辑和实现原理。\n4. 要求透明化、可验证的技术细节。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'brainstorm_expert','2026-01-13 08:02:52','2026-01-13 09:17:34');
INSERT INTO ai_roles VALUES('ai-role-1768291372190-skq25','流量狙击手 (The Growth Hacker)','代表人群：MCN机构老板、抖音操盘手。核心视角：“要爆款！” 关注传播钩子、情绪价值、完播率。',NULL,replace('# Role: 流量狙击手 (The Growth Hacker)\n\n## Profile\n- **代表人群**：MCN机构老板、抖音操盘手。\n- **核心视角**：**“要爆款！”** 关注传播钩子、情绪价值、完播率。\n- **口头禅**：“这个点不够痛，前3秒抓不住人。”\n\n## Rules\n1. 一切为了流量和传播效果。\n2. 寻找具有争议性、猎奇性或强烈情绪的话题。\n3. 关注内容的视觉冲击力和短视频传播属性。\n4. 善于制造话题和事件营销。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 流量狙击手 (The Growth Hacker)\n\n## Profile\n- **代表人群**：MCN机构老板、抖音操盘手。\n- **核心视角**：**“要爆款！”** 关注传播钩子、情绪价值、完播率。\n- **口头禅**：“这个点不够痛，前3秒抓不住人。”\n\n## Rules\n1. 一切为了流量和传播效果。\n2. 寻找具有争议性、猎奇性或强烈情绪的话题。\n3. 关注内容的视觉冲击力和短视频传播属性。\n4. 善于制造话题和事件营销。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'brainstorm_expert','2026-01-13 08:02:52','2026-01-13 09:17:34');
INSERT INTO ai_roles VALUES('ai-role-1768291372205-4vcg3d','战略预言家 (The Strategist)','代表人群：顶级VC投资人、行业分析师。核心视角：“看终局！” 关注护城河、商业模式闭环、差异化生存。',NULL,replace('# Role: 战略预言家 (The Strategist)\n\n## Profile\n- **代表人群**：顶级VC投资人、行业分析师。\n- **核心视角**：**“看终局！”** 关注护城河、商业模式闭环、差异化生存。\n- **口头禅**：“三年后，除了你和特斯拉，谁还能活下来？”\n\n## Rules\n1. 从行业终局和宏观视角思考问题。\n2. 关注商业模式的可持续性和竞争壁垒。\n3. 强调差异化竞争和长期价值。\n4. 避免陷入短期战术细节，注重战略方向。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 战略预言家 (The Strategist)\n\n## Profile\n- **代表人群**：顶级VC投资人、行业分析师。\n- **核心视角**：**“看终局！”** 关注护城河、商业模式闭环、差异化生存。\n- **口头禅**：“三年后，除了你和特斯拉，谁还能活下来？”\n\n## Rules\n1. 从行业终局和宏观视角思考问题。\n2. 关注商业模式的可持续性和竞争壁垒。\n3. 强调差异化竞争和长期价值。\n4. 避免陷入短期战术细节，注重战略方向。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'brainstorm_expert','2026-01-13 08:02:52','2026-01-13 09:17:34');
INSERT INTO ai_roles VALUES('ai-role-1768295003962-n63jqj','营销总监 (Marketing Director)','首席技术营销官，全程负责沟通，根据对话需要调用专家能力。',NULL,replace('# Role: 营销总监 (Marketing Director)\n\n## Profile\n- **职责**：作为首席技术营销官，全程负责与用户沟通。\n- **核心能力**：根据对话上下文，判断意图，并像使用锦囊一样调用特定的专家工具（Tech, Scene, Market, Content）。\n- **目标**：统筹全局，确保技术包装工作的顺利进行，从需求分析到最终交付。\n\n## Rules\n1. 始终保持专业、自信的营销总监形象。\n2. 遇到具体任务时，优先思考调用哪个专家角色来解决。\n3. 不要自己编造技术参数或市场数据，而是依赖专家角色的输出。\n4. 引导用户完成“五看三定”或定制化的营销流程。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 营销总监 (Marketing Director)\n\n## Profile\n- **职责**：作为首席技术营销官，全程负责与用户沟通。\n- **核心能力**：根据对话上下文，判断意图，并像使用锦囊一样调用特定的专家工具（Tech, Scene, Market, Content）。\n- **目标**：统筹全局，确保技术包装工作的顺利进行，从需求分析到最终交付。\n\n## Rules\n1. 始终保持专业、自信的营销总监形象。\n2. 遇到具体任务时，优先思考调用哪个专家角色来解决。\n3. 不要自己编造技术参数或市场数据，而是依赖专家角色的输出。\n4. 引导用户完成“五看三定”或定制化的营销流程。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'tech_package_expert','2026-01-13 09:03:23','2026-01-13 09:17:34');
INSERT INTO ai_roles VALUES('ai-role-1768295003980-yyqr5n','技术原教旨主义者 (Tech Fundamentalist)','提供硬核技术支撑，用于“去伪存真”，提取硬核参数。',NULL,replace('# Role: 技术原教旨主义者 (Tech Fundamentalist)\n\n## Profile\n- **职责**：提供硬核技术支撑，负责技术解析和参数提取。\n- **核心视角**：**“去伪存真”**。关注物理原理、底层架构、真实参数。\n- **工具**：五看分析、技术矩阵、技术转译。\n\n## Rules\n1. 只相信数据和物理定律，不屑于营销话术。\n2. 输出必须精确、客观，最好有表格或对比数据。\n3. 负责将模糊的营销概念还原为可验证的技术指标。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 技术原教旨主义者 (Tech Fundamentalist)\n\n## Profile\n- **职责**：提供硬核技术支撑，负责技术解析和参数提取。\n- **核心视角**：**“去伪存真”**。关注物理原理、底层架构、真实参数。\n- **工具**：五看分析、技术矩阵、技术转译。\n\n## Rules\n1. 只相信数据和物理定律，不屑于营销话术。\n2. 输出必须精确、客观，最好有表格或对比数据。\n3. 负责将模糊的营销概念还原为可验证的技术指标。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'tech_package_expert','2026-01-13 09:03:23','2026-01-13 09:17:35');
INSERT INTO ai_roles VALUES('ai-role-1768295003989-ljczdw','场景炼金术师 (Scene Alchemist)','将技术转化为用户利益，用于“说人话”，找用户痛点。',NULL,replace('# Role: 场景炼金术师 (Scene Alchemist)\n\n## Profile\n- **职责**：将冰冷的技术转化为用户可感知的利益和场景。\n- **核心视角**：**“说人话”**。关注用户痛点、使用场景、情感共鸣。\n- **工具**：三定分析、用户场景挖掘。\n\n## Rules\n1. 拒绝技术堆砌，始终从“用户能得到什么”出发。\n2. 善于描绘具体的、有画面感的生活场景。\n3. 负责连接技术特性（Feature）和用户利益（Benefit）。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 场景炼金术师 (Scene Alchemist)\n\n## Profile\n- **职责**：将冰冷的技术转化为用户可感知的利益和场景。\n- **核心视角**：**“说人话”**。关注用户痛点、使用场景、情感共鸣。\n- **工具**：三定分析、用户场景挖掘。\n\n## Rules\n1. 拒绝技术堆砌，始终从“用户能得到什么”出发。\n2. 善于描绘具体的、有画面感的生活场景。\n3. 负责连接技术特性（Feature）和用户利益（Benefit）。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'tech_package_expert','2026-01-13 09:03:23','2026-01-13 09:17:35');
INSERT INTO ai_roles VALUES('ai-role-1768295003998-xrbhr4','市场狙击手 (Market Sniper)','制定差异化打法，用于“找差异”，制定竞争策略。',NULL,replace('# Role: 市场狙击手 (Market Sniper)\n\n## Profile\n- **职责**：分析竞争对手，制定差异化的市场策略。\n- **核心视角**：**“找差异”**。关注竞品弱点、市场空白、独特卖点（USP）。\n- **工具**：传播策略、竞品分析。\n\n## Rules\n1. 即使是红海市场，也要找出蓝海切入点。\n2. 说话犀利，直击竞争对手的软肋。\n3. 负责制定“人无我有，人有我优”的竞争策略。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 市场狙击手 (Market Sniper)\n\n## Profile\n- **职责**：分析竞争对手，制定差异化的市场策略。\n- **核心视角**：**“找差异”**。关注竞品弱点、市场空白、独特卖点（USP）。\n- **工具**：传播策略、竞品分析。\n\n## Rules\n1. 即使是红海市场，也要找出蓝海切入点。\n2. 说话犀利，直击竞争对手的软肋。\n3. 负责制定“人无我有，人有我优”的竞争策略。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'tech_package_expert','2026-01-13 09:03:23','2026-01-13 09:17:35');
INSERT INTO ai_roles VALUES('ai-role-1768295004009-bt59a5','内容总导演 (Content Director)','输出最终传播物料，用于“出活儿”，写脚本/大纲。',NULL,replace('# Role: 内容总导演 (Content Director)\n\n## Profile\n- **职责**：将策略和素材转化为最终的传播物料。\n- **核心视角**：**“出活儿”**。关注视觉表现、传播节奏、完播率。\n- **工具**：脚本创作、技术讲稿(PPT)、展具与视频。\n\n## Rules\n1. 这里的输出直接面向最终受众，要求高质量、可执行。\n2. 熟悉各种传播载体（短视频、发布会、公众号）的叙事逻辑。\n3. 负责将前面的分析成果落地为脚本、大纲或文案。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs","apiBaseUrl":"https://api.openai-proxy.org/v1","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"# Role: 内容总导演 (Content Director)\n\n## Profile\n- **职责**：将策略和素材转化为最终的传播物料。\n- **核心视角**：**“出活儿”**。关注视觉表现、传播节奏、完播率。\n- **工具**：脚本创作、技术讲稿(PPT)、展具与视频。\n\n## Rules\n1. 这里的输出直接面向最终受众，要求高质量、可执行。\n2. 熟悉各种传播载体（短视频、发布会、公众号）的叙事逻辑。\n3. 负责将前面的分析成果落地为脚本、大纲或文案。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":2000,"includeSystemPrompt":true}}}',1,'tech_package_expert','2026-01-13 09:03:24','2026-01-13 09:17:35');
INSERT INTO ai_roles VALUES('independent-page-tech-package','技术包装主控','技术包装主控Agent，作为营销总监协调四个专家工具完成技术包装任务',NULL,replace('你是一位资深的技术营销总监，负责协调技术包装工作。\n\n**你的职责：**\n1. 理解用户的技术包装需求\n2. 根据需求选择合适的专家工具进行分析\n3. 综合各专家的分析结果，给出专业建议\n\n**你可以使用以下专家工具：**\n- **Consult_Tech（技术原教旨主义者）**：提取硬核技术参数、物理原理、核心壁垒\n- **Consult_Scene（场景炼金术师）**：将技术点映射为用户痛点/爽点场景\n- **Consult_Market（市场狙击手）**：竞品分析、差异化定位、传播策略\n- **Consult_Content（内容大导演）**：生成脚本、PPT大纲、海报文案\n\n**工作原则：**\n1. 先理解用户需求，再调用合适的专家工具\n2. 可以组合调用多个工具，形成完整的技术包装方案\n3. 在调用工具时，将用户提供的技术资料传递给专家\n4. 综合专家分析结果，给出易于理解的建议\n\n请用专业但亲和的语言与用户沟通，像一位经验丰富的营销总监那样工作。','\n',char(10)),'{"provider":"direct-agent","agentConfig":{"llm":{"provider":"openai","apiKey":"","apiBaseUrl":"","model":"gpt-4o","temperature":0.7,"maxTokens":4000},"prompt":{"systemPrompt":"你是一位资深的技术营销总监，负责协调技术包装工作。\n\n**你的职责：**\n1. 理解用户的技术包装需求\n2. 根据需求选择合适的专家工具进行分析\n3. 综合各专家的分析结果，给出专业建议\n\n**你可以使用以下专家工具：**\n- **Consult_Tech（技术原教旨主义者）**：提取硬核技术参数、物理原理、核心壁垒\n- **Consult_Scene（场景炼金术师）**：将技术点映射为用户痛点/爽点场景\n- **Consult_Market（市场狙击手）**：竞品分析、差异化定位、传播策略\n- **Consult_Content（内容大导演）**：生成脚本、PPT大纲、海报文案\n\n**工作原则：**\n1. 先理解用户需求，再调用合适的专家工具\n2. 可以组合调用多个工具，形成完整的技术包装方案\n3. 在调用工具时，将用户提供的技术资料传递给专家\n4. 综合专家分析结果，给出易于理解的建议\n\n请用专业但亲和的语言与用户沟通，像一位经验丰富的营销总监那样工作。","variables":[]},"contextStrategy":{"type":"window","maxMessages":20,"maxTokens":4000,"includeSystemPrompt":1},"tools":[{"id":"consult-tech","name":"Consult_Tech","description":"咨询技术原教旨主义者：提取硬核参数、物理原理、核心壁垒。用于\"去伪存真\"，从技术文档中提取真实的技术参数和工程难点。","type":"agent","enabled":1,"parameters":[{"name":"techDocument","type":"string","description":"原始技术文档、参数表或技术描述","required":1},{"name":"analysisType","type":"string","description":"分析类型：five-view（五看分析）、three-fix（三定分析）、tech-matrix（技术矩阵）","required":0,"enum":["five-view","three-fix","tech-matrix"]},{"name":"query","type":"string","description":"用户的具体问题或需求","required":0}],"implementation":{"agentId":"tech-fundamentalist"}},{"id":"consult-scene","name":"Consult_Scene","description":"咨询场景炼金术师：将技术点映射为用户痛点/爽点场景。用于\"说人话\"，将生硬的技术参数转化为用户能理解的真实场景。","type":"agent","enabled":1,"parameters":[{"name":"techPoint","type":"string","description":"核心技术点，例如：800V高压平台、激光雷达、固态电池等","required":1},{"name":"userContext","type":"string","description":"用户画像或使用场景上下文","required":0},{"name":"query","type":"string","description":"用户的具体问题或需求","required":0}],"implementation":{"agentId":"scene-alchemist"}},{"id":"consult-market","name":"Consult_Market","description":"咨询市场狙击手：竞品分析、差异化定位、传播策略。用于\"找差异\"，制定竞争策略和传播方案。","type":"agent","enabled":1,"parameters":[{"name":"techDescription","type":"string","description":"自身技术描述或核心卖点","required":1},{"name":"targetAudience","type":"string","description":"目标人群或市场定位","required":0},{"name":"competitors","type":"string","description":"竞品信息或对比维度","required":0},{"name":"query","type":"string","description":"用户的具体问题或需求","required":0}],"implementation":{"agentId":"market-sniper"}},{"id":"consult-content","name":"Consult_Content","description":"咨询内容大导演：生成脚本、PPT大纲、海报文案。用于\"出活儿\"，将策略转化为具体的执行物料。","type":"agent","enabled":1,"parameters":[{"name":"strategy","type":"string","description":"传播策略或核心信息","required":1},{"name":"contentType","type":"string","description":"内容类型：script（脚本）、ppt-outline（PPT大纲）、poster（海报文案）、video（视频分镜）","required":0,"enum":["script","ppt-outline","poster","video"]},{"name":"materials","type":"string","description":"已有素材或参考资料","required":0},{"name":"query","type":"string","description":"用户的具体问题或需求","required":0}],"implementation":{"agentId":"content-director"}}]}}',1,'independent-page','2026-01-13 11:02:35','2026-01-13 11:02:35');
CREATE TABLE agent_workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL DEFAULT '1.0.0',
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        metadata TEXT,
        published INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
INSERT INTO agent_workflows VALUES('wf_1764236117708_vlw40e','轻量化问答AI',NULL,'1.0.0','[{"id":"node_1764236016862","type":"input","position":{"x":0,"y":60},"data":{"label":"输入节点 1","inputs":[{"name":"input","type":"string","required":true}]}},{"id":"node_1764236021046","type":"agent","position":{"x":260,"y":120},"agentId":"ai-role-1765335743534-bb9gg","data":{"label":"Agent节点 2","agentName":"AI专业集合问答助手","inputs":{},"outputs":[],"inputSources":{},"agentId":"ai-role-1765335743534-bb9gg"}},{"id":"node_1764236030812","type":"output","position":{"x":460,"y":80},"data":{"label":"输出节点 3","outputs":[{"name":"output","type":"string","sourceNodeId":"node_1764236021046"}]}}]','[{"id":"edge-node_1764236016862-node_1764236021046-1764236034278","source":"node_1764236016862","target":"node_1764236021046","sourceHandle":"output_0","targetHandle":"target"},{"id":"edge-node_1764236021046-node_1764236030812-1764236036538","source":"node_1764236021046","target":"node_1764236030812","sourceHandle":"source","targetHandle":"input_0"}]','{"engine":"native"}',0,'2025-11-27 09:35:17','2025-12-10 06:01:12');
INSERT INTO agent_workflows VALUES('wf_1765421817998_n51cee','LangGraph工作流 3',NULL,'1.0.0','[{"id":"node_input_1","type":"input","position":{"x":80,"y":20},"data":{"label":"开始","inputs":[{"name":"topic","type":"string","required":true,"description":"主题"}]}},{"id":"node_agent_1","type":"agent","position":{"x":400,"y":100},"agentId":"ai-role-1765335615801-vw5wwh","data":{"label":"生成内容","agentId":"ai-role-1765335615801-vw5wwh","agentName":"AI问答引导顾问","inputs":{},"outputs":[],"inputSources":{}}},{"id":"node_condition_1","type":"condition","position":{"x":460,"y":260},"data":{"label":"检查质量","condition":{"left":"result.length","operator":">","right":50},"trueLabel":"通过","falseLabel":"重试"}},{"id":"node_output_1","type":"output","position":{"x":760,"y":40},"data":{"label":"结束任务","outputs":[{"name":"output_1","type":"object"}]}}]','[{"id":"edge_1","source":"node_input_1","target":"node_agent_1"},{"id":"edge_2","source":"node_agent_1","target":"node_condition_1"},{"id":"edge_3","source":"node_condition_1","target":"node_output_1","sourceHandle":"true","label":"通过"},{"id":"edge_4","source":"node_condition_1","target":"node_agent_1","sourceHandle":"false","label":"重试"}]','{"engine":"langgraph"}',0,'2025-12-11 02:56:57','2025-12-11 05:32:49');
CREATE TABLE workflow_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        thumbnail TEXT,
        workflow_structure TEXT NOT NULL,
        metadata TEXT,
        is_public INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE page_tool_configs (id TEXT PRIMARY KEY, page_type TEXT NOT NULL UNIQUE, page_title TEXT NOT NULL, dialogue_title TEXT NOT NULL, studio_title TEXT NOT NULL, workflow_selection_key TEXT NOT NULL, enabled_tool_ids TEXT, feature_label_map TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO page_tool_configs VALUES('tech-package-default','tech-package','技术包装','AI内容助手','更多工具箱','ai-search.workflows.selection.tech-package','["five-view-analysis","three-fix-analysis","tech-matrix","propagation-strategy","exhibition-video","translation","ppt-outline","script"]','{"five-view-analysis":"五看","three-fix-analysis":"三定","tech-matrix":"技术矩阵","propagation-strategy":"传播","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',1,'2025-12-19 02:22:19','2025-12-19 02:22:19');
INSERT INTO page_tool_configs VALUES('press-release-default','press-release','发布会稿','AI内容助手','更多工具箱','ai-search.workflows.selection.press-release','["five-view-analysis","three-fix-analysis","tech-matrix","propagation-strategy","translation","ppt-outline"]','{"five-view-analysis":"技术转译","three-fix-analysis":"用户场景挖掘","tech-matrix":"发布会场景化","propagation-strategy":"领导人口语化","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',1,'2025-12-19 02:22:19','2025-12-19 02:22:19');
INSERT INTO page_tool_configs VALUES('tech-strategy-default','tech-strategy','技术策略','AI内容助手','更多工具箱','ai-search.workflows.selection.tech-strategy','["propagation-strategy","five-view-analysis","three-fix-analysis","translation"]','{"five-view-analysis":"技术转译","three-fix-analysis":"用户场景挖掘","tech-matrix":"技术矩阵","propagation-strategy":"传播策略","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',1,'2025-12-19 02:22:19','2025-12-19 02:22:19');
INSERT INTO page_tool_configs VALUES('tech-article-default','tech-article','技术通稿','AI内容助手','更多工具箱','ai-search.workflows.selection.tech-article','["ppt-outline","translation"]','{"five-view-analysis":"技术转译","three-fix-analysis":"用户场景挖掘","tech-matrix":"技术矩阵","propagation-strategy":"传播策略","exhibition-video":"展具与视频","translation":"翻译","ppt-outline":"技术讲稿","script":"脚本"}',1,'2025-12-19 02:22:19','2025-12-19 02:22:19');
CREATE TABLE public_page_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        display_mode TEXT NOT NULL DEFAULT 'all',
        workflow_id TEXT,
        role_ids TEXT,
        access_token TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        template_type TEXT,
        custom_html TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
INSERT INTO public_page_configs VALUES('public-config-1764234635784-90kkzr','技术包装','技术内容包装工作流公开页面','tech-package','role',NULL,'[]','a7980838d7f48530712324fe3dca613ec08ffae1c1c2591fc698c5756e450906',1,'ai-chat-source-tools',replace('<div class="flex h-screen bg-gray-50">\n  <!-- 左侧来源栏 -->\n  <div class="w-64 h-full bg-white border-r border-gray-200 flex flex-col">\n    <!-- 标题和操作按钮 -->\n    <div class="p-4 border-b border-gray-200">\n      <h2 class="text-lg font-semibold text-gray-900 mb-3">来源</h2>\n      <div class="flex gap-2">\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n          </svg>\n          添加文件\n        </button>\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>\n          </svg>\n          知识库选择\n        </button>\n      </div>\n    </div>\n    <!-- 选择所有来源 -->\n    <div class="px-4 py-3 border-b border-gray-200">\n      <label class="flex items-center gap-2 cursor-pointer">\n        <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />\n        <span class="text-sm text-gray-700">选择所有来源</span>\n      </label>\n    </div>\n    <!-- 来源列表 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4 text-center text-gray-500 text-sm">\n        暂无来源，点击"添加文件"或"知识库选择"添加来源\n      </div>\n    </div>\n  </div>\n  <!-- 中间AI对话栏 -->\n  <div class="flex-1 flex flex-col">\n    <div class="bg-white border-b border-gray-200 px-6 py-4">\n      <div class="flex items-center justify-between">\n        <div>\n          <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>\n          <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>\n              技术包装\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术策略\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术通稿\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              发布会稿\n            </span>\n          </div>\n        </div>\n        <div class="flex items-center space-x-2">\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n            </svg>\n            <span>新对话</span>\n          </button>\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>\n            </svg>\n            <span>搜索历史记录</span>\n          </button>\n        </div>\n      </div>\n    </div>\n    <div class="flex-1 overflow-y-auto p-6">\n      <div class="flex flex-col items-center justify-center h-full">\n        <div class="text-center">\n          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">\n            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>\n            </svg>\n          </div>\n          <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>\n          <p class="text-gray-500 text-sm max-w-md">\n            我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。\n          </p>\n        </div>\n      </div>\n    </div>\n    <div class="bg-white border-t border-gray-200 p-4"></div>\n  </div>\n  <!-- 右侧工具箱栏 -->\n  <div class="w-80 h-full bg-white border-l border-gray-200 flex flex-col">\n    <!-- 标题 -->\n    <div class="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">\n      <div class="flex-1 flex flex-col justify-center">\n        <h2 class="text-lg font-semibold text-gray-900">更多工具箱</h2>\n        <div class="text-xs text-transparent mt-1">占位</div>\n      </div>\n    </div>\n    <!-- 工具网格 -->\n    <div class="p-4 border-b border-gray-200">\n      <div class="grid grid-cols-2 gap-3">\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">技术转译</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">用户场景挖掘</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">发布会场景化</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">领导人口语化</span>\n        </button>\n      </div>\n    </div>\n    <!-- 相关内容 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4">\n        <h3 class="text-sm font-medium text-gray-700 mb-3">相关内容</h3>\n        <div class="text-center py-8 text-gray-400 text-sm">\n          暂无相关内容\n        </div>\n      </div>\n    </div>\n  </div>\n</div>','\n',char(10)),'2025-11-27 09:10:35','2025-11-27 09:10:35');
INSERT INTO public_page_configs VALUES('public-config-1764234635808-87sl2q','技术策略','技术策略生成工作流公开页面','tech-strategy','role',NULL,'[]','f3effe2c8f5493f773fb8c68ba0d861f3d9fbcf0c4eb6b58799457ef852c546f',1,'ai-chat-source-tools',replace('<div class="flex h-screen bg-gray-50">\n  <!-- 左侧来源栏 -->\n  <div class="w-64 h-full bg-white border-r border-gray-200 flex flex-col">\n    <!-- 标题和操作按钮 -->\n    <div class="p-4 border-b border-gray-200">\n      <h2 class="text-lg font-semibold text-gray-900 mb-3">来源</h2>\n      <div class="flex gap-2">\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n          </svg>\n          添加文件\n        </button>\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>\n          </svg>\n          知识库选择\n        </button>\n      </div>\n    </div>\n    <!-- 选择所有来源 -->\n    <div class="px-4 py-3 border-b border-gray-200">\n      <label class="flex items-center gap-2 cursor-pointer">\n        <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />\n        <span class="text-sm text-gray-700">选择所有来源</span>\n      </label>\n    </div>\n    <!-- 来源列表 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4 text-center text-gray-500 text-sm">\n        暂无来源，点击"添加文件"或"知识库选择"添加来源\n      </div>\n    </div>\n  </div>\n  <!-- 中间AI对话栏 -->\n  <div class="flex-1 flex flex-col">\n    <div class="bg-white border-b border-gray-200 px-6 py-4">\n      <div class="flex items-center justify-between">\n        <div>\n          <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>\n          <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>\n              技术包装\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术策略\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术通稿\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              发布会稿\n            </span>\n          </div>\n        </div>\n        <div class="flex items-center space-x-2">\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n            </svg>\n            <span>新对话</span>\n          </button>\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>\n            </svg>\n            <span>搜索历史记录</span>\n          </button>\n        </div>\n      </div>\n    </div>\n    <div class="flex-1 overflow-y-auto p-6">\n      <div class="flex flex-col items-center justify-center h-full">\n        <div class="text-center">\n          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">\n            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>\n            </svg>\n          </div>\n          <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>\n          <p class="text-gray-500 text-sm max-w-md">\n            我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。\n          </p>\n        </div>\n      </div>\n    </div>\n    <div class="bg-white border-t border-gray-200 p-4"></div>\n  </div>\n  <!-- 右侧工具箱栏 -->\n  <div class="w-80 h-full bg-white border-l border-gray-200 flex flex-col">\n    <!-- 标题 -->\n    <div class="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">\n      <div class="flex-1 flex flex-col justify-center">\n        <h2 class="text-lg font-semibold text-gray-900">更多工具箱</h2>\n        <div class="text-xs text-transparent mt-1">占位</div>\n      </div>\n    </div>\n    <!-- 工具网格 -->\n    <div class="p-4 border-b border-gray-200">\n      <div class="grid grid-cols-2 gap-3">\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">技术转译</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">用户场景挖掘</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">发布会场景化</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">领导人口语化</span>\n        </button>\n      </div>\n    </div>\n    <!-- 相关内容 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4">\n        <h3 class="text-sm font-medium text-gray-700 mb-3">相关内容</h3>\n        <div class="text-center py-8 text-gray-400 text-sm">\n          暂无相关内容\n        </div>\n      </div>\n    </div>\n  </div>\n</div>','\n',char(10)),'2025-11-27 09:10:35','2025-11-27 09:10:35');
INSERT INTO public_page_configs VALUES('public-config-1764234635823-2tbko','技术通稿','核心内容生成工作流公开页面','tech-article','role',NULL,'[]','a14b894d154f9117f369b1da939ab6748ddb5e3cce13ddc29fb42aedadec2ebb',1,'ai-chat-source-tools',replace('<div class="flex h-screen bg-gray-50">\n  <!-- 左侧来源栏 -->\n  <div class="w-64 h-full bg-white border-r border-gray-200 flex flex-col">\n    <!-- 标题和操作按钮 -->\n    <div class="p-4 border-b border-gray-200">\n      <h2 class="text-lg font-semibold text-gray-900 mb-3">来源</h2>\n      <div class="flex gap-2">\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n          </svg>\n          添加文件\n        </button>\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>\n          </svg>\n          知识库选择\n        </button>\n      </div>\n    </div>\n    <!-- 选择所有来源 -->\n    <div class="px-4 py-3 border-b border-gray-200">\n      <label class="flex items-center gap-2 cursor-pointer">\n        <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />\n        <span class="text-sm text-gray-700">选择所有来源</span>\n      </label>\n    </div>\n    <!-- 来源列表 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4 text-center text-gray-500 text-sm">\n        暂无来源，点击"添加文件"或"知识库选择"添加来源\n      </div>\n    </div>\n  </div>\n  <!-- 中间AI对话栏 -->\n  <div class="flex-1 flex flex-col">\n    <div class="bg-white border-b border-gray-200 px-6 py-4">\n      <div class="flex items-center justify-between">\n        <div>\n          <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>\n          <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>\n              技术包装\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术策略\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术通稿\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              发布会稿\n            </span>\n          </div>\n        </div>\n        <div class="flex items-center space-x-2">\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n            </svg>\n            <span>新对话</span>\n          </button>\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>\n            </svg>\n            <span>搜索历史记录</span>\n          </button>\n        </div>\n      </div>\n    </div>\n    <div class="flex-1 overflow-y-auto p-6">\n      <div class="flex flex-col items-center justify-center h-full">\n        <div class="text-center">\n          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">\n            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>\n            </svg>\n          </div>\n          <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>\n          <p class="text-gray-500 text-sm max-w-md">\n            我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。\n          </p>\n        </div>\n      </div>\n    </div>\n    <div class="bg-white border-t border-gray-200 p-4"></div>\n  </div>\n  <!-- 右侧工具箱栏 -->\n  <div class="w-80 h-full bg-white border-l border-gray-200 flex flex-col">\n    <!-- 标题 -->\n    <div class="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">\n      <div class="flex-1 flex flex-col justify-center">\n        <h2 class="text-lg font-semibold text-gray-900">更多工具箱</h2>\n        <div class="text-xs text-transparent mt-1">占位</div>\n      </div>\n    </div>\n    <!-- 工具网格 -->\n    <div class="p-4 border-b border-gray-200">\n      <div class="grid grid-cols-2 gap-3">\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">技术转译</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">用户场景挖掘</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">发布会场景化</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">领导人口语化</span>\n        </button>\n      </div>\n    </div>\n    <!-- 相关内容 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4">\n        <h3 class="text-sm font-medium text-gray-700 mb-3">相关内容</h3>\n        <div class="text-center py-8 text-gray-400 text-sm">\n          暂无相关内容\n        </div>\n      </div>\n    </div>\n  </div>\n</div>','\n',char(10)),'2025-11-27 09:10:35','2025-12-05 02:10:55');
INSERT INTO public_page_configs VALUES('public-config-1764902018950-414tv','发布会稿','技术发布内容生成工作流公开页面','press-release','role',NULL,'[]','251020628e477e7c84b8aba401f687dc4890df04195a1a582230a703155f82ec',1,'ai-chat-source-tools',replace('<div class="flex h-screen bg-gray-50">\n  <!-- 左侧来源栏 -->\n  <div class="w-64 h-full bg-white border-r border-gray-200 flex flex-col">\n    <!-- 标题和操作按钮 -->\n    <div class="p-4 border-b border-gray-200">\n      <h2 class="text-lg font-semibold text-gray-900 mb-3">来源</h2>\n      <div class="flex gap-2">\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n          </svg>\n          添加文件\n        </button>\n        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">\n          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>\n          </svg>\n          知识库选择\n        </button>\n      </div>\n    </div>\n    <!-- 选择所有来源 -->\n    <div class="px-4 py-3 border-b border-gray-200">\n      <label class="flex items-center gap-2 cursor-pointer">\n        <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />\n        <span class="text-sm text-gray-700">选择所有来源</span>\n      </label>\n    </div>\n    <!-- 来源列表 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4 text-center text-gray-500 text-sm">\n        暂无来源，点击"添加文件"或"知识库选择"添加来源\n      </div>\n    </div>\n  </div>\n  <!-- 中间AI对话栏 -->\n  <div class="flex-1 flex flex-col">\n    <div class="bg-white border-b border-gray-200 px-6 py-4">\n      <div class="flex items-center justify-between">\n        <div>\n          <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>\n          <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>\n              技术包装\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术策略\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              技术通稿\n            </span>\n            <span class="flex items-center">\n              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>\n              发布会稿\n            </span>\n          </div>\n        </div>\n        <div class="flex items-center space-x-2">\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>\n            </svg>\n            <span>新对话</span>\n          </button>\n          <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">\n            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>\n            </svg>\n            <span>搜索历史记录</span>\n          </button>\n        </div>\n      </div>\n    </div>\n    <div class="flex-1 overflow-y-auto p-6">\n      <div class="flex flex-col items-center justify-center h-full">\n        <div class="text-center">\n          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">\n            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>\n            </svg>\n          </div>\n          <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>\n          <p class="text-gray-500 text-sm max-w-md">\n            我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。\n          </p>\n        </div>\n      </div>\n    </div>\n    <div class="bg-white border-t border-gray-200 p-4"></div>\n  </div>\n  <!-- 右侧工具箱栏 -->\n  <div class="w-80 h-full bg-white border-l border-gray-200 flex flex-col">\n    <!-- 标题 -->\n    <div class="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">\n      <div class="flex-1 flex flex-col justify-center">\n        <h2 class="text-lg font-semibold text-gray-900">更多工具箱</h2>\n        <div class="text-xs text-transparent mt-1">占位</div>\n      </div>\n    </div>\n    <!-- 工具网格 -->\n    <div class="p-4 border-b border-gray-200">\n      <div class="grid grid-cols-2 gap-3">\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">技术转译</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">用户场景挖掘</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">发布会场景化</span>\n        </button>\n        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">\n          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>\n          </svg>\n          <span class="text-xs text-gray-700 text-center">领导人口语化</span>\n        </button>\n      </div>\n    </div>\n    <!-- 相关内容 -->\n    <div class="flex-1 overflow-y-auto">\n      <div class="p-4">\n        <h3 class="text-sm font-medium text-gray-700 mb-3">相关内容</h3>\n        <div class="text-center py-8 text-gray-400 text-sm">\n          暂无相关内容\n        </div>\n      </div>\n    </div>\n  </div>\n</div>','\n',char(10)),'2025-12-05 02:33:38','2025-12-05 02:33:38');
CREATE TABLE article_types (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , requirement TEXT);
INSERT INTO article_types VALUES('at_1767775238878_5o0knx2id','media_release','媒体通稿','面向媒体的新闻通稿',1,1,'2026-01-07T08:40:38.878Z','2026-01-07T08:40:38.878Z',NULL);
INSERT INTO article_types VALUES('at_1767775238881_35j83z11u','internal_memo','内部通报','面向内部的通报文档',1,2,'2026-01-07T08:40:38.881Z','2026-01-07T08:40:38.881Z',NULL);
INSERT INTO article_types VALUES('at_1767775238884_8ayoeno4q','social_media','社交媒体','面向社交媒体的内容',1,3,'2026-01-07T08:40:38.884Z','2026-01-07T08:40:38.884Z',NULL);
CREATE TABLE article_type_ai_roles (
        id TEXT PRIMARY KEY,
        article_type_id TEXT NOT NULL,
        ai_role_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_type_id) REFERENCES article_types(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_role_id) REFERENCES ai_roles(id) ON DELETE CASCADE,
        UNIQUE(article_type_id, ai_role_id)
      );
CREATE TABLE brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_en TEXT,
      logo_url TEXT,
      country TEXT,
      founded_year INTEGER,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO brands VALUES(6,'吉利',NULL,NULL,NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO brands VALUES(7,'领克',NULL,NULL,NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO brands VALUES(8,'吉利银河',NULL,NULL,NULL,NULL,NULL,'active','2025-12-25 07:05:15','2025-12-25 07:05:15');
INSERT INTO brands VALUES(9,'极氪',NULL,NULL,NULL,NULL,NULL,'active','2025-12-26 06:37:30','2025-12-26 06:37:30');
CREATE TABLE car_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT,
        category TEXT CHECK (category IN ('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'pickup', 'van', 'mpv')),
        launch_year INTEGER,
        end_year INTEGER,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'planned')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
      );
INSERT INTO car_models VALUES(11,6,'星舰7',NULL,'suv',NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO car_models VALUES(12,6,'银河E5',NULL,'suv',NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO car_models VALUES(13,6,'银河L6',NULL,'suv',NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO car_models VALUES(14,6,'银河L7',NULL,'suv',NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO car_models VALUES(15,7,'领克07',NULL,'suv',NULL,NULL,NULL,'active','2025-12-08 08:23:55','2025-12-08 08:23:55');
INSERT INTO car_models VALUES(16,8,'银河E5',NULL,NULL,NULL,NULL,NULL,'active','2025-12-25 07:06:22','2025-12-25 07:06:22');
INSERT INTO car_models VALUES(17,8,'银河E8',NULL,NULL,NULL,NULL,NULL,'active','2025-12-25 07:06:31','2025-12-25 07:06:31');
CREATE TABLE car_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        description TEXT,
        launch_year INTEGER,
        end_year INTEGER,
        market_segment VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (model_id) REFERENCES car_models(id) ON DELETE CASCADE,
        UNIQUE(model_id, name)
      );
CREATE TABLE tech_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id INTEGER,
        level INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES tech_categories(id) ON DELETE SET NULL
      );
INSERT INTO tech_categories VALUES(1,'大安全','代码: G-safe',NULL,1,0,'active','2025-11-27 03:13:11','2025-12-08 06:13:32');
INSERT INTO tech_categories VALUES(2,'智能化','代码: G-AI',NULL,1,0,'active','2025-11-27 03:13:50','2025-12-08 06:13:32');
INSERT INTO tech_categories VALUES(3,'新能源','代码: G-power',NULL,1,0,'active','2025-11-28 06:33:31','2025-12-08 06:13:32');
INSERT INTO tech_categories VALUES(4,'数字底盘与架构','代码: G-pilot',NULL,1,0,'active','2025-11-28 06:34:09','2025-12-08 06:13:32');
INSERT INTO tech_categories VALUES(5,'大健康','代码: G-health',NULL,1,0,'active','2025-11-28 06:34:30','2025-12-08 06:13:32');
INSERT INTO tech_categories VALUES(6,'全球化','代码: G-globel',NULL,1,0,'active','2025-11-28 06:34:49','2025-12-08 06:13:32');
INSERT INTO tech_categories VALUES(7,'动力系统','发动机、电机、传动系统等相关技术',NULL,1,1,'active','2025-12-18 05:35:30','2025-12-18 05:35:30');
INSERT INTO tech_categories VALUES(8,'智能驾驶','自动驾驶、辅助驾驶相关技术',NULL,1,2,'active','2025-12-18 05:35:30','2025-12-18 05:35:30');
INSERT INTO tech_categories VALUES(9,'车联网','车载通信、物联网技术',NULL,1,3,'active','2025-12-18 05:35:30','2025-12-18 05:35:30');
INSERT INTO tech_categories VALUES(11,'安全技术','主动安全、被动安全技术',NULL,1,5,'active','2025-12-18 05:35:30','2025-12-18 05:35:30');
CREATE TABLE tech_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER,
        parent_id INTEGER,
        level INTEGER NOT NULL DEFAULT 1,
        tech_type VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        tags TEXT,
        technical_details TEXT,
        benefits TEXT,
        applications TEXT,
        keywords TEXT,
        source_url VARCHAR(500),
        created_by VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, tpd_id VARCHAR(100), car_models_info TEXT, resources_info TEXT, knowledge_info TEXT,
        FOREIGN KEY (category_id) REFERENCES tech_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES tech_points(id) ON DELETE SET NULL
      );
INSERT INTO tech_points VALUES(1,'千里浩瀚H7',replace('【技术原理/参数/价值/边界（简版）】\n原理：智能驾驶\n价值：敬请期待\n适用边界：敬请期待\n【技术亮点/证据体系】','\n',char(10)),2,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-27 03:14:11','2025-12-26 06:29:01',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(2,'千里浩瀚H5',replace('【技术原理/参数/价值/边界（简版）】\n原理：吉利智能辅助驾驶\n价值：敬请期待\n适用边界：敬请期待\n【技术亮点/证据体系】','\n',char(10)),2,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-27 06:38:41','2025-12-26 06:28:58',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(5,'未绑定 - 千里浩瀚',replace('【技术原理/参数/价值/边界（简版）】\n原理：智能驾驶\n价值：敬请期待\n适用边界：敬请期待\n【技术亮点/证据体系】','\n',char(10)),NULL,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-27 02:54:01','2025-12-26 06:29:02',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(35,'Flyme Sound无界之声 v1.0','1',2,NULL,1,'feature','medium','archived',NULL,'{"highlights":[],"evidence_measured":[],"evidence_certified":[],"evidence_comparison":[]}',NULL,NULL,NULL,NULL,NULL,'2025-11-28 10:58:31','2025-12-01 09:14:48',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(125,'雷神AI电混2.0','吉利汽车发布的行业首个全域AI赋能的超级电混系统，基于“星睿AI云动力2.0”智能体，融合了雷神EM-i（极致节能）、雷神EM-P（高性能）及雷神醇氢EF三大技术路线，实现了从“机械驱动”向“AI智能驱动”的代际跨越。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **AI核心**：依托星睿AI云动力2.0（23.5 EFLOPS算力），构建数字孪生场景库，实现智慧能量、运动、健康及补能管理；\n2. **硬件基座**：搭载热效率47.26%的混动专用发动机（驭风火龙卷燃烧系统）与11合1智能电驱（SiC升压模块）；\n3. **控制逻辑**：通过AI预判路况与驾驶习惯，动态调整油电策略与扭矩分配。","tech_value":"彻底解决了混动车“馈电油耗高、性能衰减”的痛点，为用户提供“极致节能（2L级油耗）+超长续航（2000km+）+智能进化（支持OTA）”的用车体验。","tech_boundary":"老车主OTA升级功能需等到2025年第四季度推送 *","highlights":["全球最高量产发动机热效率47.26%","行业首个动力域AI智能体（星睿AI云动力2.0）","支持老车主OTA升级，常用常新","包含雷神醇氢EF技术，热效率达48.15% *","全域无损电感，满电/馈电加速差异仅0.03秒"],"evidence_measured":["吉利银河A7实测百公里馈电油耗2.49L","吉利银河星舰7综合续航2390km","吉利银河M9零百加速4.5s"],"evidence_certified":["行业首个全域低能耗证书","动力系统智能化“S”级认证 *"],"evidence_comparison":["高速巡航油耗增幅仅8%，优于单挡混动（如DM-i）的25%","直驱模式效率比增程式提升30%","热效率47.26%超越比亚迪第五代DM（46.06%） *"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(126,'雷神EM-P超级电混 (AI版)','吉利汽车基于“星睿AI云动力2.0”打造的高性能混动系统，结合“3挡DHT Pro/3DHT”多挡位架构与全域AI控制，主打“节能更性能”，彻底解决传统混动高速乏力与亏电性能衰减的痛点。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **架构**：采用P1+P2双电机（3挡DHT Pro）或P1+P3双电机（3DHT）的多挡串并联结构，发动机始终工作在高效区；\n2. **电驱**：11合1高度集成电驱，集成SiC升压模块，实现满电/亏电性能一致；\n3. **AI控制**：依托星睿AI云动力2.0，预判路况（如坡度、拥堵）动态调整能量管理策略。","tech_value":"实现了“高性能（4秒级加速）+低能耗（4L级油耗）+高安全（冗余设计）”的统一，让混动车在高速、越野、馈电等极限场景下依然保持强劲动力与低能耗。","tech_boundary":"高性能版本（如后轴双电机）主要应用于中大型SUV或皮卡车型；部分功能（如OTA）需等待2025年Q4推送 *","highlights":["3挡DHT多挡位架构，高速油耗仅增8%（竞品增25%）","11合1智能电驱，功率密度提升20%","SiC碳化硅升压模块，亏电动力无衰减","5动力源冗余设计（发动机+P1+P2/P3+后轴双电机）","神盾电池5级防护，支持-30℃至60℃全气候运行"],"evidence_measured":["百公里加速4.5秒（吉利银河M9）","馈电油耗4L/100km","综合续航超1500km","电驱传动效率98.8%","外放电功率21kW（皮卡版本） *"],"evidence_certified":["神盾电池36项极限测试（23项超国标）"],"evidence_comparison":["高速（150km/h）油耗相比120km/h仅增加8%，优于单挡混动的25%","爬坡能力优于燃油车（重载65%坡度） *","直驱模式高速效率比增程式提升30%"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(127,'雷神EM-i超级电混','吉利汽车自主研发的全新一代“极致节能”插电混动系统，基于“全域AI+硬件革新”理念，旨在成为全球新一代“混动节能之王”。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **架构**：采用P1+P3双电机串并联架构（单挡E-DHT 11合1），主打极致效率；\n2. **核心硬件**：搭载热效率47.26%的BHE15混动专用发动机（全球最高量产热效率）与SiC无级升压模块；\n3. **AI赋能**：引入星睿AI云动力2.0，通过数字孪生技术实现智慧能量管理与运动控制。","tech_value":"彻底解决了传统混动“馈电油耗高、高速动力弱、低温续航短”的痛点，为用户提供“2L级油耗+2000km级续航+不失速”的安心体验。","tech_boundary":"主打节能与家用市场，极致性能场景（如越野、赛道）建议选择EM-P版本 *","highlights":["全球最高量产发动机热效率47.26%","实测续航2390.5km，刷新混动续航纪录","E-DHT 11合1电驱，结构减重13.5%","SiC无级升压技术，满电/馈电加速性能基本一致","行业首发混动安全冗余技术（发动机/P1/P3互为备份）"],"evidence_measured":["吉利银河星舰7实测续航2390.5km","吉利银河A7实测百公里馈电油耗2.49L","高速155km/h亏电连续行驶2小时无性能衰减","百公里加速7.5秒（吉利银河星舰7） *"],"evidence_certified":["行业首个“全域低能耗”认证证书","中汽中心权威认证 *"],"evidence_comparison":["热效率47.26%超越比亚迪第五代DM（46.06%） *","百公里馈电油耗2.67L（CLTC）优于同级竞品","电机效率98.02%，行业第一"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(128,'神盾短刀电池','吉利汽车自研自产的最新一代“刀片式”磷酸铁锂电池，采用独特的短刀片结构设计，在安全性、循环寿命、快充能力及低温性能上实现了全面突破，被定义为新一代磷酸铁锂电池的最佳形态。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **物理结构降阻**：基于电阻定律(R=ρL/S)，将电芯长度缩短至580mm（比长刀电池缩短约40%），厚度增加至18.2mm，通过物理尺寸优化显著降低内阻和发热量。*\n2. **材料体系升级**：采用湿法双涂层隔膜（提高柔韧性与防穿刺能力）、氧化铝耐热涂层（构建正负极“隔离带”）、细管径碳纳米管（打造离子“高速公路”）及低阻抗电解液添加剂。*\n3. **结构集成技术**：应用CTB电池车身一体化技术，配合“田”字形框架及吸能缓冲空间，实现液电分离与热量疏导。*","tech_value":"彻底解决了新能源汽车用户的四大核心痛点：极致的安全性消除起火焦虑；超长循环寿命实现“一代电池服务两代车”，提升二手保值率；超快充技术显著减少补能等待；卓越的低温性能解决了冬季续航大幅衰减的问题。","tech_boundary":"基于磷酸铁锂化学体系，主要通过吉利自建的建湖耀宁及贵阳闪聚工厂生产，广泛适配轿车、SUV、MPV及商用车等多种车型平台。 *","highlights":["“军工级”安全标准：8针同刺、真弹枪击不起火 *","17分钟极速快充（10%-80%） *","3500圈超长循环寿命，支持行驶超100万公里 *","-30℃极寒环境下容量保持率超90% *","能量密度高达192Wh/kg，体积利用率提升50% *"],"evidence_measured":["8针同刺试验：8根直径5mm钢针同时穿刺并静置1小时，不冒烟、不起火、不爆炸 *","真弹枪击试验：全球首个通过5.8mm自动步枪子弹以920m/s速度击穿测试，创口直径≥60mm仍保持稳定 *","充电实测：10%-80% SOC充电仅需17分4秒 *","实车耐久：银河E5行驶30万公里后电池健康度仍达90.5% *","低温实测：-30℃环境下容量保持率高达90.54% *"],"evidence_certified":["行业首张“新能源汽车安全管理体系认证”证书 *","中汽中心6大“魔鬼”串行试验通过认证（动态海水腐蚀、高原极寒、高频刮底、26吨碾压、侧柱碰、烈焰炙烤） *"],"evidence_comparison":["充电倍率：平均充电倍率2.45C，相比长刀电池（1.61C）提升约52% *","低温性能：-30℃容量保持率90.54%，领先长刀电池（78.96%）约11.6个百分点 *","热管理：因内阻降低，发热量相比长刀电池减少30% *","结构效率：长度缩短40%，体积利用率提升50%以上 *"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(129,'神盾电池安全系统','吉利汽车研发的电池全维安全保护体系，以“无盲区”防护为理念，从电芯、PACK、整车架构到云端智能监控，构建了“软硬融合”的四层防护网络。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **硬件层**：采用“潜艇式”车身结构与田字格框架专利，底部设三重防护（超高强钢护板+吸能结构），抗剪切力提升58%；\n2. **电芯层**：应用低反应活性电解液与耐热涂层隔膜，阻断热失控源头；\n3. **软件层**：BMS 3.0电池医生实时监测200+项参数，结合云端星睿智算中心实现故障预警与碰撞毫秒级断电。","tech_value":"打破了仅关注电芯安全的局限，实现了“基础安全、整车安全、智能安全、健康安全”的全面覆盖，彻底消除用户对电池起火、辐射及车内健康的焦虑。","tech_boundary":"安全防护系统需配合特定车身结构（如CMA架构）才能发挥最大效能 *","highlights":["首创“基础+整车+智能+健康”四大安全标准","“潜艇式”整车架构，抗剪切力超国标58%","田字格框架专利，整车扭转刚度31000N·m/deg","BMS 3.0电池医生+云端智算中心，碰撞0.05秒断电","国内首获新能源汽车电磁防辐射001号认证 *"],"evidence_measured":["8mm钢针穿刺不起火（超国标5mm）","2米高度三面跌落零泄漏（国标1米）","外部火烧时长超国标50%","1米深海水浸泡24小时无泄漏（国标0.5小时）"],"evidence_certified":["新能源汽车电磁防辐射001号认证 *","Euro NCAP/ANCAP双五星认证（搭载车型） *"],"evidence_comparison":["底部抗碰撞能力参与制定行业首个国标 *","低温（-30℃）续航达成率＞90%，优于行业平均（＜80%）","电池包抗剪切力由23.6kN提升至37.4kN"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(130,'雷霆11合1智能电驱','吉利汽车研发的行业首个实现11大核心部件深度集成的电驱动系统，融合了电机、电控、减速器及各类控制器，代表了当前电驱集成技术的巅峰水平。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **高度集成**：将P1+P3电机、双电控（SiC）、VCU、TCU、PDU、传动系统、TMS热管理及G-TCS等11个模块整合为一；\n2. **核心技术**：采用混碳电控技术（IGBT+SiC）、双端X-Pin扁线绕组及高精度喷淋油冷技术；\n3. **智能控制**：通过AI动力寻优算法与G-TCS主动防滑系统，实现毫秒级扭矩响应。","tech_value":"通过极致集成实现了“体积更小、重量更轻、效率更高”，为用户带来更长的续航里程、更强的动力响应及更宽泛的空间体验。","tech_boundary":"目前主要应用于吉利银河系列纯电及混动车型，未来将扩展至更多平台。","highlights":["行业最高集成度（11合1），体积缩减30%，重量减轻13.5%","电机效率高达98.02%，系统综合效率92.5%","混碳电控技术，功率控制效率突破99%","SiC无级升压模块，亏电动力无衰减","获得国内首张电驱动总成5A级认证证书"],"evidence_measured":["百公里电耗最低11.9 kWh（吉利银河E5）","系统综合效率90.04%（行业主流85%-88%）","亏电动力衰减≤3%（行业主流15%-30%）","连续10次全油门加速效率衰减＜5%"],"evidence_certified":["中汽研电驱动总成5A级认证（001号证书）"],"evidence_comparison":["相比行业主流“三合一/六合一”，部件数量减少40%，故障点大幅降低","传动效率98.8%，优于行业平均水平","噪音控制仅78dB，媲美百万级豪车"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(131,'E-DHT 11合1混动电驱','吉利雷神EM-i超级电混系统的核心驱动单元，采用“纯电11合1”集成理念，将P1+P3双电机、双电控、传动系统等11大核心部件高度整合，主打极致节能与高效。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **架构**：采用P1+P3双电机串并联+单挡变速（E-DHT）构型，电机主要负责驱动，发动机负责发电或高速直驱；\n2. **集成**：融合电机、电控（SiC）、VCU、TCU、PDU、TMS热管理及G-TCS等11个模块，实现“机电热控”一体化；\n3. **工艺**：应用双端X-Pin扁线绕组与高精度喷淋油冷技术。","tech_value":"通过高度集成化设计，实现了结构更紧凑（减重13.5%）、效率更高（电机效率98.02%）和成本更优，是实现“2L级油耗”的关键硬件支撑。","tech_boundary":"主要适用于追求极致节能与性价比的家用车型（如EM-i平台），高性能需求（如越野）通常采用3DHT版本 *","highlights":["11合1超高集成度，体积缩减30%","P1+P3双电机+单挡结构，专注于极致能效","引入碳化硅（SiC）无级升压模块，亏电动力不衰减","电机最高效率98.02%，系统综合效率92.5%","具备双电机安全冗余能力（互为备份）"],"evidence_measured":["结构减重13.5%","功率密度提升20%","换热效率提升20%（相比传统水冷）","吉利银河星舰7实测百公里馈电油耗2.49L"],"evidence_certified":["电驱动总成5A级认证 *"],"evidence_comparison":["相比传统3DHT混动电驱，结构更简单，能耗更低（高速油耗仅增8% vs 单挡竞品25%） *","相比同级“六合一”电驱，部件数量减少40%，可靠性更高"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(132,'杭州湾中央试验基地','1',6,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-26 06:59:17',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(133,'吐鲁番高温试验基地','1',6,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-26 06:59:15',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(134,'海南湿热试验基地','1',6,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-26 06:59:13',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(135,'黑河高寒试验基地','1',6,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-26 06:59:11',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(136,'欧洲试验基地','1',6,NULL,1,'feature','medium','archived',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-26 06:59:09',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(137,'全球化试验基地 v1.0',replace('【一句话说明（slogan）】\n敬请期待\n【技术品牌定位与愿景】\n定位：敬请期待\n愿景：敬请期待\n【用户体验与场景】\n敬请期待','\n',char(10)),6,NULL,1,'feature','medium','active',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(138,'吉利健康循环材料','吉利汽车基于“生态造车”理念构建的全方位智能健康安全材料体系，涵盖车内生态健康、材料循环利用及全生命周期减碳三大维度，旨在打造“移动健康空间+零碳出行”协同的生态闭环。',5,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **健康防护技术**：采用CN95高效复合空调滤芯（集成活性炭与防过敏层）及银离子抗菌涂层技术，通过物理阻隔与化学抑制结合保障座舱空气与接触面安全。\n2. **循环再生闭环**：建立“三端协同一体化”降碳路径，实施钢材、铝材及塑料的闭环回收（如冲压废钢100%回收、发动机铝屑回收），并利用伺服冲压与干式喷房技术减少制造能耗。\n3. **生态材料设计**：研发并应用循环仿麂皮、循环PET纤维等生物基或再生材料，替代原生矿产与石油资源。","tech_value":"对用户而言，提供“母婴级”极致健康座舱，显著降低车内异味（VOC）、致病菌及颗粒物风险；对社会而言，通过资源高效循环大幅减少碳排放与废弃物，推动汽车产业从“资源消耗型”向“循环再生型”转型。","tech_boundary":"循环材料的大规模应用需平衡成本与物理性能稳定性；目前主要在极氪、领克及银河系列的中高端车型上优先落地，并逐步向全系推广。","highlights":["CN95高效复合空调滤芯（国内首个认证）","纳米银离子抗菌方向盘与换挡球头","100%回收再生原料的循环仿麂皮与PET纤维","冲压废钢100%闭环回收再生体系","“报废车-电池-材料”三级回收网络"],"evidence_measured":["抗菌表面材料抗菌率达99.9%","CN95滤芯对直径≥0.3µm颗粒过滤效率达95%","单车减碳19kg（相当于2棵树年固碳量）","制造端碳排放较2020年下降50%","再生铝节能90%以上，碳排放量减少95%"],"evidence_certified":["中汽研CN95滤芯001号认证","ISO 17025国际标准认证（内饰）","国际抗菌I级要求","全国首批“无废企业”"],"evidence_comparison":["抗菌率99.9%（优于国标Ⅰ级99%）","VOC排放量仅为国标限值的1/10","循环材料应用比例逐步领先行业（2025年目标：循环钢20%、循环铝30%）"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(139,'BMA基础模块化架构','吉利汽车完全自主研发的全球化模块化造车平台，专注于A0至A+级车型（小型到紧凑型），旨在以灵活性和高性价比满足全球市场需求。',4,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **模块化设计**：将动力、电气、底盘、车身等模块标准化，像“积木”一样自由组合，零部件通用率达70%。\n2. **空间优化**：通过动力总成布局优化、悬挂系统精简及座椅人机工程改进，在同等车身尺寸下实现同级领先的乘坐空间。\n3. **多动力兼容**：同步支持传统燃油（1.0TD/1.4T/1.5TD）、PHEV插混、HEV油电混动及MHEV轻混动力系统。","tech_value":"研发效率革命，研发周期缩短至18-24个月，研发成本降低20%-30%；为用户提供超越同级（7.9秒加速）的性能与L2级智能驾驶体验，打破小型车低配印象；填补CMA架构以下的市场空白，支撑吉利全球化战略。","tech_boundary":"专注于A0至A+级车型（小型/紧凑型），轴距限制在2550-2700mm范围内。","highlights":["零部件通用率70%，研发周期缩短至18-24个月","轴距带宽2550-2700mm，轮距1500-1600mm","支持L2级自动驾驶，预留L3级升级能力","车身70%高强度钢+20%热成型钢，满足中欧双五星标准","兼容燃油、HEV、PHEV、MHEV多种动力"],"evidence_measured":["缤越1.5TD百公里加速7.9秒","1.5TD发动机热效率40%","研发成本降低20%-30%"],"evidence_certified":["中欧双五星安全碰撞标准"],"evidence_comparison":["研发周期18-24个月（传统平台需40个月）","乘坐空间利用率同级领先（优于竞品）","同级少有的L2级智驾下放"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(140,'雷神醇氢EF','吉利汽车在2025年推出的全球独创甲醇混合动力技术，隶属于雷神AI电混2.0体系。支持甲醇、汽油、电能任意比例混合加注，实现超低成本与极致低碳的出行体验。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **超高热效率引擎**：第五代醇氢专用发动机采用超高压缸内直喷、湍流燃烧技术及纳米级燃料雾化，热效率达全球最高的48.15%。\n2. **灵活燃料混注**：系统自动识别并切换最优燃烧模式，支持甲醇与汽油任意比例混注，无需用户区分燃料类型。\n3. **低温冷启动技术**：通过催化预热技术解决甲醇低温结晶难题，实现-40℃极寒环境一键启动。","tech_value":"解决新能源车续航焦虑、补能效率与成本痛点。每公里能耗成本低至0.2元（比燃油车省70%）；全生命周期碳减排42%，污染物排放大幅降低（PM减少98%）。","tech_boundary":"依赖甲醇加注网络布局（计划2025年656座，2027年4000座）；目前主要在商用车（远程重卡）及特定乘用车（2025年Q4上市新车）上应用。","highlights":["全球最高热效率48.15%醇氢专用发动机","支持甲醇/汽油/电能任意比例混合加注","-40℃极寒环境一键启动","每公里成本低至0.2元","综合续航超1200km，纯电续航＞150km"],"evidence_measured":["发动机热效率48.15%","甲醇加注成本低至2元/升","每公里能耗成本0.2元","零百加速7秒级","馈电油耗＜3L/100km"],"evidence_certified":["欧盟绿色转型战略燃料","全球独创醇氢发动机技术"],"evidence_comparison":["热效率48.15%（超越丰田氢发动机46%）","运营成本降低超20万元（重卡年运营对比柴油车）","PM颗粒物减少98%，氮氧化物下降82%（对比传统燃油）"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(141,'雷霆800V碳化硅电驱','吉利汽车自主研发的高压电气架构核心系统，融合800V高压平台与碳化硅（SiC）功率器件，实现能效、充电速度及动力性能的突破性提升。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **800V高压架构**：整车电压提升至550-930V，降低电流与线束损耗，提升能量传输效率。\n2. **SiC功率器件**：利用碳化硅的高耐温、高导热及高电子饱和速率特性，替代传统硅基IGBT，将逆变器效率提升至99.5%，开关频率提升10倍。\n3. **系统集成优化**：采用同轴双联齿行星排减速器设计与高精度喷淋油冷技术，提升扭矩密度与散热效率。","tech_value":"彻底解决新能源车续航焦虑与补能痛点。实现“充电9分钟，续航里程显著增加”的超充体验；整车能耗降低5-7%，系统轻量化降本15%；保障亏电状态下动力不衰减。","tech_boundary":"需配合800V超充桩以发挥最大补能优势；目前主要应用于中高端车型（如银河E8等），成本相对较高。","highlights":["400kW峰值功率，充电10%-80%≤9分钟","SiC模组效率高达99.5%","同轴双联齿行星排减速器，扭矩密度提升118%","馈电工况动力衰减≤4%（传统系统15%-30%）","行业首搭镁合金外壳，重量降低25%"],"evidence_measured":["充电10%-80%仅需9分钟","系统综合效率高达92.5%","电机效率最高98.02%","功率密度6.78kW/kg","WLTP工况整车能耗减少5-7%"],"evidence_certified":["中汽研电驱动总成5A级认证（行业首个）"],"evidence_comparison":["充电速度比400V平台快70%","系统效率提升7-12个百分点（对比400V Si系统）","功率密度提升50%（对比行业平均4.5kW/kg）","亏电动力衰减≤4%（优于传统系统15%-30%）"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(142,'神盾金砖电池','吉利汽车整合旗下电池技术资源后推出的新一代自研自产动力电池，融合“神盾电池安全系统”与“金砖电芯”高性能优势，以军工级安全标准和全域AI赋能重构新能源电池安全与性能。',3,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **材料创新**：应用晶盾复合材料（正极表面致密保护层）与石墨烯包覆硅碳负极，提升热失控温度至350℃及能量密度。\n2. **结构设计**：采用短刀电芯构型（长度压缩至580mm），配合蜂巢仿生+田字格框架CTB设计，降低内阻、提升散热效率及整车刚性。\n3. **AI智控**：集成BMS 3.0电池医生与云端算力，实时监测200+项参数，实现热失控提前预警与健康度自修复。","tech_value":"解决用户对新能源车电池安全、续航衰减及补能效率的焦虑。提供“军工级”安全防护，实现百万公里超长寿命与“充电17分钟续航大幅增加”的快充体验，大幅降低全生命周期用车成本。","tech_boundary":"主要应用于吉利银河、极氪等中高端新能源车型，需配合特定高压平台与快充网络发挥最大效能。","highlights":["军工级安全：通过8针同刺、5.8mm真弹枪击等极限测试","超长寿命：循环寿命超3500次，支持行驶超100万公里","极致快充：800V平台+SiC技术，17分钟充入70%电量","全气候适应：-30℃极寒续航达成率超90%","高能量密度：石墨烯包覆硅碳负极达215Wh/kg"],"evidence_measured":["热失控温度提升至350℃","循环寿命3500次","10%-80%充电仅需17分钟","-30℃低温容量保持率90.54%","能量密度215Wh/kg"],"evidence_certified":["全球首个通过5.8mm真弹枪击贯穿试验","美国UL“零热扩散”认证","ISO动力电池安全等级评定主导起草"],"evidence_comparison":["热失控温度350℃（传统电池约200℃）","低温放电容量保持率超90%（行业平均低8.7%）","充电速度提升52%（对比长刀电池）","内阻更低，发热量减少30%（对比长刀电池）"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(143,'吉利全域安全','吉利面向智能新能源时代构建的全维度安全防护体系，以“生命至上”为核心，覆盖生命、健康、财产、隐私四大安全域及九大安全系统，并于2025年升级为“全域AI安全”，实现从“被动保命”到“主动防患”的进化。',1,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"基于“4域9系”框架（生命/健康/财产/隐私4域，被动/主动/功能/信息/高压/防火/健康/使用/防盗9系）；2025年引入“全域AI”技术，利用星睿AI大模型（融合DeepSeek *）与“吉利未来出行星座”卫星网络，实现天地一体化感知与毫秒级风险预判。","tech_value":"打破传统汽车安全仅关注碰撞的局限，重新定义智能出行安全标准；通过技术下放实现“安全平权”，让入门级车型也能拥有百万级的安全防护能力；“安全是最高级的豪华” *。","tech_boundary":"卫星预警功能依赖于吉利未来出行星座的覆盖范围（全球90%区域）；高阶智驾功能受限于当地法规开放程度 *","highlights":["四大安全域+九大安全系统全覆盖","AI数字底盘：0.7秒主动避险，减少27%碰撞侵入量","神盾/金砖电池：8针穿刺、700℃火烧240秒不爆炸 *","隐私堡垒：国内首个UWB数字钥匙防中继攻击，全链路数据加密","天地一体：30颗卫星提供72小时自然灾害预警 *","健康座舱：零甲醛材料与电磁辐射医疗级防护"],"evidence_measured":["车身扭转刚度高达 45000N·m/deg","AEB支持最高 135km/h 刹停（静止车辆） *","电池材料镍钴锰回收率 >99% *","AI智驾预判交通行为准确率 98.7%","热成型钢占比 >80%"],"evidence_certified":["工信部第001号“5A级座舱舒适认证”","工信部五星信息安全认证","Euro NCAP / ANCAP 双五星安全评级","ISO 26262 功能安全认证 *","CNAS/TUV 认证实验室 *"],"evidence_comparison":["电池火烧测试时长 240秒（国标130秒的1.8倍） *","前防撞梁“目”字形截面承载能力比主流“日”字形提升 30%","同级唯一满足 50km/h 正面中心柱碰安全要求（如银河E5）"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(144,'吉利安全白车身','吉利全域安全体系的核心物理载体，采用‘星甲笼式’结构设计与‘蜻蜓’传力架构，融合CTB电池车身一体化技术，打造出的兼顾轻量化与极致防护的整车骨架。',1,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **笼式结构**：采用‘四横四纵’封闭环状框架，高强度钢与铝合金占比超80%，关键部位应用四层热成型硼钢；\n2. **传力设计**：独创‘蜻蜓’式多路径力传导，将局部冲击扩散至整体骨架；\n3. **吸能机制**：前部采用550mm超长铝合金吸能盒（Z型折弯），底部副车架设计定向断裂（发动机下沉）防止侵入座舱。","tech_value":"为乘员提供‘军工级’物理生存空间，彻底解决新能源汽车电池碰撞起火痛点，并显著提升车辆操控稳定性（高扭转刚度）。","tech_boundary":"极端碰撞下虽能保全乘员舱，但高强度结构可能导致维修成本较高；需配合主动安全系统才能发挥最大效能。","highlights":["行业首创‘十宫格’电池防撞隔舱（航空铝合金，厚度163mm）","TWB激光拼焊一体式门环","四层热成型硼钢A柱（兼顾视野与200kN抗弯）","航天级‘目’字形截面前防撞梁","CTB技术集成，电池包作为结构件增强车身刚性"],"evidence_measured":["车身扭转刚度高达 41,000~45,000 N·m/deg","侧面可承受 65吨 冲击力（是普通车身的数倍）","电池包最大形变仅 12.5mm（在65吨冲击下）","白车身轻量化系数低至 1.74"],"evidence_certified":["C-NCAP / Euro NCAP / ANCAP 五星安全评级","20吨重卡夹击测试‘零’泄漏","魔鬼秋千试验（5米高空45°双车撞击）A/C柱无变形"],"evidence_comparison":["前防撞梁‘目’字形截面承载能力比主流‘日’字形提升 30%","同级唯一通过 50km/h 正面中心柱碰测试（国标无要求）","后碰防御速度达 90km/h（远超美标80km/h）","侧面柱碰测试点位 14个（国标仅1个），覆盖全车身"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(145,'吉利GEA架构','全球首个集“硬件、系统、生态、AI”四位一体的智能新能源架构，实现了从“模块化造车”到“AI架构造AI车”的代际跨越。',4,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. **全域解耦与融合**：硬件层（空间/底盘）与系统层（EEA3.0/OS）深度解耦，实现跨能源形式（纯电/混动/增程/甲醇）的兼容；\n2. **AI原生集成**：将星睿AI大模型植入研发、制造及车机系统，实现全链路AI赋能；\n3. **空间与能效最大化**：通过CTB电池车身一体化与AI数字底盘技术，突破物理空间与能效极限。","tech_value":"大幅降低研发成本（通用率70%）并缩短周期（50%），让主流市场车型也能拥有百万级的智能化体验与安全标准，推动“科技平权”。","tech_boundary":"虽然架构本身支持全尺寸，但主要聚焦于主流中高端市场（B-D级），A0级小车可能更多沿用SEA入门版或BMA架构。","highlights":["**全能源兼容**：支持纯电、插混、增程、甲醇等全能源形式","**AI数字底盘**：4ms极速响应，支持蟹行模式、无人漂移 *","**极致能效**：雷神EM-i超级电混热效率46.5%，综合续航超2000km","**空间魔术师**：轴距带宽2850-3200mm，得房率高达88% *","**无界生态**：开放4000+ API接口，构建硬件+软件+云端全生态"],"evidence_measured":["研发周期缩短 50%","零部件通用率 70%","风阻系数低至 0.199Cd（银河E8）","电池寿命延长 15%（AI云端管理）","热效率 46.5%（雷神EM-i发动机）"],"evidence_certified":["行业首个“AI智能架构”认证","满足全球五星安全标准（C-NCAP/E-NCAP等）","ISO 26262 功能安全流程认证 *"],"evidence_comparison":["同级唯一实现“硬件、系统、生态、AI”四位一体深度融合","相比传统架构，空间利用率提升显著（如银河E5座舱空间达B级车标准）","馈电油耗低至 2L/100km（雷神EM-i），优于行业平均水平"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(146,'吉利AI数字底盘','吉利汽车基于全域AI技术开发的智能化底盘系统，通过融合线控技术、AI大模型与多域协同控制，实现车辆动态性能与安全性的革命性突破。',4,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"以“硬件全域线控 + AI实时决策”为核心：硬件上整合线控转向、线控制动、轮边电驱及闭式双腔空悬；软件上依托星睿AI大模型进行车身姿态预测与动态调优，结合多传感器融合（卫星遥感、激光雷达等）构建天地一体感知网络，通过GVMC动态控制系统实现4毫秒级实时响应。","tech_value":"重新定义驾驶边界与安全标准：实现极限操控（如无人漂移）、全地形适应（涉水/沙漠脱困）、以及“永不失控”的主动安全防护，推动高端底盘技术向大众车型平权。","tech_boundary":"需配合星睿智算中心与低轨卫星网络实现完整功能","highlights":["全球首个汽车无人驾驶漂移","响应速度仅4毫秒（比人类快25倍）","全栈线控技术（线控转向/制动/轮边电驱）","轮边电驱支持±20°后轮转向","坦克掉头与蟹行模式","涉水漂浮与沙漠脱困能力"],"evidence_measured":["响应速度 4ms","单电机峰值功率 230kW","轮端扭矩 2600Nm","转弯半径缩至 5米","涉水深度 800mm","漂浮航速 4.6节","爆胎后偏移率 <0.5°","碰撞0.05秒切断高压电"],"evidence_certified":["全球首个汽车无人驾驶漂移"],"evidence_comparison":["转弯半径媲美A级车","脱困能力提升60%","冲击感降低50%（无感越障）"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(147,'吉利星睿AI大模型','全球首个汽车行业全栈自研全场景AI大模型，以“云-数-智”一体化架构为核心，深度融合造车全链路数据与场景，成为驱动汽车智能化转型的核心引擎。',2,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"基于“三层基础模型体系”（语言大模型、多模态大模型、数字孪生大模型）和“六大能力模型”（NLP、NPDS、多模态感知等），依托星睿智算中心算力底座，实现从语言交互到研发制造的全链路赋能。","tech_value":"重构汽车AI范式：实现交互升维（情感陪伴）、研发革命（缩短周期、降本增效）及生态开源（技术平权），推动汽车从“移动工具”向“全域智能终端”进化。","tech_boundary":"算力底座支持500万车辆并发计算","highlights":["全球首个汽车行业全栈自研全场景AI大模型","千亿参数语言理解，万亿级场景生成","行业首个全场景陪伴AI智能体验","具备高情商、高智商的类人情感交互","支持跨模态交互（眼神、手势、语音）"],"evidence_measured":["训练数据量超3万亿Tokens","AI语音助手0.23秒极速响应","单句15指令并发","用户指令执行满意度达98%","AI DRIVE模型缩短自动驾驶验证周期30%","节省50%开发成本","10小时生成1000公里逼真驾驶场景","单日可合成10万张标注数据"],"evidence_certified":["中国信通院大模型通用能力4+最高评级","2023 AIIA人工智能十大先锋应用案例"],"evidence_comparison":["逻辑推理与上下文记忆能力达中文前十水平","语音交互自然度、多意图理解精度超越竞品","AI DRIVE在Cityscapes和ACDC评测中排名第一","类人化情感交互能力领先"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(148,'星睿智算中心2.0','吉利汽车集团联合生态伙伴成立的全球首个智能汽车算力联盟，标志着吉利在“云-数-智”一体化超级计算平台领域的全面升级。',2,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"基于云-边-端协同架构：云端采用阿里云飞天智算平台支持千卡并行；边缘节点实现毫秒级工业数据处理；底层采用自研高速通信协议（4.5TB/s带宽）与液冷散热/电力冗余基础设施，融合阶跃星辰多模态大模型进行算法创新。","tech_value":"重构汽车研发与智能化进程：实现研发效能跃迁（训练提速200倍）、新能源安全全维守护（电池热失控预警）、以及生态开放普惠，推动中国汽车从“制造”向“智造”转型。","tech_boundary":"断电时可满负荷运行30分钟; 全年可用性99.99%","highlights":["综合算力23.5 EFLOPS，位居中国车企首位","万卡级超算规模","云-边-端协同架构","液冷散热与电力冗余设计（全年可用性99.99%）","支持700多万辆车辆并发需求"],"evidence_measured":["综合算力 23.5 EFLOPS","存储带宽 4.5TB/s","千卡并行计算效率 >90%","1000个智驾模型训练时间从3个月缩短至8小时","1天可模拟10万公里驾驶行为","双精度浮点算力 3.54 PFlops","断电满负荷运行 30分钟"],"evidence_certified":["全球首个智能汽车算力联盟","国家“东数西算”工程标杆"],"evidence_comparison":["综合算力位居中国车企首位","研发周期缩短6个月以上","单轮试验效率提升600倍"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(149,'Flyme Sound无界之声','吉利汽车与星纪魅族联合打造的行业首个AI智能音响系统，以硬件创新、软件算法和生态整合为核心，重新定义了车载音响体验。',2,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"结合硬件堆料（9.1.6声道、2000W功放）与AI算法（虚拟场馆、声场自适应），通过WANOS全景声技术实现沉浸式听觉体验。","tech_value":"打破国际品牌垄断，将百万级豪车的声学体验下放至15万级车型，推动智能座舱进入“听觉体验竞争”新阶段。","tech_boundary":"部分全景声资源需通过WANOS全景声App或银河声音空间App获取 *","highlights":["9.1.6声道立体环绕声：支持最多27个扬声器布局","2000W独立功放：额定功率达行业顶尖水平","虚拟场馆技术：AI模拟录音棚、音乐厅等4大场景","WANOS全景声技术：国产唯一自研全景声标准","同级唯一头枕扬声器：定向传递导航与通话","AI音乐律动：氛围灯随音乐节奏律动"],"evidence_measured":["额定功率 2000W","低频下潜 20Hz","高频延伸 20kHz+","座舱静谧性 < 35dB"],"evidence_comparison":["AI算力是高通骁龙8155的2倍 *","音效品质可媲美豪华车音响的“柏林之声” *","小米SU7峰值功率仅1260W *"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(150,'银河Flyme Auto 智能座舱系统','吉利汽车与星纪魅族深度融合打造的下一代智能座舱解决方案，以“多终端无感互联、全场景沉浸交互、AI原生赋能”为核心，重新定义了智能汽车的人机交互体验。',2,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"基于“芯片自研+无界互联+AI情感化”三重革新：硬件上采用国产首颗车规级7nm座舱芯片“龍鷹一号”与云端星睿智算中心协同；软件上利用Flyme Link技术实现手机-车机无感连接，并结合星睿AI大模型实现多模态交互与场景化服务。","tech_value":"打破技术垄断，将AI算力普惠至15万级车型；实现多终端无缝流转与全景声生态，打造移动娱乐空间；通过AI数字精灵与定制化服务，让车成为有温度的出行伙伴。","tech_boundary":"部分深度互联功能（如无感连接、硬件共享）需配合魅族手机使用 *","highlights":["龍鷹一号7nm座舱芯片：AI算力达8 TOPS，支持2.5K高清视频","Flyme Link技术：手机-车机无感连接，应用流转，硬件共享","Flyme Sound无界之声：行业首个9.1.6声道布局，27扬声器 *","Alive Design场景空间：8种预设场景模式，支持自定义组合","星睿AI大模型赋能：AI律动、AI回忆、AI数字精灵"],"evidence_measured":["系统响应速度 < 0.23秒","语音模糊语义识别准确率 98%","CPU算力 90K DMIPS","GPU算力 900G FLOPS","音响额定功率 2000W *","低频下潜至 20Hz *"],"evidence_comparison":["AI算力为高通8155的2倍","系统流畅度超越行业标杆"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(151,'吉利无界空间','行业首个智能车云娱乐平台，通过“云端算力+开放生态”颠覆传统车机体验，实现应用云端运行与海量生态接入。',2,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"依托星睿智算中心与火山引擎边缘节点构建云端算力底座，利用实时音视频推流技术（1080P/60帧）、网络波动摆尾技术及云端热更新机制，将计算负载转移至云端，终端仅负责显示与交互。","tech_value":"解决传统车机算力不足、存储受限及应用生态匮乏的痛点，以10万级车型价格实现百万级智能座舱体验（科技平权），释放本地算力并确保持久流畅。","tech_boundary":"依赖网络连接质量（虽有弱网优化技术），体验受限于云端算力覆盖区域。","highlights":["海量生态：接入腾讯应用宝（300+应用），支持微信小程序“云空间管家”私有APK直装","0存储占用：应用云端运行，不占用本地存储空间","AI个性化：AI音乐律动（生成动态MV）、Wow壁纸（AI生成主题）","多场景扩展：支持手机虚拟手柄游戏、车内线上会议及育儿助手","跨端互联：车机与手机账号打通（如网易云VIP），权益无缝共享"],"evidence_measured":["云端交互延迟低至 70ms","支持 1080P 高清画质 + 60帧刷新率","星睿智算中心算力超 15 EFLOPS"],"evidence_certified":["中国汽车工业协会 AUTOSEMO智能汽车创新合作奖"],"evidence_comparison":["视频通话相比传统方案实现 0延迟、0缓冲","应用更新无需等待 OTA，实时同步最新版本"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(152,'千里浩瀚智能驾驶系统','吉利汽车集团发布的统一高阶智能驾驶解决方案，以“智驾平权”和“安全平权”为核心，整合了全域AI、卫星通信、自研芯片及多模态大模型技术。该系统旨在打破高阶智驾仅限高端车型的壁垒，通过H1至H9五级分层架构，实现从基础辅助驾驶到L3级自动驾驶的全场景覆盖。',2,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"1. 全域AI架构：采用端到端（E2E）大模型，整合BEV感知、Occupancy Network（3D体素占据网络）和强化学习策略，实现从传感器输入到控制指令的直接映射，减少中间规则损耗。\n2. 天地一体协同：利用自建低轨卫星网络提供厘米级高精定位，并结合视觉语言模型（VLM）进行超视距环境感知（如天气、地质灾害预警）。\n3. 硬件全冗余：H9方案采用双NVIDIA Thor芯片、双MCU、双制动系统（ESP+ibooster）架构，确保单点失效下的系统安全性。","tech_value":"核心价值在于“技术平权”与“极致安全”。它将高速NOA、记忆泊车等高阶功能下放至15万级甚至6.88万级的大众车型，显著提升了用户的驾驶体验与性价比。同时，通过“天地一体”的卫星预警和全冗余安全架构，大幅降低了极端天气和复杂路况下的驾驶风险。","tech_boundary":"L3级自动驾驶功能（H9）的全面落地受限于当前法规责任划分及用户认知；高阶功能需依赖特定的高性能硬件（如双Thor芯片、激光雷达）。","highlights":["五级分层架构 (H1-H9)：从入门级高速NOA到行业首个量产级L3自动驾驶方案，覆盖全价格段。","无图全场景通行：摆脱高精地图依赖，纯视觉+激光雷达融合感知，支持小区、无名小路及极端泊车场景。","天地一体卫星通信：结合30颗低轨卫星，提供暴雨/滑坡等灾害提前预警及精准定位。","超强算力底座：依托23.5 EFLOPS算力的星睿智算中心2.0进行模型训练。","全场景泊车：支持机械车位、跨楼层记忆泊车（最长2km）及代客泊车。"],"evidence_measured":["系统延迟：从传统方案的300ms大幅降至180ms。","实测通过率：在重庆黄桷湾8D立交等极复杂路况下，实测通过率达93%。","长尾场景可靠性：针对“鬼探头”、“加塞”等场景应对可靠性达99.99%。","灾害预警：支持提前15分钟预警暴雨、滑坡等自然灾害。","AEB性能：主动刹车生效时速最高达130km/h（行业最高）。","冗余切换：双Thor芯片主备切换时间小于500ms。"],"evidence_certified":["ISO 26262 ASIL-D (H9方案满足)","行业首个量产级L3智能驾驶解决方案"],"evidence_comparison":["算力优势：星睿智算中心综合算力（23.5 EFLOPS）约为华为的3倍、比亚迪的10倍。","成本下探：相比竞品高阶智驾通常仅限30万+车型，H1方案成功下探至6.88万级（如吉利星愿）。","地图依赖：相比早期小鹏XNGP等强依赖高精地图的方案，千里浩瀚实现无图城市NOA。","生态完整性：相比特斯拉FSD，拥有独家的低轨卫星系统支持，具备“天地一体”的差异化优势。"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
INSERT INTO tech_points VALUES(153,'SEA浩瀚架构','吉利历时4年、投入超180亿元研发的全球首个纯电原创架构，以用户出行体验为核心，构建了硬件层、系统层、生态层三位一体的立体化布局，是全球最高效的智能电动汽车解决方案。 [1][2]',4,NULL,1,'feature','medium','draft',NULL,'{"tech_principle":"采用''硬件层+系统层+生态层''三位一体架构。硬件层通过1800-3300mm的超大带宽实现全尺寸覆盖；系统层首发SEA OS整车智能开发系统；生态层向全球开发者开放，实现全场景、全生命周期的体验进化。 [1][2]","tech_value":"重新定义了软件汽车的研发周期，将软件开发时间缩短50%以上；通过取消传统传动轴实现纯平地板，使座舱空间利用率提升10%；为用户创造零边界的智能出行体验。 [1][2]","tech_boundary":"适用于轴距1800mm-3300mm的纯电车型，覆盖轿车、SUV、MPV、皮卡及跑车等 [1]","highlights":["全球最大带宽：轴距覆盖1800mm-3300mm，适配A级至E级全品类车型 [1]","超长电池寿命：NEDC工况下20万公里无衰减，200万公里长寿命 [2]","800V高压平台：支持充电5分钟续航120公里 [2]","高性能电驱：搭载自主研发两挡电驱动变速器，最大承载扭矩8000N·m [2]"],"evidence_measured":["NEDC续航里程超700km (110kWh电池包) [2]","百公里加速最快可达3.8秒 (极氪001) [1]","电池系统20万公里无衰减 [2]"],"evidence_certified":["满足国际最高安全等级 ISO 26262 ASIL-D [2]","电池安全：无热蔓延技术，实现''只冒烟不起火'' [2]"],"evidence_comparison":["软件开发周期比传统模式缩短50%以上 [1]","座舱空间利用率比传统燃油车架构提升10% [1]","带宽覆盖范围（1800-3300mm）全球最大，优于同期大众MEB平台 [2]"]}',NULL,NULL,NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05',NULL,NULL,NULL,NULL);
CREATE TABLE tech_point_car_models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tech_point_id INTEGER NOT NULL,
          car_model_id INTEGER NOT NULL,
          application_status VARCHAR(50) NOT NULL DEFAULT 'planned',
          implementation_date DATE,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
          FOREIGN KEY (car_model_id) REFERENCES car_models(id) ON DELETE CASCADE,
          UNIQUE(tech_point_id, car_model_id)
        );
INSERT INTO tech_point_car_models VALUES(23,125,1,'planned',NULL,'关联方式：标配','2025-12-01 02:17:47','2025-12-01 02:17:47');
INSERT INTO tech_point_car_models VALUES(24,126,1,'planned',NULL,'关联方式：标配','2025-12-01 02:20:04','2025-12-01 02:20:04');
INSERT INTO tech_point_car_models VALUES(25,126,5,'planned',NULL,'关联方式：标配','2025-12-01 02:20:04','2025-12-01 02:20:04');
INSERT INTO tech_point_car_models VALUES(26,129,3,'planned',NULL,'关联方式：标配','2025-12-01 02:46:41','2025-12-01 02:46:41');
INSERT INTO tech_point_car_models VALUES(27,130,2,'planned',NULL,'关联方式：标配','2025-12-01 02:48:08','2025-12-01 02:48:08');
INSERT INTO tech_point_car_models VALUES(28,138,4,'planned',NULL,'关联方式：标配','2025-12-01 02:55:41','2025-12-01 02:55:41');
INSERT INTO tech_point_car_models VALUES(29,139,6,'planned',NULL,'关联方式：标配','2025-12-01 02:56:50','2025-12-01 02:56:50');
INSERT INTO tech_point_car_models VALUES(30,139,9,'planned',NULL,'关联方式：标配','2025-12-01 02:56:50','2025-12-01 02:56:50');
INSERT INTO tech_point_car_models VALUES(31,141,4,'planned',NULL,'关联方式：标配','2025-12-01 03:01:08','2025-12-01 03:01:08');
INSERT INTO tech_point_car_models VALUES(32,143,3,'planned',NULL,'关联方式：标配','2025-12-01 03:06:38','2025-12-01 03:06:38');
INSERT INTO tech_point_car_models VALUES(33,143,5,'planned',NULL,'关联方式：标配','2025-12-01 03:06:38','2025-12-01 03:06:38');
INSERT INTO tech_point_car_models VALUES(34,144,3,'planned',NULL,'关联方式：标配','2025-12-01 03:08:09','2025-12-01 03:08:09');
INSERT INTO tech_point_car_models VALUES(35,144,4,'planned',NULL,'关联方式：标配','2025-12-01 03:08:09','2025-12-01 03:08:09');
INSERT INTO tech_point_car_models VALUES(36,145,3,'planned',NULL,'关联方式：标配','2025-12-01 03:09:52','2025-12-01 03:09:52');
INSERT INTO tech_point_car_models VALUES(37,147,1,'planned',NULL,'关联方式：标配','2025-12-01 10:43:02','2025-12-01 10:43:02');
INSERT INTO tech_point_car_models VALUES(38,147,3,'planned',NULL,'关联方式：标配','2025-12-01 10:43:02','2025-12-01 10:43:02');
INSERT INTO tech_point_car_models VALUES(39,148,1,'planned',NULL,'关联方式：标配','2025-12-01 10:42:34','2025-12-01 10:42:34');
INSERT INTO tech_point_car_models VALUES(40,150,2,'planned',NULL,'关联方式：标配','2025-12-01 10:41:33','2025-12-01 10:41:33');
INSERT INTO tech_point_car_models VALUES(41,150,5,'planned',NULL,'关联方式：标配','2025-12-01 10:41:33','2025-12-01 10:41:33');
INSERT INTO tech_point_car_models VALUES(42,151,2,'planned',NULL,'关联方式：标配','2025-12-01 10:39:54','2025-12-01 10:39:54');
INSERT INTO tech_point_car_models VALUES(43,152,2,'planned',NULL,'关联方式：标配','2025-12-01 01:38:00','2025-12-01 01:38:00');
INSERT INTO tech_point_car_models VALUES(44,153,4,'planned',NULL,'关联方式：标配','2025-12-01 02:01:02','2025-12-01 02:01:02');
CREATE TABLE tech_point_knowledge_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tech_point_id INTEGER NOT NULL,
        knowledge_point_id INTEGER NOT NULL,
        relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('reference', 'support', 'related', 'example')),
        relevance_score REAL,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
        FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
        UNIQUE(tech_point_id, knowledge_point_id)
      );
CREATE TABLE tech_point_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tech_point_id INTEGER NOT NULL,
            resource_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
            FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
            UNIQUE(tech_point_id, resource_id)
          );
INSERT INTO tech_point_resources VALUES(4,36,1,'2025-12-01 08:42:06');
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    icon TEXT,
    type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'featured')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_opened_at DATETIME
);
INSERT INTO projects VALUES(1,'吉利千里浩瀚',NULL,NULL,NULL,'normal','active',NULL,'2025-12-05 01:03:53','2025-12-05 01:03:53','2026-01-13 03:29:46');
INSERT INTO projects VALUES(2,'神盾金砖电池',NULL,NULL,NULL,'normal','active',NULL,'2025-12-05 01:09:37','2025-12-05 01:09:37','2026-01-08 12:04:50');
INSERT INTO projects VALUES(3,'Flyme智能座舱',NULL,NULL,NULL,'normal','active',NULL,'2025-12-05 01:10:10','2025-12-05 01:10:10','2026-01-13 09:54:24');
INSERT INTO projects VALUES(4,'全域安全',NULL,NULL,NULL,'normal','active',NULL,'2025-12-11 09:39:28','2025-12-11 09:39:28','2026-01-13 13:35:24');
CREATE TABLE project_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text', 'tech_point', 'knowledge_point')),
    source_content TEXT NOT NULL,
    source_title TEXT,
    source_description TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE project_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(project_id, tech_point_id)
);
INSERT INTO project_tech_points VALUES(1,4,143,NULL,'2026-01-07 06:55:12','2026-01-07 06:55:12');
CREATE TABLE project_knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    knowledge_point_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(project_id, knowledge_point_id)
);
CREATE TABLE project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    UNIQUE(project_id, file_id)
);
CREATE TABLE project_source_informations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          source_information_id INTEGER NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, source_information_id)
        );
INSERT INTO project_source_informations VALUES(1,4,66,NULL,'2026-01-13 09:24:06','2026-01-13 09:24:06');
INSERT INTO project_source_informations VALUES(2,4,67,NULL,'2026-01-13 09:27:22','2026-01-13 09:27:22');
INSERT INTO project_source_informations VALUES(3,4,68,NULL,'2026-01-13 09:27:44','2026-01-13 09:27:44');
INSERT INTO project_source_informations VALUES(4,4,69,NULL,'2026-01-13 09:28:10','2026-01-13 09:28:10');
INSERT INTO project_source_informations VALUES(5,4,70,NULL,'2026-01-13 09:57:08','2026-01-13 09:57:08');
INSERT INTO project_source_informations VALUES(6,4,71,NULL,'2026-01-13 09:57:49','2026-01-13 09:57:49');
INSERT INTO project_source_informations VALUES(7,4,72,NULL,'2026-01-13 09:58:32','2026-01-13 09:58:32');
INSERT INTO project_source_informations VALUES(8,4,73,NULL,'2026-01-13 09:59:44','2026-01-13 09:59:44');
INSERT INTO project_source_informations VALUES(9,4,74,NULL,'2026-01-13 10:08:31','2026-01-13 10:08:31');
INSERT INTO project_source_informations VALUES(10,4,75,NULL,'2026-01-13 10:12:14','2026-01-13 10:12:14');
INSERT INTO project_source_informations VALUES(11,4,76,NULL,'2026-01-13 11:00:28','2026-01-13 11:00:28');
CREATE TABLE knowledge_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tech_point_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        knowledge_type TEXT DEFAULT 'concept',
        difficulty_level TEXT DEFAULT 'medium',
        tags TEXT,
        prerequisites TEXT,
        learning_objectives TEXT,
        examples TEXT,
        "references" TEXT,
        source_query TEXT,
        source_url TEXT,
        source_type TEXT DEFAULT 'import' CHECK (source_type IN ('ai_search', 'manual', 'import')),
        metadata TEXT,
        relevance_score REAL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
        dify_task_id TEXT,
        ai_search_session_id TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
      );
INSERT INTO knowledge_points VALUES(1,125,'技术原理',replace('1. **AI核心**：依托星睿AI云动力2.0（23.5 EFLOPS算力），构建数字孪生场景库，实现智慧能量、运动、健康及补能管理；\n2. **硬件基座**：搭载热效率47.26%的混动专用发动机（驭风火龙卷燃烧系统）与11合1智能电驱（SiC升压模块）；\n3. **控制逻辑**：通过AI预判路况与驾驶习惯，动态调整油电策略与扭矩分配。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(2,125,'价值','彻底解决了混动车“馈电油耗高、性能衰减”的痛点，为用户提供“极致节能（2L级油耗）+超长续航（2000km+）+智能进化（支持OTA）”的用车体验。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(3,125,'适用边界','老车主OTA升级功能需等到2025年第四季度推送 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(4,125,'技术亮点 1','全球最高量产发动机热效率47.26%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(5,125,'技术亮点 2','行业首个动力域AI智能体（星睿AI云动力2.0）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(6,125,'技术亮点 3','支持老车主OTA升级，常用常新','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(7,125,'技术亮点 4','包含雷神醇氢EF技术，热效率达48.15% *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(8,125,'技术亮点 5','全域无损电感，满电/馈电加速差异仅0.03秒','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(9,125,'实测证据 1','吉利银河A7实测百公里馈电油耗2.49L','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(10,125,'实测证据 2','吉利银河星舰7综合续航2390km','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(11,125,'实测证据 3','吉利银河M9零百加速4.5s','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(12,125,'认证证据 1','行业首个全域低能耗证书','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(13,125,'认证证据 2','动力系统智能化“S”级认证 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(14,125,'对比证据 1','高速巡航油耗增幅仅8%，优于单挡混动（如DM-i）的25%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(15,125,'对比证据 2','直驱模式效率比增程式提升30%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(16,125,'对比证据 3','热效率47.26%超越比亚迪第五代DM（46.06%） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(17,126,'技术原理',replace('1. **架构**：采用P1+P2双电机（3挡DHT Pro）或P1+P3双电机（3DHT）的多挡串并联结构，发动机始终工作在高效区；\n2. **电驱**：11合1高度集成电驱，集成SiC升压模块，实现满电/亏电性能一致；\n3. **AI控制**：依托星睿AI云动力2.0，预判路况（如坡度、拥堵）动态调整能量管理策略。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(18,126,'价值','实现了“高性能（4秒级加速）+低能耗（4L级油耗）+高安全（冗余设计）”的统一，让混动车在高速、越野、馈电等极限场景下依然保持强劲动力与低能耗。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(19,126,'适用边界','高性能版本（如后轴双电机）主要应用于中大型SUV或皮卡车型；部分功能（如OTA）需等待2025年Q4推送 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(20,126,'技术亮点 1','3挡DHT多挡位架构，高速油耗仅增8%（竞品增25%）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(21,126,'技术亮点 2','11合1智能电驱，功率密度提升20%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:03','2025-12-08 07:30:03');
INSERT INTO knowledge_points VALUES(22,126,'技术亮点 3','SiC碳化硅升压模块，亏电动力无衰减','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(23,126,'技术亮点 4','5动力源冗余设计（发动机+P1+P2/P3+后轴双电机）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(24,126,'技术亮点 5','神盾电池5级防护，支持-30℃至60℃全气候运行','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(25,126,'实测证据 1','百公里加速4.5秒（吉利银河M9）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(26,126,'实测证据 2','馈电油耗4L/100km','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(27,126,'实测证据 3','综合续航超1500km','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(28,126,'实测证据 4','电驱传动效率98.8%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(29,126,'实测证据 5','外放电功率21kW（皮卡版本） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(30,126,'认证证据','神盾电池36项极限测试（23项超国标）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(31,126,'对比证据 1','高速（150km/h）油耗相比120km/h仅增加8%，优于单挡混动的25%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(32,126,'对比证据 2','爬坡能力优于燃油车（重载65%坡度） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(33,126,'对比证据 3','直驱模式高速效率比增程式提升30%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(34,127,'技术原理',replace('1. **架构**：采用P1+P3双电机串并联架构（单挡E-DHT 11合1），主打极致效率；\n2. **核心硬件**：搭载热效率47.26%的BHE15混动专用发动机（全球最高量产热效率）与SiC无级升压模块；\n3. **AI赋能**：引入星睿AI云动力2.0，通过数字孪生技术实现智慧能量管理与运动控制。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(35,127,'价值','彻底解决了传统混动“馈电油耗高、高速动力弱、低温续航短”的痛点，为用户提供“2L级油耗+2000km级续航+不失速”的安心体验。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(36,127,'适用边界','主打节能与家用市场，极致性能场景（如越野、赛道）建议选择EM-P版本 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(37,127,'技术亮点 1','全球最高量产发动机热效率47.26%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(38,127,'技术亮点 2','实测续航2390.5km，刷新混动续航纪录','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(39,127,'技术亮点 3','E-DHT 11合1电驱，结构减重13.5%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(40,127,'技术亮点 4','SiC无级升压技术，满电/馈电加速性能基本一致','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(41,127,'技术亮点 5','行业首发混动安全冗余技术（发动机/P1/P3互为备份）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(42,127,'实测证据 1','吉利银河星舰7实测续航2390.5km','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(43,127,'实测证据 2','吉利银河A7实测百公里馈电油耗2.49L','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(44,127,'实测证据 3','高速155km/h亏电连续行驶2小时无性能衰减','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(45,127,'实测证据 4','百公里加速7.5秒（吉利银河星舰7） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(46,127,'认证证据 1','行业首个“全域低能耗”认证证书','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(47,127,'认证证据 2','中汽中心权威认证 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(48,127,'对比证据 1','热效率47.26%超越比亚迪第五代DM（46.06%） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(49,127,'对比证据 2','百公里馈电油耗2.67L（CLTC）优于同级竞品','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(50,127,'对比证据 3','电机效率98.02%，行业第一','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(51,128,'技术原理',replace('1. **物理结构**：采用580mm短刀设计（比长刀电池缩短40%），基于电阻定律（L↓, S↑）大幅降低内阻与发热量；\n2. **材料体系**：应用湿法双涂层隔膜（防穿刺）、氧化铝耐热涂层（正负极隔离）及碳纳米管导电剂（离子高速公路）；\n3. **集成技术**：采用CTB构型与“田”字格框架设计，提升空间利用率与整车刚性。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(52,128,'价值','解决了传统长刀电池“内阻高、充电热量大、低温衰减快”的物理痛点，为用户提供“军工级安全、百万公里寿命、17分钟快充”的优质体验。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(53,128,'适用边界','目前主要应用于吉利银河系列车型，定位为主流家用市场的高安全、长寿命解决方案。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(54,128,'技术亮点 1','580mm短刀尺寸，内阻更低，发热量减少30%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(55,128,'技术亮点 2','湿法双涂层隔膜，穿刺不易断裂','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(56,128,'技术亮点 3','支持2.45C平均充电倍率','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(57,128,'技术亮点 4','循环寿命3500次（相当于行驶100万公里）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(58,128,'技术亮点 5','CTB田字格框架，整车扭转刚度达31000N·m/deg','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(59,128,'实测证据 1','17分钟充电至80%（SOC 10%-80%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(60,128,'实测证据 2','能量密度192Wh/kg','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(61,128,'实测证据 3','-30℃极寒环境下容量保持率90.54%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(62,128,'实测证据 4','吉利银河E5行驶30万公里后电池健康度90.5%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(63,128,'认证证据 1','中汽中心“8针同刺”试验（8根5mm钢针同时穿刺，不起火不爆炸）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(64,128,'认证证据 2','全球首个通过5.8mm真弹枪击试验的电芯','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(65,128,'认证证据 3','中汽中心6大“魔鬼”串行测试（海水、极寒、刮底、碾压、侧碰、火烧）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(66,128,'对比证据 1','充电速度比长刀电池提升52%（17min vs 26min）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(67,128,'对比证据 2','-30℃低温保持率比长刀电池高11.58%（90.54% vs 78.96%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(68,128,'对比证据 3','循环寿命比行业平均水平提升40%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(69,129,'技术原理',replace('1. **硬件层**：采用“潜艇式”车身结构与田字格框架专利，底部设三重防护（超高强钢护板+吸能结构），抗剪切力提升58%；\n2. **电芯层**：应用低反应活性电解液与耐热涂层隔膜，阻断热失控源头；\n3. **软件层**：BMS 3.0电池医生实时监测200+项参数，结合云端星睿智算中心实现故障预警与碰撞毫秒级断电。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(70,129,'价值','打破了仅关注电芯安全的局限，实现了“基础安全、整车安全、智能安全、健康安全”的全面覆盖，彻底消除用户对电池起火、辐射及车内健康的焦虑。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(71,129,'适用边界','安全防护系统需配合特定车身结构（如CMA架构）才能发挥最大效能 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(72,129,'技术亮点 1','首创“基础+整车+智能+健康”四大安全标准','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(73,129,'技术亮点 2','“潜艇式”整车架构，抗剪切力超国标58%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(74,129,'技术亮点 3','田字格框架专利，整车扭转刚度31000N·m/deg','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(75,129,'技术亮点 4','BMS 3.0电池医生+云端智算中心，碰撞0.05秒断电','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(76,129,'技术亮点 5','国内首获新能源汽车电磁防辐射001号认证 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(77,129,'实测证据 1','8mm钢针穿刺不起火（超国标5mm）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(78,129,'实测证据 2','2米高度三面跌落零泄漏（国标1米）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(79,129,'实测证据 3','外部火烧时长超国标50%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(80,129,'实测证据 4','1米深海水浸泡24小时无泄漏（国标0.5小时）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(81,129,'认证证据 1','新能源汽车电磁防辐射001号认证 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(82,129,'认证证据 2','Euro NCAP/ANCAP双五星认证（搭载车型） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(83,129,'对比证据 1','底部抗碰撞能力参与制定行业首个国标 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(84,129,'对比证据 2','低温（-30℃）续航达成率＞90%，优于行业平均（＜80%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(85,129,'对比证据 3','电池包抗剪切力由23.6kN提升至37.4kN','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(86,130,'技术原理',replace('1. **高度集成**：将P1+P3电机、双电控（SiC）、VCU、TCU、PDU、传动系统、TMS热管理及G-TCS等11个模块整合为一；\n2. **核心技术**：采用混碳电控技术（IGBT+SiC）、双端X-Pin扁线绕组及高精度喷淋油冷技术；\n3. **智能控制**：通过AI动力寻优算法与G-TCS主动防滑系统，实现毫秒级扭矩响应。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(87,130,'价值','通过极致集成实现了“体积更小、重量更轻、效率更高”，为用户带来更长的续航里程、更强的动力响应及更宽泛的空间体验。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(88,130,'适用边界','目前主要应用于吉利银河系列纯电及混动车型，未来将扩展至更多平台。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(89,130,'技术亮点 1','行业最高集成度（11合1），体积缩减30%，重量减轻13.5%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(90,130,'技术亮点 2','电机效率高达98.02%，系统综合效率92.5%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(91,130,'技术亮点 3','混碳电控技术，功率控制效率突破99%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(92,130,'技术亮点 4','SiC无级升压模块，亏电动力无衰减','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(93,130,'技术亮点 5','获得国内首张电驱动总成5A级认证证书','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(94,130,'实测证据 1','百公里电耗最低11.9 kWh（吉利银河E5）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(95,130,'实测证据 2','系统综合效率90.04%（行业主流85%-88%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(96,130,'实测证据 3','亏电动力衰减≤3%（行业主流15%-30%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(97,130,'实测证据 4','连续10次全油门加速效率衰减＜5%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(98,130,'认证证据','中汽研电驱动总成5A级认证（001号证书）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(99,130,'对比证据 1','相比行业主流“三合一/六合一”，部件数量减少40%，故障点大幅降低','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(100,130,'对比证据 2','传动效率98.8%，优于行业平均水平','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(101,130,'对比证据 3','噪音控制仅78dB，媲美百万级豪车','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(102,131,'技术原理',replace('1. **架构**：采用P1+P3双电机串并联+单挡变速（E-DHT）构型，电机主要负责驱动，发动机负责发电或高速直驱；\n2. **集成**：融合电机、电控（SiC）、VCU、TCU、PDU、TMS热管理及G-TCS等11个模块，实现“机电热控”一体化；\n3. **工艺**：应用双端X-Pin扁线绕组与高精度喷淋油冷技术。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(103,131,'价值','通过高度集成化设计，实现了结构更紧凑（减重13.5%）、效率更高（电机效率98.02%）和成本更优，是实现“2L级油耗”的关键硬件支撑。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(104,131,'适用边界','主要适用于追求极致节能与性价比的家用车型（如EM-i平台），高性能需求（如越野）通常采用3DHT版本 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(105,131,'技术亮点 1','11合1超高集成度，体积缩减30%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(106,131,'技术亮点 2','P1+P3双电机+单挡结构，专注于极致能效','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(107,131,'技术亮点 3','引入碳化硅（SiC）无级升压模块，亏电动力不衰减','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(108,131,'技术亮点 4','电机最高效率98.02%，系统综合效率92.5%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(109,131,'技术亮点 5','具备双电机安全冗余能力（互为备份）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(110,131,'实测证据 1','结构减重13.5%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(111,131,'实测证据 2','功率密度提升20%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(112,131,'实测证据 3','换热效率提升20%（相比传统水冷）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(113,131,'实测证据 4','吉利银河星舰7实测百公里馈电油耗2.49L','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(114,131,'认证证据','电驱动总成5A级认证 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(115,131,'对比证据 1','相比传统3DHT混动电驱，结构更简单，能耗更低（高速油耗仅增8% vs 单挡竞品25%） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(116,131,'对比证据 2','相比同级“六合一”电驱，部件数量减少40%，可靠性更高','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(117,138,'技术原理',replace('1. **健康防护技术**：采用CN95高效复合空调滤芯（集成活性炭与防过敏层）及银离子抗菌涂层技术，通过物理阻隔与化学抑制结合保障座舱空气与接触面安全。\n2. **循环再生闭环**：建立“三端协同一体化”降碳路径，实施钢材、铝材及塑料的闭环回收（如冲压废钢100%回收、发动机铝屑回收），并利用伺服冲压与干式喷房技术减少制造能耗。\n3. **生态材料设计**：研发并应用循环仿麂皮、循环PET纤维等生物基或再生材料，替代原生矿产与石油资源。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(118,138,'价值','对用户而言，提供“母婴级”极致健康座舱，显著降低车内异味（VOC）、致病菌及颗粒物风险；对社会而言，通过资源高效循环大幅减少碳排放与废弃物，推动汽车产业从“资源消耗型”向“循环再生型”转型。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(119,138,'适用边界','循环材料的大规模应用需平衡成本与物理性能稳定性；目前主要在极氪、领克及银河系列的中高端车型上优先落地，并逐步向全系推广。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(120,138,'技术亮点 1','CN95高效复合空调滤芯（国内首个认证）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(121,138,'技术亮点 2','纳米银离子抗菌方向盘与换挡球头','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(122,138,'技术亮点 3','100%回收再生原料的循环仿麂皮与PET纤维','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(123,138,'技术亮点 4','冲压废钢100%闭环回收再生体系','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(124,138,'技术亮点 5','“报废车-电池-材料”三级回收网络','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(125,138,'实测证据 1','抗菌表面材料抗菌率达99.9%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(126,138,'实测证据 2','CN95滤芯对直径≥0.3µm颗粒过滤效率达95%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(127,138,'实测证据 3','单车减碳19kg（相当于2棵树年固碳量）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(128,138,'实测证据 4','制造端碳排放较2020年下降50%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(129,138,'实测证据 5','再生铝节能90%以上，碳排放量减少95%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(130,138,'认证证据 1','中汽研CN95滤芯001号认证','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(131,138,'认证证据 2','ISO 17025国际标准认证（内饰）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(132,138,'认证证据 3','国际抗菌I级要求','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(133,138,'认证证据 4','全国首批“无废企业”','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(134,138,'对比证据 1','抗菌率99.9%（优于国标Ⅰ级99%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(135,138,'对比证据 2','VOC排放量仅为国标限值的1/10','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(136,138,'对比证据 3','循环材料应用比例逐步领先行业（2025年目标：循环钢20%、循环铝30%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(137,139,'技术原理',replace('1. **模块化设计**：将动力、电气、底盘、车身等模块标准化，像“积木”一样自由组合，零部件通用率达70%。\n2. **空间优化**：通过动力总成布局优化、悬挂系统精简及座椅人机工程改进，在同等车身尺寸下实现同级领先的乘坐空间。\n3. **多动力兼容**：同步支持传统燃油（1.0TD/1.4T/1.5TD）、PHEV插混、HEV油电混动及MHEV轻混动力系统。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(138,139,'价值','研发效率革命，研发周期缩短至18-24个月，研发成本降低20%-30%；为用户提供超越同级（7.9秒加速）的性能与L2级智能驾驶体验，打破小型车低配印象；填补CMA架构以下的市场空白，支撑吉利全球化战略。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(139,139,'适用边界','专注于A0至A+级车型（小型/紧凑型），轴距限制在2550-2700mm范围内。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(140,139,'技术亮点 1','零部件通用率70%，研发周期缩短至18-24个月','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(141,139,'技术亮点 2','轴距带宽2550-2700mm，轮距1500-1600mm','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(142,139,'技术亮点 3','支持L2级自动驾驶，预留L3级升级能力','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(143,139,'技术亮点 4','车身70%高强度钢+20%热成型钢，满足中欧双五星标准','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(144,139,'技术亮点 5','兼容燃油、HEV、PHEV、MHEV多种动力','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(145,139,'实测证据 1','缤越1.5TD百公里加速7.9秒','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(146,139,'实测证据 2','1.5TD发动机热效率40%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(147,139,'实测证据 3','研发成本降低20%-30%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(148,139,'认证证据','中欧双五星安全碰撞标准','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(149,139,'对比证据 1','研发周期18-24个月（传统平台需40个月）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(150,139,'对比证据 2','乘坐空间利用率同级领先（优于竞品）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(151,139,'对比证据 3','同级少有的L2级智驾下放','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(152,140,'技术原理',replace('1. **超高热效率引擎**：第五代醇氢专用发动机采用超高压缸内直喷、湍流燃烧技术及纳米级燃料雾化，热效率达全球最高的48.15%。\n2. **灵活燃料混注**：系统自动识别并切换最优燃烧模式，支持甲醇与汽油任意比例混注，无需用户区分燃料类型。\n3. **低温冷启动技术**：通过催化预热技术解决甲醇低温结晶难题，实现-40℃极寒环境一键启动。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(153,140,'价值','解决新能源车续航焦虑、补能效率与成本痛点。每公里能耗成本低至0.2元（比燃油车省70%）；全生命周期碳减排42%，污染物排放大幅降低（PM减少98%）。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(154,140,'适用边界','依赖甲醇加注网络布局（计划2025年656座，2027年4000座）；目前主要在商用车（远程重卡）及特定乘用车（2025年Q4上市新车）上应用。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(155,140,'技术亮点 1','全球最高热效率48.15%醇氢专用发动机','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(156,140,'技术亮点 2','支持甲醇/汽油/电能任意比例混合加注','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(157,140,'技术亮点 3','-40℃极寒环境一键启动','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(158,140,'技术亮点 4','每公里成本低至0.2元','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(159,140,'技术亮点 5','综合续航超1200km，纯电续航＞150km','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(160,140,'实测证据 1','发动机热效率48.15%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(161,140,'实测证据 2','甲醇加注成本低至2元/升','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(162,140,'实测证据 3','每公里能耗成本0.2元','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(163,140,'实测证据 4','零百加速7秒级','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(164,140,'实测证据 5','馈电油耗＜3L/100km','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(165,140,'认证证据 1','欧盟绿色转型战略燃料','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(166,140,'认证证据 2','全球独创醇氢发动机技术','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(167,140,'对比证据 1','热效率48.15%（超越丰田氢发动机46%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(168,140,'对比证据 2','运营成本降低超20万元（重卡年运营对比柴油车）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(169,140,'对比证据 3','PM颗粒物减少98%，氮氧化物下降82%（对比传统燃油）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(170,141,'技术原理',replace('1. **800V高压架构**：整车电压提升至550-930V，降低电流与线束损耗，提升能量传输效率。\n2. **SiC功率器件**：利用碳化硅的高耐温、高导热及高电子饱和速率特性，替代传统硅基IGBT，将逆变器效率提升至99.5%，开关频率提升10倍。\n3. **系统集成优化**：采用同轴双联齿行星排减速器设计与高精度喷淋油冷技术，提升扭矩密度与散热效率。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(171,141,'价值','彻底解决新能源车续航焦虑与补能痛点。实现“充电9分钟，续航里程显著增加”的超充体验；整车能耗降低5-7%，系统轻量化降本15%；保障亏电状态下动力不衰减。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(172,141,'适用边界','需配合800V超充桩以发挥最大补能优势；目前主要应用于中高端车型（如银河E8等），成本相对较高。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(173,141,'技术亮点 1','400kW峰值功率，充电10%-80%≤9分钟','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(174,141,'技术亮点 2','SiC模组效率高达99.5%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(175,141,'技术亮点 3','同轴双联齿行星排减速器，扭矩密度提升118%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(176,141,'技术亮点 4','馈电工况动力衰减≤4%（传统系统15%-30%）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(177,141,'技术亮点 5','行业首搭镁合金外壳，重量降低25%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(178,141,'实测证据 1','充电10%-80%仅需9分钟','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(179,141,'实测证据 2','系统综合效率高达92.5%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(180,141,'实测证据 3','电机效率最高98.02%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(181,141,'实测证据 4','功率密度6.78kW/kg','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(182,141,'实测证据 5','WLTP工况整车能耗减少5-7%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(183,141,'认证证据','中汽研电驱动总成5A级认证（行业首个）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(184,141,'对比证据 1','充电速度比400V平台快70%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(185,141,'对比证据 2','系统效率提升7-12个百分点（对比400V Si系统）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(186,141,'对比证据 3','功率密度提升50%（对比行业平均4.5kW/kg）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(187,141,'对比证据 4','亏电动力衰减≤4%（优于传统系统15%-30%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(188,142,'技术原理',replace('1. **材料创新**：应用晶盾复合材料（正极表面致密保护层）与石墨烯包覆硅碳负极，提升热失控温度至350℃及能量密度。\n2. **结构设计**：采用短刀电芯构型（长度压缩至580mm），配合蜂巢仿生+田字格框架CTB设计，降低内阻、提升散热效率及整车刚性。\n3. **AI智控**：集成BMS 3.0电池医生与云端算力，实时监测200+项参数，实现热失控提前预警与健康度自修复。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(189,142,'价值','解决用户对新能源车电池安全、续航衰减及补能效率的焦虑。提供“军工级”安全防护，实现百万公里超长寿命与“充电17分钟续航大幅增加”的快充体验，大幅降低全生命周期用车成本。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(190,142,'适用边界','主要应用于吉利银河、极氪等中高端新能源车型，需配合特定高压平台与快充网络发挥最大效能。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(191,142,'技术亮点 1','军工级安全：通过8针同刺、5.8mm真弹枪击等极限测试','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(192,142,'技术亮点 2','超长寿命：循环寿命超3500次，支持行驶超100万公里','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(193,142,'技术亮点 3','极致快充：800V平台+SiC技术，17分钟充入70%电量','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(194,142,'技术亮点 4','全气候适应：-30℃极寒续航达成率超90%','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(195,142,'技术亮点 5','高能量密度：石墨烯包覆硅碳负极达215Wh/kg','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(196,142,'实测证据 1','热失控温度提升至350℃','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(197,142,'实测证据 2','循环寿命3500次','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(198,142,'实测证据 3','10%-80%充电仅需17分钟','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(199,142,'实测证据 4','-30℃低温容量保持率90.54%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(200,142,'实测证据 5','能量密度215Wh/kg','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(201,142,'认证证据 1','全球首个通过5.8mm真弹枪击贯穿试验','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(202,142,'认证证据 2','美国UL“零热扩散”认证','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(203,142,'认证证据 3','ISO动力电池安全等级评定主导起草','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(204,142,'对比证据 1','热失控温度350℃（传统电池约200℃）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(205,142,'对比证据 2','低温放电容量保持率超90%（行业平均低8.7%）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(206,142,'对比证据 3','充电速度提升52%（对比长刀电池）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(207,142,'对比证据 4','内阻更低，发热量减少30%（对比长刀电池）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(208,143,'技术原理','基于“4域9系”框架（生命/健康/财产/隐私4域，被动/主动/功能/信息/高压/防火/健康/使用/防盗9系）；2025年引入“全域AI”技术，利用星睿AI大模型（融合DeepSeek *）与“吉利未来出行星座”卫星网络，实现天地一体化感知与毫秒级风险预判。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(209,143,'价值','打破传统汽车安全仅关注碰撞的局限，重新定义智能出行安全标准；通过技术下放实现“安全平权”，让入门级车型也能拥有百万级的安全防护能力；“安全是最高级的豪华” *。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(210,143,'适用边界','卫星预警功能依赖于吉利未来出行星座的覆盖范围（全球90%区域）；高阶智驾功能受限于当地法规开放程度 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(211,143,'技术亮点 1','四大安全域+九大安全系统全覆盖','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(212,143,'技术亮点 2','AI数字底盘：0.7秒主动避险，减少27%碰撞侵入量','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(213,143,'技术亮点 3','神盾/金砖电池：8针穿刺、700℃火烧240秒不爆炸 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(214,143,'技术亮点 4','隐私堡垒：国内首个UWB数字钥匙防中继攻击，全链路数据加密','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(215,143,'技术亮点 5','天地一体：30颗卫星提供72小时自然灾害预警 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(216,143,'技术亮点 6','健康座舱：零甲醛材料与电磁辐射医疗级防护','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(217,143,'实测证据 1','车身扭转刚度高达 45000N·m/deg','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(218,143,'实测证据 2','AEB支持最高 135km/h 刹停（静止车辆） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(219,143,'实测证据 3','电池材料镍钴锰回收率 >99% *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(220,143,'实测证据 4','AI智驾预判交通行为准确率 98.7%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(221,143,'实测证据 5','热成型钢占比 >80%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(222,143,'认证证据 1','工信部第001号“5A级座舱舒适认证”','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(223,143,'认证证据 2','工信部五星信息安全认证','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(224,143,'认证证据 3','Euro NCAP / ANCAP 双五星安全评级','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(225,143,'认证证据 4','ISO 26262 功能安全认证 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(226,143,'认证证据 5','CNAS/TUV 认证实验室 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(227,143,'对比证据 1','电池火烧测试时长 240秒（国标130秒的1.8倍） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(228,143,'对比证据 2','前防撞梁“目”字形截面承载能力比主流“日”字形提升 30%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(229,143,'对比证据 3','同级唯一满足 50km/h 正面中心柱碰安全要求（如银河E5）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(230,144,'技术原理',replace('1. **笼式结构**：采用‘四横四纵’封闭环状框架，高强度钢与铝合金占比超80%，关键部位应用四层热成型硼钢；\n2. **传力设计**：独创‘蜻蜓’式多路径力传导，将局部冲击扩散至整体骨架；\n3. **吸能机制**：前部采用550mm超长铝合金吸能盒（Z型折弯），底部副车架设计定向断裂（发动机下沉）防止侵入座舱。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(231,144,'价值','为乘员提供‘军工级’物理生存空间，彻底解决新能源汽车电池碰撞起火痛点，并显著提升车辆操控稳定性（高扭转刚度）。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(232,144,'适用边界','极端碰撞下虽能保全乘员舱，但高强度结构可能导致维修成本较高；需配合主动安全系统才能发挥最大效能。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(233,144,'技术亮点 1','行业首创‘十宫格’电池防撞隔舱（航空铝合金，厚度163mm）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:04','2025-12-08 07:30:04');
INSERT INTO knowledge_points VALUES(234,144,'技术亮点 2','TWB激光拼焊一体式门环','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(235,144,'技术亮点 3','四层热成型硼钢A柱（兼顾视野与200kN抗弯）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(236,144,'技术亮点 4','航天级‘目’字形截面前防撞梁','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(237,144,'技术亮点 5','CTB技术集成，电池包作为结构件增强车身刚性','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(238,144,'实测证据 1','车身扭转刚度高达 41,000~45,000 N·m/deg','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(239,144,'实测证据 2','侧面可承受 65吨 冲击力（是普通车身的数倍）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(240,144,'实测证据 3','电池包最大形变仅 12.5mm（在65吨冲击下）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(241,144,'实测证据 4','白车身轻量化系数低至 1.74','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(242,144,'认证证据 1','C-NCAP / Euro NCAP / ANCAP 五星安全评级','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(243,144,'认证证据 2','20吨重卡夹击测试‘零’泄漏','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(244,144,'认证证据 3','魔鬼秋千试验（5米高空45°双车撞击）A/C柱无变形','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(245,144,'对比证据 1','前防撞梁‘目’字形截面承载能力比主流‘日’字形提升 30%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(246,144,'对比证据 2','同级唯一通过 50km/h 正面中心柱碰测试（国标无要求）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(247,144,'对比证据 3','后碰防御速度达 90km/h（远超美标80km/h）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(248,144,'对比证据 4','侧面柱碰测试点位 14个（国标仅1个），覆盖全车身','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(249,145,'技术原理',replace('1. **全域解耦与融合**：硬件层（空间/底盘）与系统层（EEA3.0/OS）深度解耦，实现跨能源形式（纯电/混动/增程/甲醇）的兼容；\n2. **AI原生集成**：将星睿AI大模型植入研发、制造及车机系统，实现全链路AI赋能；\n3. **空间与能效最大化**：通过CTB电池车身一体化与AI数字底盘技术，突破物理空间与能效极限。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(250,145,'价值','大幅降低研发成本（通用率70%）并缩短周期（50%），让主流市场车型也能拥有百万级的智能化体验与安全标准，推动“科技平权”。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(251,145,'适用边界','虽然架构本身支持全尺寸，但主要聚焦于主流中高端市场（B-D级），A0级小车可能更多沿用SEA入门版或BMA架构。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(252,145,'技术亮点 1','**全能源兼容**：支持纯电、插混、增程、甲醇等全能源形式','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(253,145,'技术亮点 2','**AI数字底盘**：4ms极速响应，支持蟹行模式、无人漂移 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(254,145,'技术亮点 3','**极致能效**：雷神EM-i超级电混热效率46.5%，综合续航超2000km','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(255,145,'技术亮点 4','**空间魔术师**：轴距带宽2850-3200mm，得房率高达88% *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(256,145,'技术亮点 5','**无界生态**：开放4000+ API接口，构建硬件+软件+云端全生态','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(257,145,'实测证据 1','研发周期缩短 50%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(258,145,'实测证据 2','零部件通用率 70%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(259,145,'实测证据 3','风阻系数低至 0.199Cd（银河E8）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(260,145,'实测证据 4','电池寿命延长 15%（AI云端管理）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(261,145,'实测证据 5','热效率 46.5%（雷神EM-i发动机）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(262,145,'认证证据 1','行业首个“AI智能架构”认证','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(263,145,'认证证据 2','满足全球五星安全标准（C-NCAP/E-NCAP等）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(264,145,'认证证据 3','ISO 26262 功能安全流程认证 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(265,145,'对比证据 1','同级唯一实现“硬件、系统、生态、AI”四位一体深度融合','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(266,145,'对比证据 2','相比传统架构，空间利用率提升显著（如银河E5座舱空间达B级车标准）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(267,145,'对比证据 3','馈电油耗低至 2L/100km（雷神EM-i），优于行业平均水平','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(268,146,'技术原理','以“硬件全域线控 + AI实时决策”为核心：硬件上整合线控转向、线控制动、轮边电驱及闭式双腔空悬；软件上依托星睿AI大模型进行车身姿态预测与动态调优，结合多传感器融合（卫星遥感、激光雷达等）构建天地一体感知网络，通过GVMC动态控制系统实现4毫秒级实时响应。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(269,146,'价值','重新定义驾驶边界与安全标准：实现极限操控（如无人漂移）、全地形适应（涉水/沙漠脱困）、以及“永不失控”的主动安全防护，推动高端底盘技术向大众车型平权。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(270,146,'适用边界','需配合星睿智算中心与低轨卫星网络实现完整功能','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(271,146,'技术亮点 1','全球首个汽车无人驾驶漂移','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(272,146,'技术亮点 2','响应速度仅4毫秒（比人类快25倍）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(273,146,'技术亮点 3','全栈线控技术（线控转向/制动/轮边电驱）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(274,146,'技术亮点 4','轮边电驱支持±20°后轮转向','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(275,146,'技术亮点 5','坦克掉头与蟹行模式','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(276,146,'技术亮点 6','涉水漂浮与沙漠脱困能力','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(277,146,'实测证据 1','响应速度 4ms','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(278,146,'实测证据 2','单电机峰值功率 230kW','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(279,146,'实测证据 3','轮端扭矩 2600Nm','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(280,146,'实测证据 4','转弯半径缩至 5米','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(281,146,'实测证据 5','涉水深度 800mm','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(282,146,'实测证据 6','漂浮航速 4.6节','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(283,146,'实测证据 7','爆胎后偏移率 <0.5°','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(284,146,'实测证据 8','碰撞0.05秒切断高压电','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(285,146,'认证证据','全球首个汽车无人驾驶漂移','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(286,146,'对比证据 1','转弯半径媲美A级车','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(287,146,'对比证据 2','脱困能力提升60%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(288,146,'对比证据 3','冲击感降低50%（无感越障）','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(289,147,'技术原理','基于“三层基础模型体系”（语言大模型、多模态大模型、数字孪生大模型）和“六大能力模型”（NLP、NPDS、多模态感知等），依托星睿智算中心算力底座，实现从语言交互到研发制造的全链路赋能。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(290,147,'价值','重构汽车AI范式：实现交互升维（情感陪伴）、研发革命（缩短周期、降本增效）及生态开源（技术平权），推动汽车从“移动工具”向“全域智能终端”进化。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(291,147,'适用边界','算力底座支持500万车辆并发计算','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(292,147,'技术亮点 1','全球首个汽车行业全栈自研全场景AI大模型','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(293,147,'技术亮点 2','千亿参数语言理解，万亿级场景生成','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(294,147,'技术亮点 3','行业首个全场景陪伴AI智能体验','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(295,147,'技术亮点 4','具备高情商、高智商的类人情感交互','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(296,147,'技术亮点 5','支持跨模态交互（眼神、手势、语音）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(297,147,'实测证据 1','训练数据量超3万亿Tokens','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(298,147,'实测证据 2','AI语音助手0.23秒极速响应','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(299,147,'实测证据 3','单句15指令并发','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(300,147,'实测证据 4','用户指令执行满意度达98%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(301,147,'实测证据 5','AI DRIVE模型缩短自动驾驶验证周期30%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(302,147,'实测证据 6','节省50%开发成本','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(303,147,'实测证据 7','10小时生成1000公里逼真驾驶场景','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(304,147,'实测证据 8','单日可合成10万张标注数据','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(305,147,'认证证据 1','中国信通院大模型通用能力4+最高评级','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(306,147,'认证证据 2','2023 AIIA人工智能十大先锋应用案例','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(307,147,'对比证据 1','逻辑推理与上下文记忆能力达中文前十水平','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(308,147,'对比证据 2','语音交互自然度、多意图理解精度超越竞品','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(309,147,'对比证据 3','AI DRIVE在Cityscapes和ACDC评测中排名第一','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(310,147,'对比证据 4','类人化情感交互能力领先','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(311,148,'技术原理','基于云-边-端协同架构：云端采用阿里云飞天智算平台支持千卡并行；边缘节点实现毫秒级工业数据处理；底层采用自研高速通信协议（4.5TB/s带宽）与液冷散热/电力冗余基础设施，融合阶跃星辰多模态大模型进行算法创新。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(312,148,'价值','重构汽车研发与智能化进程：实现研发效能跃迁（训练提速200倍）、新能源安全全维守护（电池热失控预警）、以及生态开放普惠，推动中国汽车从“制造”向“智造”转型。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(313,148,'适用边界','断电时可满负荷运行30分钟; 全年可用性99.99%','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(314,148,'技术亮点 1','综合算力23.5 EFLOPS，位居中国车企首位','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(315,148,'技术亮点 2','万卡级超算规模','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(316,148,'技术亮点 3','云-边-端协同架构','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(317,148,'技术亮点 4','液冷散热与电力冗余设计（全年可用性99.99%）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(318,148,'技术亮点 5','支持700多万辆车辆并发需求','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(319,148,'实测证据 1','综合算力 23.5 EFLOPS','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(320,148,'实测证据 2','存储带宽 4.5TB/s','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(321,148,'实测证据 3','千卡并行计算效率 >90%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(322,148,'实测证据 4','1000个智驾模型训练时间从3个月缩短至8小时','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(323,148,'实测证据 5','1天可模拟10万公里驾驶行为','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(324,148,'实测证据 6','双精度浮点算力 3.54 PFlops','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(325,148,'实测证据 7','断电满负荷运行 30分钟','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(326,148,'认证证据 1','全球首个智能汽车算力联盟','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(327,148,'认证证据 2','国家“东数西算”工程标杆','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(328,148,'对比证据 1','综合算力位居中国车企首位','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(329,148,'对比证据 2','研发周期缩短6个月以上','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(330,148,'对比证据 3','单轮试验效率提升600倍','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(331,149,'技术原理','结合硬件堆料（9.1.6声道、2000W功放）与AI算法（虚拟场馆、声场自适应），通过WANOS全景声技术实现沉浸式听觉体验。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(332,149,'价值','打破国际品牌垄断，将百万级豪车的声学体验下放至15万级车型，推动智能座舱进入“听觉体验竞争”新阶段。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(333,149,'适用边界','部分全景声资源需通过WANOS全景声App或银河声音空间App获取 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(334,149,'技术亮点 1','9.1.6声道立体环绕声：支持最多27个扬声器布局','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(335,149,'技术亮点 2','2000W独立功放：额定功率达行业顶尖水平','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(336,149,'技术亮点 3','虚拟场馆技术：AI模拟录音棚、音乐厅等4大场景','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(337,149,'技术亮点 4','WANOS全景声技术：国产唯一自研全景声标准','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(338,149,'技术亮点 5','同级唯一头枕扬声器：定向传递导航与通话','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(339,149,'技术亮点 6','AI音乐律动：氛围灯随音乐节奏律动','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(340,149,'实测证据 1','额定功率 2000W','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(341,149,'实测证据 2','低频下潜 20Hz','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(342,149,'实测证据 3','高频延伸 20kHz+','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(343,149,'实测证据 4','座舱静谧性 < 35dB','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(344,149,'对比证据 1','AI算力是高通骁龙8155的2倍 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(345,149,'对比证据 2','音效品质可媲美豪华车音响的“柏林之声” *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(346,149,'对比证据 3','小米SU7峰值功率仅1260W *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(347,150,'技术原理','基于“芯片自研+无界互联+AI情感化”三重革新：硬件上采用国产首颗车规级7nm座舱芯片“龍鷹一号”与云端星睿智算中心协同；软件上利用Flyme Link技术实现手机-车机无感连接，并结合星睿AI大模型实现多模态交互与场景化服务。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(348,150,'价值','打破技术垄断，将AI算力普惠至15万级车型；实现多终端无缝流转与全景声生态，打造移动娱乐空间；通过AI数字精灵与定制化服务，让车成为有温度的出行伙伴。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(349,150,'适用边界','部分深度互联功能（如无感连接、硬件共享）需配合魅族手机使用 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(350,150,'技术亮点 1','龍鷹一号7nm座舱芯片：AI算力达8 TOPS，支持2.5K高清视频','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(351,150,'技术亮点 2','Flyme Link技术：手机-车机无感连接，应用流转，硬件共享','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(352,150,'技术亮点 3','Flyme Sound无界之声：行业首个9.1.6声道布局，27扬声器 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(353,150,'技术亮点 4','Alive Design场景空间：8种预设场景模式，支持自定义组合','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(354,150,'技术亮点 5','星睿AI大模型赋能：AI律动、AI回忆、AI数字精灵','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(355,150,'实测证据 1','系统响应速度 < 0.23秒','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(356,150,'实测证据 2','语音模糊语义识别准确率 98%','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(357,150,'实测证据 3','CPU算力 90K DMIPS','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(358,150,'实测证据 4','GPU算力 900G FLOPS','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(359,150,'实测证据 5','音响额定功率 2000W *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(360,150,'实测证据 6','低频下潜至 20Hz *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(361,150,'对比证据 1','AI算力为高通8155的2倍','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(362,150,'对比证据 2','系统流畅度超越行业标杆','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(363,149,'技术原理','结合硬件堆料（9.1.6声道、2000W功放）与AI算法（虚拟场馆、声场自适应），通过WANOS全景声技术实现沉浸式听觉体验。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(364,149,'价值','打破国际品牌垄断，将百万级豪车的声学体验下放至15万级车型，推动智能座舱进入“听觉体验竞争”新阶段。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(365,149,'适用边界','部分全景声资源需通过WANOS全景声App或银河声音空间App获取 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(366,149,'技术亮点 1','9.1.6声道立体环绕声：支持最多27个扬声器布局','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(367,149,'技术亮点 2','2000W独立功放：额定功率达行业顶尖水平','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(368,149,'技术亮点 3','虚拟场馆技术：AI模拟录音棚、音乐厅等4大场景','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(369,149,'技术亮点 4','WANOS全景声技术：国产唯一自研全景声标准','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(370,149,'技术亮点 5','同级唯一头枕扬声器：定向传递导航与通话','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(371,149,'技术亮点 6','AI音乐律动：氛围灯随音乐节奏律动','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(372,149,'实测证据 1','额定功率 2000W','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(373,149,'实测证据 2','低频下潜 20Hz','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(374,149,'实测证据 3','高频延伸 20kHz+','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(375,149,'实测证据 4','座舱静谧性 < 35dB','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(376,149,'对比证据 1','AI算力是高通骁龙8155的2倍 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(377,149,'对比证据 2','音效品质可媲美豪华车音响的“柏林之声” *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(378,149,'对比证据 3','小米SU7峰值功率仅1260W *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(379,151,'技术原理','依托星睿智算中心与火山引擎边缘节点构建云端算力底座，利用实时音视频推流技术（1080P/60帧）、网络波动摆尾技术及云端热更新机制，将计算负载转移至云端，终端仅负责显示与交互。','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(380,151,'价值','解决传统车机算力不足、存储受限及应用生态匮乏的痛点，以10万级车型价格实现百万级智能座舱体验（科技平权），释放本地算力并确保持久流畅。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(381,151,'适用边界','依赖网络连接质量（虽有弱网优化技术），体验受限于云端算力覆盖区域。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(382,151,'技术亮点 1','海量生态：接入腾讯应用宝（300+应用），支持微信小程序“云空间管家”私有APK直装','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(383,151,'技术亮点 2','0存储占用：应用云端运行，不占用本地存储空间','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(384,151,'技术亮点 3','AI个性化：AI音乐律动（生成动态MV）、Wow壁纸（AI生成主题）','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(385,151,'技术亮点 4','多场景扩展：支持手机虚拟手柄游戏、车内线上会议及育儿助手','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(386,151,'技术亮点 5','跨端互联：车机与手机账号打通（如网易云VIP），权益无缝共享','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(387,151,'实测证据 1','云端交互延迟低至 70ms','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(388,151,'实测证据 2','支持 1080P 高清画质 + 60帧刷新率','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(389,151,'实测证据 3','星睿智算中心算力超 15 EFLOPS','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(390,151,'认证证据','中国汽车工业协会 AUTOSEMO智能汽车创新合作奖','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(391,151,'对比证据 1','视频通话相比传统方案实现 0延迟、0缓冲','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(392,151,'对比证据 2','应用更新无需等待 OTA，实时同步最新版本','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(393,128,'技术原理',replace('1. **物理结构降阻**：基于电阻定律(R=ρL/S)，将电芯长度缩短至580mm（比长刀电池缩短约40%），厚度增加至18.2mm，通过物理尺寸优化显著降低内阻和发热量。*\n2. **材料体系升级**：采用湿法双涂层隔膜（提高柔韧性与防穿刺能力）、氧化铝耐热涂层（构建正负极“隔离带”）、细管径碳纳米管（打造离子“高速公路”）及低阻抗电解液添加剂。*\n3. **结构集成技术**：应用CTB电池车身一体化技术，配合“田”字形框架及吸能缓冲空间，实现液电分离与热量疏导。*','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(394,128,'价值','彻底解决了新能源汽车用户的四大核心痛点：极致的安全性消除起火焦虑；超长循环寿命实现“一代电池服务两代车”，提升二手保值率；超快充技术显著减少补能等待；卓越的低温性能解决了冬季续航大幅衰减的问题。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(395,128,'适用边界','基于磷酸铁锂化学体系，主要通过吉利自建的建湖耀宁及贵阳闪聚工厂生产，广泛适配轿车、SUV、MPV及商用车等多种车型平台。 *','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(396,128,'技术亮点 1','“军工级”安全标准：8针同刺、真弹枪击不起火 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(397,128,'技术亮点 2','17分钟极速快充（10%-80%） *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(398,128,'技术亮点 3','3500圈超长循环寿命，支持行驶超100万公里 *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(399,128,'技术亮点 4','-30℃极寒环境下容量保持率超90% *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(400,128,'技术亮点 5','能量密度高达192Wh/kg，体积利用率提升50% *','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(401,128,'实测证据 1','8针同刺试验：8根直径5mm钢针同时穿刺并静置1小时，不冒烟、不起火、不爆炸 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(402,128,'实测证据 2','真弹枪击试验：全球首个通过5.8mm自动步枪子弹以920m/s速度击穿测试，创口直径≥60mm仍保持稳定 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(403,128,'实测证据 3','充电实测：10%-80% SOC充电仅需17分4秒 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(404,128,'实测证据 4','实车耐久：银河E5行驶30万公里后电池健康度仍达90.5% *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(405,128,'实测证据 5','低温实测：-30℃环境下容量保持率高达90.54% *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(406,128,'认证证据 1','行业首张“新能源汽车安全管理体系认证”证书 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(407,128,'认证证据 2','中汽中心6大“魔鬼”串行试验通过认证（动态海水腐蚀、高原极寒、高频刮底、26吨碾压、侧柱碰、烈焰炙烤） *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(408,128,'对比证据 1','充电倍率：平均充电倍率2.45C，相比长刀电池（1.61C）提升约52% *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(409,128,'对比证据 2','低温性能：-30℃容量保持率90.54%，领先长刀电池（78.96%）约11.6个百分点 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(410,128,'对比证据 3','热管理：因内阻降低，发热量相比长刀电池减少30% *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(411,128,'对比证据 4','结构效率：长度缩短40%，体积利用率提升50%以上 *','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(412,152,'技术原理',replace('1. 全域AI架构：采用端到端（E2E）大模型，整合BEV感知、Occupancy Network（3D体素占据网络）和强化学习策略，实现从传感器输入到控制指令的直接映射，减少中间规则损耗。\n2. 天地一体协同：利用自建低轨卫星网络提供厘米级高精定位，并结合视觉语言模型（VLM）进行超视距环境感知（如天气、地质灾害预警）。\n3. 硬件全冗余：H9方案采用双NVIDIA Thor芯片、双MCU、双制动系统（ESP+ibooster）架构，确保单点失效下的系统安全性。','\n',char(10)),'principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(413,152,'价值','核心价值在于“技术平权”与“极致安全”。它将高速NOA、记忆泊车等高阶功能下放至15万级甚至6.88万级的大众车型，显著提升了用户的驾驶体验与性价比。同时，通过“天地一体”的卫星预警和全冗余安全架构，大幅降低了极端天气和复杂路况下的驾驶风险。','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(414,152,'适用边界','L3级自动驾驶功能（H9）的全面落地受限于当前法规责任划分及用户认知；高阶功能需依赖特定的高性能硬件（如双Thor芯片、激光雷达）。','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(415,152,'技术亮点 1','五级分层架构 (H1-H9)：从入门级高速NOA到行业首个量产级L3自动驾驶方案，覆盖全价格段。','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(416,152,'技术亮点 2','无图全场景通行：摆脱高精地图依赖，纯视觉+激光雷达融合感知，支持小区、无名小路及极端泊车场景。','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(417,152,'技术亮点 3','天地一体卫星通信：结合30颗低轨卫星，提供暴雨/滑坡等灾害提前预警及精准定位。','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(418,152,'技术亮点 4','超强算力底座：依托23.5 EFLOPS算力的星睿智算中心2.0进行模型训练。','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(419,152,'技术亮点 5','全场景泊车：支持机械车位、跨楼层记忆泊车（最长2km）及代客泊车。','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(420,152,'实测证据 1','系统延迟：从传统方案的300ms大幅降至180ms。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(421,152,'实测证据 2','实测通过率：在重庆黄桷湾8D立交等极复杂路况下，实测通过率达93%。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(422,152,'实测证据 3','长尾场景可靠性：针对“鬼探头”、“加塞”等场景应对可靠性达99.99%。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(423,152,'实测证据 4','灾害预警：支持提前15分钟预警暴雨、滑坡等自然灾害。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(424,152,'实测证据 5','AEB性能：主动刹车生效时速最高达130km/h（行业最高）。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(425,152,'实测证据 6','冗余切换：双Thor芯片主备切换时间小于500ms。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(426,152,'认证证据 1','ISO 26262 ASIL-D (H9方案满足)','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(427,152,'认证证据 2','行业首个量产级L3智能驾驶解决方案','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(428,152,'对比证据 1','算力优势：星睿智算中心综合算力（23.5 EFLOPS）约为华为的3倍、比亚迪的10倍。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(429,152,'对比证据 2','成本下探：相比竞品高阶智驾通常仅限30万+车型，H1方案成功下探至6.88万级（如吉利星愿）。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(430,152,'对比证据 3','地图依赖：相比早期小鹏XNGP等强依赖高精地图的方案，千里浩瀚实现无图城市NOA。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(431,152,'对比证据 4','生态完整性：相比特斯拉FSD，拥有独家的低轨卫星系统支持，具备“天地一体”的差异化优势。','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(432,153,'技术原理','采用''硬件层+系统层+生态层''三位一体架构。硬件层通过1800-3300mm的超大带宽实现全尺寸覆盖；系统层首发SEA OS整车智能开发系统；生态层向全球开发者开放，实现全场景、全生命周期的体验进化。 [1][2]','principle','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(433,153,'价值','重新定义了软件汽车的研发周期，将软件开发时间缩短50%以上；通过取消传统传动轴实现纯平地板，使座舱空间利用率提升10%；为用户创造零边界的智能出行体验。 [1][2]','application','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(434,153,'适用边界','适用于轴距1800mm-3300mm的纯电车型，覆盖轿车、SUV、MPV、皮卡及跑车等 [1]','concept','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(435,153,'技术亮点 1','全球最大带宽：轴距覆盖1800mm-3300mm，适配A级至E级全品类车型 [1]','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(436,153,'技术亮点 2','超长电池寿命：NEDC工况下20万公里无衰减，200万公里长寿命 [2]','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(437,153,'技术亮点 3','800V高压平台：支持充电5分钟续航120公里 [2]','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(438,153,'技术亮点 4','高性能电驱：搭载自主研发两挡电驱动变速器，最大承载扭矩8000N·m [2]','best_practice','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(439,153,'实测证据 1','NEDC续航里程超700km (110kWh电池包) [2]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(440,153,'实测证据 2','百公里加速最快可达3.8秒 (极氪001) [1]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(441,153,'实测证据 3','电池系统20万公里无衰减 [2]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(442,153,'认证证据 1','满足国际最高安全等级 ISO 26262 ASIL-D [2]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(443,153,'认证证据 2','电池安全：无热蔓延技术，实现''只冒烟不起火'' [2]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(444,153,'对比证据 1','软件开发周期比传统模式缩短50%以上 [1]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(445,153,'对比证据 2','座舱空间利用率比传统燃油车架构提升10% [1]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
INSERT INTO knowledge_points VALUES(446,153,'对比证据 3','带宽覆盖范围（1800-3300mm）全球最大，优于同期大众MEB平台 [2]','case_study','medium','[]','[]','[]','[]','[]',NULL,NULL,'import',NULL,NULL,'active',NULL,NULL,NULL,'2025-12-08 07:30:05','2025-12-08 07:30:05');
CREATE TABLE public_knowledge_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES public_knowledge_categories(id) ON DELETE SET NULL
        );
INSERT INTO public_knowledge_categories VALUES(1,'技术一张纸',NULL,0,'2025-12-08 05:29:56','2025-12-19 03:24:22');
CREATE TABLE public_knowledge_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER,
          name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          description TEXT,
          uploaded_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES public_knowledge_categories(id) ON DELETE SET NULL
        );
INSERT INTO public_knowledge_files VALUES(12,NULL,'【final】“天地一体化”智能出行科技生态,一页纸核心信息1107.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126794-ln3z3cbeje-_final__天地一体化_智能出行科技生态_一页纸核心信息1107.pdf','application/pdf',347617,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(13,NULL,'【final】2025上海车展一页纸核心信息.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126800-vgszazci4g-_final_2025上海车展一页纸核心信息.pdf','application/pdf',415061,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(14,NULL,'【final】吉利“五大”全球化战略体系一页纸核心信息1107.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126804-qdgind92jt-_final_吉利_五大_全球化战略体系一页纸核心信息1107.pdf','application/pdf',514270,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(15,NULL,'【final】千里浩瀚智能安全辅助驾驶 一页纸核心信息707.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126816-z663sq4paj-_final_千里浩瀚智能安全辅助驾驶_一页纸核心信息707.pdf','application/pdf',307792,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(16,NULL,'【final】星睿智算中心一页纸核心信息1107.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126822-0ab2kodbzerq-_final_星睿智算中心一页纸核心信息1107.pdf','application/pdf',292577,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(17,NULL,'【final】智能汽车全域AI 一页纸核心信息--1107.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126826-q2i2ld6xdxm-_final_智能汽车全域AI_一页纸核心信息__1107.pdf','application/pdf',343886,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(18,NULL,'【final】神盾金砖电池一页纸核心信息20250901.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126819-fzo6xm9601-_final_神盾金砖电池一页纸核心信息20250901.pdf','application/pdf',661728,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(19,NULL,'【final】雷神EM-i超级电混 一页纸核心信息20250729.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126813-rcdhui4k8m-_final_雷神EM_i超级电混_一页纸核心信息20250729.pdf','application/pdf',319107,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(20,NULL,'【final】雷神AI电混2.0 onepage KM--20250703.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126810-85mqckmw86k-_final_雷神AI电混2_0_onepage_KM__20250703.pdf','application/pdf',337507,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
INSERT INTO public_knowledge_files VALUES(21,NULL,'【final】吉利发布行业首个AI座舱.pdf','/Volumes/Lexar/git/02JLwork/todify4/backend/backend/uploads/public-knowledge/1766733126807-78gedswr22y-_final_吉利发布行业首个AI座舱.pdf','application/pdf',148571,NULL,NULL,'2025-12-26 07:12:06','2025-12-26 07:12:06');
CREATE TABLE resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(200) NOT NULL,
            type VARCHAR(50) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT '开发中',
            delivery_date DATE,
            attachments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
INSERT INTO resources VALUES(1,'银河整车图','实拍视频',NULL,'开发中',NULL,'[{"id":"1","url":"/uploads/materials/root/2025-11-24/1763967482519________________L.png","name":"第四代博越L.png","size":873343,"mimeType":"image/png"}]','2025-11-27 05:21:26','2025-12-08 06:13:32');
CREATE TABLE ai_search_field_mappings (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL UNIQUE,
          config TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO ai_search_field_mappings VALUES('bd82dabc-5baf-4eb1-acd8-774d35625507','ai-role-1765777233923-du3squ','{"workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"featureObjects":[{"featureType":"five-view-analysis","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-strategy","label":"五看"},{"featureType":"three-fix-analysis","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-strategy","label":"三定"},{"featureType":"ppt-outline","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-strategy","label":"技术讲稿"},{"featureType":"script","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-strategy","label":"脚本"},{"featureType":"custom-sence","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-strategy","label":"用户场景"},{"featureType":"five-view-analysis","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-article","label":"五看"},{"featureType":"three-fix-analysis","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-article","label":"三定"},{"featureType":"ppt-outline","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-article","label":"技术讲稿"},{"featureType":"script","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-article","label":"脚本"},{"featureType":"custom-sence","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-article","label":"用户场景"},{"featureType":"ppt-outline","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"press-release","label":"技术讲稿"},{"featureType":"script","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"press-release","label":"脚本"},{"featureType":"custom-sence","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"press-release","label":"用户场景"},{"featureType":"translation","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"press-release","label":"翻译","agentId":"ai-role-1765777230810-h1al7m"},{"featureType":"propagation-strategy","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"press-release","label":"传播","agentId":"ai-role-1765777226269-55mbe8"},{"featureType":"three-fix-analysis","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"三定","agentId":"ai-role-1765335292125-vf46rf"},{"featureType":"ppt-outline","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"技术讲稿","agentId":"ai-role-1765777232257-rrfqk"},{"featureType":"custom-sence","workflowId":"ai-role-1765777233923-du3squ","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"用户场景","agentId":"ai-role-1766113034950-68moj"}]}','2025-12-19T02:31:42.045Z','2026-01-13T06:38:01.052Z');
INSERT INTO ai_search_field_mappings VALUES('87ee3442-f79b-4eee-a1f1-f555ecdd9557','agent-content-processor','{"workflowId":"agent-content-processor","inputMappings":[],"outputMappings":[],"featureObjects":[{"featureType":"script","workflowId":"agent-content-processor","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"脚本","agentId":"ai-role-1768295004009-bt59a5"},{"featureType":"tech-matrix","workflowId":"agent-content-processor","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"技术矩阵"},{"featureType":"propagation-strategy","workflowId":"agent-content-processor","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"传播"},{"featureType":"exhibition-video","workflowId":"agent-content-processor","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"展具与视频"},{"featureType":"translation","workflowId":"agent-content-processor","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"翻译"}]}','2026-01-13T06:15:16.644Z','2026-01-13T09:05:29.375Z');
INSERT INTO ai_search_field_mappings VALUES(NULL,'independent-page-tech-package','{"workflowId":"independent-page-tech-package","inputMappings":[{"workflowInputName":"query","sourceType":"field","sourceField":"query"}],"outputMappings":[{"workflowOutputName":"answer","targetField":"content","extractExpression":"output.answer || output.text || output.content || output.output"}],"featureObjects":[{"featureType":"five-view-analysis","workflowId":"tech-fundamentalist","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"五看","agentId":"tech-fundamentalist"},{"featureType":"three-fix-analysis","workflowId":"tech-fundamentalist","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"三定","agentId":"tech-fundamentalist"},{"featureType":"tech-matrix","workflowId":"scene-alchemist","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"技术矩阵","agentId":"scene-alchemist"},{"featureType":"propagation-strategy","workflowId":"market-sniper","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"传播","agentId":"market-sniper"},{"featureType":"exhibition-video","workflowId":"content-director","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"展具与视频","agentId":"content-director"},{"featureType":"translation","workflowId":"content-director","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"翻译","agentId":"content-director"},{"featureType":"ppt-outline","workflowId":"content-director","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"技术通稿","agentId":"content-director"},{"featureType":"script","workflowId":"content-director","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"脚本","agentId":"content-director"},{"featureType":"用户场景","workflowId":"scene-alchemist","inputMappings":[],"outputMappings":[],"pageType":"tech-package","label":"用户场景","agentId":"scene-alchemist"}]}','2026-01-13 11:06:16','2026-01-13T12:18:43.845Z');
INSERT INTO ai_search_field_mappings VALUES('35ecb961-4a99-452e-a8c3-babdc83aea89','market-sniper','{"workflowId":"market-sniper","inputMappings":[{"workflowInputName":"query","sourceType":"field","sourceField":"query"}],"outputMappings":[{"workflowOutputName":"answer","targetField":"content","extractExpression":"output.answer || output.text || output.content || output.output"}]}','2026-01-13T11:13:04.585Z','2026-01-13T11:13:04.585Z');
CREATE TABLE id_mappings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_db_name TEXT NOT NULL,
          source_table_name TEXT NOT NULL,
          source_id INTEGER NOT NULL,
          target_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(source_db_name, source_table_name, source_id)
        );
INSERT INTO id_mappings VALUES(2752,'database.db','ai_roles','independent-page-ai-search','independent-page-ai-search','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2753,'database.db','ai_roles','independent-page-tech-package','independent-page-tech-package','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2754,'database.db','ai_roles','independent-page-tech-strategy','independent-page-tech-strategy','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2755,'database.db','ai_roles','independent-page-core-draft','independent-page-core-draft','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2756,'database.db','ai_roles','independent-page-speech','independent-page-speech','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2757,'database.db','ai_roles','smart-workflow-ai-search','smart-workflow-ai-search','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2758,'database.db','ai_roles','smart-workflow-tech-package','smart-workflow-tech-package','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2759,'database.db','ai_roles','smart-workflow-tech-strategy','smart-workflow-tech-strategy','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2760,'database.db','ai_roles','smart-workflow-core-draft','smart-workflow-core-draft','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2761,'database.db','ai_roles','smart-workflow-speech','smart-workflow-speech','2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2762,'todify2.db','brands',1,1,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2763,'todify2.db','brands',2,2,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2764,'todify2.db','brands',3,3,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2765,'todify2.db','brands',4,4,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2766,'todify2.db','brands',5,5,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2767,'todify2.db','brands',6,6,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2768,'todify2.db','brands',7,7,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2769,'todify2.db','tech_categories',1,1,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2770,'todify2.db','tech_categories',2,2,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2771,'todify2.db','tech_categories',3,3,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2772,'todify2.db','tech_categories',4,4,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2773,'todify2.db','tech_categories',5,5,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2774,'todify2.db','tech_categories',6,6,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2775,'todify2.db','tech_categories',7,7,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2776,'todify2.db','tech_categories',8,8,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2777,'todify2.db','tech_categories',9,9,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2778,'todify2.db','tech_categories',11,11,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2779,'todify2.db','car_models',1,1,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2780,'todify2.db','car_models',2,2,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2781,'todify2.db','car_models',3,3,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2782,'todify2.db','car_models',4,4,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2783,'todify2.db','car_models',5,5,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2784,'todify2.db','car_models',6,6,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2785,'todify2.db','car_models',7,7,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2786,'todify2.db','car_models',8,8,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2787,'todify2.db','car_models',9,9,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2788,'todify2.db','car_models',10,10,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2789,'todify2.db','car_models',11,11,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2790,'todify2.db','car_models',12,12,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2791,'todify2.db','car_models',13,13,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2792,'todify2.db','car_models',14,14,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2793,'todify2.db','car_models',15,15,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2794,'todify2.db','tech_points',1,1,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2795,'todify2.db','tech_points',2,2,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2796,'todify2.db','tech_points',5,5,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2797,'todify2.db','tech_points',35,35,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2798,'todify2.db','tech_points',125,125,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2799,'todify2.db','tech_points',126,126,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2800,'todify2.db','tech_points',127,127,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2801,'todify2.db','tech_points',128,128,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2802,'todify2.db','tech_points',129,129,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2803,'todify2.db','tech_points',130,130,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2804,'todify2.db','tech_points',131,131,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2805,'todify2.db','tech_points',132,132,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2806,'todify2.db','tech_points',133,133,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2807,'todify2.db','tech_points',134,134,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2808,'todify2.db','tech_points',135,135,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2809,'todify2.db','tech_points',136,136,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2810,'todify2.db','tech_points',137,137,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2811,'todify2.db','tech_points',138,138,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2812,'todify2.db','tech_points',139,139,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2813,'todify2.db','tech_points',140,140,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2814,'todify2.db','tech_points',141,141,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2815,'todify2.db','tech_points',142,142,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2816,'todify2.db','tech_points',143,143,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2817,'todify2.db','tech_points',144,144,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2818,'todify2.db','tech_points',145,145,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2819,'todify2.db','tech_points',146,146,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2820,'todify2.db','tech_points',147,147,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2821,'todify2.db','tech_points',148,148,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2822,'todify2.db','tech_points',149,149,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2823,'todify2.db','tech_points',150,150,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2824,'todify2.db','tech_points',151,151,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2825,'todify2.db','tech_points',152,152,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2826,'todify2.db','tech_points',153,153,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2827,'todify2.db','tech_point_car_models',23,2826,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2828,'todify2.db','tech_point_car_models',24,2827,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2829,'todify2.db','tech_point_car_models',25,2828,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2830,'todify2.db','tech_point_car_models',26,2829,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2831,'todify2.db','tech_point_car_models',27,2830,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2832,'todify2.db','tech_point_car_models',28,2831,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2833,'todify2.db','tech_point_car_models',29,2832,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2834,'todify2.db','tech_point_car_models',30,2833,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2835,'todify2.db','tech_point_car_models',31,2834,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2836,'todify2.db','tech_point_car_models',32,2835,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2837,'todify2.db','tech_point_car_models',33,2836,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2838,'todify2.db','tech_point_car_models',34,2837,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2839,'todify2.db','tech_point_car_models',35,2838,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2840,'todify2.db','tech_point_car_models',36,2839,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2841,'todify2.db','tech_point_car_models',37,2840,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2842,'todify2.db','tech_point_car_models',38,2841,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2843,'todify2.db','tech_point_car_models',39,2842,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2844,'todify2.db','tech_point_car_models',40,2843,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2845,'todify2.db','tech_point_car_models',41,2844,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2846,'todify2.db','tech_point_car_models',42,2845,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2847,'todify2.db','tech_point_car_models',43,2846,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2848,'todify2.db','tech_point_car_models',44,2847,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2849,'todify2.db','knowledge_points',1,2848,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2850,'todify2.db','knowledge_points',2,2849,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2851,'todify2.db','knowledge_points',3,2850,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2852,'todify2.db','knowledge_points',4,2851,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2853,'todify2.db','knowledge_points',5,2852,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2854,'todify2.db','knowledge_points',6,2853,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2855,'todify2.db','knowledge_points',7,2854,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2856,'todify2.db','knowledge_points',8,2855,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2857,'todify2.db','knowledge_points',9,2856,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2858,'todify2.db','knowledge_points',10,2857,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2859,'todify2.db','knowledge_points',11,2858,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2860,'todify2.db','knowledge_points',12,2859,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2861,'todify2.db','knowledge_points',13,2860,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2862,'todify2.db','knowledge_points',14,2861,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2863,'todify2.db','knowledge_points',15,2862,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2864,'todify2.db','knowledge_points',16,2863,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2865,'todify2.db','knowledge_points',17,2864,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2866,'todify2.db','knowledge_points',18,2865,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2867,'todify2.db','knowledge_points',19,2866,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2868,'todify2.db','knowledge_points',20,2867,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2869,'todify2.db','knowledge_points',21,2868,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2870,'todify2.db','knowledge_points',22,2869,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2871,'todify2.db','knowledge_points',23,2870,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2872,'todify2.db','knowledge_points',24,2871,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2873,'todify2.db','knowledge_points',25,2872,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2874,'todify2.db','knowledge_points',26,2873,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2875,'todify2.db','knowledge_points',27,2874,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2876,'todify2.db','knowledge_points',28,2875,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2877,'todify2.db','knowledge_points',29,2876,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2878,'todify2.db','knowledge_points',30,2877,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2879,'todify2.db','knowledge_points',31,2878,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2880,'todify2.db','knowledge_points',32,2879,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2881,'todify2.db','knowledge_points',33,2880,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2882,'todify2.db','knowledge_points',34,2881,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2883,'todify2.db','knowledge_points',35,2882,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2884,'todify2.db','knowledge_points',36,2883,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2885,'todify2.db','knowledge_points',37,2884,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2886,'todify2.db','knowledge_points',38,2885,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2887,'todify2.db','knowledge_points',39,2886,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2888,'todify2.db','knowledge_points',40,2887,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2889,'todify2.db','knowledge_points',41,2888,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2890,'todify2.db','knowledge_points',42,2889,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2891,'todify2.db','knowledge_points',43,2890,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2892,'todify2.db','knowledge_points',44,2891,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2893,'todify2.db','knowledge_points',45,2892,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2894,'todify2.db','knowledge_points',46,2893,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2895,'todify2.db','knowledge_points',47,2894,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2896,'todify2.db','knowledge_points',48,2895,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2897,'todify2.db','knowledge_points',49,2896,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2898,'todify2.db','knowledge_points',50,2897,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2899,'todify2.db','knowledge_points',51,2898,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2900,'todify2.db','knowledge_points',52,2899,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2901,'todify2.db','knowledge_points',53,2900,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2902,'todify2.db','knowledge_points',54,2901,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2903,'todify2.db','knowledge_points',55,2902,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2904,'todify2.db','knowledge_points',56,2903,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2905,'todify2.db','knowledge_points',57,2904,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2906,'todify2.db','knowledge_points',58,2905,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2907,'todify2.db','knowledge_points',59,2906,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2908,'todify2.db','knowledge_points',60,2907,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2909,'todify2.db','knowledge_points',61,2908,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2910,'todify2.db','knowledge_points',62,2909,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2911,'todify2.db','knowledge_points',63,2910,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2912,'todify2.db','knowledge_points',64,2911,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2913,'todify2.db','knowledge_points',65,2912,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2914,'todify2.db','knowledge_points',66,2913,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2915,'todify2.db','knowledge_points',67,2914,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2916,'todify2.db','knowledge_points',68,2915,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2917,'todify2.db','knowledge_points',69,2916,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2918,'todify2.db','knowledge_points',70,2917,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2919,'todify2.db','knowledge_points',71,2918,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2920,'todify2.db','knowledge_points',72,2919,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2921,'todify2.db','knowledge_points',73,2920,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2922,'todify2.db','knowledge_points',74,2921,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2923,'todify2.db','knowledge_points',75,2922,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2924,'todify2.db','knowledge_points',76,2923,'2025-12-25 06:04:46');
INSERT INTO id_mappings VALUES(2925,'todify2.db','knowledge_points',77,2924,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2926,'todify2.db','knowledge_points',78,2925,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2927,'todify2.db','knowledge_points',79,2926,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2928,'todify2.db','knowledge_points',80,2927,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2929,'todify2.db','knowledge_points',81,2928,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2930,'todify2.db','knowledge_points',82,2929,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2931,'todify2.db','knowledge_points',83,2930,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2932,'todify2.db','knowledge_points',84,2931,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2933,'todify2.db','knowledge_points',85,2932,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2934,'todify2.db','knowledge_points',86,2933,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2935,'todify2.db','knowledge_points',87,2934,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2936,'todify2.db','knowledge_points',88,2935,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2937,'todify2.db','knowledge_points',89,2936,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2938,'todify2.db','knowledge_points',90,2937,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2939,'todify2.db','knowledge_points',91,2938,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2940,'todify2.db','knowledge_points',92,2939,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2941,'todify2.db','knowledge_points',93,2940,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2942,'todify2.db','knowledge_points',94,2941,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2943,'todify2.db','knowledge_points',95,2942,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2944,'todify2.db','knowledge_points',96,2943,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2945,'todify2.db','knowledge_points',97,2944,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2946,'todify2.db','knowledge_points',98,2945,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2947,'todify2.db','knowledge_points',99,2946,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2948,'todify2.db','knowledge_points',100,2947,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2949,'todify2.db','knowledge_points',101,2948,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2950,'todify2.db','knowledge_points',102,2949,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2951,'todify2.db','knowledge_points',103,2950,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2952,'todify2.db','knowledge_points',104,2951,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2953,'todify2.db','knowledge_points',105,2952,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2954,'todify2.db','knowledge_points',106,2953,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2955,'todify2.db','knowledge_points',107,2954,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2956,'todify2.db','knowledge_points',108,2955,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2957,'todify2.db','knowledge_points',109,2956,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2958,'todify2.db','knowledge_points',110,2957,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2959,'todify2.db','knowledge_points',111,2958,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2960,'todify2.db','knowledge_points',112,2959,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2961,'todify2.db','knowledge_points',113,2960,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2962,'todify2.db','knowledge_points',114,2961,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2963,'todify2.db','knowledge_points',115,2962,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2964,'todify2.db','knowledge_points',116,2963,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2965,'todify2.db','knowledge_points',117,2964,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2966,'todify2.db','knowledge_points',118,2965,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2967,'todify2.db','knowledge_points',119,2966,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2968,'todify2.db','knowledge_points',120,2967,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2969,'todify2.db','knowledge_points',121,2968,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2970,'todify2.db','knowledge_points',122,2969,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2971,'todify2.db','knowledge_points',123,2970,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2972,'todify2.db','knowledge_points',124,2971,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2973,'todify2.db','knowledge_points',125,2972,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2974,'todify2.db','knowledge_points',126,2973,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2975,'todify2.db','knowledge_points',127,2974,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2976,'todify2.db','knowledge_points',128,2975,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2977,'todify2.db','knowledge_points',129,2976,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2978,'todify2.db','knowledge_points',130,2977,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2979,'todify2.db','knowledge_points',131,2978,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2980,'todify2.db','knowledge_points',132,2979,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2981,'todify2.db','knowledge_points',133,2980,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2982,'todify2.db','knowledge_points',134,2981,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2983,'todify2.db','knowledge_points',135,2982,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2984,'todify2.db','knowledge_points',136,2983,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2985,'todify2.db','knowledge_points',137,2984,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2986,'todify2.db','knowledge_points',138,2985,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2987,'todify2.db','knowledge_points',139,2986,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2988,'todify2.db','knowledge_points',140,2987,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2989,'todify2.db','knowledge_points',141,2988,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2990,'todify2.db','knowledge_points',142,2989,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2991,'todify2.db','knowledge_points',143,2990,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2992,'todify2.db','knowledge_points',144,2991,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2993,'todify2.db','knowledge_points',145,2992,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2994,'todify2.db','knowledge_points',146,2993,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2995,'todify2.db','knowledge_points',147,2994,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2996,'todify2.db','knowledge_points',148,2995,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2997,'todify2.db','knowledge_points',149,2996,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2998,'todify2.db','knowledge_points',150,2997,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(2999,'todify2.db','knowledge_points',151,2998,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3000,'todify2.db','knowledge_points',152,2999,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3001,'todify2.db','knowledge_points',153,3000,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3002,'todify2.db','knowledge_points',154,3001,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3003,'todify2.db','knowledge_points',155,3002,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3004,'todify2.db','knowledge_points',156,3003,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3005,'todify2.db','knowledge_points',157,3004,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3006,'todify2.db','knowledge_points',158,3005,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3007,'todify2.db','knowledge_points',159,3006,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3008,'todify2.db','knowledge_points',160,3007,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3009,'todify2.db','knowledge_points',161,3008,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3010,'todify2.db','knowledge_points',162,3009,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3011,'todify2.db','knowledge_points',163,3010,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3012,'todify2.db','knowledge_points',164,3011,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3013,'todify2.db','knowledge_points',165,3012,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3014,'todify2.db','knowledge_points',166,3013,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3015,'todify2.db','knowledge_points',167,3014,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3016,'todify2.db','knowledge_points',168,3015,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3017,'todify2.db','knowledge_points',169,3016,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3018,'todify2.db','knowledge_points',170,3017,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3019,'todify2.db','knowledge_points',171,3018,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3020,'todify2.db','knowledge_points',172,3019,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3021,'todify2.db','knowledge_points',173,3020,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3022,'todify2.db','knowledge_points',174,3021,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3023,'todify2.db','knowledge_points',175,3022,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3024,'todify2.db','knowledge_points',176,3023,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3025,'todify2.db','knowledge_points',177,3024,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3026,'todify2.db','knowledge_points',178,3025,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3027,'todify2.db','knowledge_points',179,3026,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3028,'todify2.db','knowledge_points',180,3027,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3029,'todify2.db','knowledge_points',181,3028,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3030,'todify2.db','knowledge_points',182,3029,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3031,'todify2.db','knowledge_points',183,3030,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3032,'todify2.db','knowledge_points',184,3031,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3033,'todify2.db','knowledge_points',185,3032,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3034,'todify2.db','knowledge_points',186,3033,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3035,'todify2.db','knowledge_points',187,3034,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3036,'todify2.db','knowledge_points',188,3035,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3037,'todify2.db','knowledge_points',189,3036,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3038,'todify2.db','knowledge_points',190,3037,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3039,'todify2.db','knowledge_points',191,3038,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3040,'todify2.db','knowledge_points',192,3039,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3041,'todify2.db','knowledge_points',193,3040,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3042,'todify2.db','knowledge_points',194,3041,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3043,'todify2.db','knowledge_points',195,3042,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3044,'todify2.db','knowledge_points',196,3043,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3045,'todify2.db','knowledge_points',197,3044,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3046,'todify2.db','knowledge_points',198,3045,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3047,'todify2.db','knowledge_points',199,3046,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3048,'todify2.db','knowledge_points',200,3047,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3049,'todify2.db','knowledge_points',201,3048,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3050,'todify2.db','knowledge_points',202,3049,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3051,'todify2.db','knowledge_points',203,3050,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3052,'todify2.db','knowledge_points',204,3051,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3053,'todify2.db','knowledge_points',205,3052,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3054,'todify2.db','knowledge_points',206,3053,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3055,'todify2.db','knowledge_points',207,3054,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3056,'todify2.db','knowledge_points',208,3055,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3057,'todify2.db','knowledge_points',209,3056,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3058,'todify2.db','knowledge_points',210,3057,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3059,'todify2.db','knowledge_points',211,3058,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3060,'todify2.db','knowledge_points',212,3059,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3061,'todify2.db','knowledge_points',213,3060,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3062,'todify2.db','knowledge_points',214,3061,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3063,'todify2.db','knowledge_points',215,3062,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3064,'todify2.db','knowledge_points',216,3063,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3065,'todify2.db','knowledge_points',217,3064,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3066,'todify2.db','knowledge_points',218,3065,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3067,'todify2.db','knowledge_points',219,3066,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3068,'todify2.db','knowledge_points',220,3067,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3069,'todify2.db','knowledge_points',221,3068,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3070,'todify2.db','knowledge_points',222,3069,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3071,'todify2.db','knowledge_points',223,3070,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3072,'todify2.db','knowledge_points',224,3071,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3073,'todify2.db','knowledge_points',225,3072,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3074,'todify2.db','knowledge_points',226,3073,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3075,'todify2.db','knowledge_points',227,3074,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3076,'todify2.db','knowledge_points',228,3075,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3077,'todify2.db','knowledge_points',229,3076,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3078,'todify2.db','knowledge_points',230,3077,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3079,'todify2.db','knowledge_points',231,3078,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3080,'todify2.db','knowledge_points',232,3079,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3081,'todify2.db','knowledge_points',233,3080,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3082,'todify2.db','knowledge_points',234,3081,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3083,'todify2.db','knowledge_points',235,3082,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3084,'todify2.db','knowledge_points',236,3083,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3085,'todify2.db','knowledge_points',237,3084,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3086,'todify2.db','knowledge_points',238,3085,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3087,'todify2.db','knowledge_points',239,3086,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3088,'todify2.db','knowledge_points',240,3087,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3089,'todify2.db','knowledge_points',241,3088,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3090,'todify2.db','knowledge_points',242,3089,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3091,'todify2.db','knowledge_points',243,3090,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3092,'todify2.db','knowledge_points',244,3091,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3093,'todify2.db','knowledge_points',245,3092,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3094,'todify2.db','knowledge_points',246,3093,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3095,'todify2.db','knowledge_points',247,3094,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3096,'todify2.db','knowledge_points',248,3095,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3097,'todify2.db','knowledge_points',249,3096,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3098,'todify2.db','knowledge_points',250,3097,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3099,'todify2.db','knowledge_points',251,3098,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3100,'todify2.db','knowledge_points',252,3099,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3101,'todify2.db','knowledge_points',253,3100,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3102,'todify2.db','knowledge_points',254,3101,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3103,'todify2.db','knowledge_points',255,3102,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3104,'todify2.db','knowledge_points',256,3103,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3105,'todify2.db','knowledge_points',257,3104,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3106,'todify2.db','knowledge_points',258,3105,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3107,'todify2.db','knowledge_points',259,3106,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3108,'todify2.db','knowledge_points',260,3107,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3109,'todify2.db','knowledge_points',261,3108,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3110,'todify2.db','knowledge_points',262,3109,'2025-12-25 06:04:47');
INSERT INTO id_mappings VALUES(3111,'todify2.db','knowledge_points',263,3110,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3112,'todify2.db','knowledge_points',264,3111,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3113,'todify2.db','knowledge_points',265,3112,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3114,'todify2.db','knowledge_points',266,3113,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3115,'todify2.db','knowledge_points',267,3114,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3116,'todify2.db','knowledge_points',268,3115,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3117,'todify2.db','knowledge_points',269,3116,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3118,'todify2.db','knowledge_points',270,3117,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3119,'todify2.db','knowledge_points',271,3118,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3120,'todify2.db','knowledge_points',272,3119,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3121,'todify2.db','knowledge_points',273,3120,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3122,'todify2.db','knowledge_points',274,3121,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3123,'todify2.db','knowledge_points',275,3122,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3124,'todify2.db','knowledge_points',276,3123,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3125,'todify2.db','knowledge_points',277,3124,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3126,'todify2.db','knowledge_points',278,3125,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3127,'todify2.db','knowledge_points',279,3126,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3128,'todify2.db','knowledge_points',280,3127,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3129,'todify2.db','knowledge_points',281,3128,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3130,'todify2.db','knowledge_points',282,3129,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3131,'todify2.db','knowledge_points',283,3130,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3132,'todify2.db','knowledge_points',284,3131,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3133,'todify2.db','knowledge_points',285,3132,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3134,'todify2.db','knowledge_points',286,3133,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3135,'todify2.db','knowledge_points',287,3134,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3136,'todify2.db','knowledge_points',288,3135,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3137,'todify2.db','knowledge_points',289,3136,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3138,'todify2.db','knowledge_points',290,3137,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3139,'todify2.db','knowledge_points',291,3138,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3140,'todify2.db','knowledge_points',292,3139,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3141,'todify2.db','knowledge_points',293,3140,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3142,'todify2.db','knowledge_points',294,3141,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3143,'todify2.db','knowledge_points',295,3142,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3144,'todify2.db','knowledge_points',296,3143,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3145,'todify2.db','knowledge_points',297,3144,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3146,'todify2.db','knowledge_points',298,3145,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3147,'todify2.db','knowledge_points',299,3146,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3148,'todify2.db','knowledge_points',300,3147,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3149,'todify2.db','knowledge_points',301,3148,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3150,'todify2.db','knowledge_points',302,3149,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3151,'todify2.db','knowledge_points',303,3150,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3152,'todify2.db','knowledge_points',304,3151,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3153,'todify2.db','knowledge_points',305,3152,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3154,'todify2.db','knowledge_points',306,3153,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3155,'todify2.db','knowledge_points',307,3154,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3156,'todify2.db','knowledge_points',308,3155,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3157,'todify2.db','knowledge_points',309,3156,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3158,'todify2.db','knowledge_points',310,3157,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3159,'todify2.db','knowledge_points',311,3158,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3160,'todify2.db','knowledge_points',312,3159,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3161,'todify2.db','knowledge_points',313,3160,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3162,'todify2.db','knowledge_points',314,3161,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3163,'todify2.db','knowledge_points',315,3162,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3164,'todify2.db','knowledge_points',316,3163,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3165,'todify2.db','knowledge_points',317,3164,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3166,'todify2.db','knowledge_points',318,3165,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3167,'todify2.db','knowledge_points',319,3166,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3168,'todify2.db','knowledge_points',320,3167,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3169,'todify2.db','knowledge_points',321,3168,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3170,'todify2.db','knowledge_points',322,3169,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3171,'todify2.db','knowledge_points',323,3170,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3172,'todify2.db','knowledge_points',324,3171,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3173,'todify2.db','knowledge_points',325,3172,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3174,'todify2.db','knowledge_points',326,3173,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3175,'todify2.db','knowledge_points',327,3174,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3176,'todify2.db','knowledge_points',328,3175,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3177,'todify2.db','knowledge_points',329,3176,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3178,'todify2.db','knowledge_points',330,3177,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3179,'todify2.db','knowledge_points',331,3178,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3180,'todify2.db','knowledge_points',332,3179,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3181,'todify2.db','knowledge_points',333,3180,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3182,'todify2.db','knowledge_points',334,3181,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3183,'todify2.db','knowledge_points',335,3182,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3184,'todify2.db','knowledge_points',336,3183,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3185,'todify2.db','knowledge_points',337,3184,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3186,'todify2.db','knowledge_points',338,3185,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3187,'todify2.db','knowledge_points',339,3186,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3188,'todify2.db','knowledge_points',340,3187,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3189,'todify2.db','knowledge_points',341,3188,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3190,'todify2.db','knowledge_points',342,3189,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3191,'todify2.db','knowledge_points',343,3190,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3192,'todify2.db','knowledge_points',344,3191,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3193,'todify2.db','knowledge_points',345,3192,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3194,'todify2.db','knowledge_points',346,3193,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3195,'todify2.db','knowledge_points',347,3194,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3196,'todify2.db','knowledge_points',348,3195,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3197,'todify2.db','knowledge_points',349,3196,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3198,'todify2.db','knowledge_points',350,3197,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3199,'todify2.db','knowledge_points',351,3198,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3200,'todify2.db','knowledge_points',352,3199,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3201,'todify2.db','knowledge_points',353,3200,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3202,'todify2.db','knowledge_points',354,3201,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3203,'todify2.db','knowledge_points',355,3202,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3204,'todify2.db','knowledge_points',356,3203,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3205,'todify2.db','knowledge_points',357,3204,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3206,'todify2.db','knowledge_points',358,3205,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3207,'todify2.db','knowledge_points',359,3206,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3208,'todify2.db','knowledge_points',360,3207,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3209,'todify2.db','knowledge_points',361,3208,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3210,'todify2.db','knowledge_points',362,3209,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3211,'todify2.db','knowledge_points',363,3210,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3212,'todify2.db','knowledge_points',364,3211,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3213,'todify2.db','knowledge_points',365,3212,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3214,'todify2.db','knowledge_points',366,3213,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3215,'todify2.db','knowledge_points',367,3214,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3216,'todify2.db','knowledge_points',368,3215,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3217,'todify2.db','knowledge_points',369,3216,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3218,'todify2.db','knowledge_points',370,3217,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3219,'todify2.db','knowledge_points',371,3218,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3220,'todify2.db','knowledge_points',372,3219,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3221,'todify2.db','knowledge_points',373,3220,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3222,'todify2.db','knowledge_points',374,3221,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3223,'todify2.db','knowledge_points',375,3222,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3224,'todify2.db','knowledge_points',376,3223,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3225,'todify2.db','knowledge_points',377,3224,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3226,'todify2.db','knowledge_points',378,3225,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3227,'todify2.db','knowledge_points',379,3226,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3228,'todify2.db','knowledge_points',380,3227,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3229,'todify2.db','knowledge_points',381,3228,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3230,'todify2.db','knowledge_points',382,3229,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3231,'todify2.db','knowledge_points',383,3230,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3232,'todify2.db','knowledge_points',384,3231,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3233,'todify2.db','knowledge_points',385,3232,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3234,'todify2.db','knowledge_points',386,3233,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3235,'todify2.db','knowledge_points',387,3234,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3236,'todify2.db','knowledge_points',388,3235,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3237,'todify2.db','knowledge_points',389,3236,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3238,'todify2.db','knowledge_points',390,3237,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3239,'todify2.db','knowledge_points',391,3238,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3240,'todify2.db','knowledge_points',392,3239,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3241,'todify2.db','knowledge_points',393,3240,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3242,'todify2.db','knowledge_points',394,3241,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3243,'todify2.db','knowledge_points',395,3242,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3244,'todify2.db','knowledge_points',396,3243,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3245,'todify2.db','knowledge_points',397,3244,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3246,'todify2.db','knowledge_points',398,3245,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3247,'todify2.db','knowledge_points',399,3246,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3248,'todify2.db','knowledge_points',400,3247,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3249,'todify2.db','knowledge_points',401,3248,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3250,'todify2.db','knowledge_points',402,3249,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3251,'todify2.db','knowledge_points',403,3250,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3252,'todify2.db','knowledge_points',404,3251,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3253,'todify2.db','knowledge_points',405,3252,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3254,'todify2.db','knowledge_points',406,3253,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3255,'todify2.db','knowledge_points',407,3254,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3256,'todify2.db','knowledge_points',408,3255,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3257,'todify2.db','knowledge_points',409,3256,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3258,'todify2.db','knowledge_points',410,3257,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3259,'todify2.db','knowledge_points',411,3258,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3260,'todify2.db','knowledge_points',412,3259,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3261,'todify2.db','knowledge_points',413,3260,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3262,'todify2.db','knowledge_points',414,3261,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3263,'todify2.db','knowledge_points',415,3262,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3264,'todify2.db','knowledge_points',416,3263,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3265,'todify2.db','knowledge_points',417,3264,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3266,'todify2.db','knowledge_points',418,3265,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3267,'todify2.db','knowledge_points',419,3266,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3268,'todify2.db','knowledge_points',420,3267,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3269,'todify2.db','knowledge_points',421,3268,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3270,'todify2.db','knowledge_points',422,3269,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3271,'todify2.db','knowledge_points',423,3270,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3272,'todify2.db','knowledge_points',424,3271,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3273,'todify2.db','knowledge_points',425,3272,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3274,'todify2.db','knowledge_points',426,3273,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3275,'todify2.db','knowledge_points',427,3274,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3276,'todify2.db','knowledge_points',428,3275,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3277,'todify2.db','knowledge_points',429,3276,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3278,'todify2.db','knowledge_points',430,3277,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3279,'todify2.db','knowledge_points',431,3278,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3280,'todify2.db','knowledge_points',432,3279,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3281,'todify2.db','knowledge_points',433,3280,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3282,'todify2.db','knowledge_points',434,3281,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3283,'todify2.db','knowledge_points',435,3282,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3284,'todify2.db','knowledge_points',436,3283,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3285,'todify2.db','knowledge_points',437,3284,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3286,'todify2.db','knowledge_points',438,3285,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3287,'todify2.db','knowledge_points',439,3286,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3288,'todify2.db','knowledge_points',440,3287,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3289,'todify2.db','knowledge_points',441,3288,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3290,'todify2.db','knowledge_points',442,3289,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3291,'todify2.db','knowledge_points',443,3290,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3292,'todify2.db','knowledge_points',444,3291,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3293,'todify2.db','knowledge_points',445,3292,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3294,'todify2.db','knowledge_points',446,3293,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3295,'todify2.db','agent_workflows','wf_1764236117708_vlw40e','wf_1764236117708_vlw40e','2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3296,'todify2.db','agent_workflows','wf_1765421817998_n51cee','wf_1765421817998_n51cee','2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3297,'todify2.db','conversations',1,3296,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3298,'todify2.db','conversations',2,3297,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3299,'todify2.db','conversations',3,3298,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3300,'todify2.db','conversations',4,3299,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3301,'todify2.db','conversations',5,3300,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3302,'todify2.db','conversations',6,3301,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3303,'todify2.db','conversations',7,3302,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3304,'todify2.db','conversations',8,3303,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3305,'todify2.db','conversations',9,3304,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3306,'todify2.db','conversations',10,3305,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3307,'todify2.db','conversations',11,3306,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3308,'todify2.db','conversations',12,3307,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3309,'todify2.db','conversations',13,3308,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3310,'todify2.db','conversations',14,3309,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3311,'todify2.db','conversations',15,3310,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3312,'todify2.db','conversations',16,3311,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3313,'todify2.db','conversations',17,3312,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3314,'todify2.db','conversations',18,3313,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3315,'todify2.db','conversations',19,3314,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3316,'todify2.db','conversations',20,3315,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3317,'todify2.db','conversations',21,3316,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3318,'todify2.db','conversations',22,3317,'2025-12-25 06:04:48');
INSERT INTO id_mappings VALUES(3319,'todify2.db','conversations',23,3318,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3320,'todify2.db','conversations',24,3319,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3321,'todify2.db','conversations',25,3320,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3322,'todify2.db','conversations',26,3321,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3323,'todify2.db','chat_messages',1,3322,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3324,'todify2.db','chat_messages',2,3323,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3325,'todify2.db','chat_messages',3,3324,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3326,'todify2.db','chat_messages',4,3325,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3327,'todify2.db','chat_messages',5,3326,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3328,'todify2.db','chat_messages',6,3327,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3329,'todify2.db','chat_messages',7,3328,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3330,'todify2.db','chat_messages',8,3329,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3331,'todify2.db','chat_messages',9,3330,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3332,'todify2.db','chat_messages',10,3331,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3333,'todify2.db','chat_messages',11,3332,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3334,'todify2.db','chat_messages',12,3333,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3335,'todify2.db','chat_messages',13,3334,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3336,'todify2.db','chat_messages',14,3335,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3337,'todify2.db','chat_messages',15,3336,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3338,'todify2.db','chat_messages',16,3337,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3339,'todify2.db','chat_messages',17,3338,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3340,'todify2.db','chat_messages',18,3339,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3341,'todify2.db','chat_messages',19,3340,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3342,'todify2.db','chat_messages',20,3341,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3343,'todify2.db','chat_messages',21,3342,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3344,'todify2.db','chat_messages',22,3343,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3345,'todify2.db','chat_messages',23,3344,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3346,'todify2.db','chat_messages',24,3345,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3347,'todify2.db','chat_messages',25,3346,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3348,'todify2.db','chat_messages',26,3347,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3349,'todify2.db','chat_messages',27,3348,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3350,'todify2.db','chat_messages',28,3349,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3351,'todify2.db','chat_messages',29,3350,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3352,'todify2.db','chat_messages',30,3351,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3353,'todify2.db','chat_messages',31,3352,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3354,'todify2.db','chat_messages',32,3353,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3355,'todify2.db','chat_messages',33,3354,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3356,'todify2.db','chat_messages',34,3355,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3357,'todify2.db','chat_messages',35,3356,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3358,'todify2.db','chat_messages',36,3357,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3359,'todify2.db','chat_messages',37,3358,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3360,'todify2.db','chat_messages',38,3359,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3361,'todify2.db','chat_messages',39,3360,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3362,'todify2.db','chat_messages',40,3361,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3363,'todify2.db','chat_messages',41,3362,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3364,'todify2.db','chat_messages',42,3363,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3365,'todify2.db','chat_messages',43,3364,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3366,'todify2.db','chat_messages',44,3365,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3367,'todify2.db','chat_messages',45,3366,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3368,'todify2.db','chat_messages',46,3367,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3369,'todify2.db','chat_messages',47,3368,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3370,'todify2.db','chat_messages',48,3369,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3371,'todify2.db','chat_messages',49,3370,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3372,'todify2.db','chat_messages',50,3371,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3373,'todify2.db','chat_messages',51,3372,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3374,'todify2.db','chat_messages',52,3373,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3375,'todify2.db','workflow_executions','exec_1764239968635_8nu9vd','exec_1764239968635_8nu9vd','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3376,'todify2.db','workflow_executions','exec_1764240322434_4sk3sp','exec_1764240322434_4sk3sp','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3377,'todify2.db','workflow_executions','exec_1764240874534_rutat','exec_1764240874534_rutat','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3378,'todify2.db','workflow_executions','exec_1764240998422_huy1mo','exec_1764240998422_huy1mo','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3379,'todify2.db','workflow_executions','exec_1764241021755_oybxj','exec_1764241021755_oybxj','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3380,'todify2.db','workflow_executions','exec_1764241274151_jgem8b','exec_1764241274151_jgem8b','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3381,'todify2.db','workflow_executions','exec_1764241313650_5vnatr','exec_1764241313650_5vnatr','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3382,'todify2.db','workflow_executions','exec_1764241348064_z50mdd','exec_1764241348064_z50mdd','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3383,'todify2.db','workflow_executions','exec_1764241482693_7qbmwq','exec_1764241482693_7qbmwq','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3384,'todify2.db','workflow_executions','exec_1764241515274_x8shs','exec_1764241515274_x8shs','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3385,'todify2.db','workflow_executions','exec_1764241560805_s19bv','exec_1764241560805_s19bv','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3386,'todify2.db','workflow_executions','exec_1764241738697_gvo8u8','exec_1764241738697_gvo8u8','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3387,'todify2.db','workflow_executions','exec_1764241856092_yf5jh8','exec_1764241856092_yf5jh8','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3388,'todify2.db','workflow_executions','exec_1764241877255_tsgpr7','exec_1764241877255_tsgpr7','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3389,'todify2.db','workflow_executions','exec_1764241999495_4qwpu','exec_1764241999495_4qwpu','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3390,'todify2.db','workflow_executions','exec_1764242015638_vbhexs','exec_1764242015638_vbhexs','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3391,'todify2.db','workflow_executions','exec_1764242044543_9k6alm','exec_1764242044543_9k6alm','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3392,'todify2.db','workflow_executions','exec_1764242213593_p6jcci','exec_1764242213593_p6jcci','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3393,'todify2.db','workflow_executions','exec_1764242234455_rrc6p','exec_1764242234455_rrc6p','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3394,'todify2.db','workflow_executions','exec_1764242287364_m5snjrf','exec_1764242287364_m5snjrf','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3395,'todify2.db','workflow_executions','exec_1764242313196_t8iezm','exec_1764242313196_t8iezm','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3396,'todify2.db','workflow_executions','exec_1764242441298_jv3al','exec_1764242441298_jv3al','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3397,'todify2.db','workflow_executions','exec_1764242454531_iy7imo','exec_1764242454531_iy7imo','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3398,'todify2.db','workflow_executions','exec_1764242676877_ftngsa','exec_1764242676877_ftngsa','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3399,'todify2.db','workflow_executions','exec_1764242690220_lbjp0n','exec_1764242690220_lbjp0n','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3400,'todify2.db','workflow_executions','exec_1764243314374_6423n8','exec_1764243314374_6423n8','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3401,'todify2.db','workflow_executions','exec_1764243742300_scebyn','exec_1764243742300_scebyn','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3402,'todify2.db','workflow_executions','exec_1764243779038_g0zlmd','exec_1764243779038_g0zlmd','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3403,'todify2.db','workflow_executions','exec_1764245036878_fz1nik','exec_1764245036878_fz1nik','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3404,'todify2.db','workflow_executions','exec_1764245072539_2rmh','exec_1764245072539_2rmh','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3405,'todify2.db','workflow_executions','exec_1764245275163_mxz19','exec_1764245275163_mxz19','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3406,'todify2.db','workflow_executions','exec_1764245653029_vp6c3','exec_1764245653029_vp6c3','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3407,'todify2.db','workflow_executions','exec_1764245673170_2wu328','exec_1764245673170_2wu328','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3408,'todify2.db','workflow_executions','exec_1764245700686_15tm06','exec_1764245700686_15tm06','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3409,'todify2.db','workflow_executions','exec_1764245717853_pcwot','exec_1764245717853_pcwot','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3410,'todify2.db','workflow_executions','exec_1764246066827_xuxrv','exec_1764246066827_xuxrv','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3411,'todify2.db','workflow_executions','exec_1764246092266_wzim9h','exec_1764246092266_wzim9h','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3412,'todify2.db','workflow_executions','exec_1764246111991_7bp42r','exec_1764246111991_7bp42r','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3413,'todify2.db','workflow_executions','exec_1764246155784_u66sr','exec_1764246155784_u66sr','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3414,'todify2.db','workflow_executions','exec_1764246181927_qguzr','exec_1764246181927_qguzr','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3415,'todify2.db','workflow_executions','exec_1764246522508_w7gb9v','exec_1764246522508_w7gb9v','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3416,'todify2.db','workflow_executions','exec_1764246596193_ypnslt','exec_1764246596193_ypnslt','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3417,'todify2.db','workflow_executions','exec_1764246619904_xc1ug','exec_1764246619904_xc1ug','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3418,'todify2.db','workflow_executions','exec_1764247007525_vxgf1c','exec_1764247007525_vxgf1c','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3419,'todify2.db','workflow_executions','exec_1764675257934_09mdbg','exec_1764675257934_09mdbg','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3420,'todify2.db','workflow_executions','exec_1765344470338_0rgykd','exec_1765344470338_0rgykd','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3421,'todify2.db','workflow_executions','exec_1765344612200_h1a9ec','exec_1765344612200_h1a9ec','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3422,'todify2.db','workflow_executions','exec_1765347237236_w9w46x','exec_1765347237236_w9w46x','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3423,'todify2.db','workflow_executions','exec_1765348484936_5prul8','exec_1765348484936_5prul8','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3424,'todify2.db','workflow_executions','exec_1765348537014_uwxq1','exec_1765348537014_uwxq1','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3425,'todify2.db','workflow_executions','exec_1765349292273_ocvd25','exec_1765349292273_ocvd25','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3426,'todify2.db','workflow_executions','exec_1765350193493_iioi','exec_1765350193493_iioi','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3427,'todify2.db','workflow_executions','exec_1765350263768_ezwfj','exec_1765350263768_ezwfj','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3428,'todify2.db','workflow_executions','exec_1765350802926_oitwed','exec_1765350802926_oitwed','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3429,'todify2.db','workflow_executions','exec_1765351173514_gd9ea','exec_1765351173514_gd9ea','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3430,'todify2.db','workflow_executions','exec_1765351893339_61w1xp','exec_1765351893339_61w1xp','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3431,'todify2.db','ai_roles','independent-page-ai-search','independent-page-ai-search','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3432,'todify2.db','ai_roles','ai-role-1765335292125-vf46rf','ai-role-1765335292125-vf46rf','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3433,'todify2.db','ai_roles','ai-role-1765335615801-vw5wwh','ai-role-1765335615801-vw5wwh','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3434,'todify2.db','ai_roles','ai-role-1765335743534-bb9gg','ai-role-1765335743534-bb9gg','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3435,'todify2.db','ai_roles','ai-role-1765777221351-gvkpox','ai-role-1765777221351-gvkpox','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3436,'todify2.db','ai_roles','ai-role-1765777226269-55mbe8','ai-role-1765777226269-55mbe8','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3437,'todify2.db','ai_roles','ai-role-1765777228819-4d4vo','ai-role-1765777228819-4d4vo','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3438,'todify2.db','ai_roles','ai-role-1765777230810-h1al7m','ai-role-1765777230810-h1al7m','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3439,'todify2.db','ai_roles','ai-role-1765777232257-rrfqk','ai-role-1765777232257-rrfqk','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3440,'todify2.db','ai_roles','ai-role-1765777233923-du3squ','ai-role-1765777233923-du3squ','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3441,'todify2.db','ai_roles','ai-role-1766113034950-68moj','ai-role-1766113034950-68moj','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3442,'todify2.db','ai_roles','ai-role-1766121487006-1qjgmm','ai-role-1766121487006-1qjgmm','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3443,'todify2.db','ai_roles','independent-page-tech-package','independent-page-tech-package','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3444,'todify2.db','ai_roles','independent-page-tech-strategy','independent-page-tech-strategy','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3445,'todify2.db','ai_roles','independent-page-core-draft','independent-page-core-draft','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3446,'todify2.db','ai_roles','independent-page-speech','independent-page-speech','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3447,'todify2.db','ai_roles','smart-workflow-ai-search','smart-workflow-ai-search','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3448,'todify2.db','ai_roles','smart-workflow-tech-package','smart-workflow-tech-package','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3449,'todify2.db','ai_roles','smart-workflow-tech-strategy','smart-workflow-tech-strategy','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3450,'todify2.db','ai_roles','smart-workflow-core-draft','smart-workflow-core-draft','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3451,'todify2.db','ai_roles','smart-workflow-speech','smart-workflow-speech','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3452,'todify2.db','ai_roles','project-resources-ai-qa','project-resources-ai-qa','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3453,'todify2.db','ai_roles','agent-content-processor','agent-content-processor','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3454,'todify2.db','ai_roles','agent-sub-knowledge-extractor','agent-sub-knowledge-extractor','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3455,'todify2.db','ai_roles','agent-sub-tech-packager','agent-sub-tech-packager','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3456,'todify2.db','ai_roles','agent-sub-strategy-planner','agent-sub-strategy-planner','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3457,'todify2.db','ai_roles','agent-sub-press-writer','agent-sub-press-writer','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3458,'todify2.db','public_page_configs','public-config-1764234635784-90kkzr','public-config-1764234635784-90kkzr','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3459,'todify2.db','public_page_configs','public-config-1764234635808-87sl2q','public-config-1764234635808-87sl2q','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3460,'todify2.db','public_page_configs','public-config-1764234635823-2tbko','public-config-1764234635823-2tbko','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3461,'todify2.db','public_page_configs','public-config-1764902018950-414tv','public-config-1764902018950-414tv','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3462,'todify2.db','page_tool_configs','tech-package-default','tech-package-default','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3463,'todify2.db','page_tool_configs','press-release-default','press-release-default','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3464,'todify2.db','page_tool_configs','tech-strategy-default','tech-strategy-default','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3465,'todify2.db','page_tool_configs','tech-article-default','tech-article-default','2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3466,'todify2.db','files',1,3465,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3467,'todify2.db','files',2,3466,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3468,'todify2.db','files',3,3467,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3469,'todify2.db','files',4,3468,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3470,'todify2.db','files',5,3469,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3471,'todify2.db','files',6,3470,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3472,'todify2.db','files',7,3471,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3473,'todify2.db','projects',1,3472,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3474,'todify2.db','projects',2,3473,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3475,'todify2.db','projects',3,3474,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3476,'todify2.db','projects',4,3475,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3477,'todify2.db','source_information',1,3476,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3478,'todify2.db','source_information',2,3477,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3479,'todify2.db','source_information',3,3478,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3480,'todify2.db','source_information',4,3479,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3481,'todify2.db','source_information',5,3480,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3482,'todify2.db','source_information',6,3481,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3483,'todify2.db','source_information',7,3482,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3484,'todify2.db','source_information',8,3483,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3485,'todify2.db','source_information',9,3484,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3486,'todify2.db','source_information',10,3485,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3487,'todify2.db','source_information',11,3486,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3488,'todify2.db','source_information',12,3487,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3489,'todify2.db','source_information',13,3488,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3490,'todify2.db','source_information',14,3489,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3491,'todify2.db','source_information',15,3490,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3492,'todify2.db','source_information',16,3491,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3493,'todify2.db','source_information',17,3492,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3494,'todify2.db','source_information',18,3493,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3495,'todify2.db','source_information',19,3494,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3496,'todify2.db','source_information',20,3495,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3497,'todify2.db','source_information',21,3496,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3498,'todify2.db','source_information',22,3497,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3499,'todify2.db','source_information',23,3498,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3500,'todify2.db','source_information',24,3499,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3501,'todify2.db','source_information',25,3500,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3502,'todify2.db','source_information',26,3501,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3503,'todify2.db','source_information',27,3502,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3504,'todify2.db','source_information',28,3503,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3505,'todify2.db','source_information',29,3504,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3506,'todify2.db','source_information',30,3505,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3507,'todify2.db','source_information',31,3506,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3508,'todify2.db','source_information',32,3507,'2025-12-25 06:04:49');
INSERT INTO id_mappings VALUES(3509,'todify2.db','source_information',33,3508,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3510,'todify2.db','source_information',34,3509,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3511,'todify2.db','source_information',35,3510,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3512,'todify2.db','source_information',36,3511,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3513,'todify2.db','source_information',37,3512,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3514,'todify2.db','source_information',38,3513,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3515,'todify2.db','source_information',39,3514,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3516,'todify2.db','source_information',40,3515,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3517,'todify2.db','source_information',41,3516,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3518,'todify2.db','source_information',42,3517,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3519,'todify2.db','source_information',43,3518,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3520,'todify2.db','source_information',44,3519,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3521,'todify2.db','source_information',45,3520,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3522,'todify2.db','source_information',46,3521,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3523,'todify2.db','source_information',47,3522,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3524,'todify2.db','source_information',48,3523,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3525,'todify2.db','source_information',49,3524,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3526,'todify2.db','source_information',50,3525,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3527,'todify2.db','source_information',51,3526,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3528,'todify2.db','source_information',52,3527,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3529,'todify2.db','source_information',53,3528,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3530,'todify2.db','source_information',54,3529,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3531,'todify2.db','source_information',55,3530,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3532,'todify2.db','source_information',56,3531,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3533,'todify2.db','source_information',57,3532,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3534,'todify2.db','source_information',58,3533,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3535,'todify2.db','source_information',59,3534,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3536,'todify2.db','source_information',60,3535,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3537,'todify2.db','source_information',61,3536,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3538,'todify2.db','public_knowledge_categories',1,3537,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3539,'todify2.db','public_knowledge_files',2,3538,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3540,'todify2.db','public_knowledge_files',3,3539,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3541,'todify2.db','public_knowledge_files',4,3540,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3542,'todify2.db','public_knowledge_files',5,3541,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3543,'todify2.db','public_knowledge_files',6,3542,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3544,'todify2.db','public_knowledge_files',7,3543,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3545,'todify2.db','public_knowledge_files',8,3544,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3546,'todify2.db','public_knowledge_files',9,3545,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3547,'todify2.db','public_knowledge_files',10,3546,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3548,'todify2.db','public_knowledge_files',11,3547,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3549,'todify3.db','brands',1,1,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3550,'todify3.db','brands',2,2,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3551,'todify3.db','brands',3,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3552,'todify3.db','brands',4,4,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3553,'todify3.db','brands',5,5,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3554,'todify3.db','tech_categories',1,1,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3555,'todify3.db','tech_categories',2,2,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3556,'todify3.db','tech_categories',3,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3557,'todify3.db','tech_categories',4,4,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3558,'todify3.db','tech_categories',5,5,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3559,'todify3.db','tech_categories',6,6,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3560,'todify3.db','tech_categories',7,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3561,'todify3.db','tech_categories',8,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3562,'todify3.db','tech_categories',9,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3563,'todify3.db','tech_categories',10,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3564,'todify3.db','tech_categories',11,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3565,'todify3.db','tech_categories',12,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3566,'todify3.db','tech_categories',13,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3567,'todify3.db','tech_categories',14,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3568,'todify3.db','tech_categories',15,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3569,'todify3.db','tech_categories',16,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3570,'todify3.db','tech_categories',17,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3571,'todify3.db','tech_categories',18,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3572,'todify3.db','tech_categories',19,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3573,'todify3.db','tech_categories',20,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3574,'todify3.db','tech_categories',21,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3575,'todify3.db','tech_categories',22,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3576,'todify3.db','tech_categories',23,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3577,'todify3.db','tech_categories',24,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3578,'todify3.db','tech_categories',25,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3579,'todify3.db','tech_categories',26,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3580,'todify3.db','tech_categories',27,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3581,'todify3.db','tech_categories',28,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3582,'todify3.db','tech_categories',29,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3583,'todify3.db','tech_categories',30,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3584,'todify3.db','tech_categories',31,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3585,'todify3.db','tech_categories',32,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3586,'todify3.db','tech_categories',33,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3587,'todify3.db','tech_categories',34,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3588,'todify3.db','tech_categories',35,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3589,'todify3.db','tech_categories',36,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3590,'todify3.db','tech_categories',37,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3591,'todify3.db','tech_categories',38,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3592,'todify3.db','tech_categories',39,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3593,'todify3.db','tech_categories',40,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3594,'todify3.db','tech_categories',41,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3595,'todify3.db','tech_categories',42,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3596,'todify3.db','tech_categories',43,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3597,'todify3.db','tech_categories',44,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3598,'todify3.db','tech_categories',45,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3599,'todify3.db','tech_categories',46,11,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3600,'todify3.db','car_models',1,1,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3601,'todify3.db','car_models',2,2,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3602,'todify3.db','car_models',3,3,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3603,'todify3.db','car_models',4,4,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3604,'todify3.db','car_models',5,5,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3605,'todify3.db','car_models',6,6,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3606,'todify3.db','car_models',7,7,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3607,'todify3.db','car_models',8,8,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3608,'todify3.db','car_models',9,9,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3609,'todify3.db','car_models',10,10,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3610,'todify3.db','tech_points',1,1,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3611,'todify3.db','tech_points',2,2,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3612,'todify3.db','tech_points',5,5,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3613,'todify3.db','tech_points',6,125,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3614,'todify3.db','tech_points',7,126,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3615,'todify3.db','tech_points',8,127,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3616,'todify3.db','tech_points',9,128,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3617,'todify3.db','tech_points',10,129,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3618,'todify3.db','tech_points',11,130,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3619,'todify3.db','tech_points',12,131,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3620,'todify3.db','tech_points',13,132,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3621,'todify3.db','tech_points',14,133,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3622,'todify3.db','tech_points',15,134,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3623,'todify3.db','tech_points',16,135,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3624,'todify3.db','tech_points',17,136,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3625,'todify3.db','tech_points',18,137,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3626,'todify3.db','tech_points',19,138,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3627,'todify3.db','tech_points',20,139,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3628,'todify3.db','tech_points',21,140,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3629,'todify3.db','tech_points',22,141,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3630,'todify3.db','tech_points',23,142,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3631,'todify3.db','tech_points',24,143,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3632,'todify3.db','tech_points',25,144,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3633,'todify3.db','tech_points',26,145,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3634,'todify3.db','tech_points',27,146,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3635,'todify3.db','tech_points',28,147,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3636,'todify3.db','tech_points',29,148,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3637,'todify3.db','tech_points',30,149,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3638,'todify3.db','tech_points',31,150,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3639,'todify3.db','tech_points',33,151,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3640,'todify3.db','tech_points',35,35,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3641,'todify3.db','tech_points',36,152,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3642,'todify3.db','tech_points',37,153,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3643,'todify3.db','tech_point_car_models',23,3642,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3644,'todify3.db','tech_point_car_models',24,3643,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3645,'todify3.db','tech_point_car_models',25,3644,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3646,'todify3.db','tech_point_car_models',26,3645,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3647,'todify3.db','tech_point_car_models',27,3646,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3648,'todify3.db','tech_point_car_models',28,3647,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3649,'todify3.db','tech_point_car_models',29,3648,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3650,'todify3.db','tech_point_car_models',30,3649,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3651,'todify3.db','tech_point_car_models',31,3650,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3652,'todify3.db','tech_point_car_models',32,3651,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3653,'todify3.db','tech_point_car_models',33,3652,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3654,'todify3.db','tech_point_car_models',34,3653,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3655,'todify3.db','tech_point_car_models',35,3654,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3656,'todify3.db','tech_point_car_models',36,3655,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3657,'todify3.db','tech_point_car_models',37,3656,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3658,'todify3.db','tech_point_car_models',38,3657,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3659,'todify3.db','tech_point_car_models',39,3658,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3660,'todify3.db','tech_point_car_models',40,3659,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3661,'todify3.db','tech_point_car_models',41,3660,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3662,'todify3.db','tech_point_car_models',42,3661,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3663,'todify3.db','tech_point_car_models',43,3662,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3664,'todify3.db','tech_point_car_models',44,3663,'2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3665,'todify3.db','ai_roles','independent-page-ai-search','independent-page-ai-search','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3666,'todify3.db','ai_roles','project-resources-ai-qa','project-resources-ai-qa','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3667,'todify3.db','ai_roles','independent-page-tech-package','independent-page-tech-package','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3668,'todify3.db','ai_roles','independent-page-tech-strategy','independent-page-tech-strategy','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3669,'todify3.db','ai_roles','independent-page-core-draft','independent-page-core-draft','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3670,'todify3.db','ai_roles','independent-page-speech','independent-page-speech','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3671,'todify3.db','ai_roles','smart-workflow-ai-search','smart-workflow-ai-search','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3672,'todify3.db','ai_roles','smart-workflow-tech-package','smart-workflow-tech-package','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3673,'todify3.db','ai_roles','smart-workflow-tech-strategy','smart-workflow-tech-strategy','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3674,'todify3.db','ai_roles','smart-workflow-core-draft','smart-workflow-core-draft','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3675,'todify3.db','ai_roles','smart-workflow-speech','smart-workflow-speech','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3676,'todify3.db','ai_roles','agent-content-processor','agent-content-processor','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3677,'todify3.db','ai_roles','agent-sub-knowledge-extractor','agent-sub-knowledge-extractor','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3678,'todify3.db','ai_roles','agent-sub-tech-packager','agent-sub-tech-packager','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3679,'todify3.db','ai_roles','agent-sub-strategy-planner','agent-sub-strategy-planner','2025-12-25 06:04:50');
INSERT INTO id_mappings VALUES(3680,'todify3.db','ai_roles','agent-sub-press-writer','agent-sub-press-writer','2025-12-25 06:04:50');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('brands',9);
INSERT INTO sqlite_sequence VALUES('car_models',17);
INSERT INTO sqlite_sequence VALUES('tech_categories',11);
INSERT INTO sqlite_sequence VALUES('tech_points',153);
INSERT INTO sqlite_sequence VALUES('tech_point_car_models',44);
INSERT INTO sqlite_sequence VALUES('tech_point_resources',4);
INSERT INTO sqlite_sequence VALUES('projects',4);
INSERT INTO sqlite_sequence VALUES('project_tech_points',1);
INSERT INTO sqlite_sequence VALUES('project_source_informations',11);
INSERT INTO sqlite_sequence VALUES('knowledge_points',446);
INSERT INTO sqlite_sequence VALUES('public_knowledge_categories',1);
INSERT INTO sqlite_sequence VALUES('public_knowledge_files',21);
INSERT INTO sqlite_sequence VALUES('resources',1);
INSERT INTO sqlite_sequence VALUES('id_mappings',3680);
CREATE INDEX idx_ai_roles_name ON ai_roles(name);
CREATE INDEX idx_ai_roles_enabled ON ai_roles(enabled);
CREATE INDEX idx_ai_roles_source ON ai_roles(source);
CREATE INDEX idx_ai_roles_updated ON ai_roles(updated_at DESC);
CREATE INDEX idx_agent_workflows_name ON agent_workflows(name);
CREATE INDEX idx_agent_workflows_updated ON agent_workflows(updated_at DESC);
CREATE INDEX idx_agent_workflows_published ON agent_workflows(published);
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_usage ON workflow_templates(usage_count DESC);
CREATE INDEX idx_page_tool_configs_page_type ON page_tool_configs(page_type);
CREATE INDEX idx_page_tool_configs_active ON page_tool_configs(is_active);
CREATE INDEX idx_public_page_configs_token ON public_page_configs(access_token);
CREATE INDEX idx_public_page_configs_active ON public_page_configs(is_active);
CREATE INDEX idx_public_page_configs_created ON public_page_configs(created_at DESC);
CREATE INDEX idx_public_page_configs_workflow ON public_page_configs(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX idx_public_page_configs_address ON public_page_configs(address) WHERE address IS NOT NULL;
CREATE TRIGGER update_public_page_configs_updated_at
      AFTER UPDATE ON public_page_configs
      BEGIN
        UPDATE public_page_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
CREATE INDEX idx_public_page_configs_display_mode ON public_page_configs(display_mode);
CREATE INDEX idx_article_types_code ON article_types(code);
CREATE INDEX idx_article_types_enabled ON article_types(enabled);
CREATE INDEX idx_article_type_ai_roles_article_type_id ON article_type_ai_roles(article_type_id);
CREATE INDEX idx_article_type_ai_roles_ai_role_id ON article_type_ai_roles(ai_role_id);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_status ON brands(status);
CREATE INDEX idx_brands_country ON brands(country);
CREATE INDEX idx_brands_country_status ON brands(country, status);
CREATE INDEX idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX idx_car_models_status ON car_models(status);
CREATE INDEX idx_car_models_name ON car_models(name);
CREATE INDEX idx_car_models_category ON car_models(category);
CREATE INDEX idx_car_models_launch_year ON car_models(launch_year);
CREATE INDEX idx_car_models_brand_status ON car_models(brand_id, status);
CREATE INDEX idx_car_models_category_status ON car_models(category, status);
CREATE INDEX idx_car_models_brand_category ON car_models(brand_id, category);
CREATE INDEX idx_car_series_model_id ON car_series(model_id);
CREATE INDEX idx_car_series_status ON car_series(status);
CREATE INDEX idx_car_series_name ON car_series(name);
CREATE INDEX idx_car_series_market_segment ON car_series(market_segment);
CREATE INDEX idx_car_series_launch_year ON car_series(launch_year);
CREATE INDEX idx_car_series_model_status ON car_series(model_id, status);
CREATE INDEX idx_car_series_segment_status ON car_series(market_segment, status);
CREATE INDEX idx_tech_categories_parent_id ON tech_categories(parent_id);
CREATE INDEX idx_tech_categories_status ON tech_categories(status);
CREATE INDEX idx_tech_categories_level ON tech_categories(level);
CREATE INDEX idx_tech_categories_sort_order ON tech_categories(sort_order);
CREATE INDEX idx_tech_categories_parent_status ON tech_categories(parent_id, status);
CREATE INDEX idx_tech_categories_level_sort ON tech_categories(level, sort_order);
CREATE INDEX idx_tech_points_category_id ON tech_points(category_id);
CREATE INDEX idx_tech_points_parent_id ON tech_points(parent_id);
CREATE INDEX idx_tech_points_status ON tech_points(status);
CREATE INDEX idx_tech_points_tpd_id ON tech_points(tpd_id);
CREATE INDEX idx_tech_points_tech_type ON tech_points(tech_type);
CREATE INDEX idx_tech_points_priority ON tech_points(priority);
CREATE INDEX idx_tech_points_level ON tech_points(level);
CREATE INDEX idx_tech_points_created_at ON tech_points(created_at);
CREATE INDEX idx_tech_points_category_status ON tech_points(category_id, status);
CREATE INDEX idx_tech_points_priority_status ON tech_points(priority, status);
CREATE INDEX idx_tech_points_type_status ON tech_points(tech_type, status);
CREATE INDEX idx_tech_points_parent_status ON tech_points(parent_id, status);
CREATE INDEX idx_tech_points_category_priority ON tech_points(category_id, priority);
CREATE INDEX idx_tech_point_car_models_car_model_id ON tech_point_car_models(car_model_id);
CREATE INDEX idx_tech_point_car_models_status ON tech_point_car_models(application_status);
CREATE INDEX idx_tech_point_car_models_tech_status ON tech_point_car_models(tech_point_id, application_status);
CREATE INDEX idx_tech_point_car_models_car_status ON tech_point_car_models(car_model_id, application_status);
CREATE INDEX idx_tech_point_knowledge_knowledge_point ON tech_point_knowledge_points(knowledge_point_id);
CREATE INDEX idx_tech_point_knowledge_relation_type ON tech_point_knowledge_points(relation_type);
CREATE INDEX idx_tech_point_knowledge_relevance_score ON tech_point_knowledge_points(relevance_score);
CREATE INDEX idx_tech_point_knowledge_tech_relation ON tech_point_knowledge_points(tech_point_id, relation_type);
CREATE INDEX idx_tech_point_knowledge_knowledge_relation ON tech_point_knowledge_points(knowledge_point_id, relation_type);
CREATE INDEX idx_tech_point_knowledge_points_tech_point_id ON tech_point_knowledge_points(tech_point_id);
CREATE INDEX idx_tech_point_knowledge_points_knowledge_point_id ON tech_point_knowledge_points(knowledge_point_id);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_last_opened_at ON projects(last_opened_at);
CREATE INDEX idx_projects_type_status ON projects(type, status);
CREATE INDEX idx_project_sources_project_id ON project_sources(project_id);
CREATE INDEX idx_project_sources_source_type ON project_sources(source_type);
CREATE INDEX idx_project_sources_project_type ON project_sources(project_id, source_type);
CREATE INDEX idx_project_tech_points_project_id ON project_tech_points(project_id);
CREATE INDEX idx_project_tech_points_tech_point_id ON project_tech_points(tech_point_id);
CREATE INDEX idx_project_knowledge_points_project_id ON project_knowledge_points(project_id);
CREATE INDEX idx_project_knowledge_points_knowledge_point_id ON project_knowledge_points(knowledge_point_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_file_id ON project_files(file_id);
CREATE INDEX idx_project_source_informations_project_id ON project_source_informations(project_id);
CREATE INDEX idx_project_source_informations_source_information_id ON project_source_informations(source_information_id);
CREATE INDEX idx_knowledge_points_tech_point_id ON knowledge_points(tech_point_id);
CREATE INDEX idx_knowledge_points_title ON knowledge_points(title);
CREATE INDEX idx_knowledge_points_status ON knowledge_points(status);
CREATE INDEX idx_knowledge_points_created_at ON knowledge_points(created_at);
CREATE INDEX idx_knowledge_points_source_type ON knowledge_points(source_type);
CREATE INDEX idx_knowledge_points_dify_task ON knowledge_points(dify_task_id) WHERE dify_task_id IS NOT NULL;
CREATE INDEX idx_knowledge_points_ai_session ON knowledge_points(ai_search_session_id) WHERE ai_search_session_id IS NOT NULL;
CREATE INDEX idx_knowledge_points_relevance_score ON knowledge_points(relevance_score);
CREATE INDEX idx_knowledge_points_source_status ON knowledge_points(source_type, status);
CREATE INDEX idx_knowledge_points_score_status ON knowledge_points(relevance_score, status) WHERE relevance_score IS NOT NULL;
CREATE INDEX idx_knowledge_points_knowledge_type ON knowledge_points(knowledge_type);
CREATE INDEX idx_categories_parent_id ON public_knowledge_categories(parent_id);
CREATE INDEX idx_categories_sort_order ON public_knowledge_categories(sort_order);
CREATE INDEX idx_public_knowledge_categories_sort_order ON public_knowledge_categories(sort_order);
CREATE INDEX idx_public_knowledge_categories_parent_sort ON public_knowledge_categories(parent_id, sort_order) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_files_category_id ON public_knowledge_files(category_id);
CREATE INDEX idx_public_knowledge_files_created_at ON public_knowledge_files(created_at);
CREATE INDEX idx_public_knowledge_files_file_type ON public_knowledge_files(file_type);
CREATE INDEX idx_id_mappings_source_id ON id_mappings(source_db_name, source_table_name, source_id);
CREATE INDEX idx_id_mappings_target_id ON id_mappings(target_id);
COMMIT;
