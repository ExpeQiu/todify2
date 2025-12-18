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

-- 技术包装
INSERT OR REPLACE INTO ai_roles (
    id, name, description, avatar, system_prompt, dify_config, enabled, source,
    created_at, updated_at
) VALUES (
    'independent-page-tech-package',
    '技术包装',
    '技术内容包装工作流',
    NULL,
    NULL,
    json_object(
        'apiUrl', '${DIFY_BASE_URL}',
        'apiKey', 'app-GgD3uUNDWOFu7DlBgSVkIrIt',
        'connectionType', 'chatflow'
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
