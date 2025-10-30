// 启用 Dify 配置的脚本
// 在浏览器控制台中运行此脚本来启用 AI 问答的 Dify 配置

const enableDifyConfig = () => {
  // 获取当前配置
  const stored = localStorage.getItem('dify_configs');
  let configs = [];
  
  if (stored) {
    configs = JSON.parse(stored);
  } else {
    // 如果没有配置，使用默认配置
    configs = [
      {
        id: "default-ai-search",
        name: "AI问答模型",
        description: "用于智能问答的Dify API配置",
        apiUrl: "http://47.113.225.93:8088/api/dify/chat-messages",
        apiKey: "app-t1X4eu8B4eucyO6IfrTbw1t2",
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-tech-package",
        name: "技术包装模型",
        description: "用于技术包装的Dify API配置",
        apiUrl: "http://47.113.225.93:8088/api/dify/workflows/run",
        apiKey: "app-YDVb91faDHwTqIei4WWSNaTM",
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-tech-strategy",
        name: "技术策略模型",
        description: "用于生成技术策略的Dify API配置",
        apiUrl: "http://47.113.225.93:8088/api/dify/workflows/run",
        apiKey: "app-awRZf7tKfvC73DEVANAGGNr8",
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-core-draft",
        name: "通稿生成模型",
        description: "用于生成技术通稿的Dify API配置",
        apiUrl: "http://47.113.225.93:8088/api/dify/workflows/run",
        apiKey: "app-3TK9U2F3WwFP7vOoq0Ut84KA",
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-speech-generation",
        name: "演讲稿生成模型",
        description: "用于生成发布会演讲稿的Dify API配置",
        apiUrl: "http://47.113.225.93:8088/api/dify/workflows/run",
        apiKey: "app-WcV5IDjuNKbOKIBDPWdb7HF4",
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }
  
  // 启用 AI 问答配置
  const aiSearchConfig = configs.find(config => config.id === 'default-ai-search');
  if (aiSearchConfig) {
    aiSearchConfig.enabled = true;
    aiSearchConfig.updatedAt = new Date();
    console.log('✅ AI问答配置已启用');
  } else {
    console.log('❌ 未找到 AI 问答配置');
    return;
  }
  
  // 保存配置
  localStorage.setItem('dify_configs', JSON.stringify(configs));
  console.log('✅ 配置已保存到 localStorage');
  console.log('当前配置:', configs);
  
  // 刷新页面以应用配置
  console.log('🔄 正在刷新页面以应用配置...');
  window.location.reload();
};

// 执行启用配置
enableDifyConfig();