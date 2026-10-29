import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('public pages, mobile menu, accessible exercises and responsive layout', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Каждое');
	for (const width of [360, 390, 768, 1440]) {
		await page.setViewportSize({ width, height: 1000 });
		await expect(page.locator('.school-hero')).toBeVisible();
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
		).toBeTruthy();
	}
	mkdirSync('test-results/manual-review', { recursive: true });
	await page.screenshot({ path: 'test-results/manual-review/home-desktop.png', fullPage: true });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole('button', { name: 'Открыть меню' }).click();
	await expect(page.getByRole('navigation', { name: 'Мобильное меню' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('navigation', { name: 'Мобильное меню' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Открыть меню' })).toBeFocused();
	await page.screenshot({ path: 'test-results/manual-review/home-mobile.png', fullPage: true });
	await page.goto('/demo/me-llamo');
	await expect(page.getByLabel('Перевод Hola',{exact:true})).toBeEnabled();await page.getByLabel('Перевод Hola',{exact:true}).focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await expect(page.getByLabel('Перевод Hola',{exact:true})).toHaveValue('hello');
	await page.getByLabel('Перевод Gracias', { exact: true }).selectOption('thanks');
	await page.getByLabel('Перевод Adiós', { exact: true }).selectOption('bye');
	await page
		.locator('.school-exercise')
		.filter({ has: page.getByRole('heading', { name: 'Сопоставьте испанские слова и перевод.' }) })
		.getByRole('button', { name: 'Проверить', exact: true })
		.click();
	await expect(page.getByRole('status')).toContainText('Верно!');
	await page.getByRole('button',{name:'Слово 1 ниже'}).focus();await page.keyboard.press('Enter');
	await page.getByRole('button',{name:'Слово 2 ниже'}).tap();
	await page
		.locator('.school-exercise')
		.filter({ has: page.getByRole('heading', { name: 'Составьте фразу «Меня зовут Ана».' }) })
		.getByRole('button', { name: 'Проверить', exact: true })
		.click();
	await expect(page.getByRole('status').last()).toContainText('Верно!');
	await page.screenshot({
		path: 'test-results/manual-review/exercises-mobile.png',
		fullPage: true,
	});
	for (const path of [
		'/directions',
		'/how-it-works',
		'/teacher',
		'/free-materials',
		'/faq',
		'/contacts',
		'/legal/privacy',
		'/legal/terms',
	]) {
		const response = await page.goto(path);
		expect(response?.status(), path).toBe(200);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	}
	expect(errors).toEqual([]);
});

test('real browser: enquiry → teacher assigns course → learner submits → teacher returns and checks → feedback', async ({
	page,
	browser,
}) => {
	const name = 'Сквозной тест ' + Date.now();
	await page.goto('/directions/demo-a1');
	const enquiry = page.locator('#enquiry');
	await enquiry.getByLabel('Как к вам обращаться').fill(name);
	await enquiry.getByLabel('Email, телефон или Telegram').fill('test@example.com');
	await enquiry.getByRole('checkbox').check();
	await enquiry.getByRole('button', { name: /Записаться/ }).click();
	await expect(page.getByRole('status')).toContainText('Заявка сохранена');
	await page.request.post('/login', { form: { command: 'login', userId: 'teacher' } });
	await page.goto('/staff/leads');
	const lead = page
		.locator('section.school-panel')
		.filter({ has: page.getByRole('heading', { name, exact: true }) });
	await lead.getByRole('button', { name: 'Создать ученика и назначить курс' }).click();
	await expect(page.getByRole('status')).toContainText('Ученик создан');
	await page.goto('/staff/students');
	await page.getByRole('link', { name: new RegExp(name) }).click();
	await expect(page).toHaveURL(/\/staff\/students\/[^/]+$/);
	const studentId = page.url().split('/').pop()!;
	const learner = await browser.newContext({ baseURL: 'http://127.0.0.1:5187' }),
		student = await learner.newPage();
	await learner.request.post('/login', { form: { command: 'login', userId: studentId } });
	await student.goto('/account/lessons/hola');
	await student.getByRole('radio', { name: 'Hola', exact: true }).check();
	await student
		.locator('.school-exercise')
		.first()
		.getByRole('button', { name: 'Проверить', exact: true })
		.click();
	await expect(student.getByRole('status')).toContainText('Верно!');
	await student.getByLabel('Ваш ответ', { exact: true }).fill('Hola. Gracias.');
	await student.getByRole('button', { name: 'Отправить на проверку' }).click();
	await expect(student).toHaveURL(/\/account\/homework\//);
	const submissionId = student.url().split('/').pop()!;
	await page.goto('/staff/review/' + submissionId);
	await page.getByLabel('Комментарий ученику').fill('Добавьте восклицательные знаки.');
	await page.getByRole('button', { name: 'На доработку', exact: true }).click();
	await student.reload();
	await expect(student.getByText('Добавьте восклицательные знаки.', { exact: true })).toBeVisible();
	await student.getByLabel('Ваш ответ', { exact: true }).fill('¡Hola! ¡Gracias!');
	await student.getByRole('button', { name: 'Отправить на проверку' }).click();
	const nextId = student.url().split('/').pop()!;
	expect(nextId).not.toBe(submissionId);
	await page.goto('/staff/review/' + nextId);
	await page.getByLabel('Комментарий ученику').fill('Всё верно. Отличная практика!');
	await page.getByRole('button', { name: 'Завершить проверку' }).click();
	await student.reload();
	await expect(student.getByText('Всё верно. Отличная практика!', { exact: true })).toBeVisible();
	await student.screenshot({
		path: 'test-results/manual-review/learner-feedback.png',
		fullPage: true,
	});
	const foreign = await browser.newContext({ baseURL: 'http://127.0.0.1:5187' });
	await foreign.request.post('/login', { form: { command: 'login', userId: 'student-b' } });
	expect((await foreign.request.get('/account/homework/' + nextId)).status()).toBe(404);
	expect((await foreign.request.get('/account/lessons/hola')).status()).toBe(404);
	await foreign.close();
	await learner.close();
});

test('admin creates and previews a course lesson; imports metadata with a real preview/apply', async ({
	page,
}) => {
	await page.request.post('/login', { form: { command: 'login', userId: 'admin' } });
	await page.goto('/staff/courses/new');
	await page.getByLabel('Название', { exact: true }).fill('Новый демокурс ' + Date.now());
	await page.getByLabel('Описание', { exact: true }).fill('Собственный тестовый курс.');
	await page.getByRole('button', { name: 'Сохранить курс', exact: true }).click();
	await expect(page).toHaveURL(/\/staff\/courses\/[^/]+\/edit$/);
	await page.getByLabel('Новый модуль', { exact: true }).fill('Начинаем');
	await page.getByRole('button', { name: 'Добавить модуль', exact: true }).click();
	await page.getByLabel('Название урока', { exact: true }).fill('Тестовый урок');
	await page.getByLabel('Цель', { exact: true }).fill('Познакомиться с редактором.');
	await page.getByRole('button', { name: 'Сохранить урок', exact: true }).click();
	await expect(page).toHaveURL(/\/staff\/lessons\/[^/]+\/edit$/);
	await page.getByLabel('Заметки преподавателя (скрыты)').fill('PRIVATE-TEACHER-NOTE');
	await page.getByRole('button', { name: 'Сохранить урок', exact: true }).click();
	await page.getByRole('link', { name: 'Предпросмотр урока ↗' }).click();
	await expect(page.getByRole('heading', { name: 'Тестовый урок', exact: true })).toBeVisible();
	await expect(page.getByText('PRIVATE-TEACHER-NOTE')).toHaveCount(0);
	await page.goto('/staff/library/import');
	const title = 'CSV материал ' + Date.now();
	await page.getByLabel('Устойчивый идентификатор источника').fill('browser-fixture-' + Date.now());
	await page
		.getByLabel('CSV-файл')
		.setInputFiles({
			name: 'реестр.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from(
				'relative_path;title;processed\n01 Курсы/не подключен.pdf;' + title + ';обработано',
				'utf8',
			),
		});
	await page.getByRole('button', { name: 'Предварительный просмотр', exact: true }).click();
	await expect(page.getByRole('status')).toContainText('данные ещё не записаны');
	await page.getByRole('button', { name: 'Подтвердить импорт этой порции', exact: true }).click();
	await expect(page.getByRole('status')).toContainText('Импорт завершён');
	await page.goto('/staff/library?q=' + encodeURIComponent(title));
	await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
	await page.screenshot({ path: 'test-results/manual-review/library-import.png', fullPage: true });
});
