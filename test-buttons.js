const { chromium } = require('playwright');

(async () => {
  console.log('启动浏览器测试...');
  
  // 启动浏览器
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('导航到首页...');
    await page.goto('http://localhost:3001');
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    console.log('检查页面标题...');
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 检查"提一个新问题"按钮
    console.log('检查"提一个新问题"按钮...');
    const newQuestionBtn = await page.locator('[data-oid="new-question-btn"]');
    const newQuestionExists = await newQuestionBtn.count() > 0;
    console.log('提一个新问题按钮存在:', newQuestionExists);
    
    if (newQuestionExists) {
      const newQuestionVisible = await newQuestionBtn.isVisible();
      console.log('提一个新问题按钮可见:', newQuestionVisible);
      
      // 获取按钮样式
      const newQuestionStyles = await newQuestionBtn.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position
        };
      });
      console.log('提一个新问题按钮样式:', newQuestionStyles);
    }
    
    // 检查"搜索历史记录"按钮
    console.log('检查"搜索历史记录"按钮...');
    const searchHistoryBtn = await page.locator('[data-oid="search-history-btn"]');
    const searchHistoryExists = await searchHistoryBtn.count() > 0;
    console.log('搜索历史记录按钮存在:', searchHistoryExists);
    
    if (searchHistoryExists) {
      const searchHistoryVisible = await searchHistoryBtn.isVisible();
      console.log('搜索历史记录按钮可见:', searchHistoryVisible);
      
      // 获取按钮样式
      const searchHistoryStyles = await searchHistoryBtn.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position
        };
      });
      console.log('搜索历史记录按钮样式:', searchHistoryStyles);
    }
    
    // 测试按钮点击功能
    if (newQuestionExists) {
      console.log('测试"提一个新问题"按钮点击...');
      await newQuestionBtn.click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      console.log('点击后的URL:', currentUrl);
      
      // 返回首页
      await page.goto('http://localhost:3001');
      await page.waitForTimeout(1000);
    }
    
    if (searchHistoryExists) {
      console.log('测试"搜索历史记录"按钮点击...');
      await searchHistoryBtn.click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      console.log('点击后的URL:', currentUrl);
    }
    
    // 保存截图
    console.log('保存页面截图...');
    await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
    
    // 等待一段时间以便观察
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
})();