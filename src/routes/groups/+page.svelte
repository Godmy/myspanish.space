<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { track } from '$lib/analytics';

	import Header from '$lib/components/Header.svelte';
	import GroupsHero from '$lib/components/groups/GroupsHero.svelte';
	import GroupsForWhom from '$lib/components/groups/GroupsForWhom.svelte';
	import GroupsPrograms from '$lib/components/groups/GroupsPrograms.svelte';
	import GroupsFormat from '$lib/components/groups/GroupsFormat.svelte';
	import GroupsSchedule from '$lib/components/groups/GroupsSchedule.svelte';
	import GroupsTestimonials from '$lib/components/groups/GroupsTestimonials.svelte';
	import GroupsPricing from '$lib/components/groups/GroupsPricing.svelte';
	import GroupsFaq from '$lib/components/groups/GroupsFaq.svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data }: { data: PageData } = $props();

	let settings = $derived(data.settings);

	onMount(() => {
		track('page_view', { path: '/groups' });
	});
</script>

<svelte:head>
	<title>Групповые занятия испанским для детей — myspanish.space</title>
	<meta
		name="description"
		content="Онлайн-занятия испанским в мини-группах до 6 детей: живой преподаватель, игровой формат и цена ниже индивидуальных уроков."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://myspanish.space/groups" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://myspanish.space/groups" />
	<meta property="og:title" content="Групповые занятия испанским для детей — myspanish.space" />
	<meta
		property="og:description"
		content="Онлайн-занятия испанским в мини-группах до 6 детей: живой преподаватель, игровой формат и цена ниже индивидуальных уроков."
	/>
	<meta property="og:image" content="https://myspanish.space/og-image.jpg" />
	<meta property="og:locale" content="ru_RU" />
	<meta property="og:site_name" content="myspanish.space" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Групповые занятия испанским для детей" />
	<meta
		name="twitter:description"
		content="Мини-группы до 6 детей, живой преподаватель на Zoom и игровой формат — дешевле индивидуальных уроков."
	/>

	<!-- Schema.org -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Course",
		"name": "Групповые занятия испанским для детей",
		"description": "Онлайн-занятия испанского языка для детей 4-14 лет в мини-группах до 6 человек: игровой формат, живой преподаватель, подготовка к первым экзаменам.",
		"provider": {
			"@type": "Organization",
			"name": "myspanish.space",
			"url": "https://myspanish.space"
		},
		"inLanguage": "ru",
		"availableLanguage": ["ru", "es"],
		"educationalLevel": "Beginner to Intermediate",
		"url": "https://myspanish.space/groups"
	}
	<\/script>`}
</svelte:head>

<Header sections={['for-whom', 'program', 'benefits', 'schedule', 'testimonials', 'price', 'faq', 'contact']} />

<main>
	<GroupsHero />

	<GroupsForWhom />

	<GroupsPrograms />

	<GroupsFormat />

	<GroupsSchedule />

	<GroupsTestimonials />

	<GroupsPricing
		priceText={settings.price_text ?? 'Стоимость уточняйте'}
		priceNote={settings.price_note ?? 'Напишите нам — мы расскажем о тарифах и подберём группу'}
		telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	/>

	<GroupsFaq />

	<ContactForm />
</main>

<Footer
	telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	contactEmail={settings.contact_email ?? 'info@myspanish.space'}
/>
