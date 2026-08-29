<script lang="ts">
	const results = [
		{
			emoji: '💬',
			title: 'Первые диалоги — через несколько недель',
			desc: 'Ребёнок начинает строить простые фразы и отвечать на вопросы уже на ранних уроках'
		},
		{
			emoji: '✅',
			title: 'Увереннее справляется со школьными заданиями',
			desc: 'Подтягивает грамматику и лексику, которые изучает в школе'
		},
		{
			emoji: '📈',
			title: 'Растёт от уровня к уровню',
			desc: 'Постепенный прогресс A1 → A2 → B1 → B2 с понятными ориентирами на каждом этапе'
		},
		{
			emoji: '🎓',
			title: 'Готов к международному экзамену',
			desc: 'Отработаны все части экзамена — от аудирования до устной речи'
		},
		{
			emoji: '🌍',
			title: 'Свободно общается в поездках',
			desc: 'Уверенно говорит в аэропорту, кафе и повседневных ситуациях за границей'
		}
	];
</script>

<section class="section results" id="results" data-section="results">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Результаты</div>
			<h2 class="section-title">Что получит ваш ребёнок</h2>
		</div>

		<div class="results-grid">
			{#each results as r, i}
				<div class="result-card">
					<div class="result-num" aria-hidden="true">0{i + 1}</div>
					<div class="result-icon" aria-hidden="true">{r.emoji}</div>
					<h3 class="result-title">{r.title}</h3>
					<p class="result-desc">{r.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.results-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
	}

	.result-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		position: relative;
		overflow: hidden;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease;
	}

	.result-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
	}

	.result-num {
		position: absolute;
		top: 1.1rem;
		right: 1.4rem;
		font-family: var(--font-display);
		font-size: 2.25rem;
		font-weight: 900;
		color: var(--color-primary-light);
		line-height: 1;
		letter-spacing: -0.04em;
		pointer-events: none;
		user-select: none;
	}

	.result-icon {
		font-size: 1.75rem;
		line-height: 1;
		width: 50px;
		height: 50px;
		background: var(--color-primary-light);
		border-radius: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.1rem;
	}

	.result-title {
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	.result-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 900px) {
		.results-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.results-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
