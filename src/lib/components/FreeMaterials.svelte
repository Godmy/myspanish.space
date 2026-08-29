<script lang="ts">
	import { track } from '$lib/analytics';
	import { questUrl, QUEST_LABEL } from '$lib/links';

	interface Props {
		telegramLink: string;
	}

	let { telegramLink }: Props = $props();
</script>

<section class="free-materials" data-section="free-materials">
	<div class="container">
		<div class="inner">
			<div class="text-col">
				<div class="section-tag">Бесплатно</div>
				<h2 class="section-title">Попробуйте прямо сейчас</h2>
				<p class="lead-text">
					Мы подготовили бесплатные пробные материалы — первый урок, несколько карточек и песню.
					Убедитесь сами, что заниматься испанским дома — это просто и весело.
				</p>
				<ul class="features-list">
					<li>
						<span class="feature-check" aria-hidden="true">✓</span>
						Пробный урок с конспектом
					</li>
					<li>
						<span class="feature-check" aria-hidden="true">✓</span>
						Карточки с животными
					</li>
					<li>
						<span class="feature-check" aria-hidden="true">✓</span>
						Испанская детская песенка
					</li>
				</ul>
				<div class="actions">
					<a
						href={telegramLink}
						class="btn btn-primary"
						target="_blank"
						rel="noopener"
						data-track-id="free-materials-tg"
						onclick={() =>
							track('free_materials_click', {
								button_id: 'free-materials-tg',
								section_id: 'free-materials'
							})}
					>
						Получить в Telegram
					</a>
					<a
						href={questUrl('free-materials')}
						class="btn btn-outline"
						target="_blank"
						rel="noopener"
						data-track-id="free-materials-quest"
						onclick={() =>
							track('cta_click', {
								button_id: 'quest-free-materials',
								section_id: 'free-materials'
							})}
					>
						{QUEST_LABEL}
					</a>
				</div>
			</div>
			<div class="visual-col" aria-hidden="true">
				<div class="visual-card">
					<div class="visual-icon">📖</div>
					<div class="visual-info">
						<div class="visual-title">Урок 1: Знакомство</div>
						<div class="visual-sub">конспект + аудио</div>
					</div>
				</div>
				<div class="visual-card featured">
					<div class="visual-icon">🐱</div>
					<div class="visual-info">
						<div class="visual-title">Карточки: Животные</div>
						<div class="visual-sub">PDF для печати</div>
					</div>
				</div>
				<div class="visual-card">
					<div class="visual-icon">🎵</div>
					<div class="visual-info">
						<div class="visual-title">Hola, buenos días!</div>
						<div class="visual-sub">песня с переводом</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.free-materials {
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-light) 100%);
		padding: 6rem 0;
	}

	.inner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.section-tag {
		background: var(--color-primary);
		color: white;
	}

	.section-title {
		text-align: left;
		margin-bottom: 1rem;
	}

	.lead-text {
		font-size: 1rem;
		color: var(--color-text-muted);
		line-height: 1.7;
		margin: 0 0 1.5rem;
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 0 0 2.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.features-list li {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.975rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.feature-check {
		width: 22px;
		height: 22px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 800;
		flex-shrink: 0;
	}

	.actions {
		display: flex;
		gap: 0.85rem;
		flex-wrap: wrap;
	}

	/* Visual column */
	.visual-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.visual-card {
		display: flex;
		align-items: center;
		gap: 1.1rem;
		background: rgba(255, 255, 255, 0.75);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.9);
		border-radius: var(--radius-md);
		padding: 1.1rem 1.4rem;
		box-shadow: var(--shadow-sm);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.visual-card:hover {
		transform: translateX(4px);
		box-shadow: var(--shadow-md);
	}

	.visual-card.featured {
		background: white;
		border-color: var(--color-primary);
		box-shadow: 0 4px 20px rgba(var(--color-primary-rgb), 0.15);
	}

	.visual-icon {
		font-size: 2rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.visual-info {
		flex: 1;
	}

	.visual-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.3;
	}

	.visual-sub {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		margin-top: 0.2rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.free-materials {
			padding: 4rem 0;
		}
	}
</style>
