<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { track } from '$lib/analytics';

	import Header from '$lib/components/Header.svelte';
	import KidsHero from '$lib/components/kids/KidsHero.svelte';
	import KidsForWhom from '$lib/components/kids/KidsForWhom.svelte';
	import KidsPrograms from '$lib/components/kids/KidsPrograms.svelte';
	import KidsFormat from '$lib/components/kids/KidsFormat.svelte';
	import KidsResults from '$lib/components/kids/KidsResults.svelte';
	import KidsTestimonials from '$lib/components/kids/KidsTestimonials.svelte';
	import KidsPricing from '$lib/components/kids/KidsPricing.svelte';
	import KidsFaq from '$lib/components/kids/KidsFaq.svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data }: { data: PageData } = $props();

	let settings = $derived(data.settings);

	onMount(() => {
		track('page_view', { path: '/kids' });
	});
</script>

<svelte:head>
	<title>Испанский для детей 7–17 лет — myspanish.space</title>
	<meta
		name="description"
		content="Индивидуальные онлайн-уроки испанского для школьников: с нуля, для школьной программы, разговорная практика и подготовка к международным экзаменам."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://myspanish.space/kids" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://myspanish.space/kids" />
	<meta property="og:title" content="Испанский для детей 7–17 лет — myspanish.space" />
	<meta
		property="og:description"
		content="Индивидуальные онлайн-уроки испанского для школьников: с нуля, для школьной программы, разговорная практика и подготовка к экзаменам."
	/>
	<meta property="og:image" content="https://myspanish.space/og-image.jpg" />
	<meta property="og:locale" content="ru_RU" />
	<meta property="og:site_name" content="myspanish.space" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Испанский для детей 7–17 лет" />
	<meta
		name="twitter:description"
		content="Индивидуальные онлайн-уроки испанского для школьников — с нуля и до подготовки к экзаменам."
	/>

	<!-- Schema.org -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Course",
		"name": "Испанский для детей",
		"description": "Индивидуальные онлайн-уроки испанского языка для детей 7-17 лет: с нуля, школьная программа, разговорная практика, подготовка к международным экзаменам.",
		"provider": {
			"@type": "Organization",
			"name": "myspanish.space",
			"url": "https://myspanish.space"
		},
		"inLanguage": "ru",
		"availableLanguage": ["ru", "es"],
		"educationalLevel": "Beginner to Intermediate",
		"url": "https://myspanish.space/kids"
	}
	<\/script>`}
</svelte:head>

<Header sections={['for-whom', 'program', 'benefits', 'results', 'testimonials', 'price', 'faq', 'contact']} />

<main>
	<KidsHero />

	<KidsForWhom />

	<KidsPrograms />

	<KidsFormat />

	<KidsResults />

	<KidsTestimonials />

	<KidsPricing />

	<KidsFaq />

	<ContactForm />
</main>

<Footer
	telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	contactEmail={settings.contact_email ?? 'info@myspanish.space'}
/>
