<script lang="ts">
	const items = [
		{
			emoji: '🏠',
			title: 'Испанский как часть повседневной жизни',
			desc: 'Вы будете использовать язык на прогулке, за едой, во время игр — не только за столом'
		},
		{
			emoji: '🎮',
			title: 'Игры, песни, карточки, творческие задания',
			desc: 'Всё разработано специально для детей — весело, интерактивно, без скуки'
		},
		{
			emoji: '📋',
			title: 'Готовые планы занятий',
			desc: 'Не нужно ничего придумывать — открыл урок и начал. Всё уже готово'
		},
		{
			emoji: '🖨️',
			title: 'Материалы для печати',
			desc: 'PDF-карточки, рабочие листы и шаблоны для распечатки и использования дома'
		},
		{
			emoji: '🎥',
			title: 'Озвучка и видео-презентации',
			desc: 'Правильное произношение с первого урока — профессиональные аудио и видео материалы'
		},
		{
			emoji: '💌',
			title: 'Поддержка и обратная связь',
			desc: 'Автор отвечает на вопросы — вы никогда не останетесь одна с затруднениями'
		}
	];
</script>

<section class="section what-awaits" id="what-awaits" data-section="what-awaits">
	<div class="container">
		<div class="section-header">
			<div class="section-tag">Содержание</div>
			<h2 class="section-title">Что вас ждёт</h2>
			<p class="section-desc">
				Полноценная система для обучения — всё необходимое уже включено в курс
			</p>
		</div>

		<div class="items-grid">
			{#each items as item, i}
				<div class="item">
					<div class="item-num" aria-hidden="true">0{i + 1}</div>
					<div class="item-icon" aria-hidden="true">{item.emoji}</div>
					<div class="item-body">
						<h3 class="item-title">{item.title}</h3>
						<p class="item-desc">{item.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.what-awaits {
		background: var(--color-surface);
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.item {
		display: flex;
		gap: 1.25rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
		align-items: flex-start;
		transition:
			transform 0.22s ease,
			box-shadow 0.22s ease;
		position: relative;
		overflow: hidden;
	}

	.item:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
	}

	.item-num {
		position: absolute;
		top: 1.25rem;
		right: 1.5rem;
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--color-primary-light);
		line-height: 1;
		letter-spacing: -0.04em;
		pointer-events: none;
		user-select: none;
	}

	.item-icon {
		font-size: 1.75rem;
		line-height: 1;
		width: 50px;
		height: 50px;
		background: var(--color-primary-light);
		border-radius: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.22s ease;
	}

	.item:hover .item-icon {
		background: var(--color-primary);
	}

	.item-title {
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.4rem;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	.item-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 640px) {
		.items-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
