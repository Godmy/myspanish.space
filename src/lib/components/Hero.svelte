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
				Авторский курс испанского
			</div>
			<h1 class="hero-title">
				Испанский<br />
				<em class="hero-accent">с мамой</em>
			</h1>
			<p class="hero-subtitle">Учи язык вместе с ребёнком: легко, весело и без репетитора</p>
			<p class="hero-desc">
				Мама может начать даже с нулевого уровня. Вы получаете готовую систему занятий: уроки,
				песни, игры и карточки. Всё уже сделано за вас.
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
					<strong>27</strong>
					<span>тем&nbsp;в&nbsp;курсе</span>
				</div>
				<div class="stat-sep"></div>
				<div class="stat">
					<strong>2,5+</strong>
					<span>лет&nbsp;для&nbsp;старта</span>
				</div>
				<div class="stat-sep"></div>
				<div class="stat">
					<strong>0</strong>
					<span>знаний&nbsp;не&nbsp;нужно</span>
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
			<svg class="ring ring-1" width="126" height="126" viewBox="0 0 126 126" fill="none">
				<circle cx="63" cy="63" r="60" stroke="#efeafb" stroke-opacity="0.16" stroke-width="2" />
				<path d="M63 3a60 60 0 0 1 60 60" stroke="#8fcbb0" stroke-opacity="0.35" stroke-width="4" />
			</svg>
			<svg class="ring ring-2" width="76" height="76" viewBox="0 0 76 76" fill="none">
				<circle cx="38" cy="38" r="35" stroke="#8fcbb0" stroke-opacity="0.24" stroke-width="2" />
				<path d="M12 64 64 12" stroke="#efeafb" stroke-opacity="0.2" stroke-width="2" />
			</svg>
			<span class="dot dot-1"></span>
			<span class="dot dot-2"></span>
			<span class="dot dot-3"></span>

			<svg class="star-track" width="270" height="220" viewBox="0 0 270 220" fill="none">
				<path
					d="M24 186 C 74 74, 150 166, 246 34"
					stroke="#fcfaff"
					stroke-opacity="0.18"
					stroke-width="2"
					stroke-dasharray="6 8"
				/>
			</svg>
			<div class="star-token">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path
						d="m12 2.5 2.5 6.2 6.7.5-5.1 4.3 1.6 6.5-5.7-3.5L6.3 20l1.6-6.5-5.1-4.3 6.7-.5L12 2.5Z"
						fill="#f4d35e"
					/>
				</svg>
			</div>

			<div class="story-blob">
				<svg class="kids-scene" viewBox="0 0 380 380" role="img" aria-label="Детские занятия испанским">
					<defs>
						<linearGradient id="sceneBg" x1="48" y1="36" x2="330" y2="336" gradientUnits="userSpaceOnUse">
							<stop stop-color="#fff6c9" />
							<stop offset="0.48" stop-color="#dff7ff" />
							<stop offset="1" stop-color="#efe2ff" />
						</linearGradient>
						<linearGradient id="rainbowRed" x1="84" y1="110" x2="296" y2="110" gradientUnits="userSpaceOnUse">
							<stop stop-color="#ff5c7a" />
							<stop offset="1" stop-color="#ff9a3d" />
						</linearGradient>
						<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
							<feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#3d3450" flood-opacity="0.16" />
						</filter>
					</defs>

					<rect x="32" y="34" width="316" height="308" rx="44" fill="url(#sceneBg)" />
					<path d="M54 302c57-30 218-31 273 1" stroke="#6c5a89" stroke-opacity="0.15" stroke-width="22" stroke-linecap="round" />

					<g class="sun">
						<circle cx="79" cy="83" r="24" fill="#ffd23f" />
						<path
							d="M79 43v18M79 105v18M39 83h18M101 83h18M50 54l13 13M95 99l13 13M108 54 95 67M63 99l-13 13"
							stroke="#ffd23f"
							stroke-width="7"
							stroke-linecap="round"
						/>
						<circle cx="70" cy="80" r="3" fill="#6c4b00" />
						<circle cx="88" cy="80" r="3" fill="#6c4b00" />
						<path d="M70 91c6 6 13 6 19 0" stroke="#6c4b00" stroke-width="3" stroke-linecap="round" />
					</g>

					<g class="rainbow">
						<path d="M90 151a100 100 0 0 1 200 0" fill="none" stroke="url(#rainbowRed)" stroke-width="17" stroke-linecap="round" />
						<path d="M113 151a77 77 0 0 1 154 0" fill="none" stroke="#ffd23f" stroke-width="17" stroke-linecap="round" />
						<path d="M136 151a54 54 0 0 1 108 0" fill="none" stroke="#45c26f" stroke-width="17" stroke-linecap="round" />
						<path d="M159 151a31 31 0 0 1 62 0" fill="none" stroke="#4ba3ff" stroke-width="17" stroke-linecap="round" />
						<circle cx="90" cy="151" r="20" fill="#ffffff" />
						<circle cx="72" cy="157" r="17" fill="#ffffff" />
						<circle cx="111" cy="158" r="17" fill="#ffffff" />
						<circle cx="290" cy="151" r="20" fill="#ffffff" />
						<circle cx="271" cy="158" r="17" fill="#ffffff" />
						<circle cx="309" cy="158" r="17" fill="#ffffff" />
					</g>

					<g class="flashcard flashcard-hola" filter="url(#softShadow)">
						<rect x="239" y="65" width="78" height="54" rx="10" fill="#ffffff" />
						<path d="M251 103h52" stroke="#ff5c7a" stroke-width="5" stroke-linecap="round" />
						<text x="278" y="94" text-anchor="middle" fill="#49355f" font-size="20" font-weight="900">hola</text>
					</g>
					<g class="flashcard flashcard-sol" filter="url(#softShadow)">
						<rect x="56" y="134" width="74" height="52" rx="10" fill="#ffffff" />
						<circle cx="83" cy="160" r="12" fill="#ffd23f" />
						<text x="111" y="167" text-anchor="middle" fill="#49355f" font-size="18" font-weight="900">sol</text>
					</g>

					<g class="pencils">
						<path d="M293 206 326 268" stroke="#ff6b6b" stroke-width="14" stroke-linecap="round" />
						<path d="M309 197 335 262" stroke="#4ba3ff" stroke-width="14" stroke-linecap="round" />
						<path d="m289 197 8-19 11 17" fill="#f5c7a9" />
						<path d="m305 188 10-18 9 18" fill="#f5c7a9" />
						<path d="m297 178 3-7 4 6" fill="#4a3f63" />
						<path d="m315 170 4-6 3 7" fill="#4a3f63" />
					</g>

					<g class="child" filter="url(#softShadow)">
						<path d="M137 249c5-48 26-76 55-76s50 28 55 76H137Z" fill="#ff7c43" />
						<path d="M153 196c-20 14-34 31-42 55" stroke="#f6bd9a" stroke-width="15" stroke-linecap="round" />
						<path d="M232 196c22 14 37 31 45 55" stroke="#f6bd9a" stroke-width="15" stroke-linecap="round" />
						<circle cx="192" cy="142" r="43" fill="#5c3b75" />
						<circle cx="192" cy="152" r="31" fill="#f6bd9a" />
						<path d="M162 145c5-34 47-45 68-18-25 4-45-2-60-18-2 13-5 25-8 36Z" fill="#5c3b75" />
						<circle cx="181" cy="153" r="3.5" fill="#49355f" />
						<circle cx="204" cy="153" r="3.5" fill="#49355f" />
						<path d="M181 167c8 8 17 8 25 0" stroke="#49355f" stroke-width="3.5" stroke-linecap="round" />
						<circle cx="171" cy="160" r="5" fill="#f19c8b" opacity="0.75" />
						<circle cx="214" cy="160" r="5" fill="#f19c8b" opacity="0.75" />
						<path d="M176 198h34" stroke="#ffffff" stroke-width="7" stroke-linecap="round" />
						<text x="192" y="232" text-anchor="middle" fill="#ffffff" font-size="21" font-weight="900">ES</text>
					</g>

					<g class="book" filter="url(#softShadow)">
						<path d="M111 236c30-10 56-6 78 12v58c-22-18-48-22-78-12v-58Z" fill="#38bdf8" />
						<path d="M189 248c22-18 48-22 78-12v58c-30-10-56-6-78 12v-58Z" fill="#ffffff" />
						<path d="M189 248v58" stroke="#49355f" stroke-opacity="0.25" stroke-width="3" />
						<path d="M127 256h39M127 272h31M207 256h39M207 272h31" stroke="#49355f" stroke-opacity="0.28" stroke-width="5" stroke-linecap="round" />
						<text x="150" y="293" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="900">ABC</text>
					</g>

					<g class="blocks" filter="url(#softShadow)">
						<rect x="59" y="268" width="42" height="42" rx="9" fill="#ffd23f" />
						<rect x="93" y="239" width="40" height="40" rx="9" fill="#45c26f" />
						<rect x="277" y="268" width="42" height="42" rx="9" fill="#ff5c7a" />
						<rect x="247" y="238" width="39" height="39" rx="9" fill="#8b5cf6" />
						<text x="80" y="296" text-anchor="middle" fill="#49355f" font-size="23" font-weight="900">ñ</text>
						<text x="113" y="266" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="900">A</text>
						<text x="298" y="296" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="900">B</text>
						<text x="267" y="265" text-anchor="middle" fill="#ffffff" font-size="21" font-weight="900">C</text>
					</g>
				</svg>
			</div>

			<div class="bubble bubble-1">
				<div class="bubble-parallax" style={`transform: translate(calc(var(--px) * -10px), calc(var(--py) * -10px));`}>
					<div class="bubble-card">
						<span class="bubble-kicker">игры</span>
						<span class="bubble-text">говорим через движение</span>
					</div>
				</div>
			</div>
			<div class="bubble bubble-2">
				<div class="bubble-parallax" style={`transform: translate(calc(var(--px) * 12px), calc(var(--py) * 12px));`}>
					<div class="bubble-card">
						<span class="bubble-kicker">песни</span>
						<span class="bubble-text">запоминаем фразы</span>
					</div>
				</div>
			</div>
			<div class="bubble bubble-3">
				<div class="bubble-parallax" style={`transform: translate(calc(var(--px) * -8px), calc(var(--py) * 8px));`}>
					<div class="bubble-card">
						<span class="bubble-kicker">карточки</span>
						<span class="bubble-text">учим слова каждый день</span>
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
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1.12fr 0.88fr;
		gap: 3.5rem;
		align-items: center;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.38rem 0.9rem;
		margin-bottom: 1.5rem;
		border: 1px solid rgba(156, 143, 201, 0.3);
		border-radius: 100px;
		background: rgba(156, 143, 201, 0.18);
		color: #efeafb;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.hero-title {
		margin: 0 0 1.1rem;
		color: #fcfaff;
		font-family: var(--font-display);
		font-size: clamp(3rem, 7.5vw, 5.25rem);
		font-weight: 900;
		letter-spacing: 0;
		line-height: 1.05;
	}

	.hero-accent {
		color: var(--color-primary);
		font-style: italic;
		font-weight: 700;
	}

	.hero-subtitle {
		margin: 0 0 0.75rem;
		color: rgba(252, 250, 255, 0.65);
		font-size: clamp(1rem, 2.5vw, 1.2rem);
		font-weight: 600;
		line-height: 1.45;
	}

	.hero-desc {
		max-width: 46ch;
		margin: 0 0 2.25rem;
		color: rgba(252, 250, 255, 0.45);
		font-size: 0.975rem;
		line-height: 1.75;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-bottom: 2.75rem;
	}

	.btn-hero-primary {
		border: 2px solid var(--color-primary);
		background: var(--color-primary);
		box-shadow: 0 4px 20px rgba(156, 143, 201, 0.5);
		color: white;
		font-family: var(--font-sans);
	}

	.btn-hero-primary:hover {
		border-color: #7a6ba8;
		background: #7a6ba8;
		box-shadow: 0 6px 28px rgba(156, 143, 201, 0.6);
	}

	.btn-hero-outline {
		border: 2px solid rgba(252, 250, 255, 0.2);
		background: transparent;
		color: rgba(252, 250, 255, 0.8);
		font-family: var(--font-sans);
	}

	.btn-hero-outline:hover {
		border-color: rgba(252, 250, 255, 0.4);
		background: rgba(252, 250, 255, 0.08);
		color: rgba(252, 250, 255, 0.95);
	}

	.hero-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: center;
		padding-top: 1.75rem;
		border-top: 1px solid rgba(252, 250, 255, 0.1);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat strong {
		color: var(--color-primary);
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 800;
		letter-spacing: 0;
		line-height: 1;
	}

	.stat span {
		color: rgba(252, 250, 255, 0.4);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.stat-sep {
		width: 1px;
		height: 3rem;
		flex-shrink: 0;
		background: rgba(252, 250, 255, 0.1);
	}

	.hero-visual {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 460px;
		min-width: 0;
	}

	.story-blob {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: min(360px, 84vw);
		aspect-ratio: 1;
		border: 1px solid rgba(252, 250, 255, 0.16);
		background: linear-gradient(150deg, rgba(255, 210, 63, 0.26), rgba(75, 163, 255, 0.24), rgba(255, 92, 122, 0.2));
		box-shadow: var(--shadow-xl);
		animation: blob-morph 9s ease-in-out infinite alternate;
	}

	.kids-scene {
		width: 92%;
		height: 92%;
		filter: drop-shadow(0 16px 34px rgba(24, 16, 42, 0.18));
	}

	.sun {
		transform-origin: 79px 83px;
		animation: sun-pulse 3.8s ease-in-out infinite;
	}

	.rainbow {
		transform-origin: 190px 151px;
		animation: rainbow-sway 4.6s ease-in-out infinite;
	}

	.flashcard {
		transform-origin: center;
		animation: card-wiggle 4.2s ease-in-out infinite;
	}

	.flashcard-sol {
		animation-delay: 0.8s;
	}

	.pencils {
		transform-origin: 315px 230px;
		animation: pencil-wiggle 3.6s ease-in-out infinite;
	}

	.child {
		transform-origin: 192px 204px;
		animation: child-bounce 3.8s ease-in-out infinite;
	}

	.book {
		transform-origin: 189px 276px;
		animation: book-open 4.4s ease-in-out infinite;
	}

	.blocks {
		transform-origin: center;
		animation: blocks-pop 3s ease-in-out infinite;
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

	@keyframes sun-pulse {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
		}
		50% {
			transform: scale(1.08) rotate(8deg);
		}
	}

	@keyframes rainbow-sway {
		0%,
		100% {
			transform: rotate(-1.5deg) translateY(0);
		}
		50% {
			transform: rotate(1.5deg) translateY(-5px);
		}
	}

	@keyframes card-wiggle {
		0%,
		100% {
			transform: rotate(-4deg) translateY(0);
		}
		50% {
			transform: rotate(4deg) translateY(-9px);
		}
	}

	@keyframes pencil-wiggle {
		0%,
		100% {
			transform: rotate(-4deg);
		}
		50% {
			transform: rotate(5deg);
		}
	}

	@keyframes child-bounce {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-8px) rotate(1.5deg);
		}
	}

	@keyframes book-open {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.035) translateY(-3px);
		}
	}

	@keyframes blocks-pop {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-10px) rotate(-2deg);
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
		right: 6%;
		bottom: 8%;
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

	.star-track {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.star-token {
		position: absolute;
		inset: 0;
		width: 24px;
		height: 24px;
		offset-path: path('M24 186 C 74 74, 150 166, 246 34');
		offset-rotate: 0deg;
		animation: star-flight 10s linear infinite;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.36));
	}

	@keyframes star-flight {
		0% {
			offset-distance: 0%;
			opacity: 0;
		}
		8%,
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
		right: -6%;
		bottom: 10%;
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
		align-items: flex-start;
		width: 136px;
		padding: 0.9rem;
		border: 1px solid rgba(252, 250, 255, 0.15);
		border-radius: 8px;
		background: rgba(252, 250, 255, 0.08);
		backdrop-filter: blur(6px);
		box-shadow: var(--shadow-lg);
		text-align: left;
	}

	.bubble-kicker {
		margin-bottom: 0.2rem;
		color: var(--color-gold-light);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		line-height: 1.1;
		text-transform: uppercase;
	}

	.bubble-text {
		color: rgba(252, 250, 255, 0.86);
		font-size: 0.76rem;
		font-weight: 600;
		line-height: 1.3;
	}

	@media (prefers-reduced-motion: reduce) {
		.story-blob,
		.sun,
		.rainbow,
		.flashcard,
		.pencils,
		.child,
		.book,
		.blocks,
		.ring,
		.dot,
		.star-token,
		.bubble {
			animation: none !important;
		}
	}

	@media (max-width: 900px) {
		.hero {
			padding: 3.5rem 0 4.5rem;
		}

		.hero-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.stat-sep {
			display: none;
		}

		.hero-stats {
			gap: 1.25rem;
		}

		.hero-visual {
			height: 390px;
		}

		.story-blob {
			width: min(280px, 78vw);
		}

		.bubble-card {
			width: 116px;
			padding: 0.75rem 0.65rem;
		}
	}

	@media (max-width: 480px) {
		.hero-visual {
			height: 330px;
			transform: scale(0.9);
		}

		.bubble-1 {
			left: -2%;
		}

		.bubble-2 {
			right: -2%;
		}
	}
</style>
