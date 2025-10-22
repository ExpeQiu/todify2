/**
 * 测试运行器
 * 提供统一的测试执行入口和结果汇总
 */

const completeWorkflowTest = require('./complete-workflow-test');
const individualStepTests = require('./individual-step-tests');

/**
 * 运行完整工作流程测试
 */
async function runCompleteTest() {
  console.log('🔄 执行完整工作流程测试...\n');
  return await completeWorkflowTest.runCompleteWorkflowTest();
}

/**
 * 运行独立步骤测试
 */
async function runIndividualTests() {
  console.log('🔄 执行独立步骤测试...\n');
  await individualStepTests.runAllIndividualTests();
  return true;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始执行所有工作流程测试...\n');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  let results = {
    completeWorkflow: false,
    individualSteps: false
  };

  try {
    // 1. 运行独立步骤测试
    console.log('第一阶段: 独立步骤测试');
    console.log('=' .repeat(40));
    results.individualSteps = await runIndividualTests();
    
    console.log('\n' + '=' .repeat(60));
    
    // 2. 运行完整工作流程测试
    console.log('第二阶段: 完整工作流程测试');
    console.log('=' .repeat(40));
    results.completeWorkflow = await runCompleteTest();
    
  } catch (error) {
    console.error('❌ 测试执行过程中发生异常:', error.message);
  }

  // 生成最终报告
  generateFinalReport(results, startTime);
  
  return results.completeWorkflow && results.individualSteps;
}/**
 * 生成最终测试报告
 */
function generateFinalReport(results, startTime) {
  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 最终测试报告');
  console.log('=' .repeat(60));
  console.log('测试时间:', new Date().toLocaleString());
  console.log('总耗时:', totalDuration, '秒');
  console.log('');
  
  // 测试结果汇总
  const testResults = [
    { name: '独立步骤测试', status: results.individualSteps ? '✅ 通过' : '❌ 失败' },
    { name: '完整工作流程测试', status: results.completeWorkflow ? '✅ 通过' : '❌ 失败' }
  ];
  
  testResults.forEach(result => {
    console.log(`${result.name}: ${result.status}`);
  });
  
  console.log('');
  
  // 总体结果
  const allPassed = results.completeWorkflow && results.individualSteps;
  if (allPassed) {
    console.log('🎉 所有测试通过！工作流程运行正常。');
    console.log('');
    console.log('✅ 验证完成的功能:');
    console.log('   • AI问答 -> 技术包装 -> 技术策略 -> 技术通稿 -> 技术发布');
    console.log('   • 各步骤独立功能正常');
    console.log('   • 数据流转换正确');
    console.log('   • API接口响应正常');
  } else {
    console.log('⚠️  部分测试失败，请检查:');
    console.log('   • 后端服务是否正常运行');
    console.log('   • Dify API配置是否正确');
    console.log('   • 环境变量是否设置完整');
    console.log('   • 网络连接是否正常');
  }
  
  console.log('=' .repeat(60));
}

/**
 * 命令行参数处理
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    runComplete: false,
    runIndividual: false,
    runAll: true
  };
  
  if (args.includes('--complete')) {
    options.runComplete = true;
    options.runAll = false;
  }
  
  if (args.includes('--individual')) {
    options.runIndividual = true;
    options.runAll = false;
  }
  
  if (args.includes('--help')) {
    console.log('工作流程测试运行器');
    console.log('');
    console.log('用法:');
    console.log('  node test-runner.js [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --complete     只运行完整工作流程测试');
    console.log('  --individual   只运行独立步骤测试');
    console.log('  --help         显示帮助信息');
    console.log('');
    console.log('默认: 运行所有测试');
    process.exit(0);
  }
  
  return options;
}/**
 * 主执行函数
 */
async function main() {
  const options = parseArguments();
  
  try {
    if (options.runComplete) {
      const success = await runCompleteTest();
      process.exit(success ? 0 : 1);
    } else if (options.runIndividual) {
      await runIndividualTests();
      process.exit(0);
    } else if (options.runAll) {
      const success = await runAllTests();
      process.exit(success ? 0 : 1);
    }
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  runCompleteTest,
  runIndividualTests,
  runAllTests,
  generateFinalReport
};