<script lang="ts">
	interface LocalFaqItem {
		id: number;
		question: string;
		answer: string;
	}

	const items: LocalFaqItem[] = [
		{
			id: 1,
			question: 'Сколько детей в группе?',
			answer:
				'Не больше 6 человек — так преподаватель успевает уделить внимание каждому ребёнку и услышать, как он говорит.'
		},
		{
			id: 2,
			question: 'Как формируются группы?',
			answer:
				'По возрасту и уровню владения языком. Уровень определяем на бесплатном пробном занятии, а затем предлагаем подходящую группу и время.'
		},
		{
			id: 3,
			question: 'Что если ребёнок пропустит занятие?',
			answer:
				'Пришлём запись урока и материалы, чтобы ребёнок не отстал от группы к следующему занятию.'
		},
		{
			id: 4,
			question: 'Можно ли перейти из группы в индивидуальные занятия?',
			answer:
				'Да, в любой момент — просто напишите нам, и мы поможем подобрать подходящий формат и преподавателя.'
		},
		{
			id: 5,
			question: 'Нужно ли готовить материалы заранее?',
			answer:
				'Нет, все материалы — карточки, аудио и рабочие листы — присылаем перед началом занятий.'
		},
		{
			id: 6,
			question: 'Как проходят занятия?',
			answer:
				'Онлайн на Zoom, в реальном времени с преподавателем — 45 минут два раза в неделю в одно и то же время.'
		}
	];

	let openId = $state<number | null>(null);

	function toggle(id: number) {
		openId = openId === id ? null : id;
	}
</script>

<section class="section" id="faq" data-section="faq">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">FAQ</div>
			<h2 class="section-title">Частые вопросы</h2>
		</div>

		<div class="faq-list">
			{#each items as item}
				<div class="faq-item" class:open={openId === item.id}>
					<button
						class="faq-question"
						onclick={() => toggle(item.id)}
						aria-expanded={openId === item.id}
					>
						<span>{item.question}</span>
						<span class="faq-icon" aria-hidden="true">
							<svg
								width="18"
								height="18"
								viewBox="0 0 18 18"
								fill="none"
								style="transition: transform 0.25s ease; transform: rotate({openId === item.id
									? '45deg'
									: '0deg'})"
							>
								<path
									d="M9 3v12M3 9h12"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						</span>
					</button>
					{#if openId === item.id}
						<div class="faq-answer">
							<p>{item.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.faq-list {
		max-width: 780px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.faq-item {
		background: white;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.faq-item.open {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.08);
	}

	.faq-question {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1.3rem 1.6rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		font-family: var(--font-sans);
		transition: background 0.15s ease;
		min-height: 60px;
	}

	.faq-question:hover {
		background: var(--color-surface);
	}

	.faq-icon {
		color: var(--color-primary);
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.faq-answer {
		padding: 0 1.6rem 1.4rem;
	}

	.faq-answer p {
		margin: 0;
		font-size: 0.95rem;
		color: var(--color-text-muted);
		line-height: 1.7;
	}
</style>
