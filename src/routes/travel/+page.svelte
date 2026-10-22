<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { track } from '$lib/analytics';

	import Header from '$lib/components/Header.svelte';
	import TravelHero from '$lib/components/travel/TravelHero.svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data }: { data: PageData } = $props();

	let settings = $derived(data.settings);

	onMount(() => {
		track('page_view', { path: '/travel' });
	});
</script>

<svelte:head>
	<title>Испанский для путешествий — myspanish.space</title>
	<meta
		name="description"
		content="Живой разговорный испанский для поездок: бронирование, заказ еды, дорога, общение с местными."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Header sections={['contact']} />

<main>
	<TravelHero />

	<ContactForm />
</main>

<Footer
	telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	contactEmail={settings.contact_email ?? 'info@myspanish.space'}
/>
