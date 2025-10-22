/**
 * 完整工作流程测试
 * 测试从AI问答到技术发布的完整数据流
 * 
 * 工作流程：
 * 1. AI问答 (ai-search) -> 获取基础信息
 * 2. 技术包装 (tech-package) -> 将AI问答结果包装成技术内容
 * 3. 技术策略 (tech-strategy) -> 基于技术包装制定策略
 * 4. 技术通稿 (core-draft) -> 生成技术通稿
 * 5. 技术发布 (tech-publish) -> 最终发布内容
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_TIMEOUT = 60000; // 60秒超时，确保工作流程有足够时间完成

// 测试数据
const TEST_DATA = {
  aiSearchQuery: "什么是人工智能在医疗领域的应用？",
  additionalInfo: "请重点关注AI在诊断和治疗方面的创新应用",
  promotionStrategy: "面向医疗专业人士和技术决策者",
  template: "技术深度分析"
};

// 工作流程步骤结果存储
let workflowResults = {
  aiSearch: null,
  techPackage: null,
  techStrategy: null,
  coreDraft: null,
  techPublish: null
};

/**
 * 步骤1: 测试AI问答功能
 */
async function testAiSearch() {
  console.log('\n=== 步骤1: 测试AI问答功能 ===');
  
  try {
    const response = await axios.post(`${BASE_URL}/workflow/ai-search`, {
      query: TEST_DATA.aiSearchQuery
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      workflowResults.aiSearch = response.data.data;
      console.log('✅ AI问答测试成功');
      
      // 处理不同类型的响应数据
      const resultData = workflowResults.aiSearch;
      if (typeof resultData === 'string') {
        console.log('📄 AI问答结果预览:', resultData.substring(0, 200) + '...');
      } else if (typeof resultData === 'object') {
        console.log('📄 AI问答结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      }
      return true;
    } else {
      console.error('❌ AI问答测试失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ AI问答测试异常:', error.message);
    return false;
  }
}

/**
 * 步骤2: 测试技术包装功能
 */async function testTechPackage() {
  console.log('\n=== 步骤2: 测试技术包装功能 ===');
  
  if (!workflowResults.aiSearch) {
    console.error('❌ 技术包装测试失败: 缺少AI问答结果');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/workflow/tech-package`, {
      inputs: {
        aiSearchResult: workflowResults.aiSearch,
        Additional_information: TEST_DATA.additionalInfo
      }
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      workflowResults.techPackage = response.data.data;
      console.log('✅ 技术包装测试成功');
      
      // 处理不同类型的响应数据
      const resultData = workflowResults.techPackage;
      if (typeof resultData === 'string') {
        console.log('📄 技术包装结果预览:', resultData.substring(0, 200) + '...');
      } else if (typeof resultData === 'object') {
        console.log('📄 技术包装结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      }
      return true;
    } else {
      console.error('❌ 技术包装测试失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 技术包装测试异常:', error.message);
    return false;
  }
}

/**
 * 步骤3: 测试技术策略功能
 */async function testTechStrategy() {
  console.log('\n=== 步骤3: 测试技术策略功能 ===');
  
  if (!workflowResults.techPackage) {
    console.error('❌ 技术策略测试失败: 缺少技术包装结果');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/workflow/tech-strategy`, {
      inputs: {
        techPackage: workflowResults.techPackage
      }
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      workflowResults.techStrategy = response.data.data;
      console.log('✅ 技术策略测试成功');
      
      // 处理不同类型的响应数据
      const resultData = workflowResults.techStrategy;
      if (typeof resultData === 'string') {
        console.log('📄 技术策略结果预览:', resultData.substring(0, 200) + '...');
      } else if (typeof resultData === 'object') {
        console.log('📄 技术策略结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      }
      return true;
    } else {
      console.error('❌ 技术策略测试失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 技术策略测试异常:', error.message);
    return false;
  }
}

/**
 * 步骤4: 测试技术通稿功能
 */async function testCoreDraft() {
  console.log('\n=== 步骤4: 测试技术通稿功能 ===');
  
  if (!workflowResults.techStrategy) {
    console.error('❌ 技术通稿测试失败: 缺少技术策略结果');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/workflow/core-draft`, {
      inputs: {
        input: workflowResults.techStrategy,
        promotionStrategy: TEST_DATA.promotionStrategy,
        template: TEST_DATA.template
      }
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      workflowResults.coreDraft = response.data.data;
      console.log('✅ 技术通稿测试成功');
      
      // 处理不同类型的响应数据
      const resultData = workflowResults.coreDraft;
      if (typeof resultData === 'string') {
        console.log('📄 技术通稿结果预览:', resultData.substring(0, 200) + '...');
      } else if (typeof resultData === 'object') {
        console.log('📄 技术通稿结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      }
      return true;
    } else {
      console.error('❌ 技术通稿测试失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 技术通稿测试异常:', error.message);
    return false;
  }
}

/**
 * 步骤5: 测试技术发布功能
 */async function testTechPublish() {
  console.log('\n=== 步骤5: 测试技术发布功能 ===');
  
  if (!workflowResults.coreDraft) {
    console.error('❌ 技术发布测试失败: 缺少技术通稿结果');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/workflow/tech-publish`, {
      inputs: {
        coreDraft: workflowResults.coreDraft
      }
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      workflowResults.techPublish = response.data.data;
      console.log('✅ 技术发布测试成功');
      
      // 处理不同类型的响应数据
      const resultData = workflowResults.techPublish;
      if (typeof resultData === 'string') {
        console.log('📄 技术发布结果预览:', resultData.substring(0, 200) + '...');
      } else if (typeof resultData === 'object') {
        console.log('📄 技术发布结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      }
      return true;
    } else {
      console.error('❌ 技术发布测试失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 技术发布测试异常:', error.message);
    return false;
  }
}

/**
 * 生成测试报告
 */function generateTestReport() {
  console.log('\n=== 完整工作流程测试报告 ===');
  console.log('测试时间:', new Date().toLocaleString());
  console.log('测试查询:', TEST_DATA.aiSearchQuery);
  
  const steps = [
    { name: 'AI问答', result: workflowResults.aiSearch },
    { name: '技术包装', result: workflowResults.techPackage },
    { name: '技术策略', result: workflowResults.techStrategy },
    { name: '技术通稿', result: workflowResults.coreDraft },
    { name: '技术发布', result: workflowResults.techPublish }
  ];

  let successCount = 0;
  steps.forEach((step, index) => {
    const status = step.result ? '✅ 成功' : '❌ 失败';
    const length = step.result ? step.result.length : 0;
    console.log(`${index + 1}. ${step.name}: ${status} (${length} 字符)`);
    if (step.result) successCount++;
  });

  console.log(`\n总体结果: ${successCount}/${steps.length} 步骤成功`);
  
  if (successCount === steps.length) {
    console.log('🎉 完整工作流程测试全部通过！');
    return true;
  } else {
    console.log('⚠️  部分步骤失败，请检查相关配置和API');
    return false;
  }
}

/**
 * 主测试函数
 */async function runCompleteWorkflowTest() {
  console.log('🚀 开始完整工作流程测试...');
  console.log('测试目标: 验证从AI问答到技术发布的完整数据流');
  
  const startTime = Date.now();
  
  try {
    // 按顺序执行所有测试步骤
    const step1 = await testAiSearch();
    if (!step1) return false;
    
    const step2 = await testTechPackage();
    if (!step2) return false;
    
    const step3 = await testTechStrategy();
    if (!step3) return false;
    
    const step4 = await testCoreDraft();
    if (!step4) return false;
    
    const step5 = await testTechPublish();
    if (!step5) return false;
    
    // 生成测试报告
    const success = generateTestReport();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  总测试时间: ${duration} 秒`);
    
    return success;
    
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error.message);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runCompleteWorkflowTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteWorkflowTest,
  testAiSearch,
  testTechPackage,
  testTechStrategy,
  testCoreDraft,
  testTechPublish,
  generateTestReport
};