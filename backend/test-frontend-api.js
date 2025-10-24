const axios = require('axios');

async function testFrontendAPI() {
  console.log('测试前端API代理功能...\n');
  
  try {
    // 测试通过前端代理访问后端API
    console.log('1. 测试通过前端代理访问统计概览API:');
    const response = await axios.get('http://localhost:3001/api/v1/workflow-stats/overview?days=1');
    console.log('✅ 成功获取统计数据');
    console.log('总使用次数:', response.data.data.overview.totalUsage);
    console.log('总会话数:', response.data.data.overview.totalSessions);
    
    console.log('\n2. 测试通过前端代理访问实时统计API:');
    const realtimeResponse = await axios.get('http://localhost:3001/api/v1/workflow-stats/realtime');
    console.log('✅ 成功获取实时统计数据');
    console.log('实时数据条数:', realtimeResponse.data.data.length);
    
    console.log('\n✅ 前端API代理功能正常！');
    
  } catch (error) {
    console.error('❌ 前端API代理测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testFrontendAPI();