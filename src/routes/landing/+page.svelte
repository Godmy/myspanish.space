<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { track } from '$lib/analytics';

	import Header from '$lib/components/Header.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import ForWhom from '$lib/components/ForWhom.svelte';
	import FreeMaterials from '$lib/components/FreeMaterials.svelte';
	import Author from '$lib/components/Author.svelte';
	import WhatAwaits from '$lib/components/WhatAwaits.svelte';
	import Program from '$lib/components/Program.svelte';
	import Benefits from '$lib/components/Benefits.svelte';
	import Pricing from '$lib/components/Pricing.svelte';
	import Testimonials from '$lib/components/Testimonials.svelte';
	import Faq from '$lib/components/Faq.svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data }: { data: PageData } = $props();

	let settings = $derived(data.settings);

	onMount(() => {
		track('page_view', { path: '/landing' });
	});
</script>

<svelte:head>
	<title>Испанский с мамой — учите испанский вместе с ребёнком</title>
	<meta
		name="description"
		content="Готовые уроки, игры, песни и карточки для мам, которые хотят познакомить ребёнка с испанским языком. Начните с нулевого уровня!"
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://myspanish.space/landing" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://myspanish.space/landing" />
	<meta property="og:title" content="Испанский с мамой — учите испанский вместе с ребёнком" />
	<meta
		property="og:description"
		content="Готовые уроки, игры, песни и карточки для мам, которые хотят познакомить ребёнка с испанским языком."
	/>
	<meta property="og:image" content="https://myspanish.space/og-image.jpg" />
	<meta property="og:locale" content="ru_RU" />
	<meta property="og:site_name" content="Испанский с мамой" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Испанский с мамой" />
	<meta
		name="twitter:description"
		content="Готовые уроки, игры, песни и карточки для мам, которые хотят познакомить ребёнка с испанским языком."
	/>

	<!-- Schema.org -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Course",
		"name": "Испанский с мамой",
		"description": "Авторский курс испанского языка для мам с детьми от 2,5 лет. Готовые уроки, игры, песни и карточки.",
		"provider": {
			"@type": "Organization",
			"name": "Испанский с мамой",
			"url": "https://myspanish.space"
		},
		"instructor": {
			"@type": "Person",
			"name": "Марина Синельникова"
		},
		"inLanguage": "ru",
		"availableLanguage": ["ru", "es"],
		"educationalLevel": "Beginner",
		"url": "https://myspanish.space/landing"
	}
	<\/script>`}
</svelte:head>

<Header sections={['for-whom', 'author', 'what-awaits', 'program', 'benefits', 'price', 'testimonials', 'faq', 'contact']} />

<main>
	<Hero />

	<ForWhom />

	<FreeMaterials
		telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	/>

	<Author authorPhotoUrl={undefined} />

	<WhatAwaits />

	<Program />

	<Benefits />

	<Pricing
		priceText={settings.price_text ?? 'Стоимость уточняйте'}
		priceNote={settings.price_note ?? 'Напишите нам — мы расскажем о тарифах'}
		telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	/>

	<Testimonials testimonials={data.testimonials} />

	<Faq items={data.faqItems} />

	<ContactForm />
</main>

<Footer
	telegramLink={settings.telegram_link ?? 'https://t.me/mamaespanola'}
	contactEmail={settings.contact_email ?? 'info@myspanish.space'}
/>
