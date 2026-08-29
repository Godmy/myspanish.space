<script lang="ts">
	const options = [
		{
			emoji: '🧾',
			title: 'Налоговый вычет',
			desc: 'Мы образовательная организация с лицензией — вы можете вернуть часть стоимости обучения через налоговый вычет'
		},
		{
			emoji: '👶',
			title: 'Материнский капитал',
			desc: 'Можно оплатить занятия материнским капиталом через Госуслуги'
		},
		{
			emoji: '💳',
			title: 'Рассрочка без переплат',
			desc: 'Разбейте оплату на части удобным сервисом рассрочки — без скрытых процентов'
		}
	];
</script>

<section class="section pricing-benefits" id="price" data-section="price">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Учитесь с выгодой</div>
			<h2 class="section-title">Три способа оплатить обучение выгоднее</h2>
		</div>

		<div class="options-grid">
			{#each options as o}
				<div class="option-card">
					<div class="option-icon" aria-hidden="true">{o.emoji}</div>
					<h3 class="option-title">{o.title}</h3>
					<p class="option-desc">{o.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.pricing-benefits {
		background: var(--color-bg);
	}

	.options-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
	}

	.option-card {
		background: white;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 2rem 1.75rem;
		text-align: center;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease,
			border-color 0.22s ease;
	}

	.option-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary-light);
	}

	.option-icon {
		font-size: 2rem;
		line-height: 1;
		width: 58px;
		height: 58px;
		background: var(--color-primary-light);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.1rem;
	}

	.option-title {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem;
		letter-spacing: -0.01em;
	}

	.option-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 900px) {
		.options-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
