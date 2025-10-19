const axios = require('axios');

// 模拟选择的知识点数据
const testData = {
  inputs: {
    selectedKnowledgePoints: [
      {
        knowledgePointId: "1",
        contentType: "knowledge_point",
        knowledgePoint: {
          id: "1",
          vehicleModel: "Model S",
          vehicleSeries: "Tesla",
          techCategory: "电池技术",
          techPoint: "三元锂电池",
          description: "高能量密度三元锂电池技术"
        }
      },
      {
        knowledgePointId: "1",
        contentType: "tech_packaging",
        knowledgePoint: {
          id: "1",
          vehicleModel: "Model S",
          vehicleSeries: "Tesla",
          techCategory: "电池技术",
          techPoint: "三元锂电池",
          description: "高能量密度三元锂电池技术"
        }
      },
      {
        knowledgePointId: "2",
        contentType: "knowledge_point",
        knowledgePoint: {
          id: "2",
          vehicleModel: "Model 3",
          vehicleSeries: "Tesla",
          techCategory: "自动驾驶",
          techPoint: "FSD芯片",
          description: "全自动驾驶芯片技术"
        }
      }
    ]
  }
};

async function testPerformance() {
  console.log('开始性能测试...');
  const startTime = Date.now();
  
  try {
    const response = await axios.post('http://localhost:3001/api/workflow/ai-search', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 请求成功完成，耗时: ${duration}ms`);
    console.log('响应状态:', response.status);
    
    if (response.data && response.data.processedInputs) {
      const { knowledgeContext, knowledgeContextSummary } = response.data.processedInputs;
      console.log('知识点上下文长度:', knowledgeContext ? knowledgeContext.length : 0);
      console.log('处理统计:', knowledgeContextSummary);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求错误:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    console.error('完整错误:', error);
  }
}

// 运行测试
testPerformance();
