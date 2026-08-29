<script lang="ts">
	interface Props {
		authorPhotoUrl?: string;
	}
	let { authorPhotoUrl }: Props = $props();
</script>

<section class="section" id="author" data-section="author">
	<div class="container">
		<div class="author-inner">
			<div class="author-photo-col">
				<div class="photo-frame">
					{#if authorPhotoUrl}
						<img src={authorPhotoUrl} alt="Марина Синельникова" class="author-img" />
					{:else}
						<div class="photo-placeholder" aria-label="Фото автора">
							<span aria-hidden="true">👩‍🏫</span>
						</div>
					{/if}
					<div class="photo-badge">Автор курса</div>
				</div>
			</div>

			<div class="author-content">
				<div class="section-tag">Автор проекта</div>
				<h2 class="section-title">Марина<br />Синельникова</h2>

				<div class="facts">
					<div class="fact">
						<div class="fact-icon" aria-hidden="true">🇪🇸</div>
						<div class="fact-text">Жила и училась в Испании — Университет Балеарских островов</div>
					</div>
					<div class="fact">
						<div class="fact-icon" aria-hidden="true">👩‍🏫</div>
						<div class="fact-text">Преподаёт испанский взрослым и детям уже много лет</div>
					</div>
					<div class="fact">
						<div class="fact-icon" aria-hidden="true">👶</div>
						<div class="fact-text">
							Создала проект «Испанский с мамой» — для тех, кто хочет учить язык вместе с ребёнком
						</div>
					</div>
					<div class="fact">
						<div class="fact-icon" aria-hidden="true">💡</div>
						<div class="fact-text">
							Помогает мамам вводить испанский в жизнь ребёнка через игру, песни и бытовые ситуации
						</div>
					</div>
				</div>

				<blockquote class="author-quote">
					<span class="quote-mark" aria-hidden="true">&ldquo;</span>
					<p>
						Язык лучше всего усваивается в детстве — через игру, повторение и радость. Моя задача
						— дать маме все инструменты, чтобы создать это пространство дома.
					</p>
				</blockquote>
			</div>
		</div>
	</div>
</section>

<style>
	.section {
		background: var(--color-bg);
	}

	.author-inner {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 4rem;
		align-items: start;
	}

	.photo-frame {
		position: relative;
		width: 300px;
		flex-shrink: 0;
	}

	.author-img {
		width: 100%;
		aspect-ratio: 3/4;
		object-fit: cover;
		border-radius: 24px;
		display: block;
	}

	.photo-placeholder {
		width: 300px;
		aspect-ratio: 3/4;
		background: linear-gradient(145deg, var(--color-surface) 0%, var(--color-primary-light) 100%);
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 6.5rem;
		border: 1px solid var(--color-border);
	}

	.photo-badge {
		position: absolute;
		bottom: -0.875rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-dark);
		color: white;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.45rem 1.1rem;
		border-radius: 100px;
		white-space: nowrap;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.section-title {
		text-align: left;
		margin-bottom: 1.5rem;
	}

	.facts {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		margin: 0 0 2rem;
	}

	.fact {
		display: flex;
		gap: 0.85rem;
		align-items: flex-start;
	}

	.fact-icon {
		font-size: 1.25rem;
		line-height: 1;
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		background: var(--color-surface);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.fact-text {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.55;
		padding-top: 0.5rem;
	}

	.author-quote {
		background: var(--color-dark);
		border-radius: var(--radius-lg);
		padding: 1.75rem 2rem;
		margin: 0;
		position: relative;
	}

	.quote-mark {
		font-family: var(--font-display);
		font-size: 4rem;
		color: var(--color-primary);
		line-height: 0.5;
		display: block;
		margin-bottom: 0.75rem;
		opacity: 0.8;
	}

	.author-quote p {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1rem;
		color: rgba(252, 250, 255, 0.85);
		line-height: 1.65;
		margin: 0;
	}

	@media (max-width: 860px) {
		.author-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.photo-frame {
			width: 220px;
			margin: 0 auto;
		}

		.photo-placeholder {
			width: 220px;
		}

		.section-title {
			text-align: center;
		}

		.section-tag {
			display: flex;
			justify-content: center;
		}
	}
</style>
