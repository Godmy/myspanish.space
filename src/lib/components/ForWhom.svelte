<script lang="ts">
	const cards = [
		{
			emoji: '🌍',
			title: 'Хочу, чтобы ребёнок знал испанский',
			desc: 'Второй язык в детстве — это подарок на всю жизнь'
		},
		{
			emoji: '✈️',
			title: 'Планируем путешествие, переезд или учёбу за рубежом',
			desc: 'Испанский откроет двери в 20+ стран мира'
		},
		{
			emoji: '🕐',
			title: 'Хочу заниматься в удобное время',
			desc: 'Материалы доступны 24/7, занимайтесь тогда, когда удобно'
		},
		{
			emoji: '💛',
			title: 'Хочу сама быть первым проводником ребёнка в язык',
			desc: 'Нет ничего ценнее, чем учиться вместе с мамой'
		},
		{
			emoji: '🏠',
			title: 'Нет возможности ходить в языковую школу',
			desc: 'Всё что нужно — уже у вас: материалы, уроки, поддержка'
		},
		{
			emoji: '🤝',
			title: 'Хочу больше живого общения с ребёнком',
			desc: 'Совместные занятия укрепляют связь и создают общие воспоминания'
		}
	];
</script>

<section class="section" id="for-whom" data-section="for-whom">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Для кого</div>
			<h2 class="section-title">Этот курс для вас, если…</h2>
			<p class="section-desc">
				Курс создан для мам, которые хотят подарить ребёнку испанский язык — даже если сами никогда
				его не учили
			</p>
		</div>

		<div class="cards-grid">
			{#each cards as card, i}
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
		grid-template-columns: repeat(3, 1fr);
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
		transition: background 0.22s ease, transform 0.22s ease;
	}

	.card:hover .card-icon-wrap {
		background: rgba(var(--color-primary-rgb), 0.15);
		transform: scale(1.05);
	}

	.card-emoji {
		font-size: 1.75rem;
		line-height: 1;
		transition: filter 0.22s ease;
	}


	.card-title {
		font-family: var(--font-display);
		font-size: 1.05rem;
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
