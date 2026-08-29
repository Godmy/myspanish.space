<script lang="ts">
	import { track } from '$lib/analytics';

	interface Props {
		telegramLink: string;
		whatsappLink: string;
		contactEmail: string;
	}

	let { telegramLink, whatsappLink, contactEmail }: Props = $props();

	const navLinks = [
		{ href: '#for-whom', label: 'Для кого' },
		{ href: '#author', label: 'Автор' },
		{ href: '#program', label: 'Программа' },
		{ href: '#price', label: 'Стоимость' },
		{ href: '#faq', label: 'FAQ' },
		{ href: '/kids', label: 'Детям' }
	];
</script>

<footer class="footer">
	<div class="container footer-inner">
		<div class="footer-brand-col">
			<a href="/landing" class="footer-brand">
				<span class="logo-icon" aria-hidden="true">🌞</span>
				<span class="logo-text">Испанский с мамой</span>
			</a>
			<p class="footer-tagline">
				Учите испанский вместе с ребёнком — легко, весело и без репетитора
			</p>
		</div>

		<div class="footer-nav-col">
			<div class="col-heading">Навигация</div>
			<nav aria-label="Навигация в подвале">
				{#each navLinks as link}
					<a href={link.href} class="footer-link">{link.label}</a>
				{/each}
			</nav>
		</div>

		<div class="footer-contact-col">
			<div class="col-heading">Контакты</div>
			<div class="footer-contacts">
				<a
					href={telegramLink}
					target="_blank"
					rel="noopener"
					class="footer-link"
					data-track-id="footer-tg"
					onclick={() => track('telegram_click', { button_id: 'footer-tg', section_id: 'footer' })}
				>
					Telegram
				</a>
				<a
					href={whatsappLink}
					target="_blank"
					rel="noopener"
					class="footer-link"
					data-track-id="footer-wa"
					onclick={() =>
						track('whatsapp_click', { button_id: 'footer-wa', section_id: 'footer' })}
				>
					WhatsApp
				</a>
				<a href="mailto:{contactEmail}" class="footer-link">{contactEmail}</a>
			</div>
		</div>
	</div>

	<div class="footer-bottom">
		<div class="container">
			<span>© {new Date().getFullYear()} myspanish.space — все права защищены</span>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--color-dark);
		padding-top: 4rem;
	}

	.footer-inner {
		display: grid;
		grid-template-columns: 1.75fr 1fr 1fr;
		gap: 3rem;
		padding-bottom: 3rem;
		border-bottom: 1px solid rgba(252, 250, 255, 0.1);
	}

	/* Brand column */
	.footer-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		text-decoration: none;
		margin-bottom: 1rem;
	}

	.logo-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		color: #fcfaff;
		letter-spacing: -0.02em;
	}

	.footer-tagline {
		font-size: 0.875rem;
		color: rgba(252, 250, 255, 0.4);
		line-height: 1.65;
		max-width: 28ch;
		margin: 0;
	}

	/* Nav/Contact columns */
	.col-heading {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(252, 250, 255, 0.3);
		margin-bottom: 1.1rem;
	}

	.footer-nav-col nav,
	.footer-contacts {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.footer-link {
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(252, 250, 255, 0.6);
		text-decoration: none;
		transition: color 0.18s ease;
		padding: 0.1rem 0;
	}

	.footer-link:hover {
		color: rgba(252, 250, 255, 0.95);
	}

	/* Bottom bar */
	.footer-bottom {
		padding: 1.5rem 0;
	}

	.footer-bottom .container {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.78rem;
		color: rgba(252, 250, 255, 0.25);
		letter-spacing: 0.02em;
	}

	@media (max-width: 768px) {
		.footer-inner {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}

		.footer-brand-col {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 480px) {
		.footer-inner {
			grid-template-columns: 1fr;
		}

		.footer-brand-col {
			grid-column: auto;
		}
	}
</style>
