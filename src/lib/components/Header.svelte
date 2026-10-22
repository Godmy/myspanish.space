<script lang="ts">
	import { page } from '$app/state';
	import { track } from '$lib/analytics';
	import Icon from '$stylist/svg/component/atom/icon/index.svelte';
	import SchoolAppMenu from '$stylist/spanish/component/organism/school-app-menu/index.svelte';
	import { SCHOOL_LOCALE_NAME } from '$stylist/spanish/const/record/school-locale-name';
	import { SCHOOL_MENU_TEXT } from '$stylist/spanish/const/record/school-menu-text';
	import { createSchoolMenu } from '$stylist/spanish/function/create/school-menu';
	import type { SchoolLocale } from '$stylist/spanish/type/alias/school-locale';

	interface Props {
		/** Anchor ids of the page sections in page order; the menu lists them. */
		sections?: string[];
	}

	let { sections = [] }: Props = $props();

	// Phone and tablet: a Google apps top bar (burger, logo, account) opening the
	// SchoolAppMenu sheet. Desktop: the page sections, language, account and the CTA.
	let menuOpen = $state(false);

	const locale = $derived<SchoolLocale>(page.data.locale ?? 'ru');
	const viewer = $derived(page.data.viewer ?? null);
	const text = $derived(SCHOOL_MENU_TEXT[locale]);
	const returnTo = $derived(page.url.pathname + page.url.search);
	const menu = $derived(
		createSchoolMenu({
			locale,
			role: viewer?.role,
			sections,
			telegramLink: page.data.settings?.telegram_link ?? 'https://t.me/mamaespanola'
		})
	);
	const locales = Object.keys(SCHOOL_LOCALE_NAME) as SchoolLocale[];
	// The desktop bar keeps the key sections; the full list lives in the menu.
	const DESKTOP_SECTIONS = ['for-whom', 'program', 'price', 'faq'];
	const sectionLinks = $derived(
		menu.links.page.filter((link) => DESKTOP_SECTIONS.includes(link.href.slice(1)))
	);
	const courseLinks = $derived(
		menu.links.learn.filter((link) => link.href !== page.url.pathname && link.id !== 'travel')
	);

	function handleCtaClick(buttonId: string) {
		track('cta_click', { button_id: buttonId, section_id: 'header' });
	}
</script>

{#snippet logo()}
	<a href="/landing" class="logo">
		<span class="logo-icon" aria-hidden="true">🌞</span>
		<span class="logo-text">{text.brand}</span>
	</a>
{/snippet}

<header class="site-header">
	<div class="container header-inner">
		<button
			class="icon-button burger"
			onclick={() => (menuOpen = true)}
			aria-label={text.openMenu}
			aria-expanded={menuOpen}
			aria-haspopup="dialog"
		>
			<Icon name="menu" size={24} aria-hidden="true" />
		</button>

		{@render logo()}

		<nav class="desktop-nav" aria-label={text.menu}>
			{#each [...courseLinks, ...sectionLinks] as link (link.id)}
				<a href={link.href} class="nav-link">{link.label}</a>
			{/each}
		</nav>

		<form class="lang-switch" method="POST" action="/lang" aria-label={text.language}>
			<input type="hidden" name="to" value={returnTo} />
			{#each locales as code (code)}
				<button
					type="submit"
					name="lang"
					value={code}
					class="lang-option"
					lang={code}
					title={SCHOOL_LOCALE_NAME[code]}
					aria-current={code === locale ? 'true' : undefined}
				>
					{code.toUpperCase()}
				</button>
			{/each}
		</form>

		{#if viewer}
			<button
				class="icon-button account"
				onclick={() => (menuOpen = true)}
				aria-label={viewer.name}
				title={viewer.name}
			>
				<span class="avatar" aria-hidden="true">{viewer.name.slice(0, 1).toUpperCase()}</span>
			</button>
		{:else}
			<a href="/auth/login" class="sign-in">
				<Icon name="user" size={20} aria-hidden="true" />
				<span class="sign-in-label">{text.signIn}</span>
			</a>
		{/if}

		<a
			href="#contact"
			class="btn btn-primary header-cta"
			data-track-id="header-cta"
			onclick={() => handleCtaClick('header-cta')}
		>
			{text.trial}
		</a>
	</div>
</header>

<SchoolAppMenu
	bind:open={menuOpen}
	class="site-menu"
	{menu}
	{locale}
	{viewer}
	{returnTo}
	onTrial={() => handleCtaClick('header-cta-mobile')}
>
	{#snippet brand()}
		{@render logo()}
	{/snippet}
</SchoolAppMenu>

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
		gap: 1rem;
		height: 64px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
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
		white-space: nowrap;
	}

	.desktop-nav {
		display: flex;
		gap: 0.15rem;
		flex: 1;
		justify-content: center;
		min-width: 0;
		/* One row: links that do not fit wrap below and are clipped; the menu lists them all. */
		flex-wrap: wrap;
		height: 2.2rem;
		overflow: hidden;
	}

	.nav-link {
		padding: 0.45rem 0.6rem;
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

	.lang-switch {
		display: flex;
		flex-shrink: 0;
		padding: 2px;
		border: 1px solid var(--color-border);
		border-radius: 999px;
	}

	.lang-option {
		min-width: 2.25rem;
		min-height: 2rem;
		padding: 0 0.4rem;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--color-text-muted);
		font: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}

	.lang-option[aria-current] {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
	}

	.icon-button {
		display: grid;
		flex-shrink: 0;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--color-text);
		cursor: pointer;
		transition: background 0.15s;
	}

	.icon-button:hover {
		background: var(--color-surface);
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.sign-in {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.4rem;
		min-height: 40px;
		padding: 0 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		color: var(--color-primary-dark);
		font-size: 0.85rem;
		font-weight: 600;
		text-decoration: none;
	}

	.sign-in:hover {
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
		margin-left: -0.5rem;
	}

	/* Google apps top bar: burger, logo, account; everything else lives in the menu. */
	@media (max-width: 1200px) {
		.desktop-nav,
		.lang-switch,
		.header-cta {
			display: none;
		}

		.burger {
			display: grid;
		}

		.header-inner {
			gap: 0.5rem;
		}

		.account,
		.sign-in {
			margin-left: auto;
		}
	}

	@media (max-width: 420px) {
		.sign-in {
			width: 44px;
			padding: 0;
			justify-content: center;
			border: 0;
		}

		.sign-in-label {
			display: none;
		}
	}

	/* The sheet takes the site palette, including the dark theme. */
	:global(.site-menu) {
		--color-background-primary: var(--color-bg);
		--color-background-secondary: var(--color-surface);
		--color-text-primary: var(--color-text);
		--color-text-secondary: var(--color-text-muted);
		--color-border-primary: var(--color-border);
		--color-primary-500: var(--color-primary);
		--color-primary-100: var(--color-primary-light);
		--color-text-inverse: var(--color-on-primary);
		font-family: var(--font-sans);
	}
</style>
