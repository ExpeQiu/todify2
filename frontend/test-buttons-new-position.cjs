const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 导航到首页
    await page.goto('http://localhost:3001');
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 检查"提一个新问题"按钮是否存在并可见
    const newQuestionBtn = await page.locator('[data-oid="new-question-btn"]');
    const isNewQuestionVisible = await newQuestionBtn.isVisible();
    console.log('提一个新问题按钮是否可见:', isNewQuestionVisible);
    
    if (isNewQuestionVisible) {
      // 检查按钮样式
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
    
    // 检查"搜索历史记录"按钮是否存在并可见
    const searchHistoryBtn = await page.locator('[data-oid="search-history-btn"]');
    const isSearchHistoryVisible = await searchHistoryBtn.isVisible();
    console.log('搜索历史记录按钮是否可见:', isSearchHistoryVisible);
    
    if (isSearchHistoryVisible) {
      // 检查按钮样式
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
    if (isNewQuestionVisible) {
      console.log('测试"提一个新问题"按钮点击...');
      await newQuestionBtn.click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      console.log('点击"提一个新问题"后的URL:', currentUrl);
      
      // 返回首页
      await page.goto('http://localhost:3001');
      await page.waitForTimeout(1000);
    }
    
    if (isSearchHistoryVisible) {
      console.log('测试"搜索历史记录"按钮点击...');
      await searchHistoryBtn.click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      console.log('点击"搜索历史记录"后的URL:', currentUrl);
    }
    
    // 保存截图
    await page.screenshot({ path: 'homepage-screenshot-new-position.png' });
    console.log('截图已保存为 homepage-screenshot-new-position.png');
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
  }
})();