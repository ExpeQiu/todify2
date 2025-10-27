// 测试页面检查脚本
// 运行方法: node test-page-check.js

const http = require('http');

console.log('正在检查 http://localhost:3001 ...\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✓ 服务器响应: ${res.statusCode}\n`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // 检查关键元素
    console.log('=== 页面内容检查 ===\n');
    
    const checks = {
      '包含 root div': data.includes('<div id="root"></div>'),
      '包含 Vite 客户端': data.includes('/@vite/client'),
      '包含 main.tsx': data.includes('main.tsx'),
      '包含 StandaloneDocumentEditor': data.includes('StandaloneDocumentEditor') || 
                                       data.includes('standalone-document-editor'),
    };
    
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${value ? '✓' : '✗'} ${key}: ${value}`);
    });
    
    console.log(`\n页面总长度: ${data.length} 字节`);
    console.log('\n✓ 服务器正常运行');
    console.log('✓ 请在浏览器打开 http://localhost:3001');
    console.log('✓ 然后按 F12 打开开发者工具');
  });
});

req.on('error', (e) => {
  console.log('✗ 错误:', e.message);
  console.log('\n可能的原因:');
  console.log('1. 前端服务未启动');
  console.log('2. 服务运行在其他端口');
  console.log('\n请尝试运行:');
  console.log('  cd frontend && npm run dev');
});

req.end();

