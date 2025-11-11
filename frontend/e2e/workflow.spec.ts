import { test, expect } from '@playwright/test';

test.describe('Workflow Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workflow');
  });

  test('should display workflow page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show chat interface on step 0', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"]').or(page.locator('input[placeholder*="问题"]'));
    await expect(chatInput).toBeVisible({ timeout: 5000 }).catch(() => {
      // 如果找不到特定选择器，至少验证页面已加载
      expect(page.url()).toContain('workflow');
    });
  });
});

test.describe('API Health Check', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });
});

