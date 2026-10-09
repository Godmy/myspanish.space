<script lang="ts">
	import DataTable from '$stylist/table/component/organism/data-table/index.svelte';
	import { createColumn } from '$stylist/table/function/create/column';
	import Tabs from '$stylist/dialog/component/molecule/tabs/index.svelte';
	import TabList from '$stylist/dialog/component/atom/tab-list/index.svelte';
	import Tab from '$stylist/dialog/component/atom/tab/index.svelte';
	import TabPanels from '$stylist/dialog/component/atom/tab-panels/index.svelte';
	import TabPanel from '$stylist/dialog/component/atom/tab-panel/index.svelte';
	import Badge from '$stylist/typography/component/atom/badge/index.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selectedTab = $state('questions');
	const questionRows = $derived(data.questions as Record<string, unknown>[]);
	const resultRows = $derived(data.results as Record<string, unknown>[]);

	const questionSchema = [
		createColumn<Record<string, unknown>>('order', { cell: 'number', header: '#', sortable: true }),
		createColumn<Record<string, unknown>>('key', { cell: 'text', header: 'Ключ', sortable: true }),
		createColumn<Record<string, unknown>>('location', { cell: 'text', header: 'Локация', sortable: true }),
		createColumn<Record<string, unknown>>('question', { cell: 'text', header: 'Вопрос', sortable: true }),
		createColumn<Record<string, unknown>>('options', { cell: 'number', header: 'Варианты', sortable: true }),
		createColumn<Record<string, unknown>>('correct', { cell: 'text', header: 'Верный ответ', sortable: true }),
		createColumn<Record<string, unknown>>('status', { cell: 'pill', header: 'Статус', sortable: true }),
	];

	const resultSchema = [
		createColumn<Record<string, unknown>>('id', { cell: 'number', header: 'Run', sortable: true }),
		createColumn<Record<string, unknown>>('student', { cell: 'text', header: 'Ученик', sortable: true }),
		createColumn<Record<string, unknown>>('score', { cell: 'text', header: 'Балл', sortable: true }),
		createColumn<Record<string, unknown>>('bucket', { cell: 'pill', header: 'Уровень', sortable: true }),
		createColumn<Record<string, unknown>>('status', { cell: 'pill', header: 'Статус', sortable: true }),
		createColumn<Record<string, unknown>>('answers', { cell: 'text', header: 'Ответы', sortable: true }),
		createColumn<Record<string, unknown>>('started', { cell: 'text', header: 'Старт', sortable: true }),
		createColumn<Record<string, unknown>>('finished', { cell: 'text', header: 'Финиш', sortable: true }),
	];

	const completedCount = $derived(data.results.filter((row) => row.status === 'completed').length);
	const averageScore = $derived.by(() => {
		const scores = data.results
			.map((row) => Number(row.score.split('/')[0]))
			.filter((score) => Number.isFinite(score));
		if (scores.length === 0) return '-';
		return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
	});

	function handleTabChange(id: string) {
		selectedTab = id;
	}
</script>

<svelte:head>
	<title>Админка | myspanish.space</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="admin-page">
	<header class="admin-header">
		<div class="admin-title">
			<div class="admin-kicker">Quiz admin</div>
			<h1>Панель квеста</h1>
			<p>Вопросы, прохождения и результаты учеников</p>
		</div>
		<div class="admin-user">
			<span>{data.user?.name}</span>
			{#if data.user?.uname}
				<Badge label={`@${data.user.uname}`} variant="neutral" size="sm" />
			{/if}
			<a class="logout-link" href="/auth/logout">Выйти</a>
		</div>
	</header>

	{#if data.loadError}
		<section class="notice" data-kind="warning">
			<strong>Данные quiz-bot пока недоступны</strong>
			<span>После применения миграции и деплоя таблицы появятся здесь автоматически.</span>
		</section>
	{/if}

	<section class="metrics" aria-label="Quiz summary">
		<div class="metric">
			<span>Вопросы</span>
			<strong>{data.questions.length}</strong>
		</div>
		<div class="metric">
			<span>Прохождения</span>
			<strong>{data.results.length}</strong>
		</div>
		<div class="metric">
			<span>Завершено</span>
			<strong>{completedCount}</strong>
		</div>
		<div class="metric">
			<span>Средний балл</span>
			<strong>{averageScore}</strong>
		</div>
	</section>

	<section class="workspace">
		<Tabs selectedId={selectedTab} onValueChange={handleTabChange} class="admin-tabs">
			<TabList class="admin-tab-list">
				<Tab id="questions">Вопросы</Tab>
				<Tab id="results">Результаты</Tab>
			</TabList>

			<TabPanels class="admin-panels">
				<TabPanel id="questions">
					<div class="panel-head">
						<div>
							<h2>Вопросы tesoro-v1</h2>
							<p>{data.questions.length} вопросов · 4 варианта на вопрос</p>
						</div>
						<Badge label="D1 content" variant={data.quizDbReady ? 'success' : 'warning'} size="sm" />
					</div>

					<DataTable data={questionRows} schema={questionSchema} maxHeight="64vh" />
				</TabPanel>

				<TabPanel id="results">
					<div class="panel-head">
						<div>
							<h2>Результаты учеников</h2>
							<p>Последние 100 прохождений</p>
						</div>
						<Badge label={`${completedCount} completed`} variant="primary" size="sm" />
					</div>

					<DataTable data={resultRows} schema={resultSchema} maxHeight="64vh" />
				</TabPanel>
			</TabPanels>
		</Tabs>
	</section>
</main>

<style>
	.admin-page {
		min-height: 100vh;
		padding: 2rem;
		background:
			linear-gradient(180deg, rgb(18 36 50 / 0.08), transparent 280px),
			var(--color-bg);
		color: var(--color-text);
	}

	.admin-header,
	.metrics,
	.workspace,
	.notice {
		width: min(1180px, 100%);
		margin-inline: auto;
	}

	.admin-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1.25rem;
	}

	.admin-title {
		display: grid;
		gap: 0.35rem;
	}

	.admin-kicker {
		color: var(--color-primary);
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin: 0;
	}

	h1 {
		font-family: var(--font-display);
		font-size: clamp(2rem, 4vw, 3.35rem);
		line-height: 1;
	}

	h2 {
		font-size: 1.05rem;
		line-height: 1.25;
	}

	p {
		color: var(--color-muted);
		line-height: 1.55;
	}

	.admin-user {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 0.65rem;
		min-width: min(100%, 280px);
		color: var(--color-muted);
		font-size: 0.92rem;
	}

	.logout-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.1rem;
		padding: 0 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-weight: 700;
		text-decoration: none;
	}

	.notice {
		display: grid;
		gap: 0.2rem;
		margin-bottom: 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 36%, var(--color-border));
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
	}

	.notice span {
		color: var(--color-muted);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.metric {
		display: grid;
		gap: 0.35rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.metric span {
		color: var(--color-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.metric strong {
		font-family: var(--font-display);
		font-size: 2rem;
		line-height: 1;
	}

	.workspace {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: 0 18px 48px rgb(15 23 42 / 0.08);
	}

	:global(.admin-tabs) {
		display: grid;
		width: 100%;
		gap: 1rem;
	}

	:global(.admin-tab-list) {
		width: fit-content;
		padding: 0.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
	}

	:global(.admin-tab-list .c-tab) {
		border-radius: calc(var(--radius-sm) - 2px);
		border-bottom: 0;
	}

	:global(.admin-tab-list .c-tab[data-active]) {
		background: var(--color-surface);
		color: var(--color-primary);
		box-shadow: 0 1px 4px rgb(15 23 42 / 0.08);
	}

	:global(.admin-panels) {
		margin-top: 0;
	}

	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.85rem;
	}

	:global(.c-data-table) {
		border-color: var(--color-border);
		background: var(--color-surface);
	}

	:global(.c-data-table table) {
		min-width: 920px;
	}

	@media (max-width: 820px) {
		.admin-page {
			padding: 1rem;
		}

		.admin-header,
		.panel-head {
			flex-direction: column;
		}

		.admin-user {
			justify-content: flex-start;
		}

		.metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 520px) {
		.metrics {
			grid-template-columns: 1fr;
		}

		.workspace {
			padding: 0.75rem;
		}
	}
</style>
