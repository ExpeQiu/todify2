const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('正在访问页面...');
    await page.goto('http://localhost:3001');
    
    // 等待页面加载完成
    await page.waitForTimeout(3000);
    
    console.log('正在查找"提一个新问题"按钮...');
    const newQuestionBtn = await page.locator('[data-oid="new-question-btn"]');
    
    // 验证按钮是否存在
    await newQuestionBtn.waitFor({ state: 'visible' });
    console.log('✓ "提一个新问题"按钮已找到');
    
    // 先发送一条消息，创建聊天记录
    console.log('正在发送测试消息...');
    const inputField = await page.locator('input[placeholder*="输入"], textarea[placeholder*="输入"]').first();
    if (await inputField.count() > 0) {
      await inputField.fill('这是一条测试消息');
      
      // 查找发送按钮并点击
      const sendBtn = await page.locator('button:has-text("发送"), button[type="submit"]').first();
      if (await sendBtn.count() > 0) {
        await sendBtn.click();
        await page.waitForTimeout(2000); // 等待消息发送
        console.log('✓ 测试消息已发送');
      }
    }
    
    // 记录当前URL
    const currentUrl = page.url();
    console.log('当前页面URL:', currentUrl);
    
    // 点击"提一个新问题"按钮
    console.log('正在点击"提一个新问题"按钮...');
    await newQuestionBtn.click();
    
    // 等待一段时间让页面响应
    await page.waitForTimeout(2000);
    
    // 检查URL是否发生变化
    const newUrl = page.url();
    console.log('点击后的URL:', newUrl);
    
    if (currentUrl === newUrl) {
      console.log('✓ 页面URL未发生变化，按钮没有导航到其他页面');
    } else {
      console.log('✗ 页面URL发生了变化，按钮可能仍在导航');
    }
    
    // 检查聊天记录是否被重置（查找默认的欢迎消息）
    const welcomeMessage = await page.locator('text=你好！我是智能助手，请输入您的问题或需求');
    if (await welcomeMessage.count() > 0) {
      console.log('✓ 聊天记录已重置，显示默认欢迎消息');
    } else {
      console.log('✗ 聊天记录可能未被正确重置');
    }
    
    // 检查输入框是否被清空
    const inputValue = await inputField.inputValue();
    if (inputValue === '') {
      console.log('✓ 输入框已被清空');
    } else {
      console.log('✗ 输入框未被清空，当前值:', inputValue);
    }
    
    // 截图保存
    await page.screenshot({ path: 'test-new-question-button-result.png' });
    console.log('✓ 测试截图已保存');
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
  }
})();