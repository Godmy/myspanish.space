import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('Spanish theme remains readable and fits public pages and all school roles', async ({ page }) => {
  mkdirSync('test-results/branding', { recursive: true });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/', '/directions', '/directions/demo-a1', '/contacts', '/login', '/demo/me-llamo']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('theme-scheme', 'spanish');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${path}`).toBe(true);
      if (path === '/') {
        expect(await page.locator('.school-hero-description').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(18);
        const input = page.getByLabel('Как к вам обращаться');
        expect(await input.evaluate(e => parseFloat(getComputedStyle(e).borderTopWidth))).toBeGreaterThanOrEqual(1);
        await input.fill('Проверка оформления');
        await expect(input).toHaveValue('Проверка оформления');
      }
    }
  }
  for (const role of ['student', 'teacher', 'parent', 'admin']) {
    await page.request.post('/login', { form: { command: 'login', userId: role } });
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const paths = ['student', 'parent'].includes(role)
        ? ['/account', '/account/courses', '/account/homework', '/account/materials']
        : ['/staff', '/staff/students', '/staff/courses', '/staff/review', '/staff/library'];
      for (const path of paths) {
        const response = await page.goto(path);
        expect(response?.status(), `${role}: ${path}`).toBe(200);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${role} ${width}: ${path}`).toBe(true);
      }
      await page.goto(paths[0]);
      await page.screenshot({ path: `test-results/branding/${role}-${width}.png`, fullPage: true });
    }
  }
});
