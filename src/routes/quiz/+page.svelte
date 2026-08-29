<script lang="ts">
	import { onMount } from 'svelte';
	import { track } from '$lib/analytics';
	import { questUrl } from '$lib/links';

	/**
	 * Контракт с квиз-ботом — ARCHITECTOR-015 §4 / ARCHITECTOR-019.
	 * Deep-link `?start=quiz_<source>`; для кнопки со страницы /quiz source = 'web'.
	 */
	const QUIZ_BOT_START = questUrl('web');

	onMount(() => {
		track('page_view', { path: '/quiz' });
	});

	function onStartClick() {
		track('cta_click', { button_id: 'quiz-start', section_id: 'quiz-teaser' });
	}
</script>

<svelte:head>
	<!-- TODO(SCRUM-MASTER/OWNER): финальный <title>/description; страница-черновик до контента (PROJECT-004). -->
	<title>Квест «Поиск сокровищ» — испанский с мамой</title>
	<meta
		name="description"
		content="Мини-квест на испанском: 12 вопросов от A1 до B2. Пройдите в Telegram и узнайте свой уровень."
	/>
	<!-- Черновик: не индексируем, пока OWNER не утвердит контент и запуск эпика E-QUIZBOT. -->
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="quiz">
	<div class="quiz-inner">
		<span class="quiz-badge">Квест</span>

		<!-- TODO(SCRUM-MASTER): заголовок и текст тизера. B7 — две ветви (ядро «мамы+дети» /
		     широкая) реализуются в БОТЕ по ?start=quiz_<source>; тизер на сайте — общий. -->
		<h1 class="quiz-title">«Búsqueda del tesoro» — поиск сокровищ</h1>

		<p class="quiz-lead">
			<!-- [черновой текст — заменит SCRUM-MASTER] -->
			12 коротких вопросов на испанском — от самых простых до уровня B2. Отвечаете прямо
			в Telegram, в конце — ваш результат и подсказка, что учить дальше. Пройдёте без
			ошибок — заберёте подарок от Марины.
		</p>

		<ul class="quiz-facts">
			<li><span aria-hidden="true">⏱️</span> 5–7 минут</li>
			<li><span aria-hidden="true">💬</span> прямо в Telegram</li>
			<li><span aria-hidden="true">🎁</span> подарок за 12 из 12</li>
		</ul>

		<a
			href={QUIZ_BOT_START}
			target="_blank"
			rel="noopener"
			class="btn btn-primary btn-lg"
			data-track-id="quiz-start"
			onclick={onStartClick}
		>
			Пройти квест
		</a>

		<p class="quiz-note">
			<!-- TODO(OWNER): нужен ли возврат на лендинг/контакты здесь. Пока — без ссылок (лендинг ещё непубличный, O6). -->
			Откроется бот <span class="quiz-mono">@myspanish_space_quiz_bot</span>
		</p>
	</div>
</main>

<style>
	.quiz {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem var(--container-px);
		background: var(--color-bg);
	}

	.quiz-inner {
		width: 100%;
		max-width: 36rem;
		text-align: center;
	}

	.quiz-badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-primary);
		background: var(--color-primary-light);
		border-radius: 100px;
		padding: 0.3rem 0.85rem;
		margin-bottom: 1.25rem;
	}

	.quiz-title {
		font-family: var(--font-display);
		font-size: clamp(1.9rem, 4.5vw, 2.8rem);
		font-weight: 800;
		color: var(--color-text);
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0 0 1rem;
	}

	.quiz-lead {
		font-size: 1.05rem;
		color: var(--color-text-muted);
		line-height: 1.7;
		margin: 0 0 1.5rem;
	}

	.quiz-facts {
		list-style: none;
		padding: 0;
		margin: 0 0 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 1.25rem;
		justify-content: center;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.quiz-facts li {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.quiz-note {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 1.25rem 0 0;
	}

	.quiz-mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: var(--color-text);
	}
</style>
