export function track(eventType: string, data: Record<string, string> = {}): void {
	const params = new URLSearchParams(window.location.search);
	fetch('/api/events', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			event_type: eventType,
			path: window.location.pathname,
			utm_source: params.get('utm_source') ?? undefined,
			utm_medium: params.get('utm_medium') ?? undefined,
			utm_campaign: params.get('utm_campaign') ?? undefined,
			...data
		})
	}).catch(() => {});
}

export function trackClick(el: HTMLElement): void {
	const buttonId = el.dataset.trackId;
	const sectionId = el.closest('[data-section]')?.getAttribute('data-section') ?? undefined;
	if (buttonId) {
		track('cta_click', { button_id: buttonId, ...(sectionId ? { section_id: sectionId } : {}) });
	}
}
