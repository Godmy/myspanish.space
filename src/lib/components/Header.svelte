<script lang="ts">
	import { track } from '$lib/analytics';

	let menuOpen = $state(false);

	const navLinks = [
		{ href: '#for-whom', label: 'Для кого' },
		{ href: '#author', label: 'Автор' },
		{ href: '#program', label: 'Программа' },
		{ href: '#benefits', label: 'Преимущества' },
		{ href: '#price', label: 'Стоимость' },
		{ href: '#testimonials', label: 'Отзывы' },
		{ href: '#faq', label: 'FAQ' },
		{ href: '/kids', label: 'Детям' },
		{ href: '/groups', label: 'Группы' }
	];

	function handleCtaClick() {
		track('cta_click', { button_id: 'header-cta', section_id: 'header' });
		menuOpen = false;
	}
</script>

<header class="site-header">
	<div class="container header-inner">
		<a href="/landing" class="logo">
			<span class="logo-icon" aria-hidden="true">🌞</span>
			<span class="logo-text">Испанский с мамой</span>
		</a>

		<nav class="desktop-nav" aria-label="Навигация">
			{#each navLinks as link}
				<a href={link.href} class="nav-link">{link.label}</a>
			{/each}
		</nav>

		<a
			href="#contact"
			class="btn btn-primary header-cta"
			data-track-id="header-cta"
			onclick={handleCtaClick}
		>
			Пробный урок
		</a>

		<button
			class="burger"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Меню"
			aria-expanded={menuOpen}
		>
			<span class:open={menuOpen}></span>
			<span class:open={menuOpen}></span>
			<span class:open={menuOpen}></span>
		</button>
	</div>

	{#if menuOpen}
		<div class="mobile-menu" role="dialog" aria-label="Мобильное меню">
			{#each navLinks as link}
				<a href={link.href} class="nav-link" onclick={() => (menuOpen = false)}>{link.label}</a>
			{/each}
			<a
				href="#contact"
				class="btn btn-primary mobile-cta"
				data-track-id="header-cta-mobile"
				onclick={handleCtaClick}
			>
				Пробный урок
			</a>
		</div>
	{/if}
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(252, 250, 255, 0.96);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--color-border);
	}

	.header-inner {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		height: 64px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		flex-shrink: 0;
	}

	.logo-icon {
		font-size: 1.4rem;
		line-height: 1;
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.02em;
	}

	.desktop-nav {
		display: flex;
		gap: 0.15rem;
		flex: 1;
		justify-content: center;
	}

	.nav-link {
		padding: 0.45rem 0.7rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: color 0.18s ease, background 0.18s ease;
		white-space: nowrap;
		letter-spacing: 0.005em;
	}

	.nav-link:hover {
		color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.header-cta {
		flex-shrink: 0;
		font-size: 0.85rem;
		padding: 0.55rem 1.1rem;
		min-height: 40px;
	}

	.burger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		margin-left: auto;
		border-radius: var(--radius-sm);
		transition: background 0.15s;
		min-width: 44px;
		min-height: 44px;
		align-items: center;
		justify-content: center;
	}

	.burger:hover {
		background: var(--color-surface);
	}

	.burger span {
		display: block;
		width: 22px;
		height: 2px;
		background: var(--color-text);
		border-radius: 2px;
		transition: transform 0.2s ease, opacity 0.2s ease;
		transform-origin: center;
	}

	.mobile-menu {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1rem var(--container-px) 1.25rem;
		border-top: 1px solid var(--color-border);
		background: var(--color-bg);
	}

	.mobile-menu .nav-link {
		font-size: 1rem;
		padding: 0.65rem 0.75rem;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.mobile-cta {
		margin-top: 0.5rem;
		text-align: center;
	}

	@media (max-width: 900px) {
		.desktop-nav,
		.header-cta {
			display: none;
		}

		.burger {
			display: flex;
		}
	}
</style>
