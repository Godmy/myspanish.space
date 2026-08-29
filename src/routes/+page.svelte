<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { track } from '$lib/analytics';
	import ThemeModeToggle from '$stylist/theme/component/atom/theme-mode-toggle/index.svelte';

	let { data }: { data: PageData } = $props();

	let settings = $derived(data.settings);

	const telegramLink = $derived(settings.telegram_link ?? 'https://t.me/hispamama');
	const whatsappLink = $derived(settings.whatsapp_link ?? 'https://wa.me/79991234567');
	const contactEmail = $derived(settings.contact_email ?? 'info@myspanish.space');

	onMount(() => {
		track('page_view', { path: '/' });
	});
</script>

<svelte:head>
	<title>Испанский с мамой — сайт скоро откроется</title>
	<meta name="description" content="Сайт «Испанский с мамой» обновляется. Скоро откроется." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="uc">
	<div class="uc-theme-toggle">
		<ThemeModeToggle />
	</div>

	<div class="uc-inner">
		<span class="uc-mark" aria-hidden="true">🌞</span>
		<h1 class="uc-title">Сайт скоро откроется</h1>
		<p class="uc-text">
			Мы обновляем «Испанский с мамой» — курс испанского языка для мам и детей.
			Обновлённый сайт с уроками, играми и материалами появится совсем скоро.
			А пока напишите нам — расскажем о занятиях и ответим на вопросы.
		</p>

		<div class="uc-actions">
			<a
				href={telegramLink}
				target="_blank"
				rel="noopener"
				class="btn btn-primary"
				data-track-id="uc-tg"
				onclick={() => track('telegram_click', { button_id: 'uc-tg', section_id: 'under-construction' })}
			>
				Написать в Telegram
			</a>
			<a
				href={whatsappLink}
				target="_blank"
				rel="noopener"
				class="btn btn-outline"
				data-track-id="uc-wa"
				onclick={() => track('whatsapp_click', { button_id: 'uc-wa', section_id: 'under-construction' })}
			>
				Написать в WhatsApp
			</a>
		</div>

		<p class="uc-mail">
			Почта: <a href="mailto:{contactEmail}">{contactEmail}</a>
		</p>
	</div>
</main>

<style>
	.uc {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem var(--container-px);
		background: var(--color-bg);
	}

	.uc-theme-toggle {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
	}

	.uc-inner {
		width: 100%;
		max-width: 34rem;
		text-align: center;
	}

	.uc-mark {
		font-size: 2.75rem;
		line-height: 1;
		display: block;
		margin-bottom: 1.25rem;
	}

	.uc-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 2.9rem);
		font-weight: 800;
		color: var(--color-text);
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0 0 1rem;
	}

	.uc-text {
		font-size: 1.05rem;
		color: var(--color-text-muted);
		line-height: 1.7;
		margin: 0 0 2rem;
	}

	.uc-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.uc-mail {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.uc-mail a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.uc-mail a:hover {
		text-decoration: underline;
	}
</style>
