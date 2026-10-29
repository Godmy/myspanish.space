<script lang="ts">
	import '../school.css';
	import ThemeProvider from '$stylist/theme/component/atom/theme-provider/index.svelte';
	import { SCHEME_SPANISH } from '$stylist/theme/const/record/scheme-spanish';
	import { ManagerThemeCSS } from '$stylist/theme/class/manager/theme-css';
	let { children } = $props();
</script>

<svelte:head>
	{@html `<style id="school-theme">${ManagerThemeCSS.generateCSS(SCHEME_SPANISH.light)}</style>`}
</svelte:head>

<ThemeProvider themeScheme="spanish" themeMode="light">{@render children()}</ThemeProvider>
