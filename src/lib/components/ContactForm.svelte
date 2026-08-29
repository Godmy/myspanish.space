<script lang="ts">
	import { track } from '$lib/analytics';

	type Status = 'idle' | 'loading' | 'success' | 'error';
	let status = $state<Status>('idle');
	let errorMsg = $state('');
	let touched = $state(false);

	const initialForm = {
		name: '',
		phone: '',
		telegram: '',
		email: '',
		child_age: '',
		message: '',
		consent: false
	};

	let form = $state({ ...initialForm });

	function handleFocus() {
		if (!touched) {
			touched = true;
			track('form_start', { section_id: 'contact', button_id: 'lead-form' });
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!form.name.trim()) {
			errorMsg = 'Пожалуйста, введите ваше имя';
			return;
		}
		if (!form.consent) {
			errorMsg = 'Необходимо согласие на обработку данных';
			return;
		}

		status = 'loading';
		errorMsg = '';

		const params = new URLSearchParams(window.location.search);

		try {
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					utm_source: params.get('utm_source'),
					utm_medium: params.get('utm_medium'),
					utm_campaign: params.get('utm_campaign'),
					section_id: 'contact'
				})
			});

			const data = await res.json();

			if (res.ok && data.success) {
				status = 'success';
				form = { ...initialForm };
				touched = false;
			} else {
				status = 'error';
				errorMsg = data.error ?? 'Произошла ошибка. Попробуйте снова.';
			}
		} catch {
			status = 'error';
			errorMsg = 'Ошибка сети. Проверьте соединение и попробуйте снова.';
		}
	}
</script>

<section class="section final-cta" id="contact" data-section="contact">
	<div class="container">
		<div class="inner">
			<div class="text-col">
				<div class="section-tag">Начните сегодня</div>
				<h2 class="section-title">Хотите попробовать?</h2>
				<p class="lead-text">
					Оставьте заявку — мы пришлём пробные материалы и расскажем, с чего начать. Это бесплатно
					и ни к чему не обязывает.
				</p>
				<ul class="promise-list">
					<li>
						<span class="promise-icon" aria-hidden="true">🎁</span>
						<div>
							<strong>Пробный урок бесплатно</strong>
							<p>Убедитесь сами, прежде чем покупать</p>
						</div>
					</li>
					<li>
						<span class="promise-icon" aria-hidden="true">💬</span>
						<div>
							<strong>Ответим на все вопросы</strong>
							<p>Помогаем подобрать нужный формат</p>
						</div>
					</li>
					<li>
						<span class="promise-icon" aria-hidden="true">⚡</span>
						<div>
							<strong>Отвечаем быстро</strong>
							<p>Обычно в течение нескольких часов</p>
						</div>
					</li>
				</ul>
			</div>

			<div class="form-col">
				{#if status === 'success'}
					<div class="success-state">
						<div class="success-icon" aria-hidden="true">🎉</div>
						<h3>Заявка принята!</h3>
						<p>
							Мы получили вашу заявку и скоро свяжемся с вами. Ждите сообщение в Telegram или на
							почту.
						</p>
						<button class="btn btn-outline" onclick={() => (status = 'idle')}>
							Отправить ещё одну заявку
						</button>
					</div>
				{:else}
					<form class="lead-form" onsubmit={handleSubmit} novalidate>
						<div class="form-row">
							<label for="field-name">
								<span>Ваше имя <span class="required" aria-label="обязательное поле">*</span></span>
								<input
									id="field-name"
									type="text"
									bind:value={form.name}
									placeholder="Мария"
									autocomplete="name"
									required
									onfocus={handleFocus}
								/>
							</label>
						</div>

						<div class="form-row two-cols">
							<label for="field-phone">
								<span>Телефон</span>
								<input
									id="field-phone"
									type="tel"
									bind:value={form.phone}
									placeholder="+7 900 000 00 00"
									autocomplete="tel"
									onfocus={handleFocus}
								/>
							</label>
							<label for="field-telegram">
								<span>Telegram</span>
								<input
									id="field-telegram"
									type="text"
									bind:value={form.telegram}
									placeholder="@username"
									onfocus={handleFocus}
								/>
							</label>
						</div>

						<div class="form-row two-cols">
							<label for="field-email">
								<span>Email</span>
								<input
									id="field-email"
									type="email"
									bind:value={form.email}
									placeholder="mail@example.com"
									autocomplete="email"
									onfocus={handleFocus}
								/>
							</label>
							<label for="field-age">
								<span>Возраст ребёнка</span>
								<input
									id="field-age"
									type="text"
									bind:value={form.child_age}
									placeholder="3 года"
									onfocus={handleFocus}
								/>
							</label>
						</div>

						<div class="form-row">
							<label for="field-message">
								<span>Сообщение</span>
								<textarea
									id="field-message"
									bind:value={form.message}
									placeholder="Ваш вопрос или пожелание..."
									rows="3"
									onfocus={handleFocus}
								></textarea>
							</label>
						</div>

						<div class="consent-row">
							<label class="consent-label">
								<input type="checkbox" bind:checked={form.consent} />
								<span>
									Я согласна на обработку персональных данных в соответствии с
									<a href="/privacy" target="_blank">политикой конфиденциальности</a>
								</span>
							</label>
						</div>

						{#if errorMsg}
							<div class="error-msg" role="alert">{errorMsg}</div>
						{/if}

						<button
							type="submit"
							class="btn btn-primary btn-lg submit-btn"
							data-track-id="form-submit"
							disabled={status === 'loading'}
						>
							{status === 'loading' ? 'Отправляем…' : 'Получить пробный урок'}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.final-cta {
		background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-light) 100%);
	}

	.inner {
		display: grid;
		grid-template-columns: 1fr 1.15fr;
		gap: 4rem;
		align-items: start;
	}

	.section-title {
		text-align: left;
		margin-bottom: 1rem;
	}

	.lead-text {
		font-size: 1rem;
		color: var(--color-text-muted);
		line-height: 1.7;
		margin: 0 0 2rem;
	}

	.promise-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.promise-list li {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}

	.promise-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.promise-list strong {
		display: block;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 0.15rem;
	}

	.promise-list p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	/* Form */
	.lead-form {
		background: white;
		border-radius: var(--radius-xl);
		padding: 2.25rem;
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: flex;
		flex-direction: column;
	}

	.form-row.two-cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label > span {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.required {
		color: var(--color-primary);
	}

	input,
	textarea {
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.7rem 0.95rem;
		font-size: 0.95rem;
		font-family: var(--font-sans);
		color: var(--color-text);
		background: var(--color-bg);
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			background 0.18s ease;
		width: 100%;
		box-sizing: border-box;
		min-height: 44px;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
		background: white;
	}

	textarea {
		resize: vertical;
		min-height: 88px;
	}

	.consent-row {
		display: flex;
	}

	.consent-label {
		flex-direction: row;
		align-items: flex-start;
		gap: 0.65rem;
		cursor: pointer;
	}

	.consent-label input[type='checkbox'] {
		width: 20px;
		height: 20px;
		margin-top: 0.05rem;
		flex-shrink: 0;
		accent-color: var(--color-primary);
		cursor: pointer;
	}

	.consent-label span {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-transform: none;
		letter-spacing: 0;
		font-weight: 400;
		line-height: 1.5;
	}

	.consent-label a {
		color: var(--color-primary);
		text-underline-offset: 2px;
	}

	.error-msg {
		background: #fff1f1;
		border: 1.5px solid #fecaca;
		color: #c00;
		border-radius: var(--radius-sm);
		padding: 0.7rem 0.95rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.submit-btn {
		width: 100%;
	}

	/* Success state */
	.success-state {
		background: white;
		border-radius: var(--radius-xl);
		padding: 3rem 2.25rem;
		text-align: center;
		box-shadow: var(--shadow-lg);
	}

	.success-icon {
		font-size: 4rem;
		line-height: 1;
		margin-bottom: 1.25rem;
	}

	.success-state h3 {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--color-text);
		margin: 0 0 0.85rem;
		letter-spacing: -0.02em;
	}

	.success-state p {
		color: var(--color-text-muted);
		line-height: 1.65;
		margin: 0 0 1.75rem;
		font-size: 0.95rem;
	}

	@media (max-width: 768px) {
		.inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.form-row.two-cols {
			grid-template-columns: 1fr;
		}

		.lead-form {
			padding: 1.75rem;
		}
	}
</style>
