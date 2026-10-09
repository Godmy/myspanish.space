<script lang="ts">
	import { track } from '$lib/analytics';
	import { questUrl, QUEST_LABEL } from '$lib/links';

	interface Props {
		priceText: string;
		priceNote: string;
		telegramLink: string;
	}

	let { priceText, priceNote, telegramLink }: Props = $props();
</script>

<section class="section pricing-section" id="price" data-section="price">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Стоимость</div>
			<h2 class="section-title">Инвестиция в будущее ребёнка</h2>
		</div>

		<div class="pricing-wrap">
			<div class="pricing-card">
				<div class="price-header">
					<div class="price-label">Полный курс</div>
					<div class="price-value">{priceText}</div>
					<p class="price-note">{priceNote}</p>
				</div>

				<div class="price-divider"></div>

				<div class="price-includes">
					<div class="includes-label">Что входит в курс</div>
					<ul class="includes-list">
						<li><span class="check" aria-hidden="true">✓</span> 27 тематических блоков</li>
						<li><span class="check" aria-hidden="true">✓</span> Конспекты, карточки, глоссарии</li>
						<li><span class="check" aria-hidden="true">✓</span> Песни с переводом и озвучкой</li>
						<li><span class="check" aria-hidden="true">✓</span> Игры и творческие задания</li>
						<li><span class="check" aria-hidden="true">✓</span> Видео-презентации</li>
						<li><span class="check" aria-hidden="true">✓</span> PDF для печати</li>
						<li><span class="check" aria-hidden="true">✓</span> Планы занятий на 5 дней</li>
						<li><span class="check" aria-hidden="true">✓</span> Поддержка автора</li>
						<li><span class="check" aria-hidden="true">✓</span> Бессрочный доступ</li>
					</ul>
				</div>

				<div class="price-divider"></div>

				<div class="price-actions">
					<a
						href={telegramLink}
						class="btn btn-primary btn-lg"
						target="_blank"
						rel="noopener"
						data-track-id="price-cta-tg"
						onclick={() =>
							track('price_click', { button_id: 'price-cta-tg', section_id: 'price' })}
					>
						Узнать стоимость в Telegram
					</a>
					<a
						href={questUrl('price')}
						class="btn btn-outline btn-lg"
						target="_blank"
						rel="noopener"
						data-track-id="price-cta-quest"
						onclick={() =>
							track('quest_click', { button_id: 'quest-price', section_id: 'price' })}
					>
						{QUEST_LABEL}
					</a>
					<a
						href="#contact"
						class="btn-text"
						data-track-id="price-cta-form"
						onclick={() =>
							track('price_click', { button_id: 'price-cta-form', section_id: 'price' })}
					>
						Оставить заявку на сайте
					</a>
				</div>
			</div>

			<div class="pricing-side">
				<div class="side-item">
					<span class="side-emoji" aria-hidden="true">🎁</span>
					<div>
						<div class="side-title">Пробный урок бесплатно</div>
						<div class="side-desc">Попробуйте прежде чем покупать</div>
					</div>
				</div>
				<div class="side-item">
					<span class="side-emoji" aria-hidden="true">💬</span>
					<div>
						<div class="side-title">Отвечаем на вопросы</div>
						<div class="side-desc">Помогаем выбрать подходящий формат</div>
					</div>
				</div>
				<div class="side-item">
					<span class="side-emoji" aria-hidden="true">♾️</span>
					<div>
						<div class="side-title">Бессрочный доступ</div>
						<div class="side-desc">Один раз купили — пользуетесь всегда</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.pricing-section {
		background: var(--color-bg);
	}

	.pricing-wrap {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2.5rem;
		align-items: start;
		max-width: 900px;
		margin: 0 auto;
	}

	/* Main card */
	.pricing-card {
		background: white;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-lg);
	}

	.price-header {
		background: var(--color-dark);
		padding: 2.5rem 2.5rem 2rem;
	}

	.price-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(252, 250, 255, 0.5);
		margin-bottom: 0.6rem;
	}

	.price-value {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: 900;
		color: #fcfaff;
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin-bottom: 0.75rem;
	}

	.price-note {
		font-size: 0.9rem;
		color: rgba(252, 250, 255, 0.55);
		line-height: 1.55;
		margin: 0;
	}

	.price-divider {
		height: 1px;
		background: var(--color-border);
	}

	.price-includes {
		padding: 1.75rem 2.5rem;
	}

	.includes-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		margin-bottom: 1.1rem;
	}

	.includes-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem;
	}

	.includes-list li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.9rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.check {
		width: 18px;
		height: 18px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		font-weight: 800;
		flex-shrink: 0;
	}

	.price-actions {
		padding: 1.75rem 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.price-actions .btn {
		text-align: center;
	}

	.btn-text {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
		padding: 0.4rem;
		text-align: center;
		font-family: var(--font-sans);
		transition: color 0.15s;
		display: block;
	}

	.btn-text:hover {
		color: var(--color-primary);
	}

	/* Side block */
	.pricing-side {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 240px;
	}

	.side-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.side-emoji {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.side-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 0.2rem;
	}

	.side-desc {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	@media (max-width: 768px) {
		.pricing-wrap {
			grid-template-columns: 1fr;
		}

		.pricing-side {
			min-width: unset;
			flex-direction: row;
			flex-wrap: wrap;
		}

		.side-item {
			flex: 1;
			min-width: 200px;
		}

		.price-header,
		.price-includes,
		.price-actions {
			padding-inline: 1.5rem;
		}

		.includes-list {
			grid-template-columns: 1fr;
		}
	}
</style>
