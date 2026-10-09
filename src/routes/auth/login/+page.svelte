<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Вход | myspanish.space</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="auth-page">
	<section class="auth-panel" aria-labelledby="auth-title">
		<div>
			<p class="auth-kicker">myspanish.space</p>
			<h1 id="auth-title">Вход через Telegram</h1>
			<p class="auth-copy">Авторизация нужна для закрытых разделов сайта.</p>
		</div>

		{#if data.user}
			<div class="auth-status">
				Вы уже вошли как {data.user.name}.
				<a class="btn btn-primary" href="/admin">Перейти в админку</a>
			</div>
		{:else if data.isConfigured && data.botUsername}
			<div class="telegram-widget">
				<script
					async
					src="https://telegram.org/js/telegram-widget.js?22"
					data-telegram-login={data.botUsername}
					data-size="large"
					data-userpic="false"
					data-auth-url="/auth/telegram/callback"
					data-request-access="write"
				></script>
			</div>
		{:else}
			<p class="auth-error">Вход ещё не настроен на сервере.</p>
		{/if}

		{#if data.error}
			<p class="auth-error">Не удалось войти: {data.error}</p>
		{/if}
	</section>
</main>

<style>
	.auth-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem;
		background: var(--color-bg);
	}

	.auth-panel {
		width: min(100%, 420px);
		display: grid;
		gap: 1.5rem;
		padding: 2rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-md);
	}

	.auth-kicker {
		margin: 0 0 0.5rem;
		color: var(--color-primary);
		font-weight: 800;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 2rem;
		line-height: 1.1;
	}

	.auth-copy,
	.auth-error,
	.auth-status {
		margin: 0;
		color: var(--color-text-muted);
	}

	.auth-error {
		color: #b42318;
	}

	.auth-status {
		display: grid;
		gap: 1rem;
	}

	.telegram-widget {
		min-height: 44px;
	}
</style>
