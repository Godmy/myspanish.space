import { test, expect } from '@playwright/test';

const base = process.env.SCHOOL_BROWSER_BASE_URL;
test.use({ baseURL: base || 'http://127.0.0.1:5187' });
test.skip(!base, 'Set SCHOOL_BROWSER_BASE_URL to an already running populated local site.');
const handout = '/api/school/files/pack:autumn:lesson-1:handout';

for (const role of ['admin', 'student', 'parent']) {
 test(`closed download asks for ${role} login and resumes the original file`, async ({ page, context }) => {
  const target = handout + '?child=student';
  const first = await context.request.get(target, { maxRedirects: 0 });
  expect(first.status()).toBe(303);
  expect(first.headers().location).toBe('/login?next=' + encodeURIComponent(target));
  await page.goto(target);
  await expect(page).toHaveURL(/\/login\?next=/);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('form').filter({ has: page.locator(`input[name="userId"][value="${role}"]`) }).getByRole('button').click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe('lesson-1.txt');
  const stream = await download.createReadStream();
  expect(stream).toBeTruthy();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString('utf8')).toContain('Листья');
  for (const suffix of ['', '?child=student']) {
   const response = await context.request.get(handout + suffix);
   expect(response.status()).toBe(200);
   expect(response.headers()['content-type']).toContain('text/plain');
   expect(await response.text()).toContain('Пять осенних занятий');
  }
  const technical = await context.request.get('/api/school/files/E3dc63480b260');
  expect(technical.status()).toBe(role === 'admin' ? 200 : 404);
 });
}

test('expired session returns to login; public material stays public; unrelated learner stays denied', async ({ page, context }) => {
 const publicFile = await context.request.get('/api/school/files/demo-words');
 expect(publicFile.status()).toBe(200);
 await context.addCookies([{ name: 'school_session', value: 'invalid-test-session', url: base! }]);
 await page.goto(handout);
 await expect(page).toHaveURL(/\/login\?next=/);
 // Log into the other learner through the actual role form; it has no autumn grant.
 await page.locator('form').filter({ has: page.locator('input[name="userId"][value="student-b"]') }).getByRole('button').click();
 await expect(page.locator('body')).toContainText('Вложение недоступно');
 expect((await context.request.get(handout)).status()).toBe(404);
});
