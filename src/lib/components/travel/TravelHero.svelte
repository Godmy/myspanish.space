<script lang="ts">
	import { track } from '$lib/analytics';

	let visualEl: HTMLDivElement | undefined = $state();
	let px = $state(0);
	let py = $state(0);

	function handlePointerMove(e: PointerEvent) {
		if (!visualEl) return;
		const rect = visualEl.getBoundingClientRect();
		px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
		py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
	}

	function handlePointerLeave() {
		px = 0;
		py = 0;
	}
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
				Испанский для путешествий
			</div>
			<h1 class="hero-title">
				Испанский<br />
				<em class="hero-accent">для путешествий</em>
			</h1>
			<p class="hero-subtitle">
				Уверенно говорите в поездке — от стойки регистрации до столика в тапас-баре
			</p>
			<p class="hero-desc">
				Живой разговорный испанский без нудной грамматики: бронирование, заказ еды, дорога,
				общение с местными. Разбираем реальные ситуации, с которыми вы столкнётесь в поездке.
			</p>
			<div class="hero-actions">
				<a
					href="#contact"
					class="btn btn-hero-primary btn-lg"
					data-track-id="hero-cta"
					onclick={() => track('cta_click', { button_id: 'hero-cta', section_id: 'hero' })}
				>
					Получить пробный урок
				</a>
				<a
					href="#program"
					class="btn btn-hero-outline btn-lg"
					data-track-id="hero-program"
					onclick={() => track('cta_click', { button_id: 'hero-program', section_id: 'hero' })}
				>
					Посмотреть программу
				</a>
			</div>
			<div class="hero-stats">
				<div class="stat">
					<strong>20+</strong>
					<span>стран&nbsp;говорят&nbsp;по-испански</span>
				</div>
				<div class="stat-sep"></div>
				<div class="stat">
					<strong>B1</strong>
					<span>разговорный&nbsp;уровень&nbsp;за&nbsp;курс</span>
				</div>
				<div class="stat-sep"></div>
				<div class="stat">
					<strong>0</strong>
					<span>стеснения&nbsp;в&nbsp;поездках</span>
				</div>
			</div>
		</div>

		<div
			class="hero-visual"
			bind:this={visualEl}
			onpointermove={handlePointerMove}
			onpointerleave={handlePointerLeave}
			style={`--px: ${px}; --py: ${py};`}
			aria-hidden="true"
		>
			<!-- decorative background rings, аналог Ellipse/Subtract-фигур с референса -->
			<svg class="ring ring-1" width="120" height="120" viewBox="0 0 120 120" fill="none">
				<circle cx="60" cy="60" r="58" stroke="#efeafb" stroke-opacity="0.15" stroke-width="2" />
			</svg>
			<svg class="ring ring-2" width="70" height="70" viewBox="0 0 70 70" fill="none">
				<circle cx="35" cy="35" r="33" stroke="#8fcbb0" stroke-opacity="0.25" stroke-width="2" />
			</svg>
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>

			<!-- самолётик, летящий по пунктирной траектории -->
			<svg class="plane-track" width="260" height="220" viewBox="0 0 260 220" fill="none">
				<path
					id="plane-path"
					d="M20 190 C 70 90, 150 170, 240 30"
					stroke="#fcfaff"
					stroke-opacity="0.18"
					stroke-width="2"
					stroke-dasharray="6 8"
					fill="none"
				/>
			</svg>
			<div class="plane-icon">✈️</div>

			<!-- Главное фото: путешественница/путешественник с чемоданом на фоне узнаваемой испаноязычной локации -->
			<div class="blob-photo">
				<span class="blob-icon">🧳</span>
			</div>

			<!-- Фото-бабблы: живые кадры из поездки (карта, тапас, разговор, достопримечательность) -->
			<div class="bubble bubble-1">
				<div class="bubble-parallax" style={`transform: translate(calc(var(--px) * -10px), calc(var(--py) * -10px));`}>
					<div class="bubble-card">
						<span class="bubble-icon">🗺️</span>
						<span class="bubble-text">Ориентируюсь в городе</span>
					</div>
				</div>
			</div>
			<div class="bubble bubble-2">
				<div class="bubble-parallax" style={`transform: translate(calc(var(--px) * 12px), calc(var(--py) * 12px));`}>
					<div class="bubble-card">
						<span class="bubble-icon">🥘</span>
						<span class="bubble-text">Заказываю без Google Translate</span>
					</div>
				</div>
			</div>
			<div class="bubble bubble-3">
				<div class="bubble-parallax" style={`transform: translate(calc(var(--px) * -8px), calc(var(--py) * 8px));`}>
					<div class="bubble-card">
						<span class="bubble-icon">💬</span>
						<span class="bubble-text">Болтаю с местными</span>
					</div>
				</div>
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
		grid-template-columns: 1.1fr 0.9fr;
		gap: 3.5rem;
		align-items: center;
		position: relative;
		z-index: 1;
	}

	/* Badge */
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

	/* Title */
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

	/* Actions */
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

	/* Stats */
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

	/* ─── Visual composition ─────────────────────────────────── */
	.hero-visual {
		position: relative;
		height: 460px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.blob-photo {
		position: relative;
		width: 300px;
		height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(150deg, rgba(156, 143, 201, 0.35), rgba(143, 203, 176, 0.25));
		border: 1px solid rgba(252, 250, 255, 0.15);
		box-shadow: var(--shadow-xl);
		animation: blob-morph 9s ease-in-out infinite alternate;
	}

	.blob-icon {
		font-size: 4.5rem;
		filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.35));
	}

	@keyframes blob-morph {
		0% {
			border-radius: 63% 37% 54% 46% / 43% 65% 35% 57%;
		}
		50% {
			border-radius: 45% 55% 68% 32% / 60% 40% 60% 40%;
		}
		100% {
			border-radius: 58% 42% 35% 65% / 38% 55% 45% 62%;
		}
	}

	.ring {
		position: absolute;
		opacity: 0.8;
		animation: spin-slow 40s linear infinite;
	}
	.ring-1 {
		top: 4%;
		left: 2%;
	}
	.ring-2 {
		bottom: 8%;
		right: 6%;
		animation-direction: reverse;
		animation-duration: 30s;
	}

	@keyframes spin-slow {
		to {
			transform: rotate(360deg);
		}
	}

	.dot {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-gold);
		animation: float 4s ease-in-out infinite;
	}
	.dot-1 {
		top: 12%;
		right: 18%;
		animation-delay: 0.2s;
	}
	.dot-2 {
		bottom: 20%;
		left: 8%;
		width: 6px;
		height: 6px;
		background: var(--color-primary-light);
		animation-delay: 1s;
		animation-duration: 5s;
	}
	.dot-3 {
		top: 45%;
		right: 4%;
		width: 5px;
		height: 5px;
		animation-delay: 1.8s;
		animation-duration: 3.5s;
	}

	.plane-track {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.plane-icon {
		position: absolute;
		inset: 0;
		font-size: 1.4rem;
		offset-path: path('M20 190 C 70 90, 150 170, 240 30');
		offset-rotate: auto;
		animation: fly 10s linear infinite;
		filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
	}

	@keyframes fly {
		0% {
			offset-distance: 0%;
			opacity: 0;
		}
		8% {
			opacity: 1;
		}
		92% {
			opacity: 1;
		}
		100% {
			offset-distance: 100%;
			opacity: 0;
		}
	}

	.bubble {
		position: absolute;
		animation: float 5s ease-in-out infinite;
	}
	.bubble-1 {
		top: 2%;
		left: -4%;
		animation-delay: 0s;
	}
	.bubble-2 {
		bottom: 10%;
		right: -6%;
		animation-delay: 0.6s;
		animation-duration: 6s;
	}
	.bubble-3 {
		bottom: -4%;
		left: 12%;
		animation-delay: 1.2s;
		animation-duration: 4.5s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-14px);
		}
	}

	.bubble-parallax {
		transition: transform 0.15s ease-out;
	}

	.bubble-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		width: 132px;
		background: rgba(252, 250, 255, 0.08);
		backdrop-filter: blur(6px);
		border: 1px solid rgba(252, 250, 255, 0.15);
		border-radius: 18px;
		padding: 1rem 0.85rem;
		text-align: center;
		box-shadow: var(--shadow-lg);
	}

	.bubble-icon {
		font-size: 1.6rem;
		line-height: 1;
	}

	.bubble-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(252, 250, 255, 0.85);
		line-height: 1.3;
	}

	@media (prefers-reduced-motion: reduce) {
		.blob-photo,
		.ring,
		.dot,
		.plane-icon,
		.bubble {
			animation: none !important;
		}
	}

	@media (max-width: 900px) {
		.hero-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.hero {
			padding: 3.5rem 0 4.5rem;
		}
		.stat-sep {
			display: none;
		}
		.hero-stats {
			gap: 1.25rem;
		}
		.hero-visual {
			height: 380px;
		}
		.blob-photo {
			width: 220px;
			height: 220px;
		}
		.bubble-card {
			width: 110px;
			padding: 0.75rem 0.6rem;
		}
	}

	@media (max-width: 480px) {
		.hero-visual {
			height: 320px;
			transform: scale(0.85);
		}
	}
</style>
