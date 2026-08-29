<script lang="ts">
	const topics = [
		{ emoji: '👋', label: 'Знакомство с испанским' },
		{ emoji: '🧸', label: 'Игрушки' },
		{ emoji: '🎨', label: 'Цвета' },
		{ emoji: '🔢', label: 'Счёт' },
		{ emoji: '🐱', label: 'Домашние животные' },
		{ emoji: '🦁', label: 'Дикие животные' },
		{ emoji: '👁️', label: 'Лицо' },
		{ emoji: '🙌', label: 'Части тела' },
		{ emoji: '🚿', label: 'Ванная' },
		{ emoji: '🌅', label: 'Утренние и вечерние ритуалы' },
		{ emoji: '🍎', label: 'Фрукты' },
		{ emoji: '🥦', label: 'Овощи' },
		{ emoji: '🥛', label: 'Продукты питания' },
		{ emoji: '🍳', label: 'Кухня' },
		{ emoji: '👗', label: 'Одежда' },
		{ emoji: '👨‍👩‍👧', label: 'Семья' },
		{ emoji: '🧹', label: 'Уборка' },
		{ emoji: '😊', label: 'Эмоции' },
		{ emoji: '🔷', label: 'Формы' },
		{ emoji: '🛝', label: 'Детская площадка' }
	];

	let expanded = $state(false);
	const INITIAL_COUNT = 12;
</script>

<section class="section" id="program" data-section="program">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Программа</div>
			<h2 class="section-title">27 тематических блоков</h2>
			<p class="section-desc">
				Каждый блок — это тема из повседневной жизни ребёнка. Изучаете слова, играете, поёте и
				закрепляете в быту
			</p>
		</div>

		<div class="topics-grid">
			{#each (expanded ? topics : topics.slice(0, INITIAL_COUNT)) as topic}
				<div class="topic-tag">
					<span class="topic-emoji" aria-hidden="true">{topic.emoji}</span>
					<span>{topic.label}</span>
				</div>
			{/each}

			{#if !expanded}
				<button class="topic-tag more-btn" onclick={() => (expanded = true)}>
					+{topics.length - INITIAL_COUNT} тем →
				</button>
			{/if}
		</div>

		{#if expanded}
			<div class="collapse-wrap">
				<button class="collapse-btn" onclick={() => (expanded = false)}>Свернуть ↑</button>
			</div>
		{/if}

		<div class="course-contents">
			<h3 class="contents-heading">Что входит в каждый блок:</h3>
			<div class="contents-grid">
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">📄</span>
					<span>Тематический конспект</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">🎵</span>
					<span>Песни с переводом</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">🎲</span>
					<span>Игры</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">📚</span>
					<span>Глоссарии</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">🃏</span>
					<span>Карточки</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">🎥</span>
					<span>Видео-презентации</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">📑</span>
					<span>PDF-материалы</span>
				</div>
				<div class="content-item">
					<span class="content-emoji" aria-hidden="true">📅</span>
					<span>Планы на 5 дней занятий</span>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.topics-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-bottom: 2.5rem;
	}

	.topic-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: white;
		border: 1.5px solid var(--color-border);
		border-radius: 100px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: default;
		transition:
			background 0.18s ease,
			border-color 0.18s ease,
			transform 0.18s ease;
	}

	.topic-tag:hover {
		background: var(--color-primary-light);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.topic-emoji {
		font-size: 1rem;
		line-height: 1;
	}

	.more-btn {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
		font-weight: 700;
		cursor: pointer;
		font-family: var(--font-sans);
	}

	.more-btn:hover {
		background: var(--color-primary-dark);
		border-color: var(--color-primary-dark);
	}

	.collapse-wrap {
		margin-bottom: 2.5rem;
		text-align: center;
	}

	.collapse-btn {
		background: none;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.55rem 1.4rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
		font-family: var(--font-sans);
		transition: background 0.18s, border-color 0.18s, color 0.18s;
	}

	.collapse-btn:hover {
		background: var(--color-surface);
		border-color: var(--color-text-muted);
		color: var(--color-text);
	}

	/* Contents block */
	.course-contents {
		background: var(--color-dark);
		border-radius: var(--radius-xl);
		padding: 2.25rem 2.5rem;
	}

	.contents-heading {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 700;
		color: rgba(252, 250, 255, 0.9);
		margin: 0 0 1.5rem;
		letter-spacing: -0.01em;
	}

	.contents-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.85rem;
	}

	.content-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.875rem;
		color: rgba(252, 250, 255, 0.7);
		font-weight: 500;
		padding: 0.75rem 0.85rem;
		background: rgba(252, 250, 255, 0.06);
		border: 1px solid rgba(252, 250, 255, 0.1);
		border-radius: var(--radius-sm);
		transition: background 0.18s, border-color 0.18s, color 0.18s;
	}

	.content-item:hover {
		background: rgba(252, 250, 255, 0.1);
		border-color: rgba(156, 143, 201, 0.35);
		color: rgba(252, 250, 255, 0.95);
	}

	.content-emoji {
		font-size: 1.1rem;
		line-height: 1;
		flex-shrink: 0;
	}

	@media (max-width: 900px) {
		.contents-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.course-contents {
			padding: 1.5rem;
		}
		.contents-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
