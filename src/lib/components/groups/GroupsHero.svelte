<script lang="ts">
	import { track } from '$lib/analytics';
</script>

<section class="hero" data-section="hero">
	<div class="hero-glow" aria-hidden="true"></div>
	<div class="container hero-inner">
		<div class="hero-content">
			<div class="hero-badge">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<circle cx="7" cy="7" r="7" fill="#9c8fc9" fill-opacity="0.4" />
					<circle cx="7" cy="7" r="3" fill="#efeafb" />
				</svg>
				Групповые занятия 4–14 лет
			</div>
			<h1 class="hero-title">
				Испанский<br />
				<em class="hero-accent">в мини-группах</em>
			</h1>
			<p class="hero-subtitle">Учиться веселее, когда рядом ровесники</p>
			<p class="hero-desc">
				Онлайн-занятия для детей в небольших группах до 6 человек: играем, разговариваем и растём
				вместе с преподавателем. Результат тот же, что и индивидуально, а стоит дешевле.
			</p>
			<div class="hero-actions">
				<a
					href="#contact"
					class="btn btn-hero-primary btn-lg"
					data-track-id="groups-hero-cta"
					onclick={() => track('cta_click', { button_id: 'groups-hero-cta', section_id: 'hero' })}
				>
					Записаться на пробное занятие
				</a>
				<a
					href="#for-whom"
					class="btn btn-hero-outline btn-lg"
					data-track-id="groups-hero-groups"
					onclick={() =>
						track('cta_click', { button_id: 'groups-hero-groups', section_id: 'hero' })}
				>
					Посмотреть группы
				</a>
			</div>
			<div class="hero-stats">
				<div class="stat">
					<strong>до 6</strong>
					<span>детей&nbsp;в&nbsp;группе</span>
				</div>
				<div class="stat-sep"></div>
				<div class="stat">
					<strong>45</strong>
					<span>минут&nbsp;— длительность&nbsp;урока</span>
				</div>
				<div class="stat-sep"></div>
				<div class="stat">
					<strong>2×</strong>
					<span>занятия&nbsp;в&nbsp;неделю</span>
				</div>
			</div>
		</div>
		<div class="hero-visual" aria-hidden="true">
			<div class="hero-card">
				<div class="card-icon">🧑‍🤝‍🧑</div>
				<div class="card-text">Мини-группы до 6 детей</div>
			</div>
			<div class="hero-card">
				<div class="card-icon">🎲</div>
				<div class="card-text">Игровые задания</div>
			</div>
			<div class="hero-card">
				<div class="card-icon">🗣️</div>
				<div class="card-text">Живое общение на испанском</div>
			</div>
			<div class="hero-card">
				<div class="card-icon">💸</div>
				<div class="card-text">Дешевле индивидуальных</div>
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		background: var(--color-dark);
		padding: 5.5rem 0 6.5rem;
		overflow: hidden;
	}

	.hero-glow {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 60% 70% at 75% 25%, rgba(156, 143, 201, 0.22) 0%, transparent 60%),
			radial-gradient(ellipse 50% 60% at 20% 75%, rgba(143, 203, 176, 0.1) 0%, transparent 55%);
		pointer-events: none;
	}

	.hero-inner {
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: 3.5rem;
		align-items: center;
		position: relative;
		z-index: 1;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(156, 143, 201, 0.18);
		border: 1px solid rgba(156, 143, 201, 0.3);
		border-radius: 100px;
		padding: 0.38rem 0.9rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: #efeafb;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-family: var(--font-sans);
	}

	.hero-title {
		font-family: var(--font-display);
		font-size: clamp(3rem, 7.5vw, 5.25rem);
		font-weight: 900;
		line-height: 1.05;
		color: #fcfaff;
		margin: 0 0 1.1rem;
		letter-spacing: -0.03em;
	}

	.hero-accent {
		font-style: italic;
		color: var(--color-primary);
		font-weight: 700;
	}

	.hero-subtitle {
		font-size: clamp(1rem, 2.5vw, 1.2rem);
		font-weight: 600;
		color: rgba(252, 250, 255, 0.65);
		margin: 0 0 0.75rem;
		line-height: 1.45;
	}

	.hero-desc {
		font-size: 0.975rem;
		color: rgba(252, 250, 255, 0.45);
		line-height: 1.75;
		margin: 0 0 2.25rem;
		max-width: 46ch;
	}

	.hero-actions {
		display: flex;
		gap: 0.85rem;
		flex-wrap: wrap;
		margin-bottom: 2.75rem;
	}

	.btn-hero-primary {
		background: var(--color-primary);
		color: white;
		border: 2px solid var(--color-primary);
		box-shadow: 0 4px 20px rgba(156, 143, 201, 0.5);
		font-family: var(--font-sans);
	}
	.btn-hero-primary:hover {
		background: #7a6ba8;
		border-color: #7a6ba8;
		box-shadow: 0 6px 28px rgba(156, 143, 201, 0.6);
	}

	.btn-hero-outline {
		background: transparent;
		color: rgba(252, 250, 255, 0.8);
		border: 2px solid rgba(252, 250, 255, 0.2);
		font-family: var(--font-sans);
	}
	.btn-hero-outline:hover {
		background: rgba(252, 250, 255, 0.08);
		border-color: rgba(252, 250, 255, 0.4);
		color: rgba(252, 250, 255, 0.95);
	}

	.hero-stats {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding-top: 1.75rem;
		border-top: 1px solid rgba(252, 250, 255, 0.1);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat strong {
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 800;
		color: var(--color-primary);
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.stat span {
		font-size: 0.7rem;
		color: rgba(252, 250, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 500;
	}

	.stat-sep {
		width: 1px;
		height: 3rem;
		background: rgba(252, 250, 255, 0.1);
		flex-shrink: 0;
	}

	.hero-visual {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.hero-card {
		background: rgba(252, 250, 255, 0.05);
		border: 1px solid rgba(252, 250, 255, 0.1);
		border-radius: 18px;
		padding: 1.75rem 1.25rem;
		text-align: center;
		transition:
			background 0.25s ease,
			transform 0.25s ease,
			border-color 0.25s ease;
		cursor: default;
	}

	.hero-card:hover {
		background: rgba(252, 250, 255, 0.09);
		border-color: rgba(156, 143, 201, 0.35);
		transform: translateY(-4px);
	}

	.hero-card:nth-child(even) {
		margin-top: 1.25rem;
	}

	.card-icon {
		font-size: 2.25rem;
		margin-bottom: 0.65rem;
		line-height: 1;
	}

	.card-text {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(252, 250, 255, 0.8);
		line-height: 1.3;
	}

	@media (max-width: 900px) {
		.hero-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.hero {
			padding: 3.5rem 0 4.5rem;
		}
		.hero-card:nth-child(even) {
			margin-top: 0;
		}
		.stat-sep {
			display: none;
		}
		.hero-stats {
			gap: 1.25rem;
		}
	}
</style>
