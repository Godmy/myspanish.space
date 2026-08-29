<script lang="ts">
	const cards = [
		{
			emoji: '🏫',
			title: 'Нужна помощь со школьной программой',
			desc: 'Подтягиваем оценки, разбираем темы из учебника и готовим к контрольным'
		},
		{
			emoji: '🌱',
			title: 'Никогда не учил испанский',
			desc: 'Начинаем с простых слов, звуков и картинок — без давления и зубрёжки'
		},
		{
			emoji: '✈️',
			title: 'Готовится к поездке или переезду',
			desc: 'Разговорная практика для реальных ситуаций — в аэропорту, в кафе, в школе'
		},
		{
			emoji: '📄',
			title: 'Нужен международный экзамен',
			desc: 'Тренируем все навыки: аудирование, письмо, говорение и чтение'
		}
	];
</script>

<section class="section" id="for-whom" data-section="for-whom">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Кому подойдёт</div>
			<h2 class="section-title">Подберём формат под вашего ребёнка</h2>
			<p class="section-desc">
				Учитываем возраст, уровень и цель — от первого знакомства с языком до подготовки к
				экзамену
			</p>
		</div>

		<div class="cards-grid">
			{#each cards as card}
				<div class="card">
					<div class="card-icon-wrap">
						<span class="card-emoji" aria-hidden="true">{card.emoji}</span>
					</div>
					<h3 class="card-title">{card.title}</h3>
					<p class="card-desc">{card.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.25rem;
	}

	.card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 2rem 1.75rem;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease,
			border-color 0.22s ease;
		position: relative;
		overflow: hidden;
	}

	.card::after {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 3px;
		background: var(--color-primary);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
		border-radius: 3px 3px 0 0;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary-light);
	}

	.card:hover::after {
		transform: scaleX(1);
	}

	.card-icon-wrap {
		width: 54px;
		height: 54px;
		background: var(--color-primary-light);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
		transition:
			background 0.22s ease,
			transform 0.22s ease;
	}

	.card:hover .card-icon-wrap {
		transform: scale(1.05);
	}

	.card-emoji {
		font-size: 1.75rem;
		line-height: 1;
	}

	.card-title {
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem;
		line-height: 1.35;
		letter-spacing: -0.01em;
	}

	.card-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 900px) {
		.cards-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.cards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
