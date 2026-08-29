<script lang="ts">
	const programs = [
		{
			emoji: '🧸',
			title: 'Первые слова',
			age: '4–6 лет',
			desc: 'Приветствия, цвета, числа до 10, животные и семья — через песни, карточки и игры'
		},
		{
			emoji: '🎒',
			title: 'Простые диалоги',
			age: '7–10 лет',
			desc: 'Рассказ о себе, семье и питомцах, погода, еда и любимые занятия'
		},
		{
			emoji: '🎧',
			title: 'Живое общение',
			age: '11–14 лет',
			desc: 'Обсуждаем увлечения и культуру испаноязычных стран, тренируем разговорную речь'
		},
		{
			emoji: '📝',
			title: 'Первые экзамены',
			age: '12+ лет',
			desc: 'Знакомим с форматом международных экзаменов и разбираем типовые задания'
		}
	];
</script>

<section class="section" id="program" data-section="program">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Программа</div>
			<h2 class="section-title">Чему учимся в каждой группе</h2>
			<p class="section-desc">
				Программа построена по возрасту и уровню — от первых слов до уверенного разговора
			</p>
		</div>

		<div class="programs-grid">
			{#each programs as p}
				<div class="program-card">
					<div class="program-icon" aria-hidden="true">{p.emoji}</div>
					<div class="program-age">{p.age}</div>
					<h3 class="program-title">{p.title}</h3>
					<p class="program-desc">{p.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.programs-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.25rem;
	}

	.program-card {
		background: var(--color-dark);
		border-radius: var(--radius-lg);
		padding: 2rem 1.5rem;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease;
	}

	.program-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.program-icon {
		font-size: 2rem;
		line-height: 1;
		width: 54px;
		height: 54px;
		background: rgba(156, 143, 201, 0.18);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.1rem;
	}

	.program-age {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.program-title {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		color: #fcfaff;
		margin: 0 0 0.5rem;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	.program-desc {
		font-size: 0.875rem;
		color: rgba(252, 250, 255, 0.5);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 900px) {
		.programs-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.programs-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
