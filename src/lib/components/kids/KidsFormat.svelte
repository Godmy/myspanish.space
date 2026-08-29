<script lang="ts">
	const items = [
		{
			emoji: '🎮',
			title: 'Занятия в игровой форме',
			desc: 'Видео, карточки и интерактивные задания вместо скучных упражнений'
		},
		{
			emoji: '🎯',
			title: 'Программа под цель и уровень',
			desc: 'Подстраиваем темп и материалы под то, что действительно нужно ребёнку'
		},
		{
			emoji: '⏱️',
			title: '30 минут на урок',
			desc: 'Оптимальная длительность, чтобы ребёнок не уставал и удерживал внимание'
		},
		{
			emoji: '🧑‍🏫',
			title: 'Сертифицированные преподаватели',
			desc: 'Работаем с квалифицированными специалистами и носителями языка'
		},
		{
			emoji: '👤',
			title: 'Индивидуальный формат',
			desc: 'Один ребёнок — один преподаватель, никакой групповой суеты'
		},
		{
			emoji: '📆',
			title: 'Удобное расписание',
			desc: 'Подбираем время, которое не конфликтует со школой и кружками'
		}
	];
</script>

<section class="section what-awaits" id="benefits" data-section="benefits">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Как проходят занятия</div>
			<h2 class="section-title">Формат, который держит внимание ребёнка</h2>
		</div>

		<div class="items-grid">
			{#each items as item, i}
				<div class="item">
					<div class="item-num" aria-hidden="true">0{i + 1}</div>
					<div class="item-icon" aria-hidden="true">{item.emoji}</div>
					<div class="item-body">
						<h3 class="item-title">{item.title}</h3>
						<p class="item-desc">{item.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.what-awaits {
		background: var(--color-surface);
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.item {
		display: flex;
		gap: 1.25rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		align-items: flex-start;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease;
		position: relative;
		overflow: hidden;
	}

	.item:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
	}

	.item-num {
		position: absolute;
		top: 1.25rem;
		right: 1.5rem;
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--color-primary-light);
		line-height: 1;
		letter-spacing: -0.04em;
		pointer-events: none;
		user-select: none;
	}

	.item-icon {
		font-size: 1.75rem;
		line-height: 1;
		width: 50px;
		height: 50px;
		background: var(--color-primary-light);
		border-radius: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.22s ease;
	}

	.item:hover .item-icon {
		background: var(--color-primary);
	}

	.item-title {
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.4rem;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	.item-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 640px) {
		.items-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
