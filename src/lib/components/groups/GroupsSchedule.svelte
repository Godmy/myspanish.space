<script lang="ts">
	import { track } from '$lib/analytics';

	interface ScheduleRow {
		level: string;
		time: string;
		note: string;
	}

	interface Tab {
		id: string;
		label: string;
		rows: ScheduleRow[];
	}

	const tabs: Tab[] = [
		{
			id: 'kids',
			label: 'Дети 4–10 лет',
			rows: [
				{
					level: 'Знакомство · A0',
					time: 'Пн и Чт · 16:00 (МСК)',
					note: 'Для тех, кто начинает с нуля'
				},
				{
					level: 'Базовый · A1',
					time: 'Вт и Пт · 17:00 (МСК)',
					note: 'Простые фразы и диалоги'
				},
				{
					level: 'Продолжающие · A1+',
					time: 'Ср и Сб · 11:00 (МСК)',
					note: 'Расширяем словарный запас'
				}
			]
		},
		{
			id: 'teens',
			label: 'Подростки 11–14 лет',
			rows: [
				{
					level: 'Разговорный · A2',
					time: 'Пн и Ср · 19:00 (МСК)',
					note: 'Живое общение на актуальные темы'
				},
				{
					level: 'Продолжающие · B1',
					time: 'Вт и Чт · 18:30 (МСК)',
					note: 'Готовимся к первым экзаменам'
				},
				{
					level: 'Выходного дня · A1–A2',
					time: 'Сб · 12:00 и 13:00 (МСК)',
					note: 'Для тех, кому удобнее по выходным'
				}
			]
		}
	];

	let activeTab = $state(tabs[0].id);

	function selectTab(id: string) {
		activeTab = id;
		track('tab_click', { button_id: `groups-schedule-${id}`, section_id: 'schedule' });
	}

	let activeRows = $derived(tabs.find((t) => t.id === activeTab)?.rows ?? []);
</script>

<section class="section schedule" id="schedule" data-section="schedule">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Расписание</div>
			<h2 class="section-title">Выберите группу по возрасту и времени</h2>
			<p class="section-desc">
				Показываем ориентировочное расписание — точные дни и время уточняем на пробном занятии,
				когда собираем группу под ваш возраст и уровень
			</p>
		</div>

		<div class="tabs" role="tablist" aria-label="Возрастные группы">
			{#each tabs as tab}
				<button
					class="tab"
					class:active={activeTab === tab.id}
					role="tab"
					aria-selected={activeTab === tab.id}
					onclick={() => selectTab(tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="schedule-table" role="tabpanel">
			{#each activeRows as row}
				<div class="schedule-row">
					<div class="row-level">{row.level}</div>
					<div class="row-time">{row.time}</div>
					<div class="row-note">{row.note}</div>
					<a
						href="#contact"
						class="btn btn-outline row-cta"
						data-track-id="groups-schedule-cta"
						onclick={() =>
							track('cta_click', { button_id: 'groups-schedule-cta', section_id: 'schedule' })}
					>
						Записаться
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.schedule {
		background: var(--color-bg);
	}

	.tabs {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.tab {
		background: white;
		border: 1.5px solid var(--color-border);
		border-radius: 100px;
		padding: 0.6rem 1.4rem;
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-text-muted);
		cursor: pointer;
		transition:
			background 0.18s ease,
			color 0.18s ease,
			border-color 0.18s ease;
	}

	.tab:hover {
		border-color: var(--color-primary-light);
		color: var(--color-text);
	}

	.tab.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.schedule-table {
		max-width: 860px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.schedule-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1.3fr auto;
		gap: 1rem;
		align-items: center;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1.1rem 1.4rem;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.schedule-row:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.row-level {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.row-time {
		font-size: 0.875rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.row-note {
		font-size: 0.825rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.row-cta {
		padding: 0.5rem 1.1rem;
		font-size: 0.8rem;
		min-height: 38px;
		white-space: nowrap;
	}

	@media (max-width: 720px) {
		.schedule-row {
			grid-template-columns: 1fr;
			gap: 0.4rem;
			text-align: left;
		}

		.row-cta {
			margin-top: 0.5rem;
			width: 100%;
		}
	}
</style>
