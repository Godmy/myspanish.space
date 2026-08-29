<script lang="ts">
	const benefits = [
		{
			emoji: '⏰',
			title: 'Индивидуальный темп',
			desc: 'Занимайтесь когда удобно — утром или вечером, каждый день или несколько раз в неделю'
		},
		{
			emoji: '♾️',
			title: 'Материалы остаются навсегда',
			desc: 'Купили один раз — доступ бессрочный. Возвращайтесь к материалам когда захочется'
		},
		{
			emoji: '🎒',
			title: 'Везде — дома, на прогулке, в поездке',
			desc: 'Карточки, игры и аудио легко взять с собой — занимайтесь даже в дороге'
		},
		{
			emoji: '🎮',
			title: 'Ребёнок учит язык через игру',
			desc: 'Никаких зубрёжек. Только игры, песни и активности, которые дети обожают'
		},
		{
			emoji: '📚',
			title: 'Много практических материалов',
			desc: 'Конспекты, карточки, рабочие листы, PDF — всё готово, открывай и используй'
		},
		{
			emoji: '🙌',
			title: 'Испанский знать не обязательно',
			desc: 'Курс разработан для мам с нулевым уровнем. Вы будете учиться вместе с ребёнком'
		}
	];
</script>

<section class="section benefits" id="benefits" data-section="benefits">
	<div class="container">
		<div class="section-header">
			<div class="section-tag-dark">Преимущества</div>
			<h2 class="benefits-title">Почему мамы выбирают этот курс</h2>
		</div>

		<div class="benefits-grid">
			{#each benefits as benefit}
				<div class="benefit-card">
					<div class="benefit-icon-wrap" aria-hidden="true">{benefit.emoji}</div>
					<h3 class="benefit-title">{benefit.title}</h3>
					<p class="benefit-desc">{benefit.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.benefits {
		background: var(--color-dark);
		padding: 6rem 0;
	}

	.section-header {
		text-align: center;
		margin-bottom: 3.5rem;
	}

	.section-tag-dark {
		display: inline-flex;
		align-items: center;
		background: rgba(156, 143, 201, 0.22);
		color: #efeafb;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		border-radius: 100px;
		padding: 0.3rem 0.85rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(156, 143, 201, 0.3);
	}

	.benefits-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 4.5vw, 3rem);
		font-weight: 800;
		color: #fcfaff;
		line-height: 1.15;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
	}

	.benefit-card {
		background: rgba(252, 250, 255, 0.05);
		border: 1px solid rgba(252, 250, 255, 0.1);
		border-radius: var(--radius-lg);
		padding: 2rem 1.75rem;
		transition:
			background 0.25s ease,
			border-color 0.25s ease,
			transform 0.25s ease;
	}

	.benefit-card:hover {
		background: rgba(252, 250, 255, 0.09);
		border-color: rgba(156, 143, 201, 0.4);
		transform: translateY(-4px);
	}

	.benefit-icon-wrap {
		font-size: 1.75rem;
		line-height: 1;
		width: 54px;
		height: 54px;
		background: rgba(156, 143, 201, 0.18);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
		transition: background 0.25s ease;
	}

	.benefit-card:hover .benefit-icon-wrap {
		background: rgba(156, 143, 201, 0.35);
	}

	.benefit-title {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		color: rgba(252, 250, 255, 0.95);
		margin: 0 0 0.5rem;
		letter-spacing: -0.01em;
	}

	.benefit-desc {
		font-size: 0.875rem;
		color: rgba(252, 250, 255, 0.5);
		line-height: 1.65;
		margin: 0;
	}

	@media (max-width: 900px) {
		.benefits-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.benefits-grid {
			grid-template-columns: 1fr;
		}
		.benefits {
			padding: 4rem 0;
		}
	}
</style>
