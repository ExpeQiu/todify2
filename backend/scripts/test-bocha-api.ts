import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

const BOCHA_API_URL = 'https://api.bocha.cn/v1/web-search';
const BOCHA_API_KEY = process.env.BOCHA_API_KEY || '';

async function testBochaAPI() {
  console.log('='.repeat(60));
  console.log('博查 Web Search API 服务可用性测试');
  console.log('='.repeat(60));
  console.log('');

  // 检查 API Key
  if (!BOCHA_API_KEY) {
    console.error('❌ 错误: BOCHA_API_KEY 未配置');
    console.error('   请在 .env 文件中设置 BOCHA_API_KEY');
    process.exit(1);
  }

  console.log(`✅ API Key 已配置: ${BOCHA_API_KEY.substring(0, 7)}...`);
  console.log('');

  // 测试搜索
  console.log('正在测试 API 连接...');
  try {
    const response = await axios.post(
      BOCHA_API_URL,
      {
        query: '人工智能',
        summary: true,
        count: 3,
      },
      {
        headers: {
          'Authorization': `Bearer ${BOCHA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.status === 200) {
      console.log('✅ API 调用成功！');
      console.log('');

      const data = response.data.data || response.data;
      
      if (data.webPages && data.webPages.value) {
        console.log(`📊 搜索结果: 找到 ${data.webPages.totalEstimatedMatches || 0} 个匹配结果`);
        console.log(`📄 返回了 ${data.webPages.value.length} 条结果`);
        console.log('');

        // 显示前3条结果
        console.log('前 3 条搜索结果:');
        data.webPages.value.slice(0, 3).forEach((result: any, index: number) => {
          console.log(`\n${index + 1}. ${result.name}`);
          console.log(`   网址: ${result.url}`);
          if (result.snippet) {
            console.log(`   摘要: ${result.snippet.substring(0, 100)}...`);
          }
          if (result.siteName) {
            console.log(`   来源: ${result.siteName}`);
          }
        });
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('✅ 服务可用性验证通过！');
      console.log('='.repeat(60));
      process.exit(0);
    } else {
      console.error(`❌ API 返回异常状态码: ${response.status}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ API 调用失败！');
    console.error('');

    if (error.response) {
      // API 返回了错误响应
      const statusCode = error.response.status;
      const errorData = error.response.data || {};

      console.error(`状态码: ${statusCode}`);
      console.error(`错误代码: ${errorData.code || 'UNKNOWN'}`);
      console.error(`错误信息: ${errorData.message || error.message}`);

      if (statusCode === 401 || statusCode === 403) {
        console.error('');
        console.error('💡 提示: API Key 可能无效或已过期');
        console.error('   请检查 BOCHA_API_KEY 是否正确');
      } else if (statusCode === 403 && errorData.message?.includes('money')) {
        console.error('');
        console.error('💡 提示: 账户余额不足');
        console.error('   请前往 https://open.bocha.cn 进行充值');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误: 无法连接到博查 API 服务器');
      console.error('请检查网络连接和防火墙设置');
    } else {
      // 其他错误
      console.error(`错误: ${error.message}`);
    }

    console.error('');
    console.log('='.repeat(60));
    console.error('❌ 服务可用性验证失败！');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// 运行测试
testBochaAPI();
