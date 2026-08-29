<script lang="ts">
	import type { Testimonial } from '$lib/server/db';

	interface Props {
		testimonials: Testimonial[];
	}

	let { testimonials }: Props = $props();
</script>

<section class="section testimonials" id="testimonials" data-section="testimonials">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Отзывы</div>
			<h2 class="section-title">Мамы о курсе</h2>
			<p class="section-desc">Реальные истории от тех, кто уже занимается</p>
		</div>

		{#if testimonials.length > 0}
			<div class="testimonials-grid">
				{#each testimonials as t}
					<div class="testimonial-card">
						<div class="card-top">
							<div class="stars" aria-label="{t.rating} из 5 звёзд">
								{#each { length: 5 } as _, i}
									<span class:filled={i < t.rating} aria-hidden="true">★</span>
								{/each}
							</div>
						</div>
						<blockquote class="testimonial-text">«{t.content}»</blockquote>
						<div class="testimonial-author">
							<div class="author-avatar">
								{#if t.avatar_url}
									<img src={t.avatar_url} alt={t.author_name} />
								{:else}
									<div class="avatar-placeholder">{t.author_name[0]}</div>
								{/if}
							</div>
							<div>
								<div class="author-name">{t.author_name}</div>
								<div class="author-meta">
									{#if t.author_city}{t.author_city}{/if}
									{#if t.child_age && t.author_city} · {/if}
									{#if t.child_age}ребёнок {t.child_age}{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="no-testimonials">Отзывы скоро появятся</p>
		{/if}
	</div>
</section>

<style>
	.testimonials {
		background: var(--color-surface);
	}

	.testimonials-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
	}

	.testimonial-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease;
	}

	.testimonial-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stars {
		display: flex;
		gap: 0.1rem;
	}

	.stars span {
		font-size: 1.05rem;
		color: var(--color-border);
		transition: color 0.1s;
	}

	.stars span.filled {
		color: var(--color-gold);
	}

	.testimonial-text {
		font-size: 0.935rem;
		color: var(--color-text);
		line-height: 1.7;
		margin: 0;
		flex: 1;
		font-style: italic;
		font-family: var(--font-display);
	}

	.testimonial-author {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.author-avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		border: 2px solid var(--color-surface);
	}

	.author-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--color-primary-light), var(--color-surface));
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--color-primary);
	}

	.author-name {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.2;
	}

	.author-meta {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.15rem;
	}

	.no-testimonials {
		text-align: center;
		color: var(--color-text-muted);
		padding: 2rem;
	}

	@media (max-width: 900px) {
		.testimonials-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.testimonials-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
