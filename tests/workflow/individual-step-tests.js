/**
 * 单独步骤测试文件
 * 用于独立测试工作流程中的每个步骤
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_TIMEOUT = 60000; // 增加到60秒，解决技术策略API超时问题

/**
 * 测试AI问答功能
 */
async function testAiSearchOnly() {
  console.log('=== 独立测试: AI问答功能 ===');
  
  const testQueries = [
    "什么是人工智能在医疗领域的应用？",
    "区块链技术的核心原理是什么？",
    "云计算的主要优势有哪些？"
  ];

  for (const query of testQueries) {
    console.log(`\n测试查询: ${query}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/workflow/ai-search`, {
        query: query
      }, {
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.success) {
        console.log('✅ 测试成功');
        const resultData = response.data.data;
        if (typeof resultData === 'string') {
          console.log('📄 结果长度:', resultData.length, '字符');
          console.log('📄 结果预览:', resultData.substring(0, 150) + '...');
        } else if (resultData && typeof resultData === 'object') {
          console.log('📄 结果类型: 对象');
          console.log('📄 结果预览:', JSON.stringify(resultData).substring(0, 150) + '...');
        } else {
          console.log('📄 结果类型:', typeof resultData);
          console.log('📄 结果内容:', resultData);
        }
      } else {
        console.error('❌ 测试失败:', response.data);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
  }
}/**
 * 测试技术包装功能
 */
async function testTechPackageOnly() {
  console.log('\n=== 独立测试: 技术包装功能 ===');
  
  const mockAiSearchResult = `
人工智能在医疗领域的应用主要包括：

1. 医学影像诊断：AI可以分析X光、CT、MRI等医学影像，辅助医生进行疾病诊断。
2. 药物研发：通过机器学习算法加速新药发现和开发过程。
3. 个性化治疗：基于患者的基因信息和病史，制定个性化的治疗方案。
4. 健康监测：通过可穿戴设备和传感器实时监测患者的健康状况。
5. 医疗机器人：协助手术操作，提高手术精度和安全性。
  `;

  const additionalInfos = [
    "请重点关注AI在诊断方面的创新应用",
    "强调AI技术的商业价值和市场前景",
    "分析AI医疗的技术挑战和解决方案"
  ];

  for (const additionalInfo of additionalInfos) {
    console.log(`\n附加信息: ${additionalInfo}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/workflow/tech-package`, {
        inputs: {
          aiSearchResult: mockAiSearchResult,
          Additional_information: additionalInfo
        }
      }, {
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.success) {
        console.log('✅ 测试成功');
        const resultData = response.data.data;
        if (typeof resultData === 'string') {
          console.log('📄 结果长度:', resultData.length, '字符');
          console.log('📄 结果预览:', resultData.substring(0, 150) + '...');
        } else if (resultData && typeof resultData === 'object') {
          console.log('📄 结果类型: 对象');
          console.log('📄 结果预览:', JSON.stringify(resultData).substring(0, 150) + '...');
        } else {
          console.log('📄 结果类型:', typeof resultData);
          console.log('📄 结果内容:', resultData);
        }
      } else {
        console.error('❌ 测试失败:', response.data);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
  }
}/**
 * 测试技术策略功能
 */
async function testTechStrategyOnly() {
  console.log('\n=== 独立测试: 技术策略功能 ===');
  
  const mockTechPackage = `
# AI医疗诊断技术深度解析

## 技术概述
人工智能在医疗诊断领域正在引发革命性变化。通过深度学习和计算机视觉技术，AI系统能够分析医学影像，识别疾病模式，为医生提供精准的诊断支持。

## 核心技术
1. 深度学习算法：卷积神经网络(CNN)在医学影像分析中表现出色
2. 计算机视觉：自动识别和分析医学影像中的异常区域
3. 自然语言处理：分析医疗记录和报告

## 应用场景
- 癌症筛查和早期诊断
- 心血管疾病检测
- 神经系统疾病诊断
- 眼科疾病识别

## 商业价值
AI医疗诊断技术能够显著提高诊断准确率，降低医疗成本，改善患者体验。
  `;

  try {
    const response = await axios.post(`${BASE_URL}/workflow/tech-strategy`, {
      inputs: {
        techPackage: mockTechPackage
      }
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ 测试成功');
      const resultData = response.data.data;
      if (typeof resultData === 'string') {
        console.log('📄 结果长度:', resultData.length, '字符');
        console.log('📄 结果预览:', resultData.substring(0, 200) + '...');
      } else if (resultData && typeof resultData === 'object') {
        console.log('📄 结果类型: 对象');
        console.log('📄 结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      } else {
        console.log('📄 结果类型:', typeof resultData);
        console.log('📄 结果内容:', resultData);
      }
    } else {
      console.error('❌ 测试失败:', response.data);
    }
    if (response.status === 200 && response.data.success) {
      console.log('✅ 测试成功');
      if (typeof response.data.data === 'string') {
        console.log('📄 结果长度:', response.data.data.length, '字符');
        console.log('📄 结果预览:', response.data.data.substring(0, 200) + '...');
      } else {
        console.log('📄 结果类型:', typeof response.data.data);
        console.log('📄 结果预览:', JSON.stringify(response.data.data).substring(0, 200) + '...');
      }
    } else {
      console.error('❌ 测试失败:', response.data);
    }
  } catch (error) {
    console.error('❌ 测试异常:', error.message);
  }
}

/**
 * 测试技术通稿功能
 */
async function testCoreDraftOnly() {
  console.log('\n=== 独立测试: 技术通稿功能 ===');
  
  const mockTechStrategy = `
# AI医疗诊断技术战略规划

## 市场定位
面向医疗机构和技术决策者，提供AI诊断解决方案。

## 技术路线
1. 短期目标：完善影像识别算法
2. 中期目标：扩展到多模态数据分析
3. 长期目标：构建全面的AI医疗生态

## 竞争优势
- 高精度诊断算法
- 丰富的医疗数据资源
- 强大的技术团队

## 实施计划
分阶段推进技术研发和市场推广。
  `;

  const testCases = [
    {
      promotionStrategy: "面向医疗专业人士",
      template: "技术深度分析"
    },
    {
      promotionStrategy: "面向投资者和决策者",
      template: "商业价值展示"
    },
    {
      promotionStrategy: "面向技术开发者",
      template: "技术实现指南"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n推广策略: ${testCase.promotionStrategy}, 模板: ${testCase.template}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/workflow/core-draft`, {
        inputs: {
          input: mockTechStrategy,
          promotionStrategy: testCase.promotionStrategy,
          template: testCase.template
        }
      }, {
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.success) {
        console.log('✅ 测试成功');
        const resultData = response.data.data;
        if (typeof resultData === 'string') {
          console.log('📄 结果长度:', resultData.length, '字符');
          console.log('📄 结果预览:', resultData.substring(0, 150) + '...');
        } else if (resultData && typeof resultData === 'object') {
          console.log('📄 结果类型: 对象');
          console.log('📄 结果预览:', JSON.stringify(resultData).substring(0, 150) + '...');
        } else {
          console.log('📄 结果类型:', typeof resultData);
          console.log('📄 结果内容:', resultData);
        }
      } else {
        console.error('❌ 测试失败:', response.data);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
  }
}/**
 * 测试技术发布功能
 */
async function testTechPublishOnly() {
  console.log('\n=== 独立测试: 技术发布功能 ===');
  
  const mockCoreDraft = `
# AI医疗诊断：重塑未来医疗的核心技术

## 引言
人工智能正在医疗诊断领域掀起一场技术革命。通过深度学习和计算机视觉技术，AI系统能够以前所未有的精度分析医学影像，为医生提供强有力的诊断支持。

## 技术核心
### 深度学习算法
卷积神经网络(CNN)在医学影像分析中展现出卓越性能，能够识别人眼难以察觉的细微病变。

### 多模态数据融合
结合影像、病史、基因信息等多维度数据，提供更全面的诊断依据。

## 应用价值
- 提高诊断准确率达95%以上
- 缩短诊断时间50%
- 降低医疗成本30%

## 市场前景
预计2025年AI医疗诊断市场规模将达到500亿美元，年复合增长率超过40%。

## 结论
AI医疗诊断技术将成为未来医疗体系的重要支柱，为人类健康事业做出重大贡献。
  `;

  try {
    const response = await axios.post(`${BASE_URL}/workflow/tech-publish`, {
      inputs: {
        coreDraft: mockCoreDraft
      }
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ 测试成功');
      const resultData = response.data.data;
      if (typeof resultData === 'string') {
        console.log('📄 结果长度:', resultData.length, '字符');
        console.log('📄 结果预览:', resultData.substring(0, 200) + '...');
      } else if (resultData && typeof resultData === 'object') {
        console.log('📄 结果类型: 对象');
        console.log('📄 结果预览:', JSON.stringify(resultData).substring(0, 200) + '...');
      } else {
        console.log('📄 结果类型:', typeof resultData);
        console.log('📄 结果内容:', resultData);
      }
    } else {
      console.error('❌ 测试失败:', response.data);
    }
  } catch (error) {
    console.error('❌ 测试异常:', error.message);
  }
}

/**
 * 运行所有独立测试
 */
async function runAllIndividualTests() {
  console.log('🚀 开始运行所有独立步骤测试...\n');
  
  const startTime = Date.now();
  
  try {
    await testAiSearchOnly();
    await testTechPackageOnly();
    await testTechStrategyOnly();
    await testCoreDraftOnly();
    await testTechPublishOnly();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ 所有独立测试完成！`);
    console.log(`⏱️  总测试时间: ${duration} 秒`);
    
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error.message);
  }
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  runAllIndividualTests()
    .then(() => {
      console.log('测试完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  testAiSearchOnly,
  testTechPackageOnly,
  testTechStrategyOnly,
  testCoreDraftOnly,
  testTechPublishOnly,
  runAllIndividualTests
};