const axios = require('axios');

// 模拟数据更新的测试脚本
async function testRealTimeUpdate() {
  console.log('开始测试实时数据更新功能...');
  
  try {
    // 1. 首先获取当前统计数据
    console.log('\n1. 获取当前统计数据:');
    const initialStats = await axios.get('http://localhost:3001/api/v1/workflow-stats/overview?days=1');
    console.log('当前总使用次数:', initialStats.data.overview.totalUsage);
    console.log('当前总会话数:', initialStats.data.overview.totalSessions);
    
    // 2. 模拟添加新的节点使用数据
    console.log('\n2. 模拟添加新的节点使用数据:');
    const newUsageData = {
      node_id: 'test_node_' + Date.now(),
      node_name: '测试节点',
      node_type: 'ai_chat',
      session_id: 'test_session_' + Date.now(),
      user_id: 'test_user',
      usage_count: 1,
      total_time_spent: 30,
      avg_response_time: 2.5,
      success_count: 1,
      failure_count: 0,
      total_characters: 150,
      avg_characters: 150,
      content_quality_score: 4.5,
      likes_count: 1,
      dislikes_count: 0,
      regenerations_count: 0,
      adoptions_count: 1,
      edits_count: 0,
      is_workflow_mode: true,
      is_standalone_mode: false
    };
    
    const addUsageResponse = await axios.post('http://localhost:3001/api/v1/workflow-stats/node-usage', newUsageData);
    console.log('添加节点使用数据成功:', addUsageResponse.data.id);
    
    // 3. 模拟添加AI问答反馈数据
    console.log('\n3. 模拟添加AI问答反馈数据:');
    const feedbackData = {
      message_id: 'test_message_' + Date.now(),
      node_id: newUsageData.node_id,
      session_id: newUsageData.session_id,
      user_id: 'test_user',
      feedback_type: 'like',
      feedback_value: 1,
      feedback_comment: '测试反馈',
      response_time: 2.5,
      content_length: 150,
      content_quality_score: 4.5,
      query_text: '测试查询',
      response_text: '测试回复'
    };
    
    const addFeedbackResponse = await axios.post('http://localhost:3001/api/v1/workflow-stats/ai-qa-feedback', feedbackData);
    console.log('添加AI问答反馈成功:', addFeedbackResponse.data.id);
    
    // 4. 等待一段时间后再次获取统计数据
    console.log('\n4. 等待2秒后重新获取统计数据:');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedStats = await axios.get('http://localhost:3001/api/v1/workflow-stats/overview?days=1');
    console.log('更新后总使用次数:', updatedStats.data.overview.totalUsage);
    console.log('更新后总会话数:', updatedStats.data.overview.totalSessions);
    
    // 5. 比较数据变化
    console.log('\n5. 数据变化对比:');
    const usageChange = updatedStats.data.overview.totalUsage - initialStats.data.overview.totalUsage;
    const sessionChange = updatedStats.data.overview.totalSessions - initialStats.data.overview.totalSessions;
    
    console.log('使用次数变化:', usageChange);
    console.log('会话数变化:', sessionChange);
    
    if (usageChange > 0 || sessionChange > 0) {
      console.log('\n✅ 数据更新成功！统计数据已实时更新');
    } else {
      console.log('\n⚠️  数据可能未更新或更新延迟');
    }
    
    // 6. 测试实时统计API
    console.log('\n6. 测试实时统计API:');
    const realTimeStats = await axios.get('http://localhost:3001/api/v1/workflow-stats/realtime');
    console.log('实时统计数据:', JSON.stringify(realTimeStats.data, null, 2));
    
  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

testRealTimeUpdate();
